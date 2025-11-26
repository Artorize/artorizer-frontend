# Artorizer Frontend

A Three.js-based 3D star visualization application combined with an artwork protection dashboard. Explore a celestial sphere using real astronomical data from the BSC5P star catalog, and protect your artwork from AI scraping with multiple protection layers.

## Features

- 3D star visualization with interactive orbital controls
- Real-time star information display on hover
- Debug panel for rendering parameter adjustments
- Artwork protection dashboard with multiple protection layers
- Support for Fawkes, Photoguard, Mist, Nightshade, and C2PA manifest protections
- Image comparison tools (side-by-side, slider, overlay)
- CDN integration for protected artwork delivery
- Batch download capabilities for protected variants

## Quick Start

### Prerequisites

- Node.js (v14+)
- npm

### Installation

```bash
cd artorizer-frontend
npm install
```

### Development

Start the development server:

```bash
npm start
```

The application will be available at `http://localhost:8080`

- **Intro Page** (3D Visualization): `http://localhost:8080/`
- **Dashboard** (Protection Tools): `http://localhost:8080/dashboard/`

## Project Structure

```
artorizer-frontend/
├── README.md                       # This file
├── index.html                      # Main entry point (intro page)
├── intro/                          # Intro/3D visualization
│   ├── intro.js                   # Three.js scene initialization
│   └── intro-styles.css           # Intro page styles
├── dashboard/                      # Protection dashboard (if configured)
│   ├── index.html
│   ├── config.js                  # Configuration
│   └── artworkUploader.js          # Dashboard logic
├── src/                           # Shared modules
│   ├── setup/
│   │   └── sceneSetup.js          # Three.js scene, camera, renderer
│   ├── rendering/
│   │   ├── starRenderer.js        # Star loading and rendering
│   │   ├── textureFactory.js      # Procedural star textures
│   │   └── dustParticles.js       # Ambient particles
│   ├── interaction/
│   │   └── starInteraction.js     # Click/hover handling
│   ├── debug/
│   │   └── debugPanel.js          # Debug UI controls
│   └── utils/
│       ├── colorUtils.js          # B-V to RGB conversion
│       ├── coordinateUtils.js     # Coordinate transforms
│       └── bloomUtils.js          # Bloom effect utilities
├── data/
│   └── bsc5p_stars.json           # BSC5P star catalog
└── docs/                          # Detailed documentation
    ├── README.md                  # Documentation index
    ├── DASHBOARD.md               # Dashboard guide
    ├── auth.md                    # Authentication reference
    ├── backend-api.md             # Backend API documentation
    └── router-api.md              # Router API reference
```

## Architecture Overview

### Three.js Visualization

The intro page renders a celestial sphere with 9000+ stars from the BSC5P catalog:

1. **Star Loading**: `src/rendering/starRenderer.js` loads preprocessed 3D positions and colors
2. **Rendering**: Custom shader material with per-star attributes
3. **Post-Processing**: UnrealBloomPass for HDR bloom effects
4. **Interaction**: Raycasting for hover/click detection
5. **Controls**: Orbital camera controls for exploration

### Artwork Protection Dashboard

The dashboard provides comprehensive protection tools:

1. **Upload**: Select and upload artwork with metadata
2. **Protection Options**: Configure multiple protection layers
3. **Processing**: Submit to backend for protection application
4. **Comparison**: View original, protected, and reconstructed variants
5. **Download**: Export protected files and reconstruction masks

## Core Modules

### src/setup/sceneSetup.js
- Three.js scene, camera, and renderer initialization
- PostProcessing composer configuration
- UnrealBloomPass setup for bloom effects

### src/rendering/starRenderer.js
- BSC5P catalog data loading
- Star point geometry creation
- Custom shader material for rotating sprites
- Brightness calculation and size attenuation

### src/rendering/textureFactory.js
- Procedural star texture generation
- Canvas-based texture creation

### src/interaction/starInteraction.js
- Raycasting for star selection
- Hover and click event handling
- Info panel display

### src/debug/debugPanel.js
- Real-time debug controls
- Camera parameter adjustments
- Bloom and exposure controls

### src/utils/colorUtils.js
- B-V color index to RGB conversion
- Blackbody radiation color calculation

## Key Technical Details

### Star Data Format

BSC5P catalog fields:
- `x, y, z`: 3D position in parsecs
- `p`: distance (parsecs)
- `N`: luminosity
- `K`: pre-calculated RGB color `{r, g, b}`

### Shader System

Custom vertex/fragment shaders handle:
- Per-star rotation
- Size attenuation based on camera distance
- Star sprite rendering with procedural textures

### Brightness Calculation

