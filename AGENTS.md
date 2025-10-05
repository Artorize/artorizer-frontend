# Repository Guidelines

## Project Structure & Module Organization
- `app.js` wires scene setup, star loading, and interaction glue; use it for entry-level orchestration only.
- `src/setup/` holds renderer, camera, control, and composer configuration; adjust tone mapping or bloom here.
- `src/rendering/` contains star sprites, dust particles, and textures; coordinate updates across `starRenderer.js`, `textureFactory.js`, and helpers.
- `src/interaction/` centralizes pointer picking and UI overlays; extend hover/click behavior in `starInteraction.js`.
- `src/debug/debugPanel.js` provides optional overlays; keep debug-only hooks gated before shipping.
- Catalog data (`bsc5p_stars.json`) and static markup (`index.html`) live at the repository root; treat them as read-only inputs.

## Build, Test, and Development Commands
- `npm install` — installs the lightweight toolchain (only needed once).
- `npm start` — launches `http-server` on http://localhost:8080 and opens the demo for iterative work.
- `npm test` — currently a placeholder; update when automated tests are added.

## Coding Style & Naming Conventions
- Use ES modules with named exports; keep filenames in lowerCamelCase (e.g., `starRenderer.js`).
- Follow 4-space indentation and trailing semicolons, matching existing files.
- Co-locate shader strings and uniforms near their usage, and document non-obvious math with short inline comments.
- Prefer deterministic helpers in `src/utils/`; add new utilities there and import from modules rather than inlining duplicates.

## Testing Guidelines
- No automated suite yet; verify changes by running `npm start`, inspecting dynamic bloom levels, and checking console output for warnings.
- When adding tests, place them under `src/__tests__/` and mirror file names (`starRenderer.test.js`), using Jest or Vitest as agreed.
- Capture regression steps in `README` or this guide whenever manual validation is required.

## Commit & Pull Request Guidelines
- With no existing history, follow Conventional Commits (`feat:`, `fix:`, `chore:`) to keep the log scannable.
- Scope each PR to a coherent visual or behavioral change, reference tracked issues, and include before/after captures for rendering tweaks.
- Note any manual validation performed (`npm start`, browser/device) in the PR description so reviewers can reproduce quickly.
