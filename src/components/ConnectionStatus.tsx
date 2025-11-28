import { Wifi, WifiOff, Loader2 } from 'lucide-react'

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected'
  viewerCount?: number
}

export function ConnectionStatus({
  status,
  viewerCount,
}: ConnectionStatusProps) {
  const statusConfig = {
    connecting: {
      icon: Loader2,
      text: 'Connecting...',
      color: 'text-yellow-400',
      animate: 'animate-spin',
    },
    connected: {
      icon: Wifi,
      text: 'Connected',
      color: 'text-green-400',
      animate: '',
    },
    disconnected: {
      icon: WifiOff,
      text: 'Disconnected',
      color: 'text-red-400',
      animate: '',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
      <Icon className={`w-4 h-4 ${config.color} ${config.animate}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
      {viewerCount !== undefined && status === 'connected' && (
        <span className="ml-auto text-sm text-white/50">
          {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
        </span>
      )}
    </div>
  )
}

