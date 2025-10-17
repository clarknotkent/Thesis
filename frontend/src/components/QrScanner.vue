<template>
  <div>
    <div class="card">
      <h2 style="margin-top:0;">Scan QR</h2>
      <p class="status">Use camera live scan or upload a QR image (PNG/JPG).</p>
      <div v-if="error" class="danger" style="margin:.5rem 0;">{{ error }}</div>
      <div style="display:flex; gap:.5rem; align-items:center; flex-wrap:wrap;">
        <label>Camera:</label>
        <select v-model="selectedDeviceId" style="max-width:320px;">
          <option v-for="d in devices" :key="d.deviceId" :value="d.deviceId">{{ d.label || ('Camera ' + d.deviceId.slice(-4)) }}</option>
        </select>
        <button @click="refreshDevices" class="btn-gray" type="button">Refresh</button>
      </div>
      <div class="video-wrap" style="margin-top:.75rem;">
        <video ref="video" class="scanner-video" playsinline></video>
        <div class="scan-overlay"></div>
      </div>
      <div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap;">
        <button @click="startScanner" :disabled="scanning">{{ scanning ? 'Scanning...' : 'Start Scanner' }}</button>
        <button @click="stopScanner" :disabled="!scanning">Stop</button>
        <button @click="toggleTorch" :disabled="!track" class="btn-secondary">{{ torchOn ? 'Torch Off' : 'Torch On' }}</button>
        <button v-if="resultUrl" @click="openResult">Open Decoded URL</button>
        <button v-if="resultUrl" @click="clearResult" class="btn-gray">Clear</button>
      </div>
      <hr style="margin:1.25rem 0;" />
      <div style="display:flex;flex-direction:column;gap:.5rem;">
        <label style="font-weight:600;">Or Upload QR Image</label>
        <input type="file" accept="image/png,image/jpeg,image/jpg" @change="decodeImageFile" />
        <p class="status" v-if="decodingImage">Decoding image...</p>
      </div>
    </div>
    <div class="card" v-if="resultUrl">
      <h3>Decoded URL</h3>
      <p style="word-break:break-all;">{{ resultUrl }}</p>
      <iframe v-if="isPreviewable" :src="resultUrl" style="width:100%;height:420px;border:1px solid #ddd;border-radius:4px;" />
      <p v-else class="status">(Cannot inline preview. Use Open button.)</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { BrowserMultiFormatReader } from '@zxing/browser';

const video = ref(null);
const codeReader = new BrowserMultiFormatReader();
const scanning = ref(false);
const resultUrl = ref('');
const error = ref('');
let stream;
const decodingImage = ref(false);
const devices = ref([]);
const selectedDeviceId = ref('');
const torchOn = ref(false);
let track;

const isPreviewable = computed(() => /\.(pdf|png|jpg|jpeg)$/i.test(resultUrl.value.split('?')[0] || ''));

async function startScanner() {
  error.value = '';
  resultUrl.value = '';
  try {
    scanning.value = true;
    const constraints = selectedDeviceId.value
      ? { video: { deviceId: { exact: selectedDeviceId.value } } }
      : { video: { facingMode: 'environment' } };
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.value.srcObject = stream;
    await video.value.play();
    track = stream.getVideoTracks()[0];
    loopRead();
  } catch (e) {
    error.value = e.message;
    scanning.value = false;
  }
}

function stopScanner() {
  scanning.value = false;
  try { if (track && torchOn.value) toggleTorch(false); } catch {}
  if (stream) stream.getTracks().forEach(t => t.stop());
}

async function loopRead() {
  if (!scanning.value) return;
  try {
    const result = await codeReader.decodeOnceFromVideoElement(video.value);
    if (result?.text) {
      resultUrl.value = result.text.trim();
      stopScanner();
    }
  } catch (e) {
    if (scanning.value) requestAnimationFrame(loopRead); // continue trying
  }
}

function openResult() {
  if (resultUrl.value) window.open(resultUrl.value, '_blank');
}

function clearResult() {
  resultUrl.value = '';
  error.value = '';
}

async function decodeImageFile(e) {
  error.value = '';
  const file = e.target.files?.[0];
  if (!file) return;
  // Stop live scanning if active
  stopScanner();
  decodingImage.value = true;
  try {
    const url = URL.createObjectURL(file);
    const result = await codeReader.decodeFromImageUrl(url);
    URL.revokeObjectURL(url);
    if (result?.text) {
      resultUrl.value = result.text.trim();
    } else {
      error.value = 'No QR code detected in image';
    }
  } catch (er) {
    error.value = er.message || 'Failed to decode image';
  } finally {
    decodingImage.value = false;
    // allow selecting same file again if user wants to retry
    e.target.value = '';
  }
}

onBeforeUnmount(() => stopScanner());
onMounted(async () => {
  // load devices
  await refreshDevices();
});

async function refreshDevices() {
  try {
    const list = await navigator.mediaDevices.enumerateDevices();
    devices.value = list.filter(d => d.kind === 'videoinput');
    if (!selectedDeviceId.value && devices.value.length) {
      selectedDeviceId.value = devices.value[0].deviceId;
    }
  } catch (e) {
    error.value = e.message;
  }
}

async function toggleTorch(force) {
  try {
    if (!track) return;
    const supported = track.getCapabilities?.().torch;
    if (!supported) { error.value = 'Torch not supported on this device'; return; }
    const on = typeof force === 'boolean' ? force : !torchOn.value;
    await track.applyConstraints({ advanced: [{ torch: on }] });
    torchOn.value = on;
  } catch (e) {
    error.value = e.message;
  }
}
</script>
