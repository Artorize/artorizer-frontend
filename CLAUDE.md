# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Artorizer is a Three.js-based 3D star visualization application that renders a celestial sphere using real astronomical data from the BSC5P star catalog. Users can interactively explore stars with orbital controls, view star information on hover, and adjust rendering parameters through a debug panel.

## Development Commands

- **Start dev server**: `npm start` (launches http-server on port 8080)
- **No build step required**: Pure ES6 modules loaded directly in browser
- **No tests configured**: Test script exits with error

## Architecture

### Module Structure

The application follows a modular ES6 architecture with clear separation of concerns:

- **app.js**: Entry point that initializes the scene, sets up event handlers, and runs the animation loop
- **src/setup/sceneSetup.js**: Three.js scene initialization (camera, renderer, controls, bloom post-processing)
- **src/rendering/**: Star rendering logic
  - `starRenderer.js`: Loads BSC5P JSON data, creates point geometry with custom shader material for rotating star sprites
  - `textureFactory.js`: Generates procedural star textures
  - `dustParticles.js`: Creates ambient nebula/dust particles for depth
- **src/interaction/starInteraction.js**: Raycasting for star selection and info panel display
- **src/debug/debugPanel.js**: Debug UI controls for camera, bloom, exposure, and control parameters
- **src/utils/**: Utility functions
  - `colorUtils.js`: B-V color index to RGB conversion, color name classification
  - `coordinateUtils.js`: Coordinate transformation utilities

### Data Flow

1. **Star Loading**: `loadStars()` fetches `bsc5p_stars.json` containing pre-calculated 3D positions in parsecs and RGB colors from blackbody radiation
2. **Rendering**: Custom `ShaderMaterial` with per-star attributes (position, color, size, rotation) renders points with procedural textures
3. **Post-Processing**: `UnrealBloomPass` provides bloom effect on HDR star colors
4. **Interaction**: Raycasting detects star clicks/hovers, displays info panel with star name, distance, luminosity, and color

### Key Technical Details

- **Star Data Format**: BSC5P catalog provides fields `{i, n, x, y, z, p, N, K}` where:
  - `x,y,z`: 3D position in parsecs
  - `p`: distance (parsecs)
  - `N`: luminosity
  - `K`: pre-calculated RGB color object `{r,g,b}`
- **Shader System**: Custom vertex/fragment shaders handle per-star rotation and size attenuation based on camera distance
- **Brightness Calculation**: Apparent brightness = luminosity / distance² with boost factor applied for visual sizing
- **Coordinate System**: Right-handed 3D space with scaleFactor (currently 5) to fit stars in viewport

## Important Patterns

- Three.js loaded via CDN importmap (version 0.160.0)
- All modules use ES6 `import/export` syntax
- State management via module-scoped variables (e.g., `starPoints`, `starData` in starRenderer.js)
- Animation loop in app.js calls `controls.update()` and `composer.render()`
- Debug panel dynamically updates Three.js parameters via direct property mutation
