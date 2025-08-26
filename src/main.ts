import './style.css'
import { Engine } from './core/Engine'
import { Log, LogLevel } from './utils/Logger'

// Log.setLevel(LogLevel.DEBUG)
Log.setLevel(LogLevel.INFO)

async function main() {
  const engine = new Engine()
  
  try {
    await engine.init()
    engine.start()
    Log.info('Game engine started successfully!')
  } catch (error) {
    console.error('Failed to initialize game engine:', error)
  }
}

main()