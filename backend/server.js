import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5055;
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';
const APP_SECRET = process.env.APP_SECRET || 'change_me_dev_secret';

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());

// Storage setup
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const trashDir = path.join(process.cwd(), 'trash');
if (!fs.existsSync(trashDir)) fs.mkdirSync(trashDir, { recursive: true });

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('Unsupported file type'));
    cb(null, true);
  }
});

// Deterministic token (HMAC) so we don't need DB for demo
function signDocId(docId) {
  return crypto.createHmac('sha256', APP_SECRET).update(docId).digest('base64url');
}

// Basic health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Upload endpoint
app.post('/api/documents', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const storedName = req.file.filename; // UUID + ext
    const docId = path.parse(storedName).name; // just UUID
    const token = signDocId(docId);
    const accessUrl = `${req.protocol}://${req.get('host')}/d/${docId}?token=${token}`;
    // store metadata sidecar (best-effort, ignore errors)
    try {
      fs.writeFileSync(path.join(uploadDir, `${docId}.json`), JSON.stringify({
        originalName: req.file.originalname,
        mime: req.file.mimetype,
  createdAt: new Date().toISOString(),
  patientName: req.body?.patientName || '',
  patientId: req.body?.patientId || ''
      }));
    } catch (e) { /* ignore */ }
    res.json({ docId, token, url: accessUrl, originalName: req.file.originalname, mime: req.file.mimetype });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List recent documents (metadata + URL)
app.get('/api/documents', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.json'));
    let items = files.map(metaName => {
      const docId = path.basename(metaName, '.json');
      let meta = {};
      try { meta = JSON.parse(fs.readFileSync(path.join(uploadDir, metaName), 'utf8')); } catch {}
      const fileOnDisk = fs.readdirSync(uploadDir).find(f => f.startsWith(docId) && !f.endsWith('.json'));
      const filePath = fileOnDisk ? path.join(uploadDir, fileOnDisk) : null;
      const size = filePath && fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
      const token = signDocId(docId);
      const url = `${req.protocol}://${req.get('host')}/d/${docId}?token=${token}`;
      return {
        docId,
        url,
        originalName: meta.originalName || fileOnDisk || '',
        mime: meta.mime || (fileOnDisk ? mime.lookup(fileOnDisk) : ''),
        createdAt: meta.createdAt || null,
        patientName: meta.patientName || '',
        patientId: meta.patientId || '',
        size
      };
    }).sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
    const total = items.length;
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);
    res.json({ items: paged, page, limit, total, totalPages: Math.max(1, Math.ceil(total/limit)) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete a document (file + metadata)
app.delete('/api/documents/:docId', (req, res) => {
  const { docId } = req.params;
  try {
    // move sidecar to trash and stamp deletedAt
    const metaPath = path.join(uploadDir, `${docId}.json`);
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        meta.deletedAt = new Date().toISOString();
        fs.writeFileSync(metaPath, JSON.stringify(meta));
      } catch {}
      fs.renameSync(metaPath, path.join(trashDir, `${docId}.json`));
    }
    // move file(s) with this prefix (uuid) to trash
    const files = fs.readdirSync(uploadDir).filter(f => f.startsWith(docId) && !f.endsWith('.json'));
    files.forEach(f => {
      const src = path.join(uploadDir, f);
      const dest = path.join(trashDir, f);
      if (fs.existsSync(src)) fs.renameSync(src, dest);
    });
    res.json({ deleted: true, docId, softDeleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List trash
app.get('/api/trash', (req, res) => {
  try {
    const files = fs.readdirSync(trashDir).filter(f => f.endsWith('.json'));
    let items = files.map(metaName => {
      const docId = path.basename(metaName, '.json');
      let meta = {};
      try { meta = JSON.parse(fs.readFileSync(path.join(trashDir, metaName), 'utf8')); } catch {}
      const fileOnDisk = fs.readdirSync(trashDir).find(f => f.startsWith(docId) && !f.endsWith('.json'));
      const filePath = fileOnDisk ? path.join(trashDir, fileOnDisk) : null;
      const size = filePath && fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
      return {
        docId,
        originalName: meta.originalName || fileOnDisk || '',
        mime: meta.mime || (fileOnDisk ? mime.lookup(fileOnDisk) : ''),
        createdAt: meta.createdAt || null,
        deletedAt: meta.deletedAt || null,
        patientName: meta.patientName || '',
        patientId: meta.patientId || '',
        size
      };
    }).sort((a,b) => new Date(b.deletedAt||0) - new Date(a.deletedAt||0));
    const total = items.length;
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const start = (page - 1) * limit;
    const paged = items.slice(start, start + limit);
    res.json({ items: paged, page, limit, total, totalPages: Math.max(1, Math.ceil(total/limit)) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Restore from trash
app.post('/api/trash/:docId/restore', (req, res) => {
  const { docId } = req.params;
  try {
    const metaPath = path.join(trashDir, `${docId}.json`);
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        delete meta.deletedAt;
        fs.writeFileSync(metaPath, JSON.stringify(meta));
      } catch {}
      fs.renameSync(metaPath, path.join(uploadDir, `${docId}.json`));
    }
    const files = fs.readdirSync(trashDir).filter(f => f.startsWith(docId) && !f.endsWith('.json'));
    files.forEach(f => {
      const src = path.join(trashDir, f);
      const dest = path.join(uploadDir, f);
      if (fs.existsSync(src)) fs.renameSync(src, dest);
    });
    res.json({ restored: true, docId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Permanently delete from trash
app.delete('/api/trash/:docId', (req, res) => {
  const { docId } = req.params;
  try {
    const metaPath = path.join(trashDir, `${docId}.json`);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
    const files = fs.readdirSync(trashDir).filter(f => f.startsWith(docId) && !f.endsWith('.json'));
    files.forEach(f => {
      const fp = path.join(trashDir, f);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    });
    res.json({ deleted: true, docId, permanent: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Serve document with token validation
function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return '';
  // allow letters, numbers, space, dash, underscore, dot, parentheses
  return name.replace(/[^\w\d\-_. ()]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

function encodeRFC5987ValueChars(str) {
  return encodeURIComponent(str)
    .replace(/['()]/g, escape)
    .replace(/\*/g, '%2A')
    .replace(/%(7C|60|5E)/g, (m, hex) => '%' + hex.toLowerCase());
}

app.get('/d/:docId', (req, res) => {
  const { docId } = req.params;
  const { token, dl } = req.query;
  if (!token || token !== signDocId(docId)) return res.status(403).json({ error: 'Invalid or missing token' });

  // Find file with docId prefix (UUID) regardless of extension
  const files = fs.readdirSync(uploadDir).filter(f => f.startsWith(docId));
  if (!files.length) return res.status(404).json({ error: 'Not found' });
  const filePath = path.join(uploadDir, files[0]);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  const download = dl === '1' || dl === 'true';
  // Attempt to load metadata for nicer filename
  let originalName, patientName, patientId;
  const metaPath = path.join(uploadDir, `${docId}.json`);
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      originalName = meta.originalName; patientName = meta.patientName; patientId = meta.patientId;
    } catch(e){ /* ignore */ }
  }
  // fallback derived
  if (!originalName) {
    const ext = path.extname(files[0]);
    originalName = `${docId}${ext}`;
  }
  // Allow user-provided filename override: ?name=
  const qName = sanitizeFilename(req.query?.name);
  const extOnDisk = path.extname(files[0]) || path.extname(originalName) || '';
  let finalName;
  if (qName) {
    finalName = qName.endsWith(extOnDisk) ? qName : (extOnDisk ? qName + extOnDisk : qName);
  } else if (patientName || patientId) {
    const pn = sanitizeFilename(patientName || 'Patient');
    const pid = sanitizeFilename(patientId || docId);
    const base = `Vaccination-${pn}-${pid}`;
    finalName = extOnDisk ? `${base}${extOnDisk}` : base;
  } else {
    finalName = originalName;
  }
  const safeName = finalName.replace(/["\\\r\n]/g, '_');
  res.setHeader('Content-Type', mimeType);
  const dispType = download ? 'attachment' : 'inline';
  res.setHeader('Content-Disposition', `${dispType}; filename="${safeName}"; filename*=UTF-8''${encodeRFC5987ValueChars(safeName)}`);
  res.setHeader('X-Download-Filename', safeName);
  fs.createReadStream(filePath).pipe(res);
});

// Simple error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(400).json({ error: err.message || 'Upload error' });
});

app.listen(PORT, () => console.log(`QR backend running on :${PORT}`));
