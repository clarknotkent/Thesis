# QR Code Mini App - Code Documentation
## Progress Report Snippets for Thesis

### Project Overview
A Vue.js + Express.js application that generates QR codes for patient vaccination documents and provides scanning capabilities for healthcare staff.

**Core Flow:**
1. Upload PDF/image → Server stores with token → Generate QR code
2. Scan QR (camera/upload) → Decode URL → View/download document
3. Manage documents with recent list, recycle bin, friendly filenames

---

## Backend Code Snippets (Express.js)

### 1. File Upload Configuration
```javascript
// server.js - Multer setup for PDF/image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.' + (mime.extension(file.mimetype) || 'bin');
    const id = crypto.randomUUID();
    cb(null, id + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Unsupported file type'));
    cb(null, true);
  }
});
```

### 2. Security Token Generation
```javascript
// server.js - HMAC-based token for secure document access
const APP_SECRET = process.env.APP_SECRET || 'change_me_dev_secret';

function signDocId(docId) {
  return crypto.createHmac('sha256', APP_SECRET).update(docId).digest('base64url');
}
```

### 3. Document Upload Endpoint
```javascript
// POST /api/documents - Upload document and return tokenized URL
app.post('/api/documents', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const storedName = req.file.filename; // UUID + ext
    const docId = path.parse(storedName).name; // just UUID
    const token = signDocId(docId);
    const accessUrl = `${req.protocol}://${req.get('host')}/d/${docId}?token=${token}`;
    
    // Store metadata for patient info and original filename
    fs.writeFileSync(path.join(uploadDir, `${docId}.json`), JSON.stringify({
      originalName: req.file.originalname,
      mime: req.file.mimetype,
      createdAt: new Date().toISOString(),
      patientName: req.body?.patientName || '',
      patientId: req.body?.patientId || ''
    }));
    
    res.json({ docId, token, url: accessUrl, originalName: req.file.originalname, mime: req.file.mimetype });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

