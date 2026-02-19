"use client"

import { FormEvent, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabaseBrowser } from "@/lib/client"

export default function AdminLoginModal() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    setAuthError("")
    try {
      if (!email || !password) {
        const message = "Email and password are required."
        setAuthError(message)
        toast({ title: "Login failed", description: message })
        setIsSubmitting(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw new Error("Login failed. Please check your credentials.")
      }

      toast({ title: "Signed in", description: "Admin access granted." })
      // Layout will handle hiding the modal via auth state listener
    } catch (error) {
      const fallbackMessage = "Login failed. Please check your credentials."
      const message =
        error instanceof Error && error.message
          ? error.message
          : fallbackMessage
      setAuthError(message)
      toast({ title: "Login failed", description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-4/5 md:max-w-lg rounded-md"
        hideCloseButton
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogDescription>
            Enter your admin email and password.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="text"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (authError) setAuthError("")
              }}
              placeholder="admin@example.com"
              aria-invalid={authError ? "true" : "false"}
              aria-describedby={authError ? "admin-auth-error" : undefined}
            />
            {authError ? (
              <p
                id="admin-auth-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {authError}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (authError) setAuthError("")
              }}
              placeholder="••••••••"
            />
          </div>
          <DialogFooter>
            <Button disabled={isSubmitting} type="submit" variant="highlight">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
