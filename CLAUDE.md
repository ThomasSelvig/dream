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
- `src/main.ts` contains basic Rapier3d physics setup with dynamic rigid body simulation
- Vite config includes wasm plugin to handle Rapier3d WebAssembly files
- Physics world runs in a game loop stepping every 16ms

**Planned Structure (see docs/project-structure.md):**
- `src/core/` - Engine fundamentals (Engine, Scene, Camera, Renderer, Input)
- `src/systems/` - Modular systems (Physics, Audio, AI, Pathfinding, Interaction)  
- `src/game/` - Game logic (Player, AIAgent, House, GameState)
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

The engine is in early development - currently only physics simulation exists without visual rendering.