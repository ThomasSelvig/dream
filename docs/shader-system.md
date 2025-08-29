# Shader System Documentation

The shader system provides a complete pipeline for loading, managing, and applying custom GLSL shaders in the 3D game engine. It supports both per-object shaders and full-screen post-processing effects.

## Architecture Overview

```
src/shaders/           # GLSL shader files (.vert, .frag)
src/utils/ShaderLoader.ts      # Core shader loading utilities
src/utils/ShaderManager.ts     # Per-object shader management
src/utils/HorrorPostProcessor.ts # Post-processing pipeline
src/utils/ShaderExamples.ts    # Example shader implementations
```

## Core Components

### 1. ShaderLoader (`src/utils/ShaderLoader.ts`)

Handles loading GLSL files using Vite's `?raw` import system with caching.

```typescript
// Load shader program from files
const shaderProgram = await ShaderLoader.loadShaderProgram(
  '/src/shaders/vertex.vert',
  '/src/shaders/fragment.frag'
)

// Create Three.js material
const material = ShaderLoader.createShaderMaterial(shaderProgram, uniforms)
```

**Key Features:**
- Automatic caching to prevent duplicate loads
- Dynamic imports with Vite optimization
- Error handling with detailed messages
- Support for both ShaderMaterial and RawShaderMaterial

### 2. ShaderManager (`src/utils/ShaderManager.ts`)

Manages per-object shaders, uniforms, and updates for scene objects.

```typescript
// Create and register a material
const material = await shaderManager.createMaterial(
  'myShader',
  '/src/shaders/vertex.vert',
  '/src/shaders/fragment.frag',
  { customUniform: { value: 1.0 } }
)

// Update uniforms at runtime
shaderManager.updateUniform('myShader', 'customUniform', 2.0)

// Update time-based uniforms each frame
shaderManager.updateTime(deltaTime)
```

### 3. Post-Processing Pipeline (`src/utils/HorrorPostProcessor.ts`)

Implements full-screen effects using Three.js EffectComposer.

```typescript
// Initialize post-processor
const postProcessor = new HorrorPostProcessor(renderer, scene, camera)
await postProcessor.init()

// Render with post-processing instead of direct rendering
postProcessor.render() // Instead of renderer.render(scene, camera)
```

## Shader File Structure

### Vertex Shaders (`.vert`)

Vertex shaders receive Three.js built-in uniforms automatically:

```glsl
// These are provided by Three.js automatically:
// uniform mat4 projectionMatrix;
// uniform mat4 modelViewMatrix;
// uniform mat3 normalMatrix;
// attribute vec3 position;
// attribute vec3 normal;
// attribute vec2 uv;

varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Fragment Shaders (`.frag`)

Fragment shaders define material appearance:

```glsl
uniform float time;
uniform vec3 color;

varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vec3 finalColor = color * (0.5 + 0.5 * sin(time + vUv.x * 10.0));
  gl_FragColor = vec4(finalColor, 1.0);
}
```

### Post-Processing Shaders

Post-processing shaders operate on the full rendered frame:

```glsl
// Vertex shader (post-process)
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment shader (post-process)
uniform sampler2D tDiffuse; // The rendered scene
varying vec2 vUv;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  // Apply post-processing effects
  gl_FragColor = color;
}
```

## Current Implementation: Horror Effects

The system currently implements a horror atmosphere using post-processing:

### Horror Post-Processing (`src/shaders/horror-post.frag`)

**Visual Effects:**
- **Dark Color Grading**: Crushes blacks, reduces brightness
- **Horror Tint**: Purple/red color overlay
- **Vignette Effect**: Darkens screen edges for tunnel vision
- **Film Grain**: Adds visual noise using screen-space noise
- **Flickering**: Animated light intensity variations
- **High Contrast**: Enhances dramatic lighting

**Performance Optimizations:**
- Single full-screen pass
- Simple noise function using `fract(sin())`
- Basic flickering with combined sine waves
- Efficient texture sampling

## Usage Examples

### Creating a Custom Shader

1. **Create GLSL files:**
```glsl
// src/shaders/custom.vert
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// src/shaders/custom.frag
uniform vec3 color;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(color, 1.0);
}
```

2. **Load and apply shader:**
```typescript
const material = await shaderManager.createMaterial(
  'custom',
  '/src/shaders/custom.vert',
  '/src/shaders/custom.frag',
  { color: { value: new THREE.Color(0xff0000) } }
)

const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)
```

### Adding New Post-Processing Effects

1. **Create post-processing shaders** in `src/shaders/`
2. **Modify HorrorPostProcessor** or create new processor class
3. **Update Engine.ts** to use new post-processor

## Integration Points

### Engine Integration (`src/core/Engine.ts`)

```typescript
// Initialize post-processing after renderer setup
await this.setupHorrorPostProcessing()

// Update shaders each frame
this.shaderManager.updateTime(deltaTime)
this.horrorPostProcessor.update(deltaTime)

// Render with post-processing
this.horrorPostProcessor.render()
```

### Vite Configuration (`vite.config.js`)

```javascript
export default defineConfig({
  plugins: [wasm()],
  assetsInclude: ['**/*.vert', '**/*.frag', '**/*.glsl'], // Include shader files
})
```

## Best Practices

### Shader Development
- Use Three.js built-in uniforms when possible
- Avoid redefining uniforms that Three.js provides
- Test with simple shaders before complex effects
- Use `/* @vite-ignore */` for dynamic imports

### Performance
- Minimize texture lookups in fragment shaders
- Use simple noise functions over complex algorithms
- Cache shader programs to avoid reloading
- Profile shader performance on target devices

### Debugging
- Check browser console for shader compilation errors
- Use fallback rendering if post-processing fails
- Add debug logging for shader loading stages
- Test shaders with simple geometries first

## Troubleshooting

### Common Issues

**White Screen:**
- Check EffectComposer initialization order
- Verify shader compilation in browser console
- Ensure proper uniform setup

**Shader Compilation Errors:**
- Check for uniform/attribute redefinitions
- Verify GLSL syntax in browser dev tools
- Use RawShaderMaterial for full control

**Performance Issues:**
- Reduce shader complexity
- Minimize uniform updates per frame
- Use LOD for complex shaders

### Error Messages

- `"redefinition"` errors: Remove uniforms/attributes that Three.js provides
- `"Must have compiled shader"`: Check shader syntax and compilation
- `"Failed to load shader"`: Verify file paths and Vite configuration

## Future Enhancements

- Shader hot-reloading for development
- Visual shader editor interface
- Additional post-processing effects (bloom, depth of field)
- Per-material shader parameter GUI
- Shader performance profiling tools