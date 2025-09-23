/**
 * Micro logger utility for scraper operations
 * Prefixes all logs with [SCRAPER] for easy filtering
 */

export interface ScraperLogContext {
  correlationId?: string
  city?: string
  query?: string
  operation?: string
}

class ScraperLogger {
  private generateCorrelationId(): string {
    return `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private formatMessage(level: string, message: string, context?: ScraperLogContext): string {
    const correlationId = context?.correlationId || this.generateCorrelationId()
    const parts = [`[SCRAPER]`, `[${level}]`, `[${correlationId}]`]
    
    if (context?.city) parts.push(`[${context.city}]`)
    if (context?.query) parts.push(`[${context.query}]`)
    if (context?.operation) parts.push(`[${context.operation}]`)
    
    return `${parts.join(' ')} ${message}`
  }

  info(message: string, context?: ScraperLogContext): void {
    console.log(this.formatMessage('INFO', message, context))
  }

  warn(message: string, context?: ScraperLogContext): void {
    console.warn(this.formatMessage('WARN', message, context))
  }

  error(message: string, error?: Error, context?: ScraperLogContext): void {
    const errorMessage = error ? `${message}: ${error.message}` : message
    console.error(this.formatMessage('ERROR', errorMessage, context))
  }

  debug(message: string, context?: ScraperLogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, context))
    }
  }
}

export const scraperLogger = new ScraperLogger()
