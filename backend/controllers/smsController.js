const smsModel = require('../models/smsModel');

// Send an SMS
const sendSMS = async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    const result = await smsModel.sendSMS(phoneNumber, message);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send SMS' });
  }
};

module.exports = {
  sendSMS,
};