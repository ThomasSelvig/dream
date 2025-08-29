import * as THREE from 'three'

export type ShaderProgram = {
  vertexShader: string
  fragmentShader: string
}

export class ShaderLoader {
  private static loadedShaders = new Map<string, ShaderProgram>()

  static async loadShaderProgram(vertexPath: string, fragmentPath: string): Promise<ShaderProgram> {
    const cacheKey = `${vertexPath}:${fragmentPath}`
    
    if (this.loadedShaders.has(cacheKey)) {
      return this.loadedShaders.get(cacheKey)!
    }

    try {
      const [vertexModule, fragmentModule] = await Promise.all([
        import(/* @vite-ignore */ vertexPath + '?raw'),
        import(/* @vite-ignore */ fragmentPath + '?raw')
      ])

      const shaderProgram: ShaderProgram = {
        vertexShader: vertexModule.default,
        fragmentShader: fragmentModule.default
      }

      this.loadedShaders.set(cacheKey, shaderProgram)
      return shaderProgram
    } catch (error) {
      throw new Error(`Failed to load shaders: ${vertexPath}, ${fragmentPath}. Error: ${error}`)
    }
  }

  static createShaderMaterial(
    shaderProgram: ShaderProgram,
    uniforms: { [uniform: string]: THREE.IUniform } = {}
  ): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: shaderProgram.vertexShader,
      fragmentShader: shaderProgram.fragmentShader,
      uniforms
    })
  }

  static createRawShaderMaterial(
    shaderProgram: ShaderProgram,
    uniforms: { [uniform: string]: THREE.IUniform } = {}
  ): THREE.RawShaderMaterial {
    return new THREE.RawShaderMaterial({
      vertexShader: shaderProgram.vertexShader,
      fragmentShader: shaderProgram.fragmentShader,
      uniforms
    })
  }
}