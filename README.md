# Twilio SMS Demo Application 📱

A lightweight full-stack application for sending SMS messages using the Twilio API. Built with Vue 3, Bootstrap 5, Node.js, and Express.

> **📝 Note for Thesis Mates:** Please use the `.env` file from the one I sent in the Google Space and paste it in the `backend` folder before running the application.

## 🚀 Features

- Simple and clean UI with Bootstrap 5
- Send SMS messages through Twilio API
- Real-time feedback and error handling
- Character counter for SMS messages
- Responsive design

## 📁 Project Structure

```
TwilioDemo/
├── backend/           # Node.js + Express API server
│   ├── server.js     # Main server file
│   ├── package.json
│   └── .env.example  # Environment variables template
└── frontend/          # Vue 3 application
    ├── src/
    │   ├── App.vue   # Main component
    │   ├── main.js
    │   └── style.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Twilio account with a verified phone number

### Backend Setup

1. Navigate to the backend folder:
   ```powershell
   cd backend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. **IMPORTANT:** Get the `.env` file from Google Space and paste it in the `backend` folder
   - The file contains all the necessary Twilio credentials
   - Make sure it's named exactly `.env` (not `.env.txt`)
   - It should be in the `backend` folder: `backend/.env`

4. (Optional) If you need to create your own `.env` file:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid_here
   PORT=3000
   ```

5. Start the backend server:
   ```powershell
   npm start
   ```
   
   Or for development with auto-restart:
   ```powershell
   npm run dev
   ```

   The server will run on `http://localhost:3000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend folder:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 🔑 Getting Twilio Credentials

1. Log in to your [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Get your **Twilio Phone Number** from the Phone Numbers section
4. If using a trial account, make sure to verify the recipient phone numbers

## 📝 Usage

1. Make sure both backend and frontend servers are running
2. Open `http://localhost:5173` in your browser
3. Enter the recipient's phone number (with country code, e.g., +1234567890)
4. Type your message (max 160 characters)
5. Click "Send SMS"
6. You'll see a success or error message

## 🔧 API Endpoints

### `POST /api/send-sms`

Send an SMS message via Twilio.

**Request Body:**
```json
{
  "to": "+1234567890",
  "message": "Your message here"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "SMS sent successfully!",
  "messageSid": "SM..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🎨 Technologies Used

### Frontend
- Vue 3 (Composition API)
- Bootstrap 5
- Axios
- Vite

### Backend
- Node.js
- Express
- Twilio SDK
- dotenv
- CORS

## 📚 Learning Resources

- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [Vue 3 Documentation](https://vuejs.org/)
- [Express.js Guide](https://expressjs.com/)
- [Bootstrap Documentation](https://getbootstrap.com/)

## ⚠️ Important Notes

- **Trial Account Limitations**: Twilio trial accounts can only send messages to verified phone numbers
- **Rate Limits**: Be aware of Twilio's rate limits and pricing
- **Security**: Never commit your `.env` file with real credentials to version control
- **Phone Number Format**: Always include the country code (e.g., +1 for US)

## 🐛 Troubleshooting

**Backend won't start:**
- Check if port 3000 is already in use
- Verify all Twilio credentials are correct in `.env`

**Frontend can't connect to backend:**
- Ensure backend is running on `http://localhost:3000`
- Check for CORS issues in browser console

**SMS not sending:**
- Verify your Twilio credentials
- Check if the recipient number is verified (for trial accounts)
- Ensure your Twilio account has sufficient credits
- Check the phone number format includes country code

## 📄 License

This project is open source and available for study and demo purposes.

## 💖 Enjoy!

Happy coding! Feel free to modify and extend this application for your needs.
