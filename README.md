# Mosque Prayer Times

A modern, responsive web application for displaying Islamic prayer times with real-time clock updates. Built with React, Vite, and Tailwind CSS.

## Features

- 🕌 Real-time clock display with second-by-second updates
- 📅 Dual calendar display (Gregorian and Hijri/Islamic dates)
- 🕐 Prayer times for Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha
- ✨ Active prayer highlighting
- 🌍 Automatic timezone detection
- 📱 Fully responsive design
- 🔄 Auto-refresh prayer times every 5 minutes
- 🎨 Beautiful Islamic geometric pattern background

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18.0.0 or higher)
- **npm** (version 9.0.0 or higher) - comes with Node.js

You can check your versions by running:
```bash
node --version
npm --version
```

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd prayer-time
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   This will install all required packages including:
   - React 18.3.1
   - Vite 5.4.2
   - Tailwind CSS 3.4.10
   - And other development dependencies

## Running the Application

### Development Mode

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is occupied). The dev server includes:
- Hot Module Replacement (HMR) for instant updates
- Fast refresh for React components
- Source maps for debugging

### Production Build

To create an optimized production build:

```bash
npm run build
```

This will create a `dist` folder with optimized and minified files ready for deployment.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

This serves the production build locally so you can test it before deploying.

## Project Structure

```
prayer-time/
├── public/
│   └── images/
│       └── bg.jpeg          # Background image
├── src/
│   ├── App.jsx              # Main React component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles with Tailwind
├── assets/                  # Original assets (legacy)
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
└── README.md                # This file
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Configuration

### Prayer Times API

The application uses the Vaktija.ba API for prayer times. The API endpoint is configured in `src/App.jsx`:

```javascript
const API = "https://api.vaktija.ba/vaktija/v1";
```

### Location ID

The default location ID is stored in localStorage. You can modify the location by updating the `getLocationId()` function in `src/App.jsx`.

### Timezone

The application automatically detects the user's timezone using:
```javascript
Intl.DateTimeFormat().resolvedOptions().timeZone
```

## Technologies Used

- **React 18.3.1** - UI library
- **Vite 5.4.2** - Build tool and dev server
- **Tailwind CSS 3.4.10** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## Browser Support

The application works on all modern browsers that support:
- ES6+ JavaScript features
- CSS Grid and Flexbox
- LocalStorage API
- Fetch API

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically use the next available port. Check the terminal output for the actual port number.

### Dependencies Installation Issues

If you encounter issues installing dependencies:

1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

2. Delete `node_modules` and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   ```

3. Reinstall:
   ```bash
   npm install
   ```

### Build Errors

If you encounter build errors:

1. Ensure you're using Node.js 18+ and npm 9+
2. Clear the build cache:
   ```bash
   rm -rf dist node_modules/.vite
   ```
3. Rebuild:
   ```bash
   npm run build
   ```

## License

This project is open source and available for use.

## Acknowledgments

- Prayer times provided by [Vaktija.ba API](https://api.vaktija.ba)
- Islamic date calculations based on standard algorithms

