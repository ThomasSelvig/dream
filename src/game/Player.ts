import * as THREE from 'three'
import { Camera } from '../core/Camera'
import { Physics } from '../systems/Physics'
import { Log } from '../utils/Logger'

export class Player {
  private camera: Camera
  private physics: Physics
  private velocity = new THREE.Vector3()
  private physicsBody: any
  private keys = new Set<string>()
  
  private moveSpeed = 5.0
  private jumpSpeed = 6.0
  private friction = 15.0
  private acceleration = 50.0

  constructor(camera: Camera, physics: Physics) {
    this.camera = camera
    this.physics = physics
    this.setupInputHandlers()
  }

  async init(): Promise<void> {
    const startPosition = new THREE.Vector3(0, 2, 5)
    this.camera.setPosition(startPosition.x, startPosition.y, startPosition.z)
    
    this.physicsBody = this.physics.createPlayerCollider(startPosition)
  }

  private setupInputHandlers(): void {
    document.addEventListener('keydown', (event) => {
      this.keys.add(event.code.toLowerCase())
      Log.debug('Key pressed:', event.code.toLowerCase())
    })

    document.addEventListener('keyup', (event) => {
      this.keys.delete(event.code.toLowerCase())
      Log.debug('Key released:', event.code.toLowerCase())
    })
  }

  update(deltaTime: number): void {
    if (!this.physicsBody) return

    this.handleMovement(deltaTime)
    this.handleJump(deltaTime)
    this.applyMovement(deltaTime)
    this.syncCameraWithPhysics()
  }

  private handleMovement(deltaTime: number): void {
    const inputDirection = new THREE.Vector3()
    const forward = this.camera.getDirection().clone()
    forward.y = 0
    forward.normalize()
    
    const right = this.camera.getRightVector()

    Log.debug('Forward:', forward)
    Log.debug('Right:', right)
    Log.debug('Active keys:', Array.from(this.keys))

    if (this.keys.has('keyw')) {
      inputDirection.add(forward)
      Log.debug('Moving forward')
    }
    if (this.keys.has('keys')) {
      inputDirection.sub(forward)
      Log.debug('Moving backward')
    }
    if (this.keys.has('keya')) {
      inputDirection.sub(right)
      Log.debug('Moving left')
    }
    if (this.keys.has('keyd')) {
      inputDirection.add(right)
      Log.debug('Moving right')
    }

    if (inputDirection.length() > 0) {
      inputDirection.normalize()
      const targetVelocity = inputDirection.multiplyScalar(this.moveSpeed)
      
      // Initialize velocity if NaN
      if (isNaN(this.velocity.x)) this.velocity.x = 0
      if (isNaN(this.velocity.z)) this.velocity.z = 0
      
      this.velocity.x = THREE.MathUtils.lerp(
        this.velocity.x,
        targetVelocity.x,
        this.acceleration * deltaTime
      )
      this.velocity.z = THREE.MathUtils.lerp(
        this.velocity.z,
        targetVelocity.z,
        this.acceleration * deltaTime
      )
    } else {
      if (!isNaN(this.velocity.x) && !isNaN(this.velocity.z)) {
        const decelerationFactor = Math.pow(1 - this.friction, deltaTime)
        this.velocity.x *= decelerationFactor
        this.velocity.z *= decelerationFactor
      }
    }

  }

  private handleJump(deltaTime: number): void {
    if (this.keys.has('space') && this.physics.isGrounded(this.physicsBody.collider)) {
      this.velocity.y = this.jumpSpeed
      Log.debug('Jumping!')
    }
  }

  private applyMovement(deltaTime: number): void {
    // Apply gravity
    if (!this.physics.isGrounded(this.physicsBody.collider)) {
      this.velocity.y += -9.81 * deltaTime
    } else {
      if (this.velocity.y < 0) {
        this.velocity.y = 0
      }
    }

    const translation = new THREE.Vector3(
      this.velocity.x * deltaTime,
      this.velocity.y * deltaTime,
      this.velocity.z * deltaTime
    )

    // Use character controller for horizontal movement, direct position update for vertical
    if (Math.abs(translation.x) > 0.0001 || Math.abs(translation.z) > 0.0001 || Math.abs(translation.y) > 0.0001) {
      this.physics.moveCharacter(this.physicsBody.collider, translation)
    }
  }

  private syncCameraWithPhysics(): void {
    if (!this.physicsBody?.rigidBody) return

    const position = this.physicsBody.rigidBody.translation()
    this.camera.setPosition(position.x, position.y + 0.8, position.z)
  }

  getPosition(): THREE.Vector3 {
    if (!this.physicsBody?.rigidBody) return new THREE.Vector3()
    
    const pos = this.physicsBody.rigidBody.translation()
    return new THREE.Vector3(pos.x, pos.y, pos.z)
  }
}