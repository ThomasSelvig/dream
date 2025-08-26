import * as THREE from 'three'
import { Log } from '../utils/Logger'

export class Physics {
  private RAPIER: any
  private world: any
  private characterController: any
  private aiCharacterController: any

  async init(): Promise<void> {
    this.RAPIER = await import('@dimforge/rapier3d')

    const gravity = { x: 0.0, y: -9.81, z: 0.0 }
    this.world = new this.RAPIER.World(gravity)

    this.characterController = this.world.createCharacterController(0.01)
    this.characterController.setApplyImpulsesToDynamicBodies(true)
    this.characterController.enableAutostep(0.5, 0.2, true)
    this.characterController.enableSnapToGround(0.5)
    
    // Create separate character controller for AI agents
    this.aiCharacterController = this.world.createCharacterController(0.01)
    this.aiCharacterController.setApplyImpulsesToDynamicBodies(true)
    this.aiCharacterController.enableAutostep(0.5, 0.2, true)
    this.aiCharacterController.enableSnapToGround(0.5)
  }

  createGroundCollider(): any {
    const groundColliderDesc = this.RAPIER.ColliderDesc.cuboid(20.0, 1.0, 20.0)
      .setTranslation(0, -1.0, 0) // Position the thicker ground below surface
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

  createAIAgentCollider(position: THREE.Vector3): any {
    const rigidBodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y, position.z)
    
    const rigidBody = this.world.createRigidBody(rigidBodyDesc)
    
    const colliderDesc = this.RAPIER.ColliderDesc.capsule(0.4, 0.2)
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

    this.characterController.computeColliderMovement(
      collider,
      { x: desiredTranslation.x, y: desiredTranslation.y, z: desiredTranslation.z },
      filterFlags,
      filterGroups
    )

    const correctedMovement = this.characterController.computedMovement()
    const currentTranslation = collider.parent()?.translation()
    
    if (currentTranslation) {
      // If character controller returns zero movement but we have desired Y movement,
      // apply the Y movement directly while using corrected X/Z from controller
      const finalMovement = {
        x: correctedMovement.x,
        y: Math.abs(correctedMovement.x) < 0.0001 && Math.abs(correctedMovement.z) < 0.0001 && Math.abs(desiredTranslation.y) > 0.0001 
            ? desiredTranslation.y 
            : correctedMovement.y,
        z: correctedMovement.z
      }

      const newPosition = {
        x: currentTranslation.x + finalMovement.x,
        y: currentTranslation.y + finalMovement.y,
        z: currentTranslation.z + finalMovement.z
      }
      
      collider.parent()?.setTranslation(newPosition, true)
    }
  }

  moveAICharacter(
    collider: any,
    desiredTranslation: THREE.Vector3,
    filterFlags?: number,
    filterGroups?: number
  ): void {
    if (!this.aiCharacterController || !collider) {
      Log.error('Missing AI controller or collider:', !!this.aiCharacterController, !!collider)
      return
    }

    this.aiCharacterController.computeColliderMovement(
      collider,
      { x: desiredTranslation.x, y: desiredTranslation.y, z: desiredTranslation.z },
      filterFlags,
      filterGroups
    )

    const correctedMovement = this.aiCharacterController.computedMovement()
    const currentTranslation = collider.parent()?.translation()
    
    if (currentTranslation) {
      const finalMovement = {
        x: correctedMovement.x,
        y: Math.abs(correctedMovement.x) < 0.0001 && Math.abs(correctedMovement.z) < 0.0001 && Math.abs(desiredTranslation.y) > 0.0001 
            ? desiredTranslation.y 
            : correctedMovement.y,
        z: correctedMovement.z
      }

      const newPosition = {
        x: currentTranslation.x + finalMovement.x,
        y: currentTranslation.y + finalMovement.y,
        z: currentTranslation.z + finalMovement.z
      }
      
      collider.parent()?.setTranslation(newPosition, true)
    }
  }

  isGrounded(collider: any): boolean {
    if (!this.characterController || !collider) return false
    return this.characterController.computedGrounded()
  }

  isAIGrounded(collider: any): boolean {
    if (!this.aiCharacterController || !collider) return false
    return this.aiCharacterController.computedGrounded()
  }

  update(_deltaTime: number): void {
    this.world.step()
  }

  getWorld(): any {
    return this.world
  }

  getRAPIER(): any {
    return this.RAPIER
  }
}