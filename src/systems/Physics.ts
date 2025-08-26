import * as THREE from 'three'
import { Log } from '../utils/Logger'

export class Physics {
  private RAPIER: any
  private world: any
  private characterController: any

  async init(): Promise<void> {
    this.RAPIER = await import('@dimforge/rapier3d')

    const gravity = { x: 0.0, y: -9.81, z: 0.0 }
    this.world = new this.RAPIER.World(gravity)

    this.characterController = this.world.createCharacterController(0.01)
    this.characterController.setApplyImpulsesToDynamicBodies(true)
    this.characterController.enableAutostep(0.5, 0.2, true)
    this.characterController.enableSnapToGround(0.5)
  }

  createGroundCollider(): any {
    const groundColliderDesc = this.RAPIER.ColliderDesc.cuboid(10.0, 0.1, 10.0)
    return this.world.createCollider(groundColliderDesc)
  }

  createPlayerCollider(position: THREE.Vector3): any {
    const rigidBodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y, position.z)
    
    const rigidBody = this.world.createRigidBody(rigidBodyDesc)
    
    const colliderDesc = this.RAPIER.ColliderDesc.capsule(0.8, 0.4)
    const collider = this.world.createCollider(colliderDesc, rigidBody)
    
    return { rigidBody, collider }
  }

  moveCharacter(
    collider: any,
    desiredTranslation: THREE.Vector3,
    filterFlags?: number,
    filterGroups?: number
  ): void {
    if (!this.characterController || !collider) {
      Log.error('Missing controller or collider:', !!this.characterController, !!collider)
      return
    }

    Log.debug('Computing movement for:', desiredTranslation)

    this.characterController.computeColliderMovement(
      collider,
      { x: desiredTranslation.x, y: desiredTranslation.y, z: desiredTranslation.z },
      filterFlags,
      filterGroups
    )

    const correctedMovement = this.characterController.computedMovement()
    const currentTranslation = collider.parent()?.translation()
    
    Log.debug('Current position:', currentTranslation)
    Log.debug('Corrected movement:', correctedMovement)
    
    if (currentTranslation && correctedMovement) {
      const newPosition = {
        x: currentTranslation.x + correctedMovement.x,
        y: currentTranslation.y + correctedMovement.y,
        z: currentTranslation.z + correctedMovement.z
      }
      Log.debug('Setting new position:', newPosition)
      collider.parent()?.setTranslation(newPosition, true)
    }
  }

  isGrounded(collider: any): boolean {
    if (!this.characterController || !collider) return false
    return this.characterController.computedGrounded()
  }

  update(deltaTime: number): void {
    this.world.step()
  }

  getWorld(): any {
    return this.world
  }

  getRAPIER(): any {
    return this.RAPIER
  }
}