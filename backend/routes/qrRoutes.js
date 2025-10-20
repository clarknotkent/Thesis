const express = require('express');
const router = express.Router();
const { authenticateRequest, checkUserMapping, authorizeRole } = require('../middlewares/authMiddleware');
const { mintPatientQrUrl, verifyAndGetRedirect, rotateNonce } = require('../services/qrService');

// Mint a signed QR URL for a patient (backend-only; no PII in QR)
router.post('/patients/:id', authenticateRequest, checkUserMapping, authorizeRole(['admin','health_worker','health_staff']), async (req, res) => {
  try {
    const patientId = req.params.id;
    const ttlSeconds = req.body?.ttlSeconds;
    const { url, exp, frontendUrl } = await mintPatientQrUrl(patientId, { ttlSeconds });
    res.json({ success: true, data: { url, exp, frontendUrl } });
  } catch (e) {
    console.error('Mint QR error:', e);
    res.status(500).json({ success: false, message: 'Failed to mint QR URL', error: e.message });
  }
});

// Rotate QR nonce to revoke all existing QR links for a patient
router.post('/patients/:id/rotate', authenticateRequest, checkUserMapping, authorizeRole(['admin']), async (req, res) => {
  try {
    const patientId = req.params.id;
    await rotateNonce(patientId);
    res.json({ success: true, message: 'QR links revoked for patient' });
  } catch (e) {
    console.error('Rotate nonce error:', e);
    res.status(500).json({ success: false, message: 'Failed to rotate QR nonce', error: e.message });
  }
});

// Public scanner endpoint: validates token and redirects to frontend records page
router.get('/p/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const token = req.query.t;
    const exp = req.query.x;
    const result = await verifyAndGetRedirect(patientId, token, exp);
    if (!result.ok) {
      return res.status(result.code || 400).json({ success: false, message: result.message || 'Invalid QR' });
    }
    // Perform an HTTP redirect to the SPA route
    return res.redirect(302, result.redirectTo);
  } catch (e) {
    console.error('QR verify error:', e);
    res.status(500).json({ success: false, message: 'Failed to process QR', error: e.message });
  }
});

module.exports = router;
