require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/send-sms', async (req, res) => {
  let { to, message } = req.body;
  const apiKey = process.env.PHILSMS_API_KEY;
  const senderId = process.env.PHILSMS_SENDER_ID || 'Eulap'; // Default to Eulap if not set

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
