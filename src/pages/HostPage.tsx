import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Monitor, X, Users, MessageSquare, Mic, MicOff, MonitorOff } from 'lucide-react'
import { Button } from '../components/Button'
import { RoomCodeDisplay } from '../components/RoomCodeDisplay'
import { ConnectionStatus } from '../components/ConnectionStatus'
import { ChatPanel, type ChatMessage } from '../components/ChatPanel'
import { ParticipantTile } from '../components/ParticipantTile'
import { realtimeKitService, type Participant } from '../services/realtimekit'

export function HostPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const userName = (location.state as { userName?: string })?.userName
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [isSharing, setIsSharing] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showChat, setShowChat] = useState(true)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  // Initialize RealtimeKit
  useEffect(() => {
    if (!userName || !roomId || initialized.current) {
      if (!userName) navigate('/')
      return
    }

    initialized.current = true

    const initRoom = async () => {
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
        realtimeKitService.onScreenShareEnded = () => {
          setIsSharing(false)
          if (videoRef.current) {
            videoRef.current.srcObject = null
          }
        }
        realtimeKitService.onError = (err) => {
          console.error('RealtimeKit error:', err)
          setError(err.message)
        }

        // Create room
        await realtimeKitService.createRoom(roomId, userName)
      } catch (err) {
        console.error('Failed to create room:', err)
        setError(err instanceof Error ? err.message : 'Failed to create room')
        setStatus('disconnected')
      }
    }

    initRoom()

    return () => {
      realtimeKitService.disconnect()
    }
  }, [roomId, userName, navigate])

  const handleStartSharing = useCallback(async () => {
    try {
      const stream = await realtimeKitService.startScreenShare()
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsSharing(true)
    } catch (err) {
      console.error('Failed to start screen sharing:', err)
      setError('Failed to start screen sharing')
    }
  }, [])

  const handleStopSharing = useCallback(async () => {
    await realtimeKitService.stopScreenShare()
    setIsSharing(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

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

  const handleEndSession = useCallback(() => {
    realtimeKitService.disconnect()
    navigate('/')
  }, [navigate])

  const handleSendMessage = useCallback((message: string) => {
    realtimeKitService.sendMessage(message)
  }, [])

  if (error && status === 'disconnected') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <X className="w-10 h-10 text-red-400" />
          </div>
          <p className="text-white text-xl font-medium mb-2">Failed to Create Room</p>
          <p className="text-sm text-white/50 mb-6">{error}</p>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
          >
            Return Home
          </Button>
        </div>
      </div>
    )
  }

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
                <p className="text-sm text-white/50">Hosting Room</p>
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
              <Button variant="ghost" onClick={handleEndSession}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col p-6">
            {/* Video Preview */}
            <div className="flex-1 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center mb-4 overflow-hidden relative">
              {status === 'connecting' ? (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-white/10 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white/50">Creating room...</p>
                </div>
              ) : !isSharing ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                    <Monitor className="w-10 h-10 text-white/30" />
                  </div>
                  <p className="text-white/50 mb-6">Share your screen to start streaming</p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleStartSharing}
                    className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white"
                  >
                    <Monitor className="w-5 h-5 mr-2" />
                    Start Sharing Screen
                  </Button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 bg-black/60 backdrop-blur-sm rounded-xl border border-white/10">
                    <Button
                      variant={isMuted ? 'secondary' : 'primary'}
                      onClick={handleToggleMute}
                      className="w-12 h-12 p-0 rounded-full"
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleStopSharing}
                      className="w-12 h-12 p-0 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30"
                    >
                      <MonitorOff className="w-5 h-5" />
                    </Button>
                  </div>
                </>
              )}
            </div>

            <ConnectionStatus status={status} viewerCount={participants.length} />
          </div>

          {/* Sidebar */}
          <div className={`${showChat ? 'w-80' : 'w-0'} border-l border-white/10 flex flex-col overflow-hidden transition-all duration-300 bg-black/20`}>
            {showChat && (
              <>
                <div className="flex-none p-6 space-y-6 border-b border-white/10">
                  <div>
                    <h2 className="text-sm font-medium text-white/50 mb-3">Room Information</h2>
                    <RoomCodeDisplay code={roomId || 'UNKNOWN'} />
                  </div>
                  
                  <div>
                    <h2 className="text-sm font-medium text-white/50 mb-3">
                      Participants ({participants.length + 1})
                    </h2>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <ParticipantTile
                        name={userName || 'Host'}
                        isLocal
                        isMuted={isMuted}
                      />
                      {participants.map(p => (
                        <ParticipantTile
                          key={p.id}
                          name={p.name}
                          isMuted={p.isMuted}
                        />
                      ))}
                      {participants.length === 0 && (
                        <div className="text-center py-4">
                          <Users className="w-6 h-6 text-white/20 mx-auto mb-2" />
                          <p className="text-xs text-white/30">Waiting for viewers...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  <ChatPanel
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    currentUserName={userName || 'Host'}
                  />
                </div>

                <div className="flex-none p-4 border-t border-white/10">
                  <Button
                    variant="secondary"
                    onClick={handleEndSession}
                    className="w-full"
                  >
                    End Session
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
