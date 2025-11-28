import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface RoomCodeDisplayProps {
  code: string
}

export function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg">
      <div className="flex-1">
        <p className="text-xs text-white/50 mb-1">Room Code</p>
        <p className="text-2xl font-mono font-semibold text-white tracking-wider">
          {code}
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="p-3 hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Copy room code"
      >
        {copied ? (
          <Check className="w-5 h-5 text-green-400" />
        ) : (
          <Copy className="w-5 h-5 text-white/70" />
        )}
      </button>
    </div>
  )
}

