"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type LoginType = "member" | "merchant"

interface LoginModalProps {
  type: LoginType
  open: boolean
  onOpenChange: (open: boolean) => void
}

const titles: Record<LoginType, string> = {
  member: "GRC Member Login",
  merchant: "Merchant Login",
}

export function LoginModal({ type, open, onOpenChange }: LoginModalProps) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Wire up magic link auth
    console.log(`Sending magic link to ${email} for ${type} login`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[type]}</DialogTitle>
          <DialogDescription>
            Enter your email to receive a magic login link.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Send Magic Link
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
