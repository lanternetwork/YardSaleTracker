/**
 * Autosave hook for sale drafts
 * Provides debounced saving functionality for anonymous users
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface AutosaveOptions {
  delay?: number
  onSave?: (data: any) => Promise<void>
  onError?: (error: Error) => void
}

interface AutosaveState {
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
}

export function useAutosaveDraft<T extends Record<string, any>>(
  data: T,
  options: AutosaveOptions = {}
) {
  const { delay = 800, onSave, onError } = options
  const [state, setState] = useState<AutosaveState>({
    isSaving: false,
    lastSaved: null,
    error: null
  })
  
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastDataRef = useRef<string>()
  
  // Serialize data for comparison
  const dataString = JSON.stringify(data)
  
  const saveData = useCallback(async (dataToSave: T) => {
    if (!onSave) return
    
    setState(prev => ({ ...prev, isSaving: true, error: null }))
    
    try {
      await onSave(dataToSave)
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        error: null
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed'
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage
      }))
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage))
      }
    }
  }, [onSave, onError])
  
  // Debounced save effect
  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Don't save if data hasn't changed
    if (lastDataRef.current === dataString) {
      return
    }
    
    // Don't save if data is empty or invalid
    if (!data || Object.keys(data).length === 0) {
      return
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      lastDataRef.current = dataString
      saveData(data)
    }, delay)
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [dataString, delay, saveData])
  
  // Manual save function
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    lastDataRef.current = dataString
    saveData(data)
  }, [dataString, saveData])
  
  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])
  
  return {
    ...state,
    saveNow,
    clearError
  }
}
