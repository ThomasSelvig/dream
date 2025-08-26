import * as THREE from 'three'
import { Log } from './Logger'

export class PerformanceOptimizer {
  private static frustum = new THREE.Frustum()
  private static cameraMatrix = new THREE.Matrix4()
  private static tempVector = new THREE.Vector3()
  
  // Performance counters
  private static frameCount = 0
  private static lastFPSUpdate = 0
  private static averageFPS = 60
  
  // Optimization settings
  private static LOD_DISTANCES = {
    HIGH: 10,
    MEDIUM: 25,
    LOW: 50
  }

  /**
   * Setup frustum culling for a camera
   */
  static setupFrustumCulling(camera: THREE.Camera): void {
    this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    this.frustum.setFromProjectionMatrix(this.cameraMatrix)
  }

  /**
   * Check if object is visible in frustum
   */
  static isObjectVisible(object: THREE.Object3D): boolean {
    if (!(object instanceof THREE.Mesh) || !object.geometry) return true // Always render non-mesh objects
    
    // Simple sphere-based frustum culling
    object.geometry.computeBoundingSphere()
    const sphere = object.geometry.boundingSphere
    
    if (!sphere) return true
    
    this.tempVector.copy(sphere.center).applyMatrix4(object.matrixWorld)
    return this.frustum.intersectsSphere(new THREE.Sphere(this.tempVector, sphere.radius))
  }

  /**
   * Get appropriate level of detail based on distance to camera
   */
  static getLODLevel(objectPosition: THREE.Vector3, cameraPosition: THREE.Vector3): 'HIGH' | 'MEDIUM' | 'LOW' {
    const distance = objectPosition.distanceTo(cameraPosition)
    
    if (distance < this.LOD_DISTANCES.HIGH) return 'HIGH'
    if (distance < this.LOD_DISTANCES.MEDIUM) return 'MEDIUM'
    if (distance < this.LOD_DISTANCES.LOW) return 'LOW'
    
    return 'LOW' // Very far objects get lowest detail
  }

  /**
   * Update FPS tracking
   */
  static updateFPS(_deltaTime: number): number {
    this.frameCount++
    const currentTime = performance.now()
    
    if (currentTime - this.lastFPSUpdate >= 1000) { // Update every second
      this.averageFPS = this.frameCount
      this.frameCount = 0
      this.lastFPSUpdate = currentTime
    }
    
    return this.averageFPS
  }

  /**
   * Get performance optimizations based on current FPS
   */
  static getOptimizationSettings(fps: number): {
    shadowMapSize: number
    pathfindingRate: number
    enableShadows: boolean
    renderDistance: number
  } {
    if (fps < 30) {
      // Aggressive optimizations for low FPS
      return {
        shadowMapSize: 512,
        pathfindingRate: 0.5, // Update pathfinding every 0.5 seconds
        enableShadows: false,
        renderDistance: 30
      }
    } else if (fps < 45) {
      // Moderate optimizations
      return {
        shadowMapSize: 1024,
        pathfindingRate: 0.2,
        enableShadows: true,
        renderDistance: 50
      }
    } else {
      // High performance, no optimizations needed
      return {
        shadowMapSize: 2048,
        pathfindingRate: 0.1,
        enableShadows: true,
        renderDistance: 100
      }
    }
  }

  /**
   * Optimize scene objects based on distance and visibility
   */
  static optimizeScene(scene: THREE.Scene, camera: THREE.Camera): void {
    this.setupFrustumCulling(camera)
    
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Frustum culling
        object.visible = this.isObjectVisible(object)
        
        if (object.visible) {
          // LOD based on distance
          const cameraPos = camera.position
          const objectPos = object.position
          const lodLevel = this.getLODLevel(objectPos, cameraPos)
          
          // Adjust rendering quality based on LOD
          switch (lodLevel) {
            case 'HIGH':
              object.castShadow = true
              object.receiveShadow = true
              break
            case 'MEDIUM':
              object.castShadow = true
              object.receiveShadow = false
              break
            case 'LOW':
              object.castShadow = false
              object.receiveShadow = false
              break
          }
        }
      }
    })
  }

  /**
   * Memory cleanup utilities
   */
  static cleanupGeometry(geometry: THREE.BufferGeometry): void {
    geometry.dispose()
  }

  static cleanupMaterial(material: THREE.Material | THREE.Material[]): void {
    const materials = Array.isArray(material) ? material : [material]
    
    materials.forEach(mat => {
      if (mat instanceof THREE.MeshStandardMaterial) {
        if (mat.map) mat.map.dispose()
        if (mat.normalMap) mat.normalMap.dispose()
        if (mat.roughnessMap) mat.roughnessMap.dispose()
        if (mat.metalnessMap) mat.metalnessMap.dispose()
      } else if (mat instanceof THREE.MeshLambertMaterial) {
        if (mat.map) mat.map.dispose()
        if (mat.normalMap) mat.normalMap.dispose()
      }
      mat.dispose()
    })
  }

  /**
   * Log performance recommendations
   */
  static logPerformanceStats(fps: number, deltaTime: number): void {
    if (fps < 30) {
      Log.warn(`Low FPS detected: ${fps}. Consider reducing quality settings.`)
    } else if (fps > 100) {
      Log.debug(`High FPS: ${fps}. You can increase quality settings.`)
    }
    
    if (deltaTime > 0.033) { // > 33ms = < 30 FPS
      Log.warn(`Frame time spike: ${(deltaTime * 1000).toFixed(2)}ms`)
    }
  }
}