import React, { useEffect, useState, useRef } from 'react'
import { Send } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: number
}

interface ChatPanelProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  currentUserName: string
}

export function ChatPanel({
  messages,
  onSendMessage,
  currentUserName,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b border-white/10 p-4">
        <h2 className="text-sm font-medium text-white">Chat</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-white/30">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-sm font-medium ${msg.userName === currentUserName ? 'text-white' : 'text-white/70'}`}
                >
                  {msg.userName}
                </span>
                <span className="text-xs text-white/30">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <p className="text-sm text-white/90">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-none border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!inputValue.trim()}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

