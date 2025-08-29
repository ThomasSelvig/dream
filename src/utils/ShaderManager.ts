import * as THREE from 'three'
import { ShaderLoader } from './ShaderLoader'
import type { ShaderProgram } from './ShaderLoader'

export class ShaderManager {
  private materials = new Map<string, THREE.ShaderMaterial>()
  private uniforms = new Map<string, { [uniform: string]: THREE.IUniform }>()

  async createMaterial(
    name: string,
    vertexPath: string,
    fragmentPath: string,
    customUniforms: { [uniform: string]: THREE.IUniform } = {}
  ): Promise<THREE.ShaderMaterial> {
    const shaderProgram = await ShaderLoader.loadShaderProgram(vertexPath, fragmentPath)
    
    const defaultUniforms = {
      time: { value: 0.0 },
      ...customUniforms
    }

    this.uniforms.set(name, defaultUniforms)
    const material = ShaderLoader.createShaderMaterial(shaderProgram, defaultUniforms)
    this.materials.set(name, material)
    
    return material
  }

  getMaterial(name: string): THREE.ShaderMaterial | undefined {
    return this.materials.get(name)
  }

  updateUniform(materialName: string, uniformName: string, value: any): void {
    const uniforms = this.uniforms.get(materialName)
    if (uniforms && uniforms[uniformName]) {
      uniforms[uniformName].value = value
    }
  }

  updateTime(deltaTime: number): void {
    for (const [name, uniforms] of this.uniforms.entries()) {
      if (uniforms.time) {
        uniforms.time.value += deltaTime
      }
    }
  }

  dispose(): void {
    for (const material of this.materials.values()) {
      material.dispose()
    }
    this.materials.clear()
    this.uniforms.clear()
  }
}