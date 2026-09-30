import { Button } from '@/components/_ui/button'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

export function ErrorBoundary() {
  const error = useRouteError()

  const getErrorMessage = () => {
    if (isRouteErrorResponse(error)) {
      if (typeof error.data === 'string') {
        return error.data
      }

      if (error.data?.message) {
        return error.data.message
      }

      return error.statusText || 'Ocorreu um erro ao carregar esta página.'
    }

    if (error instanceof Error) {
      return error.message
    }

    return 'Ocorreu um erro inesperado.'
  }

  const getStatus = () => {
    if (isRouteErrorResponse(error)) {
      return error.status
    }

    return undefined
  }

  const getStack = () => {
    if (error instanceof Error) {
      return error.stack
    }

    return undefined
  }

  const status = getStatus()
  const message = getErrorMessage()
  const stack = getStack()

  return (
    <div className='min-h-screen flex items-center justify-center p-6'>
      <div className='w-full max-w-xl space-y-6 text-center'>
        <div className='flex justify-center'>
          <div className='rounded-full bg-error/10 p-4 text-error'>
            <AlertTriangle size={32} />
          </div>
        </div>

        <div className='space-y-2'>
          <h1 className='text-2xl font-bold'>Ops! Algo deu errado.</h1>

          {status && <p className='text-sm font-mono text-base-content/50'>HTTP {status}</p>}

          <p className='text-base-content/70 w-full'>{message}</p>
        </div>

        <div className='flex justify-center gap-2'>
          <Button appearance='outline' onClick={() => window.history.back()}>
            <ArrowLeft size={16} />
            Voltar
          </Button>

          <Button variant='primary' onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            Tentar novamente
          </Button>
        </div>

        {stack && (
          <details className='text-left'>
            <summary className='cursor-pointer text-sm text-base-content/60'>Detalhes do erro</summary>

            <pre className='mt-3 max-h-80 overflow-auto rounded-lg bg-base-200 p-4 text-xs whitespace-pre-wrap wrap-break-word'>
              {stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
