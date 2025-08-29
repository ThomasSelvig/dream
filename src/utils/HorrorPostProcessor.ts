import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { ShaderLoader } from './ShaderLoader'

export class HorrorPostProcessor {
  private composer: EffectComposer
  private renderPass: RenderPass
  private horrorPass: ShaderPass | null = null
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  
  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.renderer = renderer
    this.scene = scene
    this.camera = camera
    
    this.composer = new EffectComposer(renderer)
    this.renderPass = new RenderPass(scene, camera)
    this.composer.addPass(this.renderPass)
    
    console.log('EffectComposer created, renderPass added')
  }

  async init(): Promise<void> {
    try {
      console.log('Loading horror post-processing shader...')
      const shaderProgram = await ShaderLoader.loadShaderProgram(
        '/src/shaders/horror-post.vert',
        '/src/shaders/horror-post.frag'
      )

      // Create shader material
      const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          time: { value: 0.0 },
          resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: shaderProgram.vertexShader,
        fragmentShader: shaderProgram.fragmentShader
      })

      // Create shader pass
      this.horrorPass = new ShaderPass(shaderMaterial)
      this.composer.addPass(this.horrorPass)
      
      // Set proper size
      this.composer.setSize(window.innerWidth, window.innerHeight)
      
      console.log('Horror post-processing shader loaded successfully')
      console.log('EffectComposer passes count:', this.composer.passes.length)
    } catch (error) {
      console.error('Failed to load horror post-processing shader:', error)
      throw error
    }
  }

  update(deltaTime: number): void {
    if (this.horrorPass && this.horrorPass.material && this.horrorPass.material.uniforms.time) {
      this.horrorPass.material.uniforms.time.value += deltaTime
    }
  }

  render(): void {
    this.composer.render()
  }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height)
    if (this.horrorPass && this.horrorPass.material && this.horrorPass.material.uniforms.resolution) {
      this.horrorPass.material.uniforms.resolution.value.set(width, height)
    }
  }

  dispose(): void {
    this.composer.dispose()
  }
}