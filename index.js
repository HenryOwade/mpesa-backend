const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

app.post('/api/stkpush', async (req, res) => {
  const { phone, amount, name } = req.body;

  const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').slice(0, 14);
  const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

  try {
    // Get access token
    const tokenRes = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        auth: {
          username: process.env.MPESA_CONSUMER_KEY,
          password: process.env.MPESA_CONSUMER_SECRET,
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // STK Push request
    const stkRes = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: name,
        TransactionDesc: 'School Donation',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json({ success: true, message: 'STK Push initiated', data: stkRes.data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Optional: handle callback
app.post('/api/callback', (req, res) => {
  console.log('Callback received:', req.body);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
