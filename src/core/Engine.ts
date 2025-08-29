import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Renderer } from './Renderer'
import { Camera } from './Camera'
import { Physics } from '../systems/Physics'
import { Player } from '../game/Player'
import { AIAgent } from '../game/AIAgent'
import { DebugGUI } from '../utils/DebugGUI'
import { PerformanceOptimizer } from '../utils/PerformanceOptimizer'
import { ShaderManager } from '../utils/ShaderManager'
import { HorrorPostProcessor } from '../utils/HorrorPostProcessor'

export class Engine {
  private renderer: Renderer
  private camera: Camera
  private physics: Physics
  private player: Player
  private aiAgent: AIAgent
  private debugGUI: DebugGUI
  private shaderManager: ShaderManager
  private horrorPostProcessor: HorrorPostProcessor | null = null
  private scene: THREE.Scene
  private clock: THREE.Clock
  private isRunning = false
  private keys = new Set<string>()
  private performanceOptimizationsEnabled = true

  constructor() {
    this.scene = new THREE.Scene()
    this.clock = new THREE.Clock()
    this.renderer = new Renderer(this.scene)
    this.camera = new Camera()
    this.physics = new Physics()
    this.player = new Player(this.camera, this.physics)
    this.aiAgent = new AIAgent(this.scene, this.physics, this.player)
    this.debugGUI = new DebugGUI()
    this.shaderManager = new ShaderManager()
  }

  async init(): Promise<void> {
    await this.physics.init()
    await this.player.init()
    await this.aiAgent.init()
    this.renderer.init()
    this.setupScene()
    this.physics.setDebugScene(this.scene)
    await this.loadSpiralStairs()
    await this.setupHorrorPostProcessing()
    this.setupEventListeners()
    this.debugGUI.setAIAgent(this.aiAgent)
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0x87CEEB)

    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    this.scene.add(directionalLight)

    this.createGround()
    this.createReferenceSphere()
  }

  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(40, 40)
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 })
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
    groundMesh.rotation.x = -Math.PI / 2
    groundMesh.receiveShadow = true
    this.scene.add(groundMesh)

    this.physics.createGroundCollider()
  }

  private createReferenceSphere(): void {
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32)
    const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b })
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphereMesh.position.set(3, 1, 0)
    sphereMesh.castShadow = true
    this.scene.add(sphereMesh)
  }

  private async loadSpiralStairs(): Promise<void> {
    const loader = new GLTFLoader()
    
    try {
      const gltf = await loader.loadAsync('/spiral stairs.glb')
      const stairsModel = gltf.scene
      
      // Check the model's bounding box to understand its size
      const bbox = new THREE.Box3().setFromObject(stairsModel)
      const size = bbox.getSize(new THREE.Vector3())
      const center = bbox.getCenter(new THREE.Vector3())
      
      console.log('Spiral stairs - Size:', size, 'Center:', center)
      
      // Position the stairs closer and at ground level
      // stairsModel.position.set(5, 10, 0)
      // stairsModel.scale.setScalar(40) // Ensure normal scale
      stairsModel.scale.setScalar(2)
      stairsModel.castShadow = true
      stairsModel.receiveShadow = true
      
      stairsModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      
      this.scene.add(stairsModel)
      
      // Update world matrix after positioning and adding to scene
      stairsModel.updateMatrixWorld(true)
      
      const colliders = this.physics.createModelCollider(stairsModel)
      this.physics.createDebugVisualization(colliders)
      
      console.log('Spiral stairs loaded and positioned at (5, 0, 0)')
      
    } catch (error) {
      console.error('Failed to load spiral stairs model:', error)
    }
  }

  private async setupHorrorPostProcessing(): Promise<void> {
    try {
      this.horrorPostProcessor = new HorrorPostProcessor(this.renderer.getRenderer(), this.scene, this.camera.getCamera())
      await this.horrorPostProcessor.init(false) // Disable debug mode - use horror shader
      console.log('Horror post-processing initialized successfully')
    } catch (error) {
      console.error('Failed to initialize horror post-processing, falling back to normal rendering:', error)
      this.horrorPostProcessor = null
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this))
    
    // Add keyboard event listeners for debug controls
    document.addEventListener('keydown', (event) => {
      this.keys.add(event.code.toLowerCase())
      
      // Handle Enter key for AI tracking toggle
      if (event.code === 'Enter') {
        this.aiAgent.toggleTracking()
        event.preventDefault()
      }
      
      // Handle 'C' key for collision debug toggle
      if (event.code === 'KeyC') {
        this.physics.toggleDebugVisualization()
        event.preventDefault()
      }
    })

    document.addEventListener('keyup', (event) => {
      this.keys.delete(event.code.toLowerCase())
    })
  }

  private onWindowResize(): void {
    this.camera.updateAspect(window.innerWidth / window.innerHeight)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    if (this.horrorPostProcessor) {
      this.horrorPostProcessor.setSize(window.innerWidth, window.innerHeight)
    }
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true
      this.gameLoop()
    }
  }

  stop(): void {
    this.isRunning = false
  }

  private gameLoop(): void {
    if (!this.isRunning) return

    const deltaTime = this.clock.getDelta()

    // Update systems
    this.physics.update(deltaTime)
    this.player.update(deltaTime)
    this.aiAgent.update(deltaTime)
    this.shaderManager.updateTime(deltaTime)
    if (this.horrorPostProcessor) {
      this.horrorPostProcessor.update(deltaTime)
    }
    
    // Performance optimizations
    if (this.performanceOptimizationsEnabled) {
      const fps = PerformanceOptimizer.updateFPS(deltaTime)
      PerformanceOptimizer.optimizeScene(this.scene, this.camera.getCamera())
      
      // Adaptive pathfinding rate based on performance
      const settings = PerformanceOptimizer.getOptimizationSettings(fps)
      this.aiAgent.setPathfindingRate(settings.pathfindingRate)
      
      // Log performance issues occasionally
      if (Math.random() < 0.001) { // ~1 in 1000 frames
        PerformanceOptimizer.logPerformanceStats(fps, deltaTime)
      }
    }
    
    this.debugGUI.update(deltaTime)
    
    if (this.horrorPostProcessor) {
      this.horrorPostProcessor.render()
    } else {
      this.renderer.render(this.camera.getCamera())
    }

    requestAnimationFrame(this.gameLoop.bind(this))
  }
}