import React, { useState } from 'react'
import { User } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'

interface UserNamePromptProps {
  onSubmit: (name: string) => void
}

export function UserNamePrompt({ onSubmit }: UserNamePromptProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-black border border-white/20 rounded-xl p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Set Your Name</h2>
            <p className="text-sm text-white/50">How should others see you?</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={!name.trim()}
          >
            Continue
          </Button>
        </form>
      </div>
    </div>
  )
}