### 4. Document Serving with Friendly Filenames
```javascript
// GET /d/:docId - Serve document with token validation and friendly names
app.get('/d/:docId', (req, res) => {
  const { docId } = req.params;
  const { token, dl, name } = req.query;
  if (!token || token !== signDocId(docId)) return res.status(403).json({ error: 'Invalid token' });

  // Find file and load metadata
  const files = fs.readdirSync(uploadDir).filter(f => f.startsWith(docId) && !f.endsWith('.json'));
  if (!files.length) return res.status(404).json({ error: 'Not found' });
  
  const filePath = path.join(uploadDir, files[0]);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  
  // Build friendly filename from patient data or custom name
  let finalName;
  const qName = name && name.replace(/[^\w\d\-_. ()]+/g, ' ').trim();
  if (qName) {
    const ext = path.extname(files[0]);
    finalName = qName.endsWith(ext) ? qName : (ext ? qName + ext : qName);
  } else {
    // Default: Vaccination-PatientName-PatientID.ext
    const metaPath = path.join(uploadDir, `${docId}.json`);
    let patientName = 'Patient', patientId = docId;
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        patientName = meta.patientName || 'Patient';
        patientId = meta.patientId || docId;
      } catch(e) {}
    }
    finalName = `Vaccination-${patientName}-${patientId}${path.extname(files[0])}`;
  }
  
  const download = dl === '1' || dl === 'true';
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${finalName}"`);
  fs.createReadStream(filePath).pipe(res);
});
```

### 5. Soft Delete System
```javascript
// DELETE /api/documents/:docId - Soft delete (move to trash)
app.delete('/api/documents/:docId', (req, res) => {
  const { docId } = req.params;
  try {
    // Move metadata to trash and add deletion timestamp
    const metaPath = path.join(uploadDir, `${docId}.json`);
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      meta.deletedAt = new Date().toISOString();
      fs.writeFileSync(metaPath, JSON.stringify(meta));
      fs.renameSync(metaPath, path.join(trashDir, `${docId}.json`));
    }
    
    // Move actual files to trash
    const files = fs.readdirSync(uploadDir).filter(f => f.startsWith(docId) && !f.endsWith('.json'));
    files.forEach(f => {
      fs.renameSync(path.join(uploadDir, f), path.join(trashDir, f));
    });
    
    res.json({ deleted: true, softDeleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

---

## Frontend Code Snippets (Vue.js)

### 1. Drag & Drop File Upload with Preview
```vue
<!-- QrGenerator.vue - File upload with drag/drop -->
<template>
  <div class="dropzone" 
       :class="{ dragover }" 
       @dragover.prevent="dragover = true" 
       @dragleave.prevent="dragover = false" 
       @drop.prevent="onDrop">
    <p><strong>Drag & drop</strong> PDF/PNG/JPG here or click to select.</p>
    <input ref="fileInput" type="file" accept="application/pdf,image/png,image/jpeg" 
           @change="onFile" style="display:none;" />
    <button type="button" @click="fileInput.click()">Choose File</button>
  </div>
  
  <!-- File preview -->
  <div v-if="previewUrl" class="preview">
    <img v-if="isImage" :src="previewUrl" alt="preview" />
    <div>
      <div><strong>{{ fileName }}</strong> <span>({{ humanSize }})</span></div>
      <div>{{ fileType }}</div>
    </div>
  </div>
  
  <!-- Upload progress -->
  <div v-if="progress > 0" class="progress">
    <div :style="{ width: progress + '%' }"></div>
  </div>
</template>

<script setup>
const file = ref(null);
const dragover = ref(false);
const previewUrl = ref('');
const progress = ref(0);

function onDrop(ev) {
  dragover.value = false;
  const f = ev.dataTransfer?.files?.[0];
  if (!f) return;
  file.value = f;
  makePreview();
}

async function handleUpload() {
  const form = new FormData();
  form.append('file', file.value);
  form.append('patientName', patientName.value);
  form.append('patientId', patientId.value);
  
  const res = await axios.post('http://localhost:5055/api/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (ev) => {
      if (ev.total) progress.value = Math.round(ev.loaded * 100 / ev.total);
    }
  });
  
  qrData.value = res.data;
}
</script>
```

### 2. QR Code Generation with Custom Parameters
```vue
<!-- QrGenerator.vue - QR with download options -->
<template>
  <div class="qr-box">
    <qrcode-vue :value="qrUrl" :size="220" level="M" ref="qrRef" />
    
    <!-- QR customization options -->
    <label>
      <input type="checkbox" v-model="asDownload" /> 
      Make QR open as download
    </label>
    
    <div>
      <label>Suggested file name (no extension)</label>
      <input v-model="suggestedName" placeholder="Vaccination-<Name>-<ID>" />
    </div>
    
    <!-- Action buttons -->
    <div class="actions">
      <button @click="downloadPng">Download QR PNG</button>
      <button @click="copyUrl">Copy URL</button>
      <button @click="printQr">Print QR</button>
      <button @click="downloadDoc">Download Document</button>
    </div>
  </div>
</template>

<script setup>
const asDownload = ref(false);
const suggestedName = ref('');

// Dynamic QR URL based on options
const qrUrl = computed(() => {
  if (!qrData.value?.url) return '';
  const params = new URLSearchParams();
  if (asDownload.value) params.set('dl', '1');
  if (suggestedName.value) params.set('name', suggestedName.value);
  return qrData.value.url + (qrData.value.url.includes('?') ? '&' : '?') + params.toString();
});

function copyUrl() {
  navigator.clipboard.writeText(qrUrl.value);
  showToast('Copied URL to clipboard', 'success');
}
</script>
```

### 3. QR Code Scanner with Camera and Image Upload
```vue
<!-- QrScanner.vue - Dual scanning methods -->
<template>
  <div>
    <!-- Camera selection -->
    <select v-model="selectedDeviceId">
      <option v-for="d in devices" :key="d.deviceId" :value="d.deviceId">
        {{ d.label || ('Camera ' + d.deviceId.slice(-4)) }}
      </option>
    </select>
    
    <!-- Video preview with scanning overlay -->
    <div class="video-wrap">
      <video ref="video" class="scanner-video" playsinline></video>
      <div class="scan-overlay"></div>
    </div>
    
    <!-- Controls -->
    <button @click="startScanner" :disabled="scanning">
      {{ scanning ? 'Scanning...' : 'Start Scanner' }}
    </button>
    <button @click="toggleTorch" :disabled="!track">
      {{ torchOn ? 'Torch Off' : 'Torch On' }}
    </button>
    
    <!-- QR Image Upload -->
    <div>
      <label>Or Upload QR Image</label>
      <input type="file" accept="image/png,image/jpeg,image/jpg" @change="decodeImageFile" />
    </div>
  </div>
</template>

<script setup>
import { BrowserMultiFormatReader } from '@zxing/browser';

const codeReader = new BrowserMultiFormatReader();
const scanning = ref(false);
const devices = ref([]);
const selectedDeviceId = ref('');
const torchOn = ref(false);
let track;

async function startScanner() {
  const constraints = selectedDeviceId.value
    ? { video: { deviceId: { exact: selectedDeviceId.value } } }
    : { video: { facingMode: 'environment' } };
    
  stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.value.srcObject = stream;
  await video.value.play();
  track = stream.getVideoTracks()[0];
  
  const result = await codeReader.decodeOnceFromVideoElement(video.value);
  if (result?.text) {
    resultUrl.value = result.text.trim();
    stopScanner();
  }
}

async function decodeImageFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  
  const url = URL.createObjectURL(file);
  const result = await codeReader.decodeFromImageUrl(url);
  URL.revokeObjectURL(url);
  
  if (result?.text) {
    resultUrl.value = result.text.trim();
  }
}

async function toggleTorch() {
  if (!track) return;
  const supported = track.getCapabilities?.().torch;
  if (!supported) return;
  
  const on = !torchOn.value;
  await track.applyConstraints({ advanced: [{ torch: on }] });
  torchOn.value = on;
}
</script>
```

### 4. Document Management with Pagination
```vue
<!-- QrGenerator.vue - Recent documents list -->
<template>
  <div class="recent-documents">
    <h3>Recent Documents</h3>
    
    <div v-for="item in recent" :key="item.docId" class="document-item">
      <div class="doc-info">
        <div class="filename">{{ item.originalName }}</div>
        <div class="metadata">
          {{ item.patientName || 'Patient' }} · {{ item.patientId || item.docId }} · 
          {{ new Date(item.createdAt).toLocaleString() }}
        </div>
      </div>
      
      <div class="actions">
        <button @click="copy(item.url)">Copy URL</button>
        <a :href="item.url" target="_blank">Open</a>
        <button @click="downloadRecent(item)">Download</button>
        <button @click="deleteWithConfirm(item)">Delete</button>
      </div>
    </div>
    
    <!-- Pagination -->
    <div class="pagination">
      <div>Page {{ page }} of {{ totalPages }}</div>
      <div>
        <button :disabled="page<=1" @click="page--; loadRecent();">Prev</button>
        <button :disabled="page>=totalPages" @click="page++; loadRecent();">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
const recent = ref([]);
const page = ref(1);
const totalPages = ref(1);

async function loadRecent() {
  const { data } = await axios.get('http://localhost:5055/api/documents', {
    params: { page: page.value, limit: 10 }
  });
  recent.value = data.items || [];
  totalPages.value = data.totalPages || 1;
}

async function deleteWithConfirm(item) {
  const confirmed = confirm(`Delete "${item.originalName}"? You can restore it from the Recycle Bin.`);
  if (confirmed) {
    await axios.delete(`http://localhost:5055/api/documents/${item.docId}`);
    await loadRecent();
    showToast('Document moved to Recycle Bin', 'success');
  }
}
</script>
```

### 5. Toast Notification System
```vue
<!-- App-wide toast notifications -->
<template>
  <div v-if="toast.show" class="toast" :class="toast.type">
    {{ toast.text }}
  </div>
</template>

<script setup>
const toast = ref({ show: false, text: '', type: 'success' });

function showToast(text, type = 'success') {
  toast.value = { show: true, text, type };
  setTimeout(() => toast.value.show = false, 1800);
}
</script>

<style>
.toast {
  position: fixed;
  right: 16px;
  bottom: 16px;
  background: #111827;
  color: #fff;
  padding: .7rem 1rem;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(0,0,0,.2);
  z-index: 9999;
}
.toast.success { background: #15803d; }
.toast.error { background: #b91c1c; }
</style>
```

---

## Key Features Summary

### Security Features
- **Token-based Access**: HMAC-SHA256 signed URLs prevent unauthorized access
- **File Type Validation**: Only PDF, PNG, JPEG files accepted
- **Size Limits**: 10MB maximum file size
- **Secure Storage**: Files stored with UUID names, metadata in separate JSON files

### User Experience Features
- **Drag & Drop Upload**: Intuitive file selection with visual feedback
- **Live Preview**: Image thumbnails and file information display
- **Progress Tracking**: Real-time upload progress bars
- **Multiple Scan Methods**: Camera scanning + QR image upload
- **Device Selection**: Choose specific cameras, torch/flashlight control
- **Friendly Filenames**: Automatic naming based on patient data
- **Document Management**: Recent files list with pagination
- **Soft Delete**: Recycle bin system with restore capability

### Technical Implementation
- **Backend**: Express.js with Multer for file handling
- **Frontend**: Vue 3 + Vite with modern composition API
- **QR Generation**: qrcode.vue library
- **QR Scanning**: @zxing/browser for camera and image decoding
- **Storage**: Local filesystem with JSON metadata sidecars
- **File Serving**: Custom headers for download/inline display

---

## Example URLs Generated

**Basic Document URL:**
```
http://localhost:5055/d/7f2c6b9b-3d8e-4d1c-9a4e-1b2c5aa2f9a1?token=J2v8JX5abc123def456
```

**Download with Custom Name:**
```
http://localhost:5055/d/7f2c6b9b-3d8e-4d1c-9a4e-1b2c5aa2f9a1?token=J2v8JX5abc123def456&dl=1&name=Vaccination-Kent-Elrond-Andionne-12345
```

---

## Next Steps for Integration

1. **Expiring Tokens**: Add timestamp-based token expiry
2. **Database Integration**: Replace JSON files with proper database
3. **Authentication**: Integrate with main app's user system  
4. **Audit Logging**: Track all document access and modifications
5. **PDF Generation**: Create standardized vaccination certificates
6. **Cloud Storage**: Move to S3/similar with pre-signed URLs

---

*This documentation covers the core functionality of the QR Code Mini App developed for the thesis project. The system demonstrates secure document sharing via QR codes with a focus on user experience and healthcare workflow integration.*
