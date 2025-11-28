import { Mic, MicOff, Monitor, MonitorOff, PhoneOff } from 'lucide-react'
import { Button } from './Button'

interface ControlBarProps {
  isMuted: boolean
  isScreenSharing: boolean
  onToggleMute: () => void
  onToggleScreenShare?: () => void
  onLeave: () => void
  showScreenShare?: boolean
}

export function ControlBar({
  isMuted,
  isScreenSharing,
  onToggleMute,
  onToggleScreenShare,
  onLeave,
  showScreenShare = false,
}: ControlBarProps) {
  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
      <Button
        variant={isMuted ? 'secondary' : 'primary'}
        onClick={onToggleMute}
        className="w-14 h-14 p-0 rounded-full"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      {showScreenShare && onToggleScreenShare && (
        <Button
          variant={isScreenSharing ? 'secondary' : 'primary'}
          onClick={onToggleScreenShare}
          className="w-14 h-14 p-0 rounded-full"
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          {isScreenSharing ? (
            <MonitorOff className="w-5 h-5" />
          ) : (
            <Monitor className="w-5 h-5" />
          )}
        </Button>
      )}

      <Button
        variant="ghost"
        onClick={onLeave}
        className="w-14 h-14 p-0 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400"
        title="Leave"
      >
        <PhoneOff className="w-5 h-5" />
      </Button>
    </div>
  )
}

