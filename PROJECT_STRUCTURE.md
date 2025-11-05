# Project Structure

## Overview

The codebase has been reorganized into clean folders to separate intro page code from shared modules. You now have a clear structure to build your dashboard.

## Current Folder Structure

```
artorizer-frontend/
├── index.html                    # Entry point (intro page)
│
├── intro/                        # Intro page specific code
│   ├── intro.js                  # Entry point for intro (3D visualization)
│   └── intro-styles.css          # Styles for intro page
│
├── src/                          # Shared modules (used by intro)
│   ├── setup/
│   │   └── sceneSetup.js        # Three.js scene initialization
│   ├── rendering/
│   │   ├── starRenderer.js      # Star loading and rendering
│   │   ├── textureFactory.js    # Star texture generation
│   │   └── dustParticles.js     # Ambient dust particles
│   ├── interaction/
│   │   └── starInteraction.js   # Star click/hover (disabled)
│   ├── debug/
│   │   └── debugPanel.js        # Debug controls
│   └── utils/
│       ├── colorUtils.js        # Color conversions
│       ├── coordinateUtils.js   # Coordinate transformations
│       └── bloomUtils.js        # Bloom effect calculations
│
└── data/
    └── bsc5p_stars.json          # BSC5P star catalog data
```

## Key Changes Made

1. **Organized intro page files** into `/intro` folder
   - `app.js` → `intro/intro.js`
   - `styles.css` → `intro/intro-styles.css`

2. **Moved star data** to `/data` folder
   - `bsc5p_stars.json` → `data/bsc5p_stars.json`

3. **Removed star interaction**
   - Click/hover functionality disabled
   - Info panel removed

4. **Updated all import paths** to reflect new structure
   - `intro.js` now uses `../src/` for imports
   - `starRenderer.js` now fetches from `data/bsc5p_stars.json`

## Development

Start the development server:
```bash
npm start
```

Server runs at: `http://localhost:8080`

The intro page loads at the root (`/`) with the 3D star visualization.

## Ready for Dashboard

The structure is now ready for you to create your own dashboard:

- `/intro` contains all intro-specific code
- `/src` contains shared modules you can reuse
- `/data` contains data files
- You can create `/dashboard` folder for your dashboard code
- Or create any structure you prefer for your dashboard

## Notes

- The "Start Exploring" button in the intro currently does nothing (console log only)
- You can hook it up to your dashboard when ready
- All intro functionality remains intact and working
- Star interaction (click/hover) has been disabled as requested
