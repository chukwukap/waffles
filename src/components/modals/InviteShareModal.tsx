"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface InviteShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inviteCode: string
}

export function InviteShareModal({ open, onOpenChange, inviteCode }: InviteShareModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    const text = encodeURIComponent(`Join me on Waffles! Use my invite code: ${inviteCode} 🧇`)
    const url = `https://twitter.com/intent/tweet?text=${text}`
    window.open(url, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-none p-0 overflow-hidden">
        <div className="relative">
          {/* Header with pixel icon */}
          <div className="bg-[#1a5a9e] py-6 text-center relative overflow-hidden">
            {/* Pixelated clouds at top */}
            <div className="absolute top-0 left-0 right-0 h-8 pixel-art">
              <svg className="w-full h-full" viewBox="0 0 400 32" preserveAspectRatio="none">
                <rect x="0" y="0" width="80" height="8" fill="#4a7ba7" opacity="0.3" />
                <rect x="100" y="4" width="60" height="8" fill="#4a7ba7" opacity="0.3" />
                <rect x="200" y="0" width="70" height="8" fill="#4a7ba7" opacity="0.3" />
                <rect x="300" y="4" width="80" height="8" fill="#4a7ba7" opacity="0.3" />
              </svg>
            </div>

            <h2
              className="text-[#ffd700] font-black text-2xl tracking-wider flex items-center justify-center gap-2"
              style={{ fontFamily: "monospace" }}
            >
              <span className="text-3xl">👥</span>
              INVITE FRIENDS
            </h2>
          </div>

          {/* Pixelated sunset background with gift */}
          <div className="relative h-64 pixel-art overflow-hidden">
            {/* Sky gradient - sunset colors */}
            <div className="absolute inset-0">
              <svg className="w-full h-full" viewBox="0 0 400 256" preserveAspectRatio="none">
                {/* Blue sky at top */}
                <rect x="0" y="0" width="400" height="60" fill="#1a5a9e" />

                {/* Sunset rays - radiating from center */}
                <defs>
                  <linearGradient id="ray1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffd700" />
                    <stop offset="100%" stopColor="#ffb347" />
                  </linearGradient>
                  <linearGradient id="ray2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffb347" />
                    <stop offset="100%" stopColor="#ff8c42" />
                  </linearGradient>
                </defs>

                {/* Alternating sunset rays */}
                <polygon points="200,80 0,256 50,256" fill="url(#ray1)" />
                <polygon points="200,80 50,256 100,256" fill="url(#ray2)" />
                <polygon points="200,80 100,256 150,256" fill="url(#ray1)" />
                <polygon points="200,80 150,256 200,256" fill="url(#ray2)" />
                <polygon points="200,80 200,256 250,256" fill="url(#ray1)" />
                <polygon points="200,80 250,256 300,256" fill="url(#ray2)" />
                <polygon points="200,80 300,256 350,256" fill="url(#ray1)" />
                <polygon points="200,80 350,256 400,256" fill="url(#ray2)" />

                {/* Ground - brown/dirt */}
                <rect x="0" y="200" width="400" height="30" fill="#5a4a3a" />
                <rect x="0" y="230" width="400" height="26" fill="#4a3a2a" />
              </svg>
            </div>

            {/* Green grass at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-[#4a7c3e] to-[#3d6b34]" />

            {/* Gift box centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-32 h-32 pixel-art">
                {/* Gift box body - yellow/gold with dots */}
                <div className="absolute inset-0 bg-[#ffd700] rounded-lg" style={{ imageRendering: "pixelated" }}>
                  {/* Polka dots pattern */}
                  <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 p-2 gap-2">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-[#ff6b6b] rounded-full" />
                    ))}
                  </div>
                </div>

                {/* Red ribbon - vertical */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-full bg-[#dc143c]" />

                {/* Red ribbon - horizontal */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-8 bg-[#dc143c]" />

                {/* Bow on top */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8">
                  <div className="absolute left-0 w-6 h-6 bg-[#dc143c] rounded-full" />
                  <div className="absolute right-0 w-6 h-6 bg-[#dc143c] rounded-full" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-1 w-4 h-4 bg-[#b22222] rounded-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Code section */}
          <div className="bg-[#1a1a1a] px-8 py-8 space-y-6">
            <div className="text-center space-y-4">
              <p className="text-gray-400 text-lg">Your code is</p>
              <div className="bg-[#0a0a0a] border-4 border-[#2a2a2a] rounded-2xl py-6">
                <div className="text-6xl font-black tracking-[0.3em] text-white" style={{ fontFamily: "monospace" }}>
                  {inviteCode}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleShare}
                className="w-full bg-white text-black font-black text-xl py-5 rounded-2xl hover:bg-gray-100 transition-colors border-4 border-[#ffd700]"
                style={{ fontFamily: "monospace" }}
              >
                SHARE INVITE
              </button>

              <button
                onClick={handleCopy}
                className={cn(
                  "w-full bg-transparent text-[#00d4ff] font-black text-lg py-4 rounded-2xl border-2 border-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors flex items-center justify-center gap-3",
                  copied && "text-[#00ff00] border-[#00ff00]",
                )}
                style={{ fontFamily: "monospace" }}
              >
                <Copy className="w-5 h-5" />
                {copied ? "COPIED!" : "COPY CODE"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
