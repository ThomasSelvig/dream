import * as THREE from 'three'

export class Renderer {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
  }

  init(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    const appElement = document.getElementById('app')
    if (!appElement) {
      throw new Error('App element not found')
    }
    
    appElement.appendChild(this.renderer.domElement)

    document.body.style.margin = '0'
    document.body.style.overflow = 'hidden'
    this.renderer.domElement.style.display = 'block'
  }

  render(camera: THREE.PerspectiveCamera): void {
    this.renderer.render(this.scene, camera)
  }

  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height)
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }
}