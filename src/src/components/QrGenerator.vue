<template>
  <div>
    <div class="card">
      <h2 style="margin-top:0;">Generate Patient Document QR</h2>
      <form @submit.prevent="handleUpload">
        <div style="display:grid; gap:.5rem; grid-template-columns:1fr 1fr;">
          <div>
            <label>Patient Name</label>
            <input v-model="patientName" placeholder="e.g. Robert Theodore" required />
          </div>
          <div>
            <label>Patient ID</label>
            <input v-model="patientId" placeholder="Internal ID or number" required />
          </div>
        </div>
        <div>
          <label>Vaccination Document (PDF or Image)</label>
          <div
            class="dropzone"
            :class="{ dragover }"
            @dragover.prevent="dragover = true"
            @dragleave.prevent="dragover = false"
            @drop.prevent="onDrop"
          >
            <p><strong>Drag & drop</strong> PDF/PNG/JPG here or click to select.</p>
            <input ref="fileInput" type="file" accept="application/pdf,image/png,image/jpeg" @change="onFile" style="display:none;" />
            <button type="button" class="btn-secondary" @click="fileInput.click()">Choose File</button>
            <p class="muted">Max 10 MB. Name will be preserved for downloads.</p>
          </div>
          <div v-if="previewUrl" class="preview" style="margin-top:.75rem;">
            <img v-if="isImage" :src="previewUrl" alt="preview" />
            <div>
              <div><strong>{{ fileName }}</strong> <span class="muted">({{ humanSize }})</span></div>
              <div class="muted">{{ fileType }}</div>
            </div>
          </div>
          <div v-if="progress > 0" class="progress" style="margin-top:.5rem;">
            <div :style="{ width: progress + '%' }"></div>
          </div>
        </div>
        <div style="display:flex; gap:.5rem; flex-wrap:wrap;">
          <button :disabled="loading || !file">{{ loading ? 'Uploading...' : 'Upload & Generate QR' }}</button>
          <button type="button" class="btn-gray" @click="resetForm" :disabled="loading && !file">Reset</button>
        </div>
      </form>
      <p class="status" v-if="error" style="color:#b91c1c;">{{ error }}</p>
    </div>

    <div class="card" v-if="qrData">
      <h3>QR Code</h3>
      <div class="qr-box">
        <qrcode-vue :value="qrUrl" :size="220" level="M" ref="qrRef" />
        <div style="display:grid; gap:.5rem; width:100%; max-width:560px; margin-top:.5rem;">
          <label style="display:flex; gap:.5rem; align-items:center;">
            <input type="checkbox" v-model="asDownload" /> Make QR open as download
          </label>
          <div>
            <label>Suggested file name (no extension)</label>
            <input v-model="suggestedName" placeholder="Vaccination-<Name>-<ID>" />
            <p class="muted">The correct file extension will be added automatically.</p>
          </div>
        </div>
        <p style="word-break:break-all;font-size:.75rem;max-width:560px;">{{ qrUrl }}</p>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
          <button @click="downloadPng">Download QR PNG</button>
          <button class="btn-secondary" @click="copyUrl">Copy URL</button>
          <button class="btn-gray" @click="printQr">Print QR</button>
          <a class="button-link" :href="qrUrl" target="_blank">Open Document</a>
          <button @click="downloadDoc" class="btn-success">Download Document</button>
        </div>
      </div>
      <p class="status">docId: {{ qrData.docId }} | token: (hidden)</p>
      <details>
        <summary>Show Raw Response</summary>
        <pre style="font-size:.7rem; background:#f1f5f9; padding:.5rem;">{{ qrData }}</pre>
      </details>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">Recent Documents</h3>
      <p class="status" v-if="loadingRecent">Loading…</p>
      <p class="danger" v-if="recentError">{{ recentError }}</p>
      <div v-if="!loadingRecent && recent.length === 0" class="status">No documents yet.</div>
      <div v-for="item in recent" :key="item.docId" style="display:flex; justify-content:space-between; align-items:center; padding:.6rem 0; border-bottom:1px solid #eee; gap:.5rem;">
        <div style="min-width:0;">
          <div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ item.originalName }}</div>
          <div class="muted" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ item.url }}</div>
          <div class="muted">{{ item.patientName || 'Patient' }} · {{ item.patientId || item.docId }} · {{ (new Date(item.createdAt || Date.now())).toLocaleString() }}</div>
        </div>
        <div style="display:flex; gap:.4rem; flex-wrap:wrap;">
          <button class="btn-gray" @click="copy(item.url)">Copy URL</button>
          <a class="button-link" :href="item.url" target="_blank">Open</a>
          <button class="btn-success" @click="downloadRecent(item)">Download</button>
          <button class="btn-gray" style="background:#b91c1c;" @click="deleteWithConfirm(item)">Delete</button>
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:.5rem; margin-top:.75rem;">
        <div class="muted">Page {{ page }} of {{ totalPages }}</div>
        <div style="display:flex; gap:.5rem;">
          <button class="btn-gray" :disabled="page<=1" @click="page--; loadRecent();">Prev</button>
          <button class="btn-gray" :disabled="page>=totalPages" @click="page++; loadRecent();">Next</button>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">Recycle Bin</h3>
      <div v-if="trash.length === 0" class="status">No deleted documents.</div>
      <div v-for="item in trash" :key="item.docId" style="display:flex; justify-content:space-between; align-items:center; padding:.6rem 0; border-bottom:1px solid #eee; gap:.5rem;">
        <div style="min-width:0;">
          <div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">{{ item.originalName }}</div>
          <div class="muted">{{ item.patientName || 'Patient' }} · {{ item.patientId || item.docId }} · deleted {{ (new Date(item.deletedAt || Date.now())).toLocaleString() }}</div>
        </div>
        <div style="display:flex; gap:.4rem; flex-wrap:wrap;">
          <button class="btn-success" @click="restore(item)">Restore</button>
          <button class="btn-gray" style="background:#b91c1c;" @click="deleteForever(item)">Delete forever</button>
        </div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:.5rem; margin-top:.75rem;">
        <div class="muted">Page {{ trashPage }} of {{ trashTotalPages }}</div>
        <div style="display:flex; gap:.5rem;">
          <button class="btn-gray" :disabled="trashPage<=1" @click="trashPage--; loadTrash();">Prev</button>
          <button class="btn-gray" :disabled="trashPage>=trashTotalPages" @click="trashPage++; loadTrash();">Next</button>
          <button class="btn-gray" @click="loadTrash()">Refresh</button>
        </div>
      </div>
    </div>

    <div v-if="showConfirm" class="modal-backdrop" @click.self="cancelConfirm">
      <div class="modal">
        <h4>Confirm</h4>
        <p>{{ confirmText }}</p>
        <div style="display:flex; justify-content:flex-end; gap:.5rem; margin-top:1rem;">
          <button class="btn-gray" @click="cancelConfirm">Cancel</button>
          <button class="btn-success" @click="doConfirm">Yes</button>
        </div>
      </div>
    </div>

    <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.text }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import axios from 'axios';

