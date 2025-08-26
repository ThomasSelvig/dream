# Project Structure

## Directory Layout
```
src/
├── core/           # Core engine systems
├── game/           # Game-specific logic
├── systems/        # Modular game systems
├── assets/         # Asset management
├── utils/          # Utilities and helpers
├── types/          # TypeScript type definitions
└── main.ts         # Entry point

public/
├── models/         # 3D models (.gltf, .glb)
├── textures/       # Texture files
├── audio/          # Sound files
└── levels/         # Level/house data
```

## Core Module Structure

### `src/core/`
- `Engine.ts` - Main engine class, game loop
- `Scene.ts` - Three.js scene management
- `Camera.ts` - First-person camera controller
- `Renderer.ts` - WebGL renderer setup
- `Input.ts` - Keyboard/mouse input handling

### `src/systems/`
- `Physics.ts` - Rapier3d physics world
- `Audio.ts` - Howler.js audio management
- `AI.ts` - AI agent behavior
- `Pathfinding.ts` - Navigation mesh system
- `Interaction.ts` - Object interaction system

### `src/game/`
- `Player.ts` - Player character logic
- `AIAgent.ts` - Enemy AI implementation
- `House.ts` - House/level loading
- `GameState.ts` - Game state management

### `src/assets/`
- `AssetLoader.ts` - Asset loading and caching
- `ModelLoader.ts` - 3D model management
- `TextureLoader.ts` - Texture management
- `AudioLoader.ts` - Sound file loading

## Key Classes

```typescript
// Core engine
class Engine {
  scene: Scene
  physics: Physics
  audio: Audio
  input: Input
  
  init()
  update(deltaTime)
  render()
}

// Game-specific
class Player {
  position: Vector3
  camera: FirstPersonCamera
  isHidden: boolean
  
  update(deltaTime)
  handleInput(input)
}

class AIAgent {
  position: Vector3
  state: AIState
  pathfinding: Pathfinding
  
  update(deltaTime)
  detectPlayer()
  navigate()
}
```

## Implementation Order

1. **Core Setup** (`src/core/`)
   - Engine, Scene, Renderer, Camera

2. **Physics Integration** (`src/systems/Physics.ts`)
   - Connect Rapier3d to Three.js

3. **Player Movement** (`src/game/Player.ts`)
   - First-person controls with collision

4. **Basic Environment** (`src/game/House.ts`)
   - Simple house loading

5. **AI Foundation** (`src/game/AIAgent.ts`, `src/systems/AI.ts`)
   - Basic pathfinding and player detection

6. **Audio System** (`src/systems/Audio.ts`)
   - Positional audio integration

## File Naming Convention
- PascalCase for classes: `Player.ts`, `AIAgent.ts`
- camelCase for utilities: `assetLoader.ts`, `mathUtils.ts`
- Descriptive names: `FirstPersonCamera.ts`, `PhysicsWorld.ts`