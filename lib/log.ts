/**
 * Tiny logger utility that no-ops in production
 * Used for QA diagnostics and debugging
 */

export interface LogContext {
  component?: string
  operation?: string
  userId?: string
  saleId?: string
  [key: string]: any
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const parts = [`[${timestamp}]`, `[${level}]`]
    
    if (context?.component) parts.push(`[${context.component}]`)
    if (context?.operation) parts.push(`[${context.operation}]`)
    if (context?.userId) parts.push(`[user:${context.userId}]`)
    if (context?.saleId) parts.push(`[sale:${context.saleId}]`)
    
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `${parts.join(' ')} ${message}${contextStr}`
  }

  info(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.log(this.formatMessage('INFO', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.warn(this.formatMessage('WARN', message, context))
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.isProduction) {
      const errorMessage = error ? `${message}: ${error.message}` : message
      console.error(this.formatMessage('ERROR', errorMessage, context))
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.debug(this.formatMessage('DEBUG', message, context))
    }
  }
}

export const logger = new Logger()