```
Apparent Brightness = Luminosity / Distance^2 * boostFactor
```

Used for both visual sizing and HDR color intensity.

## Development Commands

```bash
# Start development server
npm start

# Run tests (currently a placeholder)
npm test
```

## Code Style Guidelines

- ES6 modules with named exports
- Filenames in lowerCamelCase (e.g., `starRenderer.js`)
- 4-space indentation, trailing semicolons
- Co-locate shader strings and uniforms near usage
- Document non-obvious math with inline comments
- Place utilities in `src/utils/` for reusability

## Coding Patterns

- Three.js loaded via CDN importmap (v0.160.0)
- All modules use ES6 `import/export` syntax
- State management via module-scoped variables
- Animation loop in `intro/intro.js` calls `controls.update()` and `composer.render()`
- Debug panel uses direct property mutation for Three.js parameters

## Testing

No automated test suite yet. Manual validation includes:
- Running `npm start` to verify initialization
- Inspecting dynamic bloom levels
- Checking console for warnings
- Testing star interaction (if enabled)

When adding tests, place them under `src/__tests__/` mirroring filenames (e.g., `starRenderer.test.js`).

## Git Commit Guidelines

- Follow Conventional Commits: `feat:`, `fix:`, `chore:`
- Scope PRs to coherent visual/behavioral changes
- Reference tracked issues
- Include before/after captures for rendering changes
- Document manual validation performed (npm start, browser testing)

## File Size Limits

- **Artwork uploads**: 256 MB max (configurable in dashboard/config.js)
- **Star catalog**: ~9000 stars in bsc5p_stars.json

## Configuration

### Dashboard Configuration

Edit `dashboard/config.js` to configure API endpoints:

```javascript
const ArtorizeConfig = {
  ROUTER_URL: 'http://localhost:7000',
  CDN_URL: 'http://localhost:3000',
  AUTH_TOKEN: null,
  // ... more options
};
```

See `docs/DASHBOARD.md` for full configuration details.

## Documentation

- **[docs/README.md](docs/README.md)** - Documentation index
- **[docs/DASHBOARD.md](docs/DASHBOARD.md)** - Complete dashboard guide (configuration, features, usage)
- **[docs/auth.md](docs/auth.md)** - Authentication API reference
- **[docs/backend-api.md](docs/backend-api.md)** - Backend storage API
- **[docs/router-api.md](docs/router-api.md)** - Router API reference

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+
- Internet Explorer: Not supported

### Required Browser Features

- WebGL support
- ES6+ JavaScript
- Fetch API
- Canvas 2D rendering
- Typed arrays (Int16Array, Float32Array)

## Performance Tips

### For 3D Visualization
- Enable hardware acceleration in browser settings
- Close other tabs during use
- Use modern browser for best WebGL performance

### For Large Image Processing
- Use WebP format for smaller file sizes
- Reduce resolution before upload
- Process one image at a time
- Clear browser cache periodically

## Security Considerations

### Data Privacy

- Original images stored securely in backend
- Only protected images served via CDN
- SAC masks contain no original data
- All transfers use HTTPS in production

### Authentication

- Optional authentication token for API access
- Recommended for production deployments
- Not required for local development
- Better Auth integration for user management

### Best Practices

- Always enable C2PA manifest for provenance
- Use all protection layers for high-value artwork
- Keep original files backed up separately
- Verify CDN URLs before public sharing
- Rotate authentication tokens regularly

## Troubleshooting

### Common Issues

**Stars not rendering:**
- Check browser console for WebGL errors
- Verify bsc5p_stars.json loaded successfully
- Ensure Three.js CDN is accessible

**Upload fails:**
- Check network tab for API errors
- Verify Router API is running (localhost:7000)
- Confirm CDN is accessible (localhost:3000)
- Check file size doesn't exceed 256MB

**Dashboard not loading:**
- Verify dashboard config.js is correct
- Check ROUTER_URL and CDN_URL settings
- Ensure backend services are running

## Support

For issues or questions:

1. Check the relevant documentation in `docs/`
2. Review browser console for error messages
3. Test services with curl or Postman
4. Check service health endpoints
5. Create an issue on GitHub

## Related Projects

- **[Artorizer Router](https://github.com/Artorize/Artorizer-core-router)** - API router with Better Auth
- **[Artorizer CDN](https://github.com/Artorize/artorize-cdn)** - Content delivery network
- **[Artorizer Backend](https://github.com/Artorize/artorizer-backend)** - Storage backend
- **[Artorizer Processor](https://github.com/Artorize/artorizer-processor)** - Protection processor

## License

Private project for Artorize AI art protection system.

---

**Last Updated**: 2025-11-25
**Version**: 2.0.0
