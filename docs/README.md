# Artorizer Frontend Documentation

Complete documentation for the Artorizer Frontend project, including the 3D star visualization and artwork protection dashboard.

## Quick Links

- **[../README.md](../README.md)** - Main project README with quick start and overview
- **[DASHBOARD.md](./DASHBOARD.md)** - Dashboard configuration, features, and usage guide
- **[auth.md](./auth.md)** - Authentication API reference
- **[backend-api.md](./backend-api.md)** - Backend storage API documentation
- **[router-api.md](./router-api.md)** - Router API reference

## Documentation Structure

### For New Users

1. Start with the main **[../README.md](../README.md)** for project overview and quick start
2. Read **[DASHBOARD.md](./DASHBOARD.md)** to learn how to use the artwork protection features
3. Check **[DASHBOARD.md - Configuration](./DASHBOARD.md#configuration)** section to set up your environment

### For Developers

1. Review **[../README.md - Architecture](../README.md#architecture-overview)** for system design
2. Examine **[../AGENTS.md](../AGENTS.md)** for coding guidelines
3. Consult **[backend-api.md](./backend-api.md)** for backend integration
4. Review **[auth.md](./auth.md)** for authentication implementation

### For Operations

1. See **[DASHBOARD.md - Deployment Scenarios](./DASHBOARD.md#deployment-scenarios)** for setup guides
2. Check **[backend-api.md - Router Integration](./backend-api.md#router-integration)** for infrastructure requirements
3. Review **[DASHBOARD.md - Security](./DASHBOARD.md#security-considerations)** for security best practices

## Documentation Overview

### Main README
- Project overview and features
- Quick start guide
- Architecture overview
- Project structure
- Development commands
- Code style guidelines
- Testing guidelines
- Commit guidelines

### Dashboard Guide (DASHBOARD.md)

Complete guide covering:

**Configuration Section**:
- Configuration file location and format
- Core settings (ROUTER_URL, CDN_URL, AUTH_TOKEN)
- Polling configuration
- Protection layer defaults
- Upload constraints
- Deployment scenarios (local, production, multi-environment)
- Runtime configuration methods

**Features Overview**:
- Artwork upload and protection process
- Available protection technologies (Fawkes, Photoguard, Mist, Nightshade, C2PA)
- Toggle and preset options

**Uploading Artwork**:
- Step-by-step upload instructions
- Metadata requirements
- Protection layer selection

**Image Comparison Views**:
- Four view modes (Original, Protected, Reconstructed, Compare)
- Three comparison modes (Side-by-side, Slider, Overlay)
- Real-time interaction controls

**Downloading Protected Files**:
- Download options for all variants
- SAC mask format explanation
- Job information display

**Technical Details**:
- How protection works
- SAC protocol specification
- CDN integration explained

**Troubleshooting**:
- Common issues and solutions
- Debug steps for various problems

**Best Practices**:
- Workflow organization
- Metadata standards
- File naming conventions
- Version control strategies
- Pre-launch testing

**Advanced Usage**:
- Programmatic API access
- Custom protection scripts
- Bulk operations

**FAQ**:
- Frequently asked questions and answers

### Authentication API (auth.md)

API documentation for:
- Session management
- Email/password authentication
- OAuth 2.0 flows (Google, GitHub)
- Client implementation examples
- OAuth provider setup
- Environment configuration
- Error handling
- Security considerations

### Backend API (backend-api.md)

Complete backend API reference including:
- Authentication methods (token-based and session-based)
- Router integration architecture
- Processor integration workflow
- Endpoints for token management
- Health check endpoints
- Artwork upload and retrieval
- Search and filtering
- Download functionality
- File format support
- SAC v1 mask protocol
- Security features
- Usage examples

### Router API (router-api.md)

Router-specific API documentation with:
- Authentication flow
- Available endpoints
- User header forwarding
- Session management

## Key Concepts

### Artwork Protection Flow

```
User Upload
    |
    v
Router API (validates)
    |
    v
Processor (applies protections)
    |
    v
Backend (stores variants)
    |
    v
CDN (serves protected image)
    |
    v
Browser (reconstructs with mask)
```

### Three.js Visualization

The intro page features an interactive 3D star visualization:
- 9000+ stars from BSC5P catalog
- Orbital camera controls
- Real-time star information
- Bloom post-processing effects
- Debug parameter controls

### Protection Layers

Multiple protection technologies can be combined:
- **Fawkes**: Facial feature perturbation
- **Photoguard**: Anti-mimicry protection
- **Mist**: Adversarial noise injection
- **Nightshade**: Model poisoning
- **C2PA**: Cryptographic provenance
- **Watermarking**: Invisible or Tree Ring

## Configuration Quick Reference

| Setting | Local Dev | Production |
|---------|-----------|------------|
| `ROUTER_URL` | `http://localhost:7000` | `https://api.artorize.com` |
| `CDN_URL` | `http://localhost:3000` | `https://cdn.artorize.com` |
| `AUTH_TOKEN` | `null` | Environment variable |
| `MAX_FILE_SIZE` | `268435456` (256MB) | Match Router config |

## API Endpoints Summary

### Dashboard API
- `POST /protect` - Submit artwork for protection
- `GET /jobs/:id` - Check job status
- `GET /jobs/:id/result` - Get protection results
- `GET /jobs/:id/download/:variant` - Download variants

### Authentication API
- `POST /auth/register` - Create new account
- `POST /auth/login` - Email/password login
- `GET /auth/oauth/:provider/start` - Initiate OAuth
- `GET /auth/oauth/:provider/callback` - OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Sign out

### Backend API
- `POST /tokens` - Generate upload token
- `POST /artworks` - Upload artwork
- `GET /artworks/{id}` - Stream artwork file
- `GET /artworks/{id}/metadata` - Get metadata
- `GET /artworks/{id}/mask` - Get SAC mask
- `GET /artworks` - Search artworks
- `GET /artworks/me` - Get user's artworks

## File Types

### Images
- JPEG (.jpg)
- PNG (.png)
- WebP (.webp)
- TIFF (.tiff)

### Mask Format
- SAC v1 Binary (.sac) - Simple Array Container format with:
  - 24-byte header
  - Two int16 arrays
  - Dimensions metadata

### Metadata
- JSON format for analysis and summary data

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Not supported**:
- Internet Explorer

## Related Projects

- **[Artorizer Router](https://github.com/Artorize/Artorizer-core-router)** - API router and orchestration
- **[Artorizer Backend](https://github.com/Artorize/artorizer-backend)** - Storage and retrieval
- **[Artorizer CDN](https://github.com/Artorize/artorize-cdn)** - Content delivery
- **[Artorizer Processor](https://github.com/Artorize/artorizer-processor)** - Protection processing

## Support

For questions or issues:

1. Check the relevant documentation section above
2. Review browser console for error messages
3. Test services with `curl` or Postman
4. Check service health endpoints
5. Create a GitHub issue with details

## Version History

- **v2.0.0** (2025-11-25): Consolidated documentation, added comprehensive README
- **v1.0.0**: Initial release with basic features

---

**Last Updated**: 2025-11-25
