export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export class Logger {
  private static currentLevel: LogLevel = LogLevel.INFO
  
  static setLevel(level: LogLevel): void {
    this.currentLevel = level
  }
  
  static debug(message: any, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.DEBUG) {
      console.log('[DEBUG]', message, ...args)
    }
  }
  
  static info(message: any, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.INFO) {
      console.log('[INFO]', message, ...args)
    }
  }
  
  static warn(message: any, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.WARN) {
      console.warn('[WARN]', message, ...args)
    }
  }
  
  static error(message: any, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.ERROR) {
      console.error('[ERROR]', message, ...args)
    }
  }
}

export const Log = Logger