import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Physics } from '../systems/Physics'
import { Player } from './Player'
import { Log } from '../utils/Logger'

export class AIAgent {
  private scene: THREE.Scene
  private physics: Physics
  private player: Player
  private model: THREE.Object3D | null = null
  private physicsBody: any = null
  private velocity = new THREE.Vector3()
  
  private moveSpeed = 2.0
  private pathfindingUpdateRate = 0.1 // Update pathfinding 10 times per second
  private lastPathfindingUpdate = 0
  private targetPosition = new THREE.Vector3()

  constructor(scene: THREE.Scene, physics: Physics, player: Player) {
    this.scene = scene
    this.physics = physics
    this.player = player
  }

  async init(): Promise<void> {
    await this.loadModel()
    this.createPhysicsBody()
  }

  private async loadModel(): Promise<void> {
    const loader = new GLTFLoader()
    
    try {
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          '/Cat.glb',
          resolve,
          undefined,
          reject
        )
      })
      
      this.model = gltf.scene
      if (this.model) {
        this.model.scale.set(0.5, 0.5, 0.5) // Scale down the cat model
        this.model.position.set(-3, 0, -3) // Start position away from player
      }
      
      // Enable shadows for the model
      if (this.model) {
        this.model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        
        this.scene.add(this.model)
      }
      Log.info('AIAgent: Cat model loaded successfully')
      
    } catch (error) {
      Log.error('AIAgent: Failed to load Cat.glb model:', error)
      // Create a fallback primitive if model loading fails
      this.createFallbackModel()
    }
  }

  private createFallbackModel(): void {
    const geometry = new THREE.BoxGeometry(0.5, 1, 0.5)
    const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 }) // Brown color for cat
    this.model = new THREE.Mesh(geometry, material)
    this.model.position.set(-3, 0.5, -3)
    if (this.model instanceof THREE.Mesh) {
      this.model.castShadow = true
      this.model.receiveShadow = true
    }
    this.scene.add(this.model)
    Log.warn('AIAgent: Using fallback primitive model')
  }

  private createPhysicsBody(): void {
    if (!this.model) return

    const position = this.model.position
    const startPosition = new THREE.Vector3(position.x, position.y + 0.5, position.z)
    
    // Create a physics body similar to the player but smaller
    const RAPIER = this.physics.getRAPIER()
    const world = this.physics.getWorld()
    
    const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(startPosition.x, startPosition.y, startPosition.z)
    
    const rigidBody = world.createRigidBody(rigidBodyDesc)
    
    const colliderDesc = RAPIER.ColliderDesc.capsule(0.4, 0.2) // Smaller than player
    const collider = world.createCollider(colliderDesc, rigidBody)
    
    this.physicsBody = { rigidBody, collider }
    Log.debug('AIAgent: Physics body created')
  }

  update(deltaTime: number): void {
    if (!this.model || !this.physicsBody) return

    this.updatePathfinding(deltaTime)
    this.updateMovement(deltaTime)
    this.syncModelWithPhysics()
  }

  private updatePathfinding(deltaTime: number): void {
    this.lastPathfindingUpdate += deltaTime
    
    if (this.lastPathfindingUpdate >= this.pathfindingUpdateRate) {
      this.lastPathfindingUpdate = 0
      
      // Get player position
      const playerPos = this.player.getPosition()
      this.targetPosition.copy(playerPos)
      
      Log.debug(`AIAgent: Targeting player at (${playerPos.x.toFixed(2)}, ${playerPos.y.toFixed(2)}, ${playerPos.z.toFixed(2)})`)
    }
  }

  private updateMovement(deltaTime: number): void {
    if (!this.physicsBody) return

    // Get current position
    const currentPos = this.physicsBody.rigidBody.translation()
    const currentPosition = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z)
    
    // Calculate direction to target
    const direction = this.targetPosition.clone().sub(currentPosition)
    direction.y = 0 // Don't move vertically for pathfinding
    
    const distanceToTarget = direction.length()
    
    // Only move if we're not already close to the target
    if (distanceToTarget > 1.0) {
      direction.normalize()
      
      // Set velocity towards target
      this.velocity.x = direction.x * this.moveSpeed
      this.velocity.z = direction.z * this.moveSpeed
      
      // Apply gravity
      if (!this.physics.isGrounded(this.physicsBody.collider)) {
        this.velocity.y += -9.81 * deltaTime
      } else {
        if (this.velocity.y < 0) {
          this.velocity.y = 0
        }
      }
      
      // Apply movement
      const translation = new THREE.Vector3(
        this.velocity.x * deltaTime,
        this.velocity.y * deltaTime,
        this.velocity.z * deltaTime
      )
      
      this.physics.moveCharacter(this.physicsBody.collider, translation)
      
      // Rotate model to face movement direction
      if (this.model && (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.z) > 0.1)) {
        const angle = Math.atan2(this.velocity.x, this.velocity.z)
        this.model.rotation.y = angle
      }
    }
  }

  private syncModelWithPhysics(): void {
    if (!this.model || !this.physicsBody?.rigidBody) return

    const position = this.physicsBody.rigidBody.translation()
    this.model.position.set(position.x, position.y - 0.5, position.z) // Offset to ground level
  }

  getPosition(): THREE.Vector3 {
    if (!this.physicsBody?.rigidBody) return new THREE.Vector3()
    
    const pos = this.physicsBody.rigidBody.translation()
    return new THREE.Vector3(pos.x, pos.y, pos.z)
  }

  getModel(): THREE.Object3D | null {
    return this.model
  }
}