import express from 'express';
const router = express.Router();
import { authenticateRequest, checkUserMapping, authorizeRole } from '../middlewares/authMiddleware.js';
import { mintPatientQrUrl, verifyAndGetRedirect, rotateNonce } from '../services/qrService.js';
import supabase from '../db.js';
import patientModel from '../models/patientModel.js';

// Mint a signed QR URL for a patient (backend-only; no PII in QR)
router.post('/patients/:id', authenticateRequest, checkUserMapping, authorizeRole([
  // Staff/Admin
  'admin','health_worker','health_staff','healthstaff','health worker',
  // Parents/Guardians
  'guardian','parent','guardian-parent'
]), async (req, res) => {
  try {
    const patientId = req.params.id;
    const ttlSeconds = req.body?.ttlSeconds;
    // Derive a public base URL from the incoming request to avoid hard-coded localhost in minted links
    // Prefer proxy headers when present (e.g., Railway, Render, Nginx)
    const forwardedProto = req.get('x-forwarded-proto');
    const forwardedHost = req.get('x-forwarded-host');
    const host = forwardedHost || req.get('host');
    const proto = forwardedProto || req.protocol || 'https';
    const baseUrl = host ? `${proto}://${host}` : undefined;
    // If caller is a guardian/parent, enforce that the patient belongs to them
    const role = (req.user && req.user.role ? String(req.user.role) : '').toLowerCase();
    const isGuardian = ['guardian','parent','guardian-parent'].includes(role);
    if (isGuardian) {
      // Resolve guardian_id for current user
      const userId = req.user && (req.user.user_id || req.user.id);
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User context missing' });
      }
      // Find guardian row for this user
      const { data: guardianRow, error: gErr } = await supabase
        .from('guardians')
        .select('guardian_id')
        .eq('user_id', userId)
        .eq('is_deleted', false)
        .maybeSingle();
      if (gErr) {
        console.error('Lookup guardian failed:', gErr);
        return res.status(500).json({ success: false, message: 'Failed to verify guardian' });
      }
      const myGuardianId = guardianRow?.guardian_id || null;
      if (!myGuardianId) {
        return res.status(403).json({ success: false, message: 'Guardian profile not found for current user' });
      }
      // Load patient to confirm ownership
      const patient = await patientModel.getPatientById(patientId).catch(() => null);
      const patientGuardianId = patient?.guardian_id || null;
      if (!patientGuardianId || patientGuardianId !== myGuardianId) {
        return res.status(403).json({ success: false, message: 'You can only generate QR for your own child' });
      }
    }
    const { url, exp, frontendUrl } = await mintPatientQrUrl(patientId, { ttlSeconds, baseUrl });
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

export default router;
