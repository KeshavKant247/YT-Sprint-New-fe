# Adda Education Dashboard - Frontend

React.js frontend for the Content Management Dashboard.

## Features

- 📊 Real-time stats dashboard
- 🔍 Advanced filtering by Type, Subcategory, and Subject
- ✏️ Inline editing of entries
- ➕ Add new entries with modal form
- 🗑️ Delete entries with confirmation
- 🎨 Clean, modern UI with Adda Education branding
- 📱 Responsive design

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` to set your backend API URL (default is `http://localhost:5000`).

### 3. Run Development Server

```bash
npm run dev
```

The app will run on `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx       # Main dashboard with filters and stats
│   │   ├── DataTable.jsx       # Data table with inline editing
│   │   └── AddEntryModal.jsx   # Modal for adding new entries
│   ├── services/
│   │   └── api.js              # API service for backend calls
│   ├── App.jsx                 # Main app component
│   ├── App.css                 # Styling with Adda Education theme
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── vite.config.js
└── package.json
```

## Color Scheme

The UI uses Adda Education's brand colors:
- Primary Red: `#DC143C`
- Secondary Red: `#B91230`
- White: `#FFFFFF`
- Light Gray: `#F8F9FA`
- Border Gray: `#E0E0E0`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
