import { RefreshCw } from 'lucide-react'

interface LoadingProps {
  text?: string
}

export function Loading({ text }: LoadingProps) {
  return (
    <div className="flex items-center space-x-2">
      <RefreshCw className="h-4 w-4 animate-spin" />
      {text && <span>{text}</span>}
    </div>
  )
}
