# PhilSMS Demo

A full-stack web application for sending SMS messages to Philippine mobile numbers using the PhilSMS API.

---

## Tech Stack

| | |
|--|--|
| **Frontend** | Vue 3, Vite, Bootstrap 5, Axios |
| **Backend** | Node.js, Express, Axios, dotenv |
| **SMS** | PhilSMS API v3 |

---

## Prerequisites

- **Node.js** v20 or higher — [nodejs.org](https://nodejs.org/)
- A **PhilSMS API key** from your PhilSMS account

---

## Setup

**1. Clone the repository**

```bash
git clone https://github.com/clarknotkent/Thesis.git
cd Thesis
git checkout SMSDemo
```

**2. Install dependencies**

```bash
npm install
```

**3. Create the `.env` file**

Create a file named `.env` in the project root:

```env
PHILSMS_API_KEY=your_api_key_here
PHILSMS_SENDER_ID=your_sender_id_here
PORT=3000
```

| Variable | Description | Required |
|----------|-------------|----------|
| `PHILSMS_API_KEY` | Your PhilSMS API Bearer token | Yes |
| `PHILSMS_SENDER_ID` | Sender name shown on received SMS | Yes |
| `PORT` | Express server port (default: `3000`) | No |

> **`.env` is git-ignored and never committed.** Keep your API key out of version control.

---

## Running the App

### Development

```bash
npm run dev
```

Starts the Express server on port `3000` and the Vite dev server on port `5173` concurrently. Vite automatically proxies `/send-sms` requests to Express.

Open **http://localhost:5173**

### Production

```bash
npm start
```

Builds the Vue app into `dist/`, then Express serves it alongside the API — single process, single port.

Open **http://localhost:3000**

---

## Project Structure

```
SMSDemo/
├── src/
│   ├── App.vue          # SMS form, validation, and send logic
│   ├── main.js          # App entry point
│   ├── style.css        # Custom styles
│   ├── assets/
│   └── components/
│       ├── Navbar.vue
│       ├── Footer.vue
│       └── SmsForm.vue
├── public/
│   └── favicon.ico
├── index.html
├── vite.config.js       # Vite config + dev proxy
├── server.js            # Express API + static file serving
├── package.json
├── .env                 # Git-ignored — create this yourself
└── API_DOCUMENTATION.md
```

---

## How to Use

1. Enter an 11-digit Philippine mobile number starting with `09` (e.g. `09171234567`)
2. Type a message — up to 160 characters
3. Click **Send SMS**
4. A green alert confirms success; red shows the error

The number is automatically converted to `+63` international format before sending.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Cannot GET /` in browser | Run `npm run dev` and open `http://localhost:5173`, not `:3000` |
| SMS not sending | Check your `PHILSMS_API_KEY` in `.env` and verify your PhilSMS balance |
| Port 3000 already in use | Run `netstat -ano \| findstr :3000` and kill the process |
| Missing `.env` | Create it in the project root — see Setup step 3 |
| Dependency errors | Delete `node_modules/` and run `npm install` again |
