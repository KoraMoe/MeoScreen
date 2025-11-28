import { Mic, MicOff, User } from 'lucide-react'

interface ParticipantTileProps {
  name: string
  isSpeaking?: boolean
  isMuted?: boolean
  isLocal?: boolean
}

export function ParticipantTile({
  name,
  isSpeaking = false,
  isMuted = false,
  isLocal = false,
}: ParticipantTileProps) {
  return (
    <div
      className={`relative bg-white/5 border rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] transition-all ${
        isSpeaking ? 'border-green-400/50 ring-2 ring-green-400/30' : 'border-white/10'
      }`}
    >
      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2">
        <User className="w-6 h-6 text-white/70" />
      </div>
      <span className="text-sm text-white font-medium truncate max-w-full">
        {name} {isLocal && '(You)'}
      </span>
      <div className="absolute top-2 right-2">
        {isMuted ? (
          <MicOff className="w-4 h-4 text-red-400" />
        ) : (
          <Mic className={`w-4 h-4 ${isSpeaking ? 'text-green-400' : 'text-white/50'}`} />
        )}
      </div>
    </div>
  )
}

