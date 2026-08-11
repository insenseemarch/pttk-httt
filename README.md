# HomeStay Dorm Management System

A comprehensive digital homestay and real estate management application that allows administrators to manage rooms, contracts, and tenants with advanced features like real-time notifications, digital signatures, and branch management.

## 🌟 Features

### 🏢 Property & Room Management
- **Branch Management:** Manage multiple homestay branches efficiently.
- **Room Organization:** Categorize rooms by type, price, and capacity.
- **Real-Time Availability:** Instantly check room availability and bed status.
- **Smart Searching:** Filter properties by branch, room type, and price range.

### 📝 Contract & Booking System
- **Digital Contracts:** Create and manage leasing contracts directly in the app.
- **E-Signatures:** Built-in digital signature support (`react-signature-canvas`) for tenants and admins.
- **Deposit Management:** Track booking deposits, approvals, and refunds.
- **Check-in/Check-out Workflow:** Seamless process for handing over rooms and verifying inventory.

### 🔔 Real-Time Communication
- **Live Updates:** Real-time notifications and data synchronization using Socket.IO.
- **Instant Messaging:** Real-time chat capabilities between staff and management.
- **Task Notifications:** Automated alerts for upcoming check-outs or pending approvals.

### 📊 Dashboard & Analytics
- **Business Insights:** Visualize revenue, occupancy rates, and pending tasks.
- **Financial Tracking:** Monitor payments, debts, and deposits.

### 📱 Modern User Experience
- **Responsive Design:** Mobile-friendly UI for on-the-go management.
- **Intuitive Interface:** Clean, modern React-based UI with smooth transitions.
- **Role-Based Access:** Secure login for different staff roles with varying permissions.

## 🛠 Tech Stack

### Backend
- **Node.js with Express.js** - RESTful API server
- **Socket.IO** - Real-time bidirectional communication
- **Supabase** - PostgreSQL database and backend-as-a-service
- **Bcrypt.js** - Secure password hashing
- **Dotenv** - Environment configuration management

### Frontend
- **React (v19)** - Modern UI library
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time frontend updates
- **React Signature Canvas** - Digital contract signing

### DevOps & Deployment
- **Vercel** - Frontend deployment platform
- **Render / Railway** - Backend Node.js deployment
- **Supabase** - Database hosting

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn
- Git
- A [Supabase](https://supabase.com/) account for database hosting

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/insenseemarch/pttk-httt.git
cd pttk-httt
```

### 2. Setup & Installation
Since this is a monorepo containing both frontend and backend in the root folder, you only need to install dependencies once:

```bash
npm install
```

### 3. Environment Variables
Copy the environment variables template and configure it:

Create a `.env` file in the root directory:
```env
# Database (Supabase)
SUPABASE_URL="your-supabase-url"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Frontend Configuration
VITE_API_URL="http://localhost:3001"
VITE_APP_URL="http://localhost:5173"
```

### 4. Start Development Server
Run both the frontend and backend concurrently:

```bash
npm run dev
```

### 5. Access the Application
- **Frontend App:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001`

## 📁 Project Structure

```text
pttk-httt/
├── server/             # Node.js + Express Backend
│   ├── config/         # Database and server configurations
│   ├── services/       # Business logic and external API integrations
│   ├── index.js        # Main Express/Socket.io entry point
│   └── seed*.js        # Database seeding scripts
├── src/                # React + Vite Frontend
│   ├── assets/         # Static images and styles
│   ├── components/     # Reusable UI components (Modals, Navbars)
│   ├── pages/          # Full page views (Dashboard, Contracts, etc.)
│   ├── App.jsx         # Main React component and Routing setup
│   └── main.jsx        # Application entry point
├── public/             # Public static assets
├── package.json        # Shared dependencies and scripts
└── vite.config.js      # Vite and API Proxy configuration
```

## 🔄 Real-Time Features

The application uses Socket.IO for real-time communication:

### Client Implementation Example
```javascript
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');

// Listen for notifications
socket.on('connect', () => {
  console.log('Connected to real-time server!');
});
```

## 🚀 Deployment

### Backend (Render.com)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set Build Command: `npm install`
4. Set Start Command: `npm run start`
5. Add all Environment Variables from your `.env` file

### Frontend (Vercel)
1. Import the repository in Vercel
2. Add the `VITE_API_URL` environment variable pointing to your deployed Render URL
3. Ensure `vercel.json` is present for API route rewriting:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-url.onrender.com/api/:path*"
    }
  ]
}
```
4. Deploy!

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License
This project is proprietary. Please contact the repository owner for licensing information.
