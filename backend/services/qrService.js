const crypto = require('crypto');
const serviceSupabase = require('../db');
const { getSupabaseForRequest } = require('../utils/supabaseClient');

const APP_QR_SECRET = process.env.APP_QR_SECRET || 'change_me_dev_qr_secret';
const PORT = process.env.PORT || 3001;
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '') || `http://localhost:${PORT}`;
const FRONTEND_BASE_URL = (process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '') || 'http://localhost:5173';
const FRONTEND_PATIENT_RECORDS_PATH = process.env.FRONTEND_PATIENT_RECORDS_PATH || '/patients/:id/vaccination-records';
const DEFAULT_TTL = parseInt(process.env.APP_QR_DEFAULT_TTL_SECONDS || '15552000', 10); // ~180 days

console.log('QR Service env check: APP_QR_SECRET loaded:', !!process.env.APP_QR_SECRET, 'PUBLIC_BASE_URL:', PUBLIC_BASE_URL)

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');
}

function sign(payloadStr) {
  return base64url(crypto.createHmac('sha256', APP_QR_SECRET).update(payloadStr).digest());
}

function payloadString(patientId, nonce, exp) {
  return `${patientId}.${nonce || ''}.${exp || ''}`;
}

function buildFrontendRecordsUrl(patientId) {
  const path = FRONTEND_PATIENT_RECORDS_PATH.replace(':id', patientId);
  return `${FRONTEND_BASE_URL}${path}`;
}

function buildPublicQrUrl(patientId, nonce, exp) {
  const s = sign(payloadString(patientId, nonce, exp));
  const query = new URLSearchParams();
  if (exp) query.set('x', String(exp));
  query.set('t', s);
  return `${PUBLIC_BASE_URL}/qr/p/${patientId}?${query.toString()}`;
}

async function getNonceForPatient(patientId, supabase = serviceSupabase) {
  const { data, error } = await supabase
    .from('patients')
    .select('qr_nonce')
    .eq('patient_id', patientId)
    .eq('is_deleted', false)
    .single();
  if (error) throw error;
  return data?.qr_nonce;
}

async function ensureNonce(patientId, supabase = serviceSupabase) {
  // If qr_nonce is null (older rows before migration), set one and return it
  const { data, error } = await supabase
    .from('patients')
    .select('qr_nonce')
    .eq('patient_id', patientId)
    .single();
  if (error) throw error;
  if (data && data.qr_nonce) return data.qr_nonce;
  const { data: upd, error: updErr } = await supabase
    .from('patients')
    .update({ qr_nonce: crypto.randomUUID() })
    .eq('patient_id', patientId)
    .select('qr_nonce')
    .single();
  if (updErr) throw updErr;
  return upd.qr_nonce;
}

async function mintPatientQrUrl(patientId, opts = {}, supabase = serviceSupabase) {
  console.log(`[qrService] Received request to mint for patientId: ${patientId}`);

  const ttl = typeof opts.ttlSeconds === 'number' ? opts.ttlSeconds : DEFAULT_TTL;
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = opts.exp || (ttl > 0 ? nowSec + ttl : undefined);
  const nonce = await ensureNonce(patientId, supabase);
  const url = buildPublicQrUrl(patientId, nonce, exp);
  return { url, exp, frontendUrl: buildFrontendRecordsUrl(patientId) };
}

async function verifyAndGetRedirect(patientId, token, exp, supabase = serviceSupabase) {
  if (!token) return { ok: false, code: 400, message: 'Missing token' };
  if (exp) {
    const expNum = parseInt(String(exp), 10);
    if (Number.isFinite(expNum) && Math.floor(Date.now() / 1000) > expNum) {
      return { ok: false, code: 410, message: 'QR code expired' };
    }
  }
  const nonce = await getNonceForPatient(patientId, supabase);
  if (!nonce) return { ok: false, code: 404, message: 'Patient not found' };
  const expected = sign(payloadString(patientId, nonce, exp));
  if (expected !== token) return { ok: false, code: 403, message: 'Invalid token' };
  return { ok: true, redirectTo: buildFrontendRecordsUrl(patientId) };
}

async function rotateNonce(patientId, supabase = serviceSupabase) {
  const { data, error } = await supabase
    .from('patients')
    .update({ qr_nonce: crypto.randomUUID(), updated_at: new Date().toISOString() })
    .eq('patient_id', patientId)
    .select('qr_nonce')
    .single();
  if (error) throw error;
  return data.qr_nonce;
}

module.exports = {
  mintPatientQrUrl,
  verifyAndGetRedirect,
  rotateNonce,
};
