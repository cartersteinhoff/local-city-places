"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** URL to redirect to after login. Defaults to current page. */
  callbackUrl?: string
}

type Status = "idle" | "loading" | "success" | "error"

export function LoginModal({ open, onOpenChange, callbackUrl }: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [devToken, setDevToken] = useState<string | null>(null)

  // Use provided callbackUrl or default to current page
  const getCallbackUrl = () => {
    if (callbackUrl) return callbackUrl
    if (typeof window !== "undefined") {
      return window.location.pathname + window.location.search
    }
    return undefined
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")
    setDevToken(null)

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl: getCallbackUrl() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send magic link")
      }

      // In dev mode, the API returns the token directly
      if (data.token) {
        setDevToken(data.token)
      }

      setStatus("success")
    } catch (error) {
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong")
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setEmail("")
      setStatus("idle")
      setErrorMessage("")
      setDevToken(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>
            Enter your email to receive a{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline decoration-dotted cursor-help">
                  magic link
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={4}>
                A secure, password-free login link sent to your email. Just click it to sign in!
              </TooltipContent>
            </Tooltip>
            .
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle className="w-16 h-16 text-success mb-6" />
            <h3 className="font-bold text-2xl mb-3">
              {devToken ? "Click to sign in" : "Check your email!"}
            </h3>
            <p className="text-muted-foreground text-base mb-2">
              {devToken
                ? "Dev mode - click the button below to complete sign in"
                : <>We sent a sign-in link to <strong>{email}</strong></>
              }
            </p>
            {!devToken && (
              <>
                <p className="text-muted-foreground text-base mb-6">
                  A magic link is a secure, one-time login link — no password needed. Just click the link in your email to sign in.
                </p>
                <div className="w-full bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-800 rounded-lg px-4 py-3 text-base font-medium text-yellow-800 dark:text-yellow-300">
                  You can close this tab.
                </div>
              </>
            )}
            {devToken && (
              <Button
                asChild
                className="bg-primary-gradient hover:opacity-90 mt-4"
              >
                <a href={`/api/auth/verify?token=${devToken}`}>
                  Sign In Now
                </a>
              </Button>
            )}
          </div>
        ) : (
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
                disabled={status === "loading"}
              />
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={status === "loading"}>
              {status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Magic Link"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
