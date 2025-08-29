import * as THREE from 'three'
import { ShaderManager } from './ShaderManager'

export class ShaderExamples {
  static async createHorrorMaterial(
    shaderManager: ShaderManager
  ): Promise<THREE.ShaderMaterial> {
    return await shaderManager.createMaterial(
      'horror',
      '/src/shaders/horror.vert',
      '/src/shaders/horror.frag',
      {
        time: { value: 0.0 }
      }
    )
  }

  static createExampleSphere(material: THREE.Material, position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  static createExamplePlane(material: THREE.Material, position: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }
}