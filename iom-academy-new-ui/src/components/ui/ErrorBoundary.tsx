import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface crash details in console for debugging while keeping UI recoverable.
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (window.location.hash !== '#/dashboard') {
      window.location.hash = '#/dashboard'
    } else {
      window.location.reload()
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-surface border border-border rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Something went wrong while rendering this view</h1>
              <p className="text-xs text-slate-600 mt-1">
                IOM Itqaan Academy caught an unexpected UI error so the page stays recoverable.
              </p>
            </div>
          </div>
          {this.state.error?.message && (
            <pre className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-3 text-rose-700 overflow-x-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Button onClick={this.handleReset}>
              <RotateCcw className="w-3.5 h-3.5" /> Reload Page
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.hash = '#/dashboard'
              }}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }
}

