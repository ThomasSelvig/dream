import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Log } from '../utils/Logger'

export class Physics {
  private RAPIER: any
  private world: any
  private characterController: any
  private aiCharacterController: any
  private debugScene?: THREE.Scene
  private debugMeshes: THREE.Mesh[] = []

  async init(): Promise<void> {
    this.RAPIER = await import('@dimforge/rapier3d')

    const gravity = { x: 0.0, y: -9.81, z: 0.0 }
    this.world = new this.RAPIER.World(gravity)

    this.characterController = this.world.createCharacterController(0.01)
    this.characterController.setApplyImpulsesToDynamicBodies(true)
    this.characterController.enableAutostep(1., 0.5, true)
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

  createModelCollider(model: THREE.Object3D): any[] {
    const colliders: any[] = []
    
    // Ensure world matrices are updated
    model.updateMatrixWorld(true)
    
    // Create individual trimesh colliders for each mesh component
    let colliderCount = 0
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        try {
          // Get the mesh's world-transformed vertices
          const geometry = child.geometry.clone()
          geometry.applyMatrix4(child.matrixWorld)
          
          // Extract vertices and indices for trimesh
          const positionAttribute = geometry.getAttribute('position')
          const vertices = new Float32Array(positionAttribute.array)
          
          let indices: Uint32Array
          if (geometry.index) {
            indices = new Uint32Array(geometry.index.array)
          } else {
            // Generate indices for non-indexed geometry
            const vertexCount = vertices.length / 3
            indices = new Uint32Array(vertexCount)
            for (let i = 0; i < vertexCount; i++) {
              indices[i] = i
            }
          }
          
          // Create trimesh collider with actual geometry
          const colliderDesc = this.RAPIER.ColliderDesc.trimesh(vertices, indices)
          const collider = this.world.createCollider(colliderDesc)
          colliders.push(collider)
          colliderCount++
          
          Log.info(`✓ Created trimesh collider ${colliderCount} for ${child.name || 'unnamed'} with ${vertices.length/3} vertices, ${indices.length/3} triangles`)
          
        } catch (error) {
          Log.error(`Failed to create trimesh collider for ${child.name}:`, error)
          
          // Fallback to box collider
          const bbox = new THREE.Box3().setFromObject(child)
          const size = bbox.getSize(new THREE.Vector3())
          const center = bbox.getCenter(new THREE.Vector3())
          
          const colliderDesc = this.RAPIER.ColliderDesc.cuboid(
            size.x / 2, 
            size.y / 2, 
            size.z / 2
          ).setTranslation(center.x, center.y, center.z)
          
          const collider = this.world.createCollider(colliderDesc)
          colliders.push(collider)
          colliderCount++
          
          Log.info(`✓ Created fallback box collider ${colliderCount} for ${child.name || 'unnamed'}`)
        }
      }
    })
    
    // If no individual meshes worked, fall back to overall box
    if (colliders.length === 0) {
      Log.info('No individual meshes found, creating overall box collider')
      const bbox = new THREE.Box3().setFromObject(model)
      const size = bbox.getSize(new THREE.Vector3())
      const center = bbox.getCenter(new THREE.Vector3())
      const colliderDesc = this.RAPIER.ColliderDesc.cuboid(size.x / 2, size.y / 2, size.z / 2)
        .setTranslation(center.x, center.y, center.z)
      
      const collider = this.world.createCollider(colliderDesc)
      colliders.push(collider)
    }
    
    Log.info(`Total colliders created: ${colliders.length}`)
    return colliders
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

  setDebugScene(scene: THREE.Scene): void {
    this.debugScene = scene
  }

  createDebugVisualization(colliders: any[]): void {
    if (!this.debugScene) return

    this.clearDebugVisualization()

    colliders.forEach((collider, index) => {
      const shape = collider.shape
      
      if (shape.type === this.RAPIER.ShapeType.Trimesh) {
        // For trimesh, create wireframe visualization
        const vertices = shape.vertices
        const indices = shape.indices
        
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
        geometry.setIndex(new THREE.BufferAttribute(indices, 1))
        
        const material = new THREE.MeshBasicMaterial({ 
          color: 0x00ff00, 
          wireframe: true,
          transparent: true,
          opacity: 0.5 
        })
        
        const debugMesh = new THREE.Mesh(geometry, material)
        this.debugScene.add(debugMesh)
        this.debugMeshes.push(debugMesh)
        
        Log.info(`Created debug visualization for trimesh collider ${index}`)
      }
      else if (shape.type === this.RAPIER.ShapeType.Cuboid) {
        // For cuboids, create wireframe box
        const halfExtents = shape.halfExtents
        const geometry = new THREE.BoxGeometry(
          halfExtents.x * 2, 
          halfExtents.y * 2, 
          halfExtents.z * 2
        )
        
        const material = new THREE.MeshBasicMaterial({ 
          color: 0xff0000, 
          wireframe: true,
          transparent: true,
          opacity: 0.5 
        })
        
        const debugMesh = new THREE.Mesh(geometry, material)
        
        const translation = collider.translation()
        debugMesh.position.set(translation.x, translation.y, translation.z)
        
        const rotation = collider.rotation()
        debugMesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
        
        this.debugScene.add(debugMesh)
        this.debugMeshes.push(debugMesh)
        
        Log.info(`Created debug visualization for cuboid collider ${index}`)
      }
    })
  }

  clearDebugVisualization(): void {
    if (!this.debugScene) return

    this.debugMeshes.forEach(mesh => {
      this.debugScene!.remove(mesh)
      mesh.geometry.dispose()
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose()
      }
    })
    this.debugMeshes = []
  }

  toggleDebugVisualization(): void {
    if (this.debugMeshes.length === 0) {
      Log.info('No debug visualization meshes available')
      return
    }
    
    this.debugMeshes.forEach(mesh => {
      mesh.visible = !mesh.visible
    })
    Log.info(`Debug visualization ${this.debugMeshes.length > 0 && this.debugMeshes[0].visible ? 'enabled' : 'disabled'}`)
  }
}