const patientName = ref('');
const patientId = ref('');
const file = ref(null);
const loading = ref(false);
const error = ref('');
const qrData = ref(null);
const qrRef = ref();
const fileInput = ref();
const dragover = ref(false);
const previewUrl = ref('');
const progress = ref(0);
const asDownload = ref(false);
const suggestedName = ref('');
const recent = ref([]);
const loadingRecent = ref(false);
const recentError = ref('');
const page = ref(1);
const totalPages = ref(1);
const limit = ref(10);
const toast = ref({ show:false, text:'', type:'success' });
const trash = ref([]);
const trashPage = ref(1);
const trashTotalPages = ref(1);
const showConfirm = ref(false);
const confirmText = ref('');
let confirmAction = null;

const fileName = computed(() => file.value?.name || '');
const fileType = computed(() => file.value?.type || '');
const isImage = computed(() => /^image\//.test(fileType.value));
const humanSize = computed(() => {
  const size = file.value?.size || 0;
  if (!size) return '';
  const units = ['B','KB','MB','GB'];
  let i = 0; let n = size;
  while (n >= 1024 && i < units.length-1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
});

function onFile(e) {
  file.value = e.target.files[0];
  makePreview();
}

async function handleUpload() {
  error.value = '';
  if (!file.value) { error.value = 'No file selected'; return; }
  loading.value = true;
  try {
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
  // prefill a friendly default suggested name
  const pn = (patientName.value || 'Patient').replace(/[^\w\d\-_. ()]+/g,' ').trim();
  const pid = (patientId.value || qrData.value.docId).replace(/[^\w\d\-_. ()]+/g,' ').trim();
  suggestedName.value = `Vaccination-${pn}-${pid}`;
  await loadRecent();
  } catch (e) {
    error.value = e.response?.data?.error || e.message;
  } finally {
    loading.value = false;
    setTimeout(()=>progress.value=0, 600);
  }
}

function downloadPng() {
  // Convert canvas inside component to image
  const canvas = qrRef.value?.$el?.querySelector('canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `qr-${qrData.value.docId}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function downloadDoc() {
  if (!qrData.value) return;
  try {
  const res = await fetch(qrUrlWithDownload.value);
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const a = document.createElement('a');
  // Try to parse filename from Content-Disposition; fallback to originalName or constructed suggested name
  const cd = res.headers.get('content-disposition') || '';
  let fname = (cd.match(/filename\*=UTF-8''([^;]+)/) && decodeURIComponent(cd.match(/filename\*=UTF-8''([^;]+)/)[1]))
       || (cd.match(/filename="([^"]+)"/) && cd.match(/filename="([^"]+)"/)[1])
       || qrData.value.originalName
       || `${suggested}.${(blob.type.split('/')[1]||'bin')}`;
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
  } catch (e) {
    error.value = e.message;
  }
}

function copyUrl() {
  if (!qrData.value?.url) return;
  navigator.clipboard.writeText(qrData.value.url);
}

function printQr() {
  const canvas = qrRef.value?.$el?.querySelector('canvas');
  if (!canvas) return;
  const img = canvas.toDataURL('image/png');
  const w = window.open('', '_blank');
  w.document.write(`<img src="${img}" style="width:300px;height:300px" />`);
  w.document.close();
  w.focus();
  w.print();
}

function onDrop(ev) {
  dragover.value = false;
  const f = ev.dataTransfer?.files?.[0];
  if (!f) return;
  file.value = f;
  makePreview();
}

function makePreview() {
  previewUrl.value && URL.revokeObjectURL(previewUrl.value);
  if (file.value && /^image\//.test(file.value.type)) {
    previewUrl.value = URL.createObjectURL(file.value);
  } else {
    previewUrl.value = '';
  }
}

function resetForm() {
  patientName.value = '';
  patientId.value = '';
  file.value = null;
  previewUrl.value && URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = '';
  progress.value = 0;
  qrData.value = null;
  error.value = '';
}

const baseUrl = computed(() => qrData.value?.url || '');
const qrUrl = computed(() => {
  if (!baseUrl.value) return '';
  const params = new URLSearchParams();
  if (asDownload.value) params.set('dl', '1');
  if (suggestedName.value) params.set('name', suggestedName.value);
  return baseUrl.value + (baseUrl.value.includes('?') ? '&' : '?') + params.toString();
});

const qrUrlWithDownload = computed(() => {
  if (!baseUrl.value) return '';
  const params = new URLSearchParams();
  params.set('dl', '1');
  if (suggestedName.value) params.set('name', suggestedName.value);
  return baseUrl.value + (baseUrl.value.includes('?') ? '&' : '?') + params.toString();
});

async function loadRecent() {
  try {
    loadingRecent.value = true;
    recentError.value = '';
  const { data } = await axios.get('http://localhost:5055/api/documents', { params: { page: page.value, limit: limit.value } });
  recent.value = data.items || [];
  totalPages.value = data.totalPages || 1;
  } catch (e) {
    recentError.value = e.response?.data?.error || e.message;
  } finally {
    loadingRecent.value = false;
  }
}

function copy(text) {
  navigator.clipboard.writeText(text);
  showToast('Copied URL to clipboard', 'success');
}

async function downloadRecent(item) {
  const params = new URLSearchParams();
  params.set('dl', '1');
  const suggested = `Vaccination-${(item.patientName || 'Patient').replace(/[^\w\d\-_. ()]+/g,' ').trim()}-${(item.patientId || item.docId).replace(/[^\w\d\-_. ()]+/g,' ').trim()}`;
  params.set('name', suggested);
  const url = item.url + (item.url.includes('?') ? '&' : '?') + params.toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  const cd = res.headers.get('content-disposition') || '';
  let fname = (cd.match(/filename\*=UTF-8''([^;]+)/) && decodeURIComponent(cd.match(/filename\*=UTF-8''([^;]+)/)[1]))
           || (cd.match(/filename="([^"]+)"/) && cd.match(/filename="([^"]+)"/)[1])
           || item.originalName
           || `${suggested}.${(blob.type.split('/')[1]||'bin')}`;
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
  showToast('Download started', 'success');
}

onMounted(() => { loadRecent(); loadTrash(); });

async function deleteRecent(item) {
  try {
    await axios.delete(`http://localhost:5055/api/documents/${item.docId}`);
    showToast('Deleted document', 'success');
    await loadRecent();
  } catch (e) {
    showToast(e.response?.data?.error || e.message, 'error');
  }
}

function showToast(text, type='success') {
  toast.value = { show:true, text, type };
  setTimeout(() => toast.value.show = false, 1800);
}

async function loadTrash() {
  try {
    const { data } = await axios.get('http://localhost:5055/api/trash', { params: { page: trashPage.value, limit: 10 } });
    trash.value = data.items || [];
    trashTotalPages.value = data.totalPages || 1;
  } catch (e) {
    showToast(e.response?.data?.error || e.message, 'error');
  }
}

function confirm(message, action) {
  confirmText.value = message;
  confirmAction = action;
  showConfirm.value = true;
}

async function doConfirm() {
  showConfirm.value = false;
  if (confirmAction) await confirmAction();
}

function cancelConfirm() {
  showConfirm.value = false;
  confirmAction = null;
}

async function deleteWithConfirm(item) {
  confirm(`Delete "${item.originalName || item.docId}"? You can restore it from the Recycle Bin.`, async () => {
    await deleteRecent(item);
    await loadTrash();
  });
}

async function restore(item) {
  try {
    await axios.post(`http://localhost:5055/api/trash/${item.docId}/restore`);
    showToast('Restored document', 'success');
    await Promise.all([loadTrash(), loadRecent()]);
  } catch (e) {
    showToast(e.response?.data?.error || e.message, 'error');
  }
}

function deleteForever(item) {
  confirm(`Permanently delete "${item.originalName || item.docId}"? This cannot be undone.`, async () => {
    try {
      await axios.delete(`http://localhost:5055/api/trash/${item.docId}`);
      showToast('Deleted permanently', 'success');
      await loadTrash();
    } catch (e) {
      showToast(e.response?.data?.error || e.message, 'error');
    }
  });
}
</script>
