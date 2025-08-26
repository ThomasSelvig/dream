# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` - Start development server with Vite
- `pnpm build` - Build for production (TypeScript compilation + Vite build)
- `pnpm preview` - Preview production build

## Architecture Overview

This is a 3D TypeScript game engine/framework for a hide-and-seek game with the following core architecture:

**Technology Stack:**
- Three.js for 3D rendering and scene management
- Rapier3d (WebAssembly) for physics and collision detection
- Howler.js for 3D positional audio
- three-pathfinding for AI navigation
- Vite with vite-plugin-wasm for WebAssembly support

**Current Implementation:**
- Fully functional 3D engine with modular architecture implemented
- First-person camera with mouse look and pointer lock controls
- WASD movement with physics-based character controller
- Jumping mechanics with gravity and ground detection
- Layered logging system (DEBUG/INFO/WARN/ERROR levels)

**Implemented Structure:**
- `src/core/` - Engine (game loop), Renderer (Three.js), Camera (first-person controls)
- `src/systems/` - Physics (Rapier3d character controller integration)
- `src/game/` - Player (movement, jumping, input handling)
- `src/utils/` - Logger (multi-level debug system)

**Remaining Structure (see docs/project-structure.md):**
- `src/systems/` - Audio, AI, Pathfinding, Interaction systems
- `src/game/` - AIAgent, House, GameState
- `src/assets/` - Asset loading and management

**Game Requirements (see docs/requirements.md):**
- First-person 3D movement with collision
- AI pathfinding for enemy agents seeking hidden player
- Custom shader support
- 3D positional audio system
- Interactive house environment with hiding mechanics

**Key Integration Points:**
- Physics (Rapier3d) must sync with Three.js scene transforms
- Audio system needs 3D positioning from Three.js objects
- AI pathfinding requires navigation mesh generation from house geometry
- Player detection combines line-of-sight (Three.js raycasting) with audio proximity

**Development Notes:**
- Use `Log.setLevel(LogLevel.DEBUG)` in main.ts for detailed debugging (causes lag)
- Character controller has known issue with vertical-only movement (jumping while stationary)
- Ground plane and reference sphere provide basic scene visualization