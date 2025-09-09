const express = require('express');
const router = express.Router();
const { sendSMS } = require('../controllers/smsController');

// POST /api/sms - Send an SMS
router.post('/', sendSMS);

module.exports = router;
