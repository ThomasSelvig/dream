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
    this.scene.background = new THREE.Color(0x404050)

    // Horror shader compatible ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 5.0)
    this.scene.add(ambientLight)

    // Main ceiling light - horror shader intensity
    const ceilingLight = new THREE.PointLight(0xfff0d4, 20.0, 50)
    ceilingLight.position.set(0, 6, 0)
    ceilingLight.castShadow = true
    ceilingLight.shadow.mapSize.width = 1024
    ceilingLight.shadow.mapSize.height = 1024
    ceilingLight.shadow.camera.near = 0.1
    ceilingLight.shadow.camera.far = 60
    this.scene.add(ceilingLight)

    // Table/floor lamp - horror shader intensity
    const tableLamp = new THREE.PointLight(0xffe4b5, 12.5, 30)
    tableLamp.position.set(5, 2, 5)
    tableLamp.castShadow = true
    tableLamp.shadow.mapSize.width = 512
    tableLamp.shadow.mapSize.height = 512
    tableLamp.shadow.camera.near = 0.1
    tableLamp.shadow.camera.far = 35
    this.scene.add(tableLamp)

    // Corner accent light - horror shader intensity
    const cornerLight = new THREE.PointLight(0xffd4a3, 7.5, 25)
    cornerLight.position.set(-8, 3, -8)
    this.scene.add(cornerLight)

    // Hallway/entrance light - horror shader intensity
    const hallwayLight = new THREE.PointLight(0xfff8dc, 10.0, 28)
    hallwayLight.position.set(-3, 3, 8)
    this.scene.add(hallwayLight)

    // Moonlight/streetlight through window - horror shader intensity
    const windowLight = new THREE.DirectionalLight(0x9bb5ff, 5.0)
    windowLight.position.set(15, 8, 10)
    windowLight.castShadow = true
    windowLight.shadow.mapSize.width = 1024
    windowLight.shadow.mapSize.height = 1024
    windowLight.shadow.camera.near = 1
    windowLight.shadow.camera.far = 50
    this.scene.add(windowLight)

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