"use client"

import { useRouter } from "next/navigation"
import { Box, Button, Container, Typography, Paper } from "@mui/material"
import { Create, Explore } from "@mui/icons-material"

export default function HeroSection() {
  const router = useRouter()

  return (
    <Paper
      sx={{
        position: "relative",
        backgroundColor: "error.main",
        color: "white",
        borderRadius: 0,
      }}
    >
        <Box sx={{ maxWidth: "md", mx: "auto", textAlign: "center", borderRadius: 0, p: 4 }}>
          <Typography component="h1" variant="h2" color="inherit" gutterBottom sx={{ fontWeight: 700 }}>
            Your Story, Your Choices
          </Typography>
          <Typography variant="h5" color="inherit" paragraph sx={{ mb: 4, opacity: 0.9 }}>
            Create and experience interactive stories where every decision shapes the narrative. Craft your own
            adventures or explore worlds created by others.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="large"
              color="secondary"
              startIcon={<Create />}
              onClick={() => router.push("/create")}
              sx={{ color: "primary.main", fontWeight: 600 }}
            >
              Create a Story
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Explore />}
              onClick={() => router.push("/browse")}
              sx={{ color: "white", borderColor: "white" }}
            >
              Browse Stories
            </Button>
          </Box>
        </Box>
    </Paper>
  )
}
