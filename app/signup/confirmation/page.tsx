"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Container, Box, Typography, Paper, Button, Alert } from "@mui/material"
import { Email, Home } from "@mui/icons-material"

export default function SignUpConfirmation() {
  const router = useRouter()

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
          <Email sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />

          <Typography component="h1" variant="h4" gutterBottom>
            Check Your Email
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            We've sent a confirmation link to your email address. Please check your inbox and click the link to activate
            your account.
          </Typography>

          <Alert severity="info" sx={{ mb: 4, textAlign: "left" }}>
            If you don't see the email, please check your spam folder. The email should arrive within a few minutes.
          </Alert>

          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Home />}
              onClick={() => router.push("/")}
              sx={{ mr: 2 }}
            >
              Go to Home
            </Button>

            <Button variant="outlined" component={Link} href="/signin">
              Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
