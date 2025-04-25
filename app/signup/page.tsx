"use client"

import { useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase-provider"
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormHelperText,
} from "@mui/material"
import { Google, GitHub } from "@mui/icons-material"

export default function SignUp() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/"
  const { supabase } = useSupabase()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate inputs
    if (!username) {
      setError("Username is required")
      return
    }

    if (!email) {
      setError("Email is required")
      return
    }

    if (!password) {
      setError("Password is required")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions")
      return
    }

    setLoading(true)

    try {
      console.log("Signing up with:", { email, password, username })

      // Sign up with email and password
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (signUpError) throw signUpError

      console.log("Sign up response:", data)

      if (data?.user) {
        // Create a profile record
        console.log("Creating profile for user:", data.user.id)

        const { error: profileError } = await supabase.from("profiles").insert([
          {
            id: data.user.id,
            username,
            email,
          },
        ])

        if (profileError) {
          console.error("Error creating profile:", profileError)

          // If the profile creation failed because the user already exists,
          // we can try to update it instead
          if (profileError.code === "23505") {
            // Unique violation
            console.log("Profile already exists, updating instead")

            const { error: updateError } = await supabase
              .from("profiles")
              .update({ username, email })
              .eq("id", data.user.id)

            if (updateError) {
              console.error("Error updating profile:", updateError)
            }
          } else {
            // For other errors, we'll continue anyway as the auth was successful
            console.warn("Continuing despite profile creation error")
          }
        }

        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          // This means the user already exists
          setError("An account with this email already exists. Please sign in instead.")
          setLoading(false)
          return
        }

        if (data.user.confirmed_at) {
          // User is already confirmed, redirect to home
          router.push(redirectTo)
        } else {
          // User needs to confirm email
          router.push("/signup/confirmation")
        }
      }
    } catch (error: any) {
      console.error("Sign up error:", error)
      setError(error.message || "Failed to sign up. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignUp = async (provider: "google" | "github") => {
    setError("")

    if (!agreeToTerms) {
      setError("You must agree to the terms and conditions")
      return
    }

    setLoading(true)

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectTo}`,
        },
      })

      if (oauthError) throw oauthError

      // The redirect happens automatically, but we'll log for debugging
      console.log("OAuth sign up initiated:", data)
    } catch (error: any) {
      console.error("OAuth sign up error:", error)
      setError(error.message || "Failed to sign up with social provider.")
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2,  mt: 2,backgroundColor: "background.default"  }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography component="h1" variant="h4" gutterBottom>
              Create an Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join NarrateNow to create and share interactive stories
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleEmailSignUp}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              error={!!error && !username}
              helperText={!!error && !username ? "Username is required" : ""}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              error={!!error && !email}
              helperText={!!error && !email ? "Email is required" : ""}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              error={!!error && (!password || password.length < 6)}
              helperText={
                !!error && !password
                  ? "Password is required"
                  : !!error && password.length < 6
                    ? "Password must be at least 6 characters"
                    : "Password must be at least 6 characters"
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  color="primary"
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{" "}
                  <Link href="/terms" style={{ textDecoration: "none", color: "primary.main" }}>
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" style={{ textDecoration: "none", color: "primary.main" }}>
                    Privacy Policy
                  </Link>
                </Typography>
              }
            />
            {!!error && !agreeToTerms && (
              <FormHelperText error>You must agree to the terms and conditions</FormHelperText>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !agreeToTerms}
            >
              {loading ? <CircularProgress size={24} /> : "Sign Up"}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              onClick={() => handleOAuthSignUp("google")}
              disabled={loading || !agreeToTerms}
            >
              Continue with Google
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHub />}
              onClick={() => handleOAuthSignUp("github")}
              disabled={loading || !agreeToTerms}
            >
              Continue with GitHub
            </Button>
          </Box>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2">
              Already have an account?{" "}
              <Link href="/signin" style={{ textDecoration: "none", color: "primary.main" }}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
