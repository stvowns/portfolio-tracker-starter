"use client"

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Filter out browser extension errors that we can't control
    if (error.message.includes('ethereum') || 
        error.message.includes('evmAsk') ||
        error.message.includes('Cannot redefine property')) {
      console.warn('Browser extension error filtered:', error.message)
      return
    }
    
    console.error('Application error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} reset={() => this.setState({ hasError: false, error: undefined })} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  // Don't show error boundary for browser extension errors
  if (error?.message.includes('ethereum') || 
      error?.message.includes('evmAsk') ||
      error?.message.includes('Cannot redefine property')) {
    return null // Silent fail for browser extension errors
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-semibold">Bir hata oluştu</h2>
        <p className="text-muted-foreground">
          Uygulama beklenmedik bir hatayla karşılaştı. Sayfayı yenilemeyi deneyin.
        </p>
        {error && (
          <details className="text-left text-sm text-muted-foreground">
            <summary>Hata detayları</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}
