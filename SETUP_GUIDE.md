# Quick Setup Guide for Thesis Mates 🎓

## Prerequisites
- Node.js installed (v16 or higher)
- Git installed
- The `.env` file from Google Space

## Step-by-Step Setup

### 1. Clone the Repository
```powershell
git clone https://github.com/clarknotkent/Thesis.git
cd Thesis
git checkout SMSDemo
```

### 2. Backend Setup

**Navigate to backend:**
```powershell
cd backend
```

**Install dependencies:**
```powershell
npm install
```

**⚠️ IMPORTANT: Add the .env file**
- Get the `.env` file from Google Space
- Paste it in the `backend` folder
- Make sure it's named exactly `.env` (not `.env.txt` or `.env.example`)

**Start the backend server:**
```powershell
npm start
```

You should see:
```
Twilio Configuration:
- Account SID: AC6cd3dc...
- Auth Token: SET (hidden)
- Messaging Service SID: MG074074...
Server is running on http://localhost:3000
```

### 3. Frontend Setup

**Open a new terminal and navigate to frontend:**
```powershell
cd frontend
```

**Install dependencies:**
```powershell
npm install
```

**Start the frontend dev server:**
```powershell
npm run dev
```

You should see:
```
VITE v5.x.x ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 4. Use the Application

1. Open your browser and go to: `http://localhost:5173`
2. Enter a recipient phone number (with country code, e.g., `+639123456789`)
3. Type your message (max 160 characters)
4. Click "Send SMS"
5. Wait for success confirmation!

## Troubleshooting

### Backend won't start
- Make sure the `.env` file is in the `backend` folder
- Check if port 3000 is already in use
- Verify Node.js is installed: `node --version`

### Frontend won't start
- Make sure you ran `npm install` in the frontend folder
- Check if port 5173 is already in use
- Clear Vite cache: `Remove-Item -Recurse -Force .vite`

### SMS not sending
- Verify the `.env` file is correct (from Google Space)
- Check if the recipient number includes country code
- For trial accounts, the recipient must be verified in Twilio

## Project Structure
```
TwilioDemo/
├── backend/              # Express API server
│   ├── server.js        # Main server file
│   ├── package.json     
│   └── .env            # ⚠️ Get this from Google Space!
└── frontend/            # Vue 3 application
    ├── src/
    │   ├── App.vue     # Main component
    │   ├── main.js
    │   └── style.css
    ├── index.html
    └── package.json
```

## Need Help?
Contact the project maintainer or check the main README.md file for more detailed information.
