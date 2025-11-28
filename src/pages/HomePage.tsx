import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Monitor, Users } from 'lucide-react'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { UserNamePrompt } from '../components/UserNamePrompt'

export function HomePage() {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [pendingAction, setPendingAction] = useState<'create' | 'join' | null>(null)

  const handleCreateRoom = () => {
    setPendingAction('create')
    setShowNamePrompt(true)
  }

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      setPendingAction('join')
      setShowNamePrompt(true)
    }
  }

  const handleNameSubmit = (name: string) => {
    setShowNamePrompt(false)
    if (pendingAction === 'create') {
      const newRoomCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()
      navigate(`/host/${newRoomCode}`, { state: { userName: name } })
    } else if (pendingAction === 'join' && roomCode.trim()) {
      navigate(`/view/${roomCode.toUpperCase()}`, { state: { userName: name } })
    }
    setPendingAction(null)
  }

  return (
    <>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/5 to-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-2xl w-full relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-tight">
              MeoScreen
            </h1>
          </div>

          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateRoom}
              className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-violet-500/25"
            >
              <Monitor className="w-5 h-5 mr-3" />
              Create Room
            </Button>

            {!showJoinInput ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowJoinInput(true)}
                className="w-full border-white/20 hover:border-white/30"
              >
                <Users className="w-5 h-5 mr-3" />
                Join Room
              </Button>
            ) : (
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4 backdrop-blur-sm">
                <Input
                  label="Enter Room Code"
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-wider uppercase"
                />
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowJoinInput(false)
                      setRoomCode('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleJoinRoom}
                    disabled={!roomCode.trim()}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
                  >
                    Join
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-white/30">
              Screen sharing • Voice chat • Text chat
            </p>
          </div>
        </div>
      </div>

      {showNamePrompt && <UserNamePrompt onSubmit={handleNameSubmit} />}
    </>
  )
}

