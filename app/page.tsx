"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material"
import HeroSection from "@/components/hero-section"
import type { Story } from "@/types/supabase"

export default function HomePage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchStories() {
      try {
        const { data, error } = await supabase
          .from("stories")
          .select("*, profiles(username, avatar_url)")
          .order("created_at", { ascending: false })

        if (error) throw error
        setStories(data || [])
      } catch (error) {
        console.error("Error fetching stories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [supabase])

  const filteredStories = stories.filter((story) => story.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <>
      <HeroSection />
      <Container sx={{ mt: 4, mb: 4 }}>
        

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              justifyContent: "center",
              "& > *": {
                flex: "1 1 300px",
                maxWidth: "100%",
              },
            }}
          >
            {filteredStories.map((story) => (
              <Card
                key={story.id}
                sx={{
                  backgroundColor: "error.main",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                  },
                  maxWidth: "270px",
                }}
              >
                <CardActionArea onClick={() => router.push(`/story/${story.id}`)}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={story.cover_image || "/placeholder.svg?height=160&width=320"}
                    alt={story.title}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div" noWrap color="white">
                      {story.title}
                    </Typography>
                    <Typography variant="body2" color="#cccccc" sx={{ mb: 3 }}>
                      By {story.profiles?.username || "Anonymous"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="white"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {story.description || "No description provided."}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}

            {filteredStories.length === 0 && (
              <Box sx={{ width: "100%", textAlign: "center", py: 8 }}>
                <Typography variant="h6" color="white">
                  No stories found. Be the first to create one!
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </>
  )
}