require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve built Vue frontend in production
const clientDist = path.join(__dirname, 'dist');
app.use(express.static(clientDist));

app.post('/send-sms', async (req, res) => {
  let { to, message } = req.body;
  const apiKey = process.env.PHILSMS_API_KEY;
  const senderId = process.env.PHILSMS_SENDER_ID;

  if (!apiKey) {
    return res.status(500).json({ error: 'PhilSMS API key not configured.' });
  }

  // Format phone number
  if (!to.startsWith("+63")) {
    to = to.replace(/^0/, "+63");
  }

  try {
    const response = await axios.post(
      'https://app.philsms.com/api/v3/sms/send', // Updated endpoint from senior dev's file
      {
        sender_id: senderId,
        recipient: to,
        message,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SPA fallback — serve index.html for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
