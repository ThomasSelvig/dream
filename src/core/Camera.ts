import * as THREE from 'three'

export class Camera {
  private camera: THREE.PerspectiveCamera
  private euler = new THREE.Euler(0, 0, 0, 'YXZ')
  private isLocked = false
  private minPolarAngle = 0
  private maxPolarAngle = Math.PI

  constructor() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(0, 1.8, 5)
    this.setupPointerLock()
  }

  private setupPointerLock(): void {
    document.addEventListener('click', () => {
      if (!this.isLocked) {
        document.body.requestPointerLock()
      }
    })

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === document.body
    })

    document.addEventListener('mousemove', this.onMouseMove.bind(this))
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isLocked) return

    const sensitivity = 0.002

    this.euler.setFromQuaternion(this.camera.quaternion)

    this.euler.y -= event.movementX * sensitivity
    this.euler.x -= event.movementY * sensitivity

    this.euler.x = Math.max(
      Math.PI / 2 - this.maxPolarAngle,
      Math.min(Math.PI / 2 - this.minPolarAngle, this.euler.x)
    )

    this.camera.quaternion.setFromEuler(this.euler)
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  getDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3()
    this.camera.getWorldDirection(direction)
    return direction
  }

  getRightVector(): THREE.Vector3 {
    const right = new THREE.Vector3()
    right.crossVectors(this.getDirection(), this.camera.up).normalize()
    return right
  }

  updateAspect(aspect: number): void {
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()
  }

  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z)
  }

  getPosition(): THREE.Vector3 {
    return this.camera.position.clone()
  }

  isPointerLocked(): boolean {
    return this.isLocked
  }
}