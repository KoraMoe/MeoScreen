import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Monitor, X, AlertCircle, MessageSquare, Mic, MicOff, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '../components/Button'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { ChatPanel, type ChatMessage } from '../components/ChatPanel'
import { ParticipantTile } from '../components/ParticipantTile'
import { realtimeKitService, type Participant } from '../services/realtimekit'

export function ViewerPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const userName = (location.state as { userName?: string })?.userName
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [hasStream, setHasStream] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showChat, setShowChat] = useState(true)
  const [participants, setParticipants] = useState<Participant[]>([])
  const initialized = useRef(false)

  // Initialize RealtimeKit
  useEffect(() => {
    if (!userName || !roomId || initialized.current) {
      if (!userName) navigate('/')
      return
    }

    initialized.current = true

    const joinRoom = async () => {
      try {
        // Set up event handlers
        realtimeKitService.onConnectionStateChange = setStatus
        realtimeKitService.onParticipantJoined = (participant) => {
          setParticipants(prev => [...prev.filter(p => p.id !== participant.id), participant])
        }
        realtimeKitService.onParticipantLeft = (participantId) => {
          setParticipants(prev => prev.filter(p => p.id !== participantId))
        }
        realtimeKitService.onParticipantUpdate = (participant) => {
          setParticipants(prev => prev.map(p => p.id === participant.id ? participant : p))
        }
        realtimeKitService.onMessage = (msg) => {
          setMessages(prev => [...prev, {
            id: msg.id,
            userId: msg.userId,
            userName: msg.userName,
            message: msg.message,
            timestamp: msg.timestamp,
          }])
        }
        realtimeKitService.onScreenShareReceived = (stream) => {
          console.log('Received screen share stream')
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
          setHasStream(true)
        }
        realtimeKitService.onScreenShareEnded = () => {
          console.log('Screen share ended')
          if (videoRef.current) {
            videoRef.current.srcObject = null
          }
          setHasStream(false)
        }
        realtimeKitService.onError = (err) => {
          console.error('RealtimeKit error:', err)
          setError(err.message)
        }

        // Join room
        await realtimeKitService.joinRoom(roomId, userName)
        
        // Get existing participants
        const existingParticipants = realtimeKitService.getParticipants()
        setParticipants(existingParticipants)
      } catch (err) {
        console.error('Failed to join room:', err)
        setError(err instanceof Error ? err.message : 'Failed to join room')
        setStatus('disconnected')
      }
    }

    joinRoom()

    return () => {
      realtimeKitService.disconnect()
    }
  }, [roomId, userName, navigate])

  const handleLeave = useCallback(() => {
    realtimeKitService.disconnect()
    navigate('/')
  }, [navigate])

  const handleToggleMute = useCallback(async () => {
    try {
      if (isMuted) {
        await realtimeKitService.startAudio()
      }
      const newMutedState = await realtimeKitService.toggleMute()
      setIsMuted(newMutedState)
    } catch (err) {
      console.error('Failed to toggle audio:', err)
    }
  }, [isMuted])

  const handleToggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleSendMessage = useCallback((message: string) => {
    realtimeKitService.sendMessage(message)
  }, [])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex-none border-b border-white/10 px-6 py-4 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 rounded-xl flex items-center justify-center">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">MeoScreen</h1>
                <p className="text-sm text-white/50">Room: {roomId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowChat(!showChat)}
                className={`px-3 ${showChat ? 'bg-white/10' : ''}`}
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              <Button variant="ghost" onClick={handleLeave}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col p-6">
            <div 
              ref={containerRef}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center mb-4 overflow-hidden relative"
            >
              {status === 'connecting' && (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-white/10 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white/50">Connecting to room...</p>
                  <p className="text-sm text-white/30 mt-2">Room ID: {roomId}</p>
                </div>
              )}

              {status === 'disconnected' && (
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <p className="text-white text-xl font-medium mb-2">Connection Failed</p>
                  <p className="text-sm text-white/50 mb-6">{error || 'Unable to connect to room'}</p>
                  <Button
                    variant="primary"
                    onClick={handleLeave}
                    className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
                  >
                    Return Home
                  </Button>
                </div>
              )}

              {status === 'connected' && !hasStream && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                    <Monitor className="w-10 h-10 text-white/30" />
                  </div>
                  <p className="text-white/50">Waiting for host to share screen...</p>
                </div>
              )}

              {status === 'connected' && hasStream && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                  
                  {/* Controls overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 bg-black/60 backdrop-blur-sm rounded-xl border border-white/10">
                    <Button
                      variant={isMuted ? 'secondary' : 'primary'}
                      onClick={handleToggleMute}
                      className="w-12 h-12 p-0 rounded-full"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleToggleFullscreen}
                      className="w-12 h-12 p-0 rounded-full"
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </Button>
                  </div>
                </>
              )}
            </div>

            <ConnectionStatus status={status} />
          </div>

          {/* Sidebar */}
          {showChat && status === 'connected' && (
            <div className="w-80 border-l border-white/10 flex flex-col overflow-hidden bg-black/20">
              <div className="flex-none p-6 border-b border-white/10">
                <h2 className="text-sm font-medium text-white/50 mb-3">
                  Participants ({participants.length + 1})
                </h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {participants.map(p => (
                    <ParticipantTile
                      key={p.id}
                      name={p.name}
                      isMuted={p.isMuted}
                    />
                  ))}
                  <ParticipantTile
                    name={userName || 'You'}
                    isLocal
                    isMuted={isMuted}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <ChatPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  currentUserName={userName || 'Viewer'}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
