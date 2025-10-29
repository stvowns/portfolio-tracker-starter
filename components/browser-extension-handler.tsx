"use client"

import { useEffect } from 'react'

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function BrowserExtensionHandler() {
  useEffect(() => {
    // Wrap Object.defineProperty to prevent ethereum redefinition errors
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj: any, prop: string | symbol, descriptor: PropertyDescriptor) {
      try {
        // Allow normal property definitions
        return originalDefineProperty.call(this, obj, prop, descriptor);
      } catch (error: any) {
        // Suppress ethereum redefinition errors specifically
        if (obj === window && prop === 'ethereum' && error.message?.includes('redefine property')) {
          console.warn('Browser extension ethereum redefinition prevented');
          return obj;
        }
        // Re-throw other errors
        throw error;
      }
    };

    // Handle browser extension errors that can't be controlled
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('ethereum') || 
          event.message?.includes('evmAsk') ||
          event.message?.includes('Cannot redefine property') ||
          event.message?.includes('method')) {
        console.warn('Browser extension error prevented:', event.message)
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('ethereum') || 
          event.reason?.message?.includes('evmAsk') ||
          event.reason?.message?.includes('Cannot redefine property') ||
          event.reason?.message?.includes('method')) {
        console.warn('Browser extension promise rejection prevented:', event.reason?.message)
        event.preventDefault()
        return false
      }
    }

    // Handle middleware errors
    const handleConsoleError = (...args: any[]) => {
      const message = args[0]?.toString() || ''
      if (message.includes('middleware.js') || message.includes('Cannot read properties of null (reading \'method\')')) {
        console.warn('Middleware error filtered:', message)
        return
      }
      originalConsoleError.apply(console, args)
    }

    const originalConsoleError = console.error
    console.error = handleConsoleError

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      console.error = originalConsoleError
      Object.defineProperty = originalDefineProperty
    }
  }, [])

  return null
}
