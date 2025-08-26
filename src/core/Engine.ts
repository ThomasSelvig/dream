import * as THREE from 'three'
import { Renderer } from './Renderer'
import { Camera } from './Camera'
import { Physics } from '../systems/Physics'
import { Player } from '../game/Player'
import { AIAgent } from '../game/AIAgent'
import { DebugGUI } from '../utils/DebugGUI'
import { PerformanceOptimizer } from '../utils/PerformanceOptimizer'

export class Engine {
  private renderer: Renderer
  private camera: Camera
  private physics: Physics
  private player: Player
  private aiAgent: AIAgent
  private debugGUI: DebugGUI
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
  }

  async init(): Promise<void> {
    await this.physics.init()
    await this.player.init()
    await this.aiAgent.init()
    this.renderer.init()
    this.setupScene()
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
    })

    document.addEventListener('keyup', (event) => {
      this.keys.delete(event.code.toLowerCase())
    })
  }

  private onWindowResize(): void {
    this.camera.updateAspect(window.innerWidth / window.innerHeight)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
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
    this.renderer.render(this.camera.getCamera())

    requestAnimationFrame(this.gameLoop.bind(this))
  }
}