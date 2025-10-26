# PhilSMS Demo Application

<div align="center">
  <h3>📱 SMS Messaging Application using PhilSMS API</h3>
  <p>A modern, user-friendly web application for sending SMS messages through the PhilSMS API</p>
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

PhilSMS Demo is a full-stack web application that provides an intuitive interface for sending SMS messages using the PhilSMS API. The application features a Vue.js frontend with Bootstrap styling and a Node.js/Express backend that handles API communication with PhilSMS.

### Key Highlights

- ✅ **Real-time validation** - Phone numbers validated as you type
- ✅ **User-friendly interface** - Clean, modern design with helpful feedback
- ✅ **Character counter** - Visual indicator for SMS length limits
- ✅ **Auto-formatting** - Automatically converts Philippine phone numbers to +63 format
- ✅ **Error handling** - Clear error messages and status indicators
- ✅ **Session tracking** - Keeps count of SMS sent during the session

---

## ✨ Features

### Frontend Features
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Modern UI** - Beautiful gradient backgrounds and smooth animations
- ✍️ **Live Validation** - Real-time phone number and message validation
- 📊 **Character Counter** - Color-coded character count with warnings
- 🔄 **Form Management** - Easy clear and reset functionality
- ⚡ **Loading States** - Visual feedback during SMS sending
- ✅ **Success/Error Alerts** - Clear feedback on operation results

### Backend Features
- 🚀 **Express Server** - Fast and reliable Node.js backend
- 🔐 **Environment Variables** - Secure API key management
- 📞 **Phone Formatting** - Automatic conversion of Philippine numbers to international format
- 🛡️ **Error Handling** - Comprehensive error catching and reporting
- 🌐 **CORS Enabled** - Cross-origin requests supported

---

## 🛠️ Technology Stack

### Frontend
- **Vue.js 3** - Progressive JavaScript framework (Composition API)
- **Vite** - Next-generation frontend tooling
- **Bootstrap 5** - CSS framework for responsive design
- **Axios** - Promise-based HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Axios** - HTTP client for API requests
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing middleware

