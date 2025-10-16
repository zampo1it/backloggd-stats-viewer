# Backloggd Stats Viewer - Frontend

Beautiful web interface for viewing and analyzing your Backloggd game statistics.

## Features

- 📎 **Enter Backloggd Link**: Fetch your games directly from Backloggd
- 📄 **Import JSON File**: Import previously exported JSON data via file upload or drag & drop
- 📊 **View Statistics**: See your complete game collection
- 💾 **Export Data**: Download your data as JSON or copy to clipboard
- 🎨 **Modern UI**: Beautiful, responsive design with dark theme
- 🎯 **Drag & Drop**: Simply drag JSON files into the browser

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Backend

Make sure the backend API is running on `http://localhost:8080`

## Usage

### Option 1: Enter Backloggd Link
1. Enter your Backloggd username or profile URL
2. Click "Fetch All Games"
3. Wait for the progress bar to complete
4. View your game data in JSON format

### Option 2: Import JSON File
1. Click to select a JSON file or drag & drop it
2. Click "Import JSON"
3. View your game data

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios

