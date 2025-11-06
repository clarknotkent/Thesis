/**
 * useQRScanner Composable
 * 
 * Manages QR code scanning using device camera including:
 * - Camera device selection
 * - QR code detection and parsing
 * - Torch/flashlight control
 * - Patient ID extraction from various URL patterns
 * 
 * @returns {Object} QR scanner state and methods
 */

import { ref, onBeforeUnmount, nextTick } from 'vue'
import { BrowserMultiFormatReader, BrowserQRCodeReader } from '@zxing/browser'

export function useQRScanner(videoElement, onQRDetected) {
  // State
  const devices = ref([])
  const selectedDeviceId = ref('')
  const isRunning = ref(false)
  const torchOn = ref(false)
  const canTorch = ref(false)
  const message = ref('')
  const error = ref('')

  // Internal state
  const reader = new BrowserQRCodeReader()
  let currentStream = null
  let handled = false
  let statusTimer = null

  // Methods
  const listDevices = async () => {
    try {
      const inputs = await BrowserMultiFormatReader.listVideoInputDevices()
      devices.value = inputs
      // Prefer back camera
      const back = inputs.find(d => /back|rear/i.test(d.label)) || inputs.at(-1) || inputs[0]
      selectedDeviceId.value = back?.deviceId || inputs[0]?.deviceId || ''
    } catch (e) {
      console.error('List devices failed', e)
    }
  }

  const stop = () => {
    try { reader.reset() } catch {}
    if (currentStream) {
      currentStream.getTracks().forEach(t => t.stop())
      currentStream = null
    }
    isRunning.value = false
    torchOn.value = false
    canTorch.value = false
    if (statusTimer) { 
      clearTimeout(statusTimer)
      statusTimer = null 
    }
  }

  const restart = async () => {
    stop()
    await start()
  }

  const enableTorchIfSupported = () => {
    try {
      const track = currentStream?.getVideoTracks?.()[0]
      if (!track) return
      const caps = track.getCapabilities?.()
      canTorch.value = !!caps?.torch
    } catch {}
  }

  const toggleTorch = async () => {
    try {
      const track = currentStream?.getVideoTracks?.()[0]
      if (!track) return
      const caps = track.getCapabilities?.()
      if (!caps?.torch) return
      torchOn.value = !torchOn.value
      await track.applyConstraints({ advanced: [{ torch: torchOn.value }] })
    } catch (e) {
      console.warn('Torch toggle failed', e)
    }
  }

  const start = async () => {
    message.value = ''
    error.value = ''
    handled = false
    
    try {
      await nextTick()
      isRunning.value = true
      
      const onResult = (result, err, controls) => {
        if (result && !handled) {
          handled = true
          message.value = 'QR detected. Processing…'
          
          try { 
            console.debug('[QRScanner] raw result:', result?.getText?.() || String(result)) 
          } catch {}
          
          // Capture stream reference for torch
          if (!currentStream && videoElement.value) {
            try { 
              currentStream = videoElement.value.srcObject || videoElement.value.captureStream?.() 
            } catch {}
          }
          
          try { controls?.stop() } catch {}
          stop()
          
          const text = result.getText?.() || String(result)
          if (onQRDetected) {
            onQRDetected(text)
          }
        }
        
        if (err && err.name && err.name !== 'NotFoundException') {
          // Other decode errors are noisy; ignore continuously
          try { 
            console.debug('[QRScanner] decode error:', err?.name) 
          } catch {}
        }
      }

      if (selectedDeviceId.value) {
        // Use a specific camera if chosen
        await reader.decodeFromVideoDevice(selectedDeviceId.value, videoElement.value, onResult)
      } else {
        // Fallback: request environment/back camera via constraints
        await reader.decodeFromConstraints(
          { 
            video: { 
              facingMode: { ideal: 'environment' }, 
              width: { ideal: 1280 }, 
              height: { ideal: 720 } 
            } 
          },
          videoElement.value,
          onResult
        )
      }
      
      // Try to get stream to check torch
      try {
        const el = videoElement.value
        currentStream = el?.srcObject || currentStream
        enableTorchIfSupported()
      } catch {}
      
      message.value = 'Scanner ready'
      
      // After a few seconds, reassure it's still scanning
      statusTimer = setTimeout(() => {
        if (isRunning.value && !handled) {
          message.value = 'Still scanning… Ensure good lighting and fill the frame.'
        }
      }, 6000)
    } catch (e) {
      console.error('Start scanner failed', e)
      error.value = 'Unable to access camera. You can paste the QR link manually.'
      isRunning.value = false
    }
  }

  // Helper function to check if string is URL
  const isUrl = (str) => {
    try { 
      new URL(str)
      return true 
    } catch { 
      return false 
    }
  }

  // Extract patient ID from various URL patterns
  const extractPatientId = (text) => {
    try {
      if (isUrl(text)) {
        const u = new URL(text)
        const parts = u.pathname.split('/').filter(Boolean)
        
        // Backend public QR: /qr/p/:id
        if (parts.length >= 3 && parts[0] === 'qr' && parts[1] === 'p' && parts[2]) {
          return parts[2]
        }
        
        // Neutral route: /patient/:id
        if (parts.length >= 2 && parts[0] === 'patient' && parts[1]) {
          return parts[1]
        }
        
        // Admin views: /admin/patients/view/:id or /admin/patients/:id
        if (parts[0] === 'admin' && parts[1] === 'patients') {
          if (parts[2] === 'view' && parts[3]) return parts[3]
          if (parts[2]) return parts[2]
        }
        
        // Healthworker: /healthworker/patients/:id
        if (parts[0] === 'healthworker' && parts[1] === 'patients' && parts[2]) {
          return parts[2]
        }
        
        // Parent: /parent/records/:id or /parent/child-info/:childId
        if (parts[0] === 'parent') {
          if (parts[1] === 'records' && parts[2]) return parts[2]
          if (parts[1] === 'child-info' && parts[2]) return parts[2]
        }
      }
    } catch {}
    
    // Fallback: looks like a UUID/id
    if (/^[A-Za-z0-9_-]{6,}$/.test(text)) {
      return text
    }
    
    return null
  }

  // Cleanup on unmount
  onBeforeUnmount(() => {
    stop()
  })

  return {
    // State
    devices,
    selectedDeviceId,
    isRunning,
    torchOn,
    canTorch,
    message,
    error,
    
    // Methods
    listDevices,
    start,
    stop,
    restart,
    toggleTorch,
    isUrl,
    extractPatientId
  }
}