### API
- **PhilSMS API** - SMS messaging service for the Philippines

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download Git](https://git-scm.com/)
- **PhilSMS API Key** - Get your API key from [PhilSMS](https://philsms.com/)

To check if Node.js and npm are installed:

```bash
node --version
npm --version
```

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/clarknotkent/Thesis.git
cd Thesis
git checkout SMSDemo
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

## ⚙️ Configuration

### Backend Configuration

1. Navigate to the `server` directory
2. Open the `.env` file (it should already exist)
3. Configure your PhilSMS API credentials:

```env
PHILSMS_API_KEY=362|jA3v0uuHjeHXb4LcPvVo4EWutmyLfLstje0WuIsX
PHILSMS_SENDER_ID=Eulap
PORT=3000
```

**Environment Variables Explanation:**

| Variable | Description | Example |
|----------|-------------|---------|
| `PHILSMS_API_KEY` | Your PhilSMS API Bearer token | `362\|jA3v0u...` |
| `PHILSMS_SENDER_ID` | The sender name that appears on SMS | `Eulap` |
| `PORT` | Port for the backend server | `3000` |

> **Note:** Since this is a private repository, the `.env` file is included. For production deployments, always use environment variables and never commit sensitive credentials.

---

## 🏃 Running the Application

You need to run both the backend server and the frontend development server.

### Option 1: Using Two Terminal Windows

**Terminal 1 - Start Backend Server:**

```bash
cd server
npm start
```

You should see:
```
Server is running on port 3000
```

**Terminal 2 - Start Frontend Server:**

```bash
cd client
npm run dev
```

You should see:
```
VITE v7.1.10  ready in 421 ms
➜  Local:   http://localhost:5173/
```

### Option 2: Using VS Code Split Terminal

1. Open VS Code integrated terminal
2. Split the terminal (Ctrl+Shift+5 or Cmd+Shift+5)
3. In the first terminal: `cd server && npm start`
4. In the second terminal: `cd client && npm run dev`

### Accessing the Application

Once both servers are running, open your browser and navigate to:

```
http://localhost:5173
```

---

## 📁 Project Structure

```
PhilSMS/
├── .github/
│   └── copilot-instructions.md
├── client/                      # Vue.js Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   └── main.css
│   │   ├── components/
│   │   │   ├── Footer.vue
│   │   │   ├── Navbar.vue
│   │   │   └── SmsForm.vue
│   │   ├── App.vue             # Main application component
│   │   ├── main.js             # Application entry point
│   │   └── style.css           # Custom styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                      # Express Backend
│   ├── server.js               # Main server file
│   ├── .env                    # Environment variables
│   └── package.json
├── .gitignore
├── README.md
└── API_DOCUMENTATION.md
```

### Key Files Explained

- **`client/src/App.vue`** - Main Vue component with SMS form and logic
- **`client/src/main.js`** - Vue app initialization and Bootstrap imports
- **`client/src/style.css`** - Custom CSS with gradients and animations
- **`server/server.js`** - Express server with SMS endpoint
- **`server/.env`** - API credentials and configuration

---

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API endpoint documentation.

### Quick Reference

**Send SMS Endpoint:**

```
POST http://localhost:3000/send-sms
Content-Type: application/json

{
  "to": "09171234567",
  "message": "Your message here"
}
```

---

## 📖 Usage Guide

### Sending an SMS

1. **Enter Phone Number**
   - Type the recipient's 11-digit Philippine mobile number
   - Format: `09XXXXXXXXX` (starts with 09)
   - The system automatically converts it to `+63` format

2. **Compose Message**
   - Type your message in the text area
   - Maximum 160 characters
   - Character counter changes color as you approach the limit

3. **Send SMS**
   - Click the "📤 Send SMS" button
   - Button is disabled until form is valid
   - Loading spinner appears while sending

4. **View Result**
   - Success: Green alert with confirmation message
   - Error: Red alert with error details
   - Form auto-clears after successful send

### Form Validation

The form validates:
- ✅ Phone number starts with "09"
- ✅ Phone number is exactly 11 digits
- ✅ Phone number contains only numbers
- ✅ Message is not empty
- ✅ Message is within 160 characters

### Tips

- 💡 Use the **Clear Form** button to reset all fields
- 💡 The session counter shows total SMS sent
- 💡 Watch for the character counter color changes:
  - 🟢 Green: 0-120 characters
  - 🔵 Blue: 121-140 characters
  - 🟡 Orange: 141-159 characters
  - 🔴 Red: 160 characters (limit)

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Cannot Connect to Backend

**Symptom:** Error message about connection refused or network error

**Solution:**
- Ensure the backend server is running on port 3000
- Check if `http://localhost:3000` is accessible
- Verify no other service is using port 3000

```bash
# Check if port 3000 is in use (Windows)
netstat -ano | findstr :3000

# Check if port 3000 is in use (Mac/Linux)
lsof -i :3000
```

#### 2. PhilSMS API Error

**Symptom:** "Failed to send SMS" or API-related errors

**Solution:**
- Verify your API key in `server/.env` is correct
- Check your PhilSMS account balance
- Ensure the sender ID is registered
- Verify the recipient number is valid

#### 3. Bootstrap Not Loading

**Symptom:** Unstyled interface

**Solution:**
```bash
cd client
npm install bootstrap
npm run dev
```

#### 4. Module Not Found Errors

**Symptom:** Import errors or missing dependencies

**Solution:**
```bash
# Reinstall dependencies
cd server
rm -rf node_modules
npm install

cd ../client
rm -rf node_modules
npm install
```

#### 5. Vite Build Errors

**Symptom:** Vite fails to start

**Solution:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages (F12)
2. Check the server terminal for backend errors
3. Review the [API Documentation](./API_DOCUMENTATION.md)
4. Create an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Use ES6+ JavaScript features
- Follow Vue.js best practices
- Write clear, descriptive commit messages
- Comment complex logic
- Test your changes thoroughly

---

## 📄 License

This project is part of a thesis project and is intended for educational purposes.

---

## 📞 Contact & Support

For questions or support regarding this project:

- **GitHub Issues:** [Create an issue](https://github.com/clarknotkent/Thesis/issues)
- **Repository:** [clarknotkent/Thesis](https://github.com/clarknotkent/Thesis)

---

## 🙏 Acknowledgments

- **PhilSMS** - For providing the SMS API
- **Vue.js Team** - For the amazing framework
- **Bootstrap Team** - For the UI framework
- **Express.js** - For the backend framework

---

<div align="center">
  <p>Made with ❤️ for educational purposes</p>
  <p>© 2025 PhilSMS Demo Project</p>
</div>
