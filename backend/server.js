require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Twilio client initialization
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Log configuration status (without revealing sensitive data)
console.log('Twilio Configuration:');
console.log('- Account SID:', process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.substring(0, 8)}...` : 'NOT SET');
console.log('- Auth Token:', process.env.TWILIO_AUTH_TOKEN ? 'SET (hidden)' : 'NOT SET');
console.log('- Messaging Service SID:', process.env.TWILIO_MESSAGING_SERVICE_SID || 'NOT SET');

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Twilio SMS API Server is running!' });
});

// Send SMS endpoint
app.post('/api/send-sms', async (req, res) => {
  console.log('Received SMS request:', req.body);
  const { to, message } = req.body;

  // Validation
  if (!to || !message) {
    console.log('Validation failed - to:', to, 'message:', message);
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide both "to" phone number and "message"' 
    });
  }

  try {
    // Prepare message options
    const messageOptions = {
      body: message,
      to: to
    };

    // Use Messaging Service SID if available, otherwise use phone number
    if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
      messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
      console.log('Sending SMS via Messaging Service:', process.env.TWILIO_MESSAGING_SERVICE_SID);
    } else if (process.env.TWILIO_PHONE_NUMBER) {
      messageOptions.from = process.env.TWILIO_PHONE_NUMBER;
      console.log('Sending SMS from phone number:', process.env.TWILIO_PHONE_NUMBER);
    } else {
      return res.status(500).json({
        success: false,
        error: 'No Twilio phone number or messaging service configured'
      });
    }

    console.log('Sending to:', to);
    console.log('Message:', message);

    const result = await twilioClient.messages.create(messageOptions);

    console.log('✅ SMS sent successfully! SID:', result.sid);

    res.json({
      success: true,
      message: 'SMS sent successfully!',
      messageSid: result.sid
    });
  } catch (error) {
    console.error('❌ Twilio Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send SMS'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
