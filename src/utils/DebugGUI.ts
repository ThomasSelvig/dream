import GUI from 'lil-gui'
import * as THREE from 'three'
import { AIAgent } from '../game/AIAgent'

interface DebugStats {
  distanceFromGround: number
  meshBottomDistance: number
  catSizeX: number
  catSizeY: number
  catSizeZ: number
  aiTrackingEnabled: boolean
  fps: number
  deltaTime: number
  frameTime: number
  pathfindingRate: number
  frustumCulling: boolean
  adaptiveLOD: boolean
  shadowOptimization: boolean
}

export class DebugGUI {
  private gui: GUI
  private stats: DebugStats
  private aiAgent: AIAgent | null = null
  private groundLevel = 0

  constructor() {
    // Initialize stats object first
    this.stats = {
      distanceFromGround: 0,
      meshBottomDistance: 0,
      catSizeX: 0,
      catSizeY: 0,
      catSizeZ: 0,
      aiTrackingEnabled: false,
      fps: 0,
      deltaTime: 0,
      frameTime: 0,
      pathfindingRate: 0.1,
      frustumCulling: true,
      adaptiveLOD: true,
      shadowOptimization: true
    }
    
    this.gui = new GUI()
    this.gui.title('Debug Info')
    this.setupGUI()
  }

  private setupGUI(): void {
    try {
      // AI Agent folder
      const aiFolder = this.gui.addFolder('AI Agent')
      aiFolder.add(this.stats, 'distanceFromGround', 0, 10).name('Distance from Ground').listen()
      aiFolder.add(this.stats, 'meshBottomDistance', 0, 10).name('Mesh Bottom Distance').listen()
      aiFolder.add(this.stats, 'catSizeX', 0, 5).name('Cat Size X').listen()
      aiFolder.add(this.stats, 'catSizeY', 0, 5).name('Cat Size Y').listen()
      aiFolder.add(this.stats, 'catSizeZ', 0, 5).name('Cat Size Z').listen()
      aiFolder.add(this.stats, 'aiTrackingEnabled').name('AI Tracking').onChange((value: boolean) => {
        if (this.aiAgent) {
          this.aiAgent.setTrackingEnabled(value)
        }
      })

      // Performance folder
      const perfFolder = this.gui.addFolder('Performance')
      perfFolder.add(this.stats, 'fps', 0, 120).name('FPS').listen()
      perfFolder.add(this.stats, 'deltaTime', 0, 0.1).name('Delta Time (s)').listen()
      perfFolder.add(this.stats, 'frameTime', 0, 50).name('Frame Time (ms)').listen()
      perfFolder.add(this.stats, 'pathfindingRate', 0, 1).name('Pathfinding Rate').listen()
      
      // Optimization controls
      const optFolder = this.gui.addFolder('Optimizations')
      optFolder.add(this.stats, 'frustumCulling').name('Frustum Culling').listen()
      optFolder.add(this.stats, 'adaptiveLOD').name('Adaptive LOD').listen()
      optFolder.add(this.stats, 'shadowOptimization').name('Shadow Optimization').listen()

      aiFolder.open()
      perfFolder.open()
    } catch (error) {
      console.error('Failed to setup debug GUI:', error)
    }
  }

  setAIAgent(aiAgent: AIAgent): void {
    this.aiAgent = aiAgent
  }

  update(deltaTime: number): void {
    // Update FPS and timing
    this.stats.fps = Math.round(1 / deltaTime)
    this.stats.deltaTime = Math.round(deltaTime * 1000) / 1000
    this.stats.frameTime = Math.round(deltaTime * 1000 * 100) / 100

    if (!this.aiAgent) return

    const model = this.aiAgent.getModel()
    const position = this.aiAgent.getPosition()

    if (model && position) {
      // Calculate distance from physics body to ground
      this.stats.distanceFromGround = Math.round((position.y - this.groundLevel) * 100) / 100

      // Calculate mesh bottom distance to ground using bounding box
      const box = new THREE.Box3().setFromObject(model)
      const meshBottom = box.min.y
      this.stats.meshBottomDistance = Math.round((meshBottom - this.groundLevel) * 100) / 100

      // Get model size after scaling
      const size = box.getSize(new THREE.Vector3())
      this.stats.catSizeX = Math.round(size.x * 100) / 100
      this.stats.catSizeY = Math.round(size.y * 100) / 100
      this.stats.catSizeZ = Math.round(size.z * 100) / 100

      // Update tracking status and pathfinding rate
      this.stats.aiTrackingEnabled = this.aiAgent.isTrackingEnabled()
      this.stats.pathfindingRate = this.aiAgent.getPathfindingRate()
    }
  }

  destroy(): void {
    this.gui.destroy()
  }
}