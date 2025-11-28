import RealtimeKitClient from '@cloudflare/realtimekit'

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: number
}

export interface Participant {
  id: string
  name: string
  isMuted: boolean
  isScreenSharing: boolean
}

// API response types
interface CreateMeetingResponse {
  meetingId: string
  authToken: string
}

interface JoinMeetingResponse {
  authToken: string
  meetingId: string
}

class RealtimeKitService {
  private meeting: RealtimeKitClient | null = null
  private userName: string = ''
  private screenStream: MediaStream | null = null

  // Event callbacks
  public onParticipantJoined?: (participant: Participant) => void
  public onParticipantLeft?: (participantId: string) => void
  public onParticipantUpdate?: (participant: Participant) => void
  public onMessage?: (message: ChatMessage) => void
  public onScreenShareReceived?: (stream: MediaStream) => void
  public onScreenShareEnded?: () => void
  public onConnectionStateChange?: (state: 'connecting' | 'connected' | 'disconnected') => void
  public onError?: (error: Error) => void

  private getBackendUrl(): string {
    // In production (Cloudflare Pages), use relative URL
    // In development, use the configured backend URL or default to local wrangler
    return import.meta.env.VITE_BACKEND_API_URL || '/api'
  }

  async createRoom(roomId: string, userName: string): Promise<string> {
    this.userName = userName

    try {
      this.onConnectionStateChange?.('connecting')

      // Call backend to create meeting
      const response = await fetch(`${this.getBackendUrl()}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          userName,
          isHost: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create meeting')
      }

      const data: CreateMeetingResponse = await response.json()
      
      // Initialize RealtimeKit client
      await this.initializeClient(data.authToken)
      
      return data.meetingId
    } catch (error) {
      this.onConnectionStateChange?.('disconnected')
      throw error
    }
  }

  async joinRoom(roomId: string, userName: string): Promise<void> {
    this.userName = userName

    try {
      this.onConnectionStateChange?.('connecting')

      // Call backend to join meeting
      const response = await fetch(`${this.getBackendUrl()}/meetings/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
        }),
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Room not found')
        }
        throw new Error('Failed to join meeting')
      }

      const data: JoinMeetingResponse = await response.json()
      
      // Initialize RealtimeKit client
      await this.initializeClient(data.authToken)
    } catch (error) {
      this.onConnectionStateChange?.('disconnected')
      throw error
    }
  }

  private async initializeClient(authToken: string): Promise<void> {
    try {
      this.meeting = await RealtimeKitClient.init({
        authToken,
        defaults: {
          audio: false,
          video: false,
        },
      })

      this.setupEventListeners()
      
      // Join the room
      await this.meeting.joinRoom()
      
      this.onConnectionStateChange?.('connected')
    } catch (error) {
      console.error('Failed to initialize RealtimeKit client:', error)
      throw error
    }
  }

  private setupEventListeners(): void {
    if (!this.meeting) return

    // Room joined
    this.meeting.self.on('roomJoined', () => {
      console.log('Room joined successfully')
      this.onConnectionStateChange?.('connected')
    })

    // Participant events
    this.meeting.participants.joined.on('participantJoined', (participant: any) => {
      this.onParticipantJoined?.({
        id: participant.id,
        name: participant.name || 'Unknown',
        isMuted: !participant.audioEnabled,
        isScreenSharing: participant.screenShareEnabled,
      })
    })

    this.meeting.participants.joined.on('participantLeft', (participant: any) => {
      this.onParticipantLeft?.(participant.id)
    })

    this.meeting.participants.joined.on('audioUpdate', (participant: any) => {
      this.onParticipantUpdate?.({
        id: participant.id,
        name: participant.name || 'Unknown',
        isMuted: !participant.audioEnabled,
        isScreenSharing: participant.screenShareEnabled,
      })
    })

    // Screen share events
    this.meeting.participants.joined.on('screenShareUpdate', (participant: any) => {
      if (participant.screenShareEnabled && participant.screenShareTrack) {
        const stream = new MediaStream([participant.screenShareTrack])
        this.onScreenShareReceived?.(stream)
      } else {
        this.onScreenShareEnded?.()
      }
    })

    // Chat messages - use type assertion for event name compatibility
    const chat = this.meeting.chat as any
    chat?.on('message', (message: any) => {
      this.onMessage?.({
        id: message.id || Date.now().toString(),
        userId: message.userId || message.senderId,
        userName: message.displayName || message.participantName || message.senderName || 'Unknown',
        message: message.message || message.text,
        timestamp: message.timestamp || message.time || Date.now(),
      })
    })

    // Connection state
    this.meeting.self.on('roomLeft', () => {
      this.onConnectionStateChange?.('disconnected')
    })
  }

  async startAudio(): Promise<void> {
    if (this.meeting) {
      await this.meeting.self.enableAudio()
    }
  }

  async stopAudio(): Promise<void> {
    if (this.meeting) {
      await this.meeting.self.disableAudio()
    }
  }

  async toggleMute(): Promise<boolean> {
    if (this.meeting) {
      if (this.meeting.self.audioEnabled) {
        await this.meeting.self.disableAudio()
        return true // muted
      } else {
        await this.meeting.self.enableAudio()
        return false // unmuted
      }
    }
    return true
  }

  async startScreenShare(): Promise<MediaStream | null> {
    if (this.meeting) {
      try {
        await this.meeting.self.enableScreenShare()
        // Return the screen share tracks as a stream
        const tracks = this.meeting.self.screenShareTracks
        if (tracks && tracks.video) {
          this.screenStream = new MediaStream([tracks.video])
          if (tracks.audio) {
            this.screenStream.addTrack(tracks.audio)
          }
          return this.screenStream
        }
      } catch (error) {
        console.error('Failed to start screen share:', error)
        throw error
      }
    }
    return null
  }

  async stopScreenShare(): Promise<void> {
    if (this.meeting) {
      await this.meeting.self.disableScreenShare()
      this.screenStream = null
      this.onScreenShareEnded?.()
    }
  }

  sendMessage(message: string): void {
    if (this.meeting?.chat) {
      this.meeting.chat.sendTextMessage(message)
    }
  }

  getParticipants(): Participant[] {
    if (!this.meeting) {
      return []
    }

    const participants: Participant[] = []
    this.meeting.participants.joined.toArray().forEach((p: any) => {
      participants.push({
        id: p.id,
        name: p.name || 'Unknown',
        isMuted: !p.audioEnabled,
        isScreenSharing: p.screenShareEnabled,
      })
    })
    return participants
  }

  getLocalParticipant(): Participant | null {
    if (this.meeting) {
      return {
        id: this.meeting.self.id,
        name: this.meeting.self.name || this.userName,
        isMuted: !this.meeting.self.audioEnabled,
        isScreenSharing: this.meeting.self.screenShareEnabled,
      }
    }
    return null
  }

  disconnect(): void {
    // Stop screen share
    this.screenStream?.getTracks().forEach(track => track.stop())
    this.screenStream = null

    // Leave meeting
    if (this.meeting) {
      this.meeting.leaveRoom()
      this.meeting = null
    }

    this.onConnectionStateChange?.('disconnected')
  }
}

// Singleton instance
export const realtimeKitService = new RealtimeKitService()
