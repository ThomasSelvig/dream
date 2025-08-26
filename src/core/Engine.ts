import * as THREE from 'three'
import { Renderer } from './Renderer'
import { Camera } from './Camera'
import { Physics } from '../systems/Physics'
import { Player } from '../game/Player'

export class Engine {
  private renderer: Renderer
  private camera: Camera
  private physics: Physics
  private player: Player
  private scene: THREE.Scene
  private clock: THREE.Clock
  private isRunning = false

  constructor() {
    this.scene = new THREE.Scene()
    this.clock = new THREE.Clock()
    this.renderer = new Renderer(this.scene)
    this.camera = new Camera()
    this.physics = new Physics()
    this.player = new Player(this.camera, this.physics)
  }

  async init(): Promise<void> {
    await this.physics.init()
    await this.player.init()
    this.renderer.init()
    this.setupScene()
    this.setupEventListeners()
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
    const groundGeometry = new THREE.PlaneGeometry(20, 20)
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

    this.physics.update(deltaTime)
    this.player.update(deltaTime)

    this.renderer.render(this.camera.getCamera())

    requestAnimationFrame(this.gameLoop.bind(this))
  }
}