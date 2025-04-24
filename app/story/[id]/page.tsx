"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Divider,
  CircularProgress,
  IconButton,
} from "@mui/material"
import { ArrowBack, Favorite, FavoriteBorder, Share } from "@mui/icons-material"
import type { Story, Scene, Profile } from "@/types/supabase"
import { use } from "react"

interface StoryPageProps {
  params: Promise<{ id: string }>
}

export default function StoryPage({ params }: StoryPageProps) {
  // Unwrap the params object using React.use()
  const { id: storyId } = use(params)

  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [story, setStory] = useState<Story | null>(null)
  const [author, setAuthor] = useState<Profile | null>(null)
  const [currentScene, setCurrentScene] = useState<Scene | null>(null)
  const [loading, setLoading] = useState(true)
  const [sceneHistory, setSceneHistory] = useState<Scene[]>([])
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    async function fetchStory() {
      try {
        const { data: storyData, error: storyError } = await supabase
          .from("stories")
          .select("*, profiles(*)")
          .eq("id", storyId)
          .single()

        if (storyError) throw storyError

        setStory(storyData)
        setAuthor(storyData.profiles)

        // Set initial scene
        const startScene: Scene | undefined = (storyData.scenes as Scene[]).find((scene: Scene) => scene.id === "start")
        if (startScene) {
          setCurrentScene(startScene)
        }

        // Check if user has liked this story
        if (user) {
          const { data: likeData } = await supabase
            .from("story_likes")
            .select("*")
            .eq("story_id", storyId)
            .eq("user_id", user.id)
            .single()

          setLiked(!!likeData)
        }

        // Get like count
        const { count } = await supabase.from("story_likes").select("*", { count: "exact" }).eq("story_id", storyId)

        setLikeCount(count || 0)
      } catch (error) {
        console.error("Error fetching story:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStory()
  }, [supabase, storyId, user])

  const handleChoiceClick = (choice: { targetSceneId: string }) => {
    if (!currentScene) return

    // Add current scene to history
    setSceneHistory([...sceneHistory, currentScene])

    // Find and set the target scene
    if (story) {
      const targetScene = story.scenes.find((scene) => scene.id === choice.targetSceneId)
      if (targetScene) {
        setCurrentScene(targetScene)
        window.scrollTo(0, 0)
      }
    }
  }

  const handleGoBack = () => {
    if (sceneHistory.length > 0) {
      // Pop the last scene from history
      const previousScene = sceneHistory[sceneHistory.length - 1]
      setCurrentScene(previousScene)
      setSceneHistory(sceneHistory.slice(0, -1))
      window.scrollTo(0, 0)
    }
  }

  const handleRestart = () => {
    if (story) {
      const startScene = story.scenes.find((scene) => scene.id === "start")
      if (startScene) {
        setCurrentScene(startScene)
        setSceneHistory([])
        window.scrollTo(0, 0)
      }
    }
  }

  const handleLike = async () => {
    if (!user) {
      router.push("/signin?redirect=/story/" + storyId)
      return
    }

    try {
      if (liked) {
        // Unlike
        await supabase.from("story_likes").delete().eq("story_id", storyId).eq("user_id", user.id)

        setLiked(false)
        setLikeCount(likeCount - 1)
      } else {
        // Like
        await supabase.from("story_likes").insert([{ story_id: storyId, user_id: user.id }])

        setLiked(true)
        setLikeCount(likeCount + 1)
      }
    } catch (error) {
      console.error("Error updating like:", error)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: story?.title || "Interactive Story",
        text: story?.description || "Check out this interactive story!",
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!story) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 8, mb: 8, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Story Not Found
          </Typography>
          <Button variant="contained" onClick={() => router.push("/")}>
            Back to Home
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 8 }}>
        {/* Story Header */}
        <Card sx={{ mb: 4 }}>
          <CardMedia
            component="img"
            height="240"
            image={story.cover_image || "/placeholder.svg?height=240&width=800"}
            alt={story.title}
          />
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h4" component="h1">
                {story.title}
              </Typography>
              <Box>
                <IconButton onClick={handleLike} color={liked ? "primary" : "default"}>
                  {liked ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
                <Typography variant="body2" component="span">
                  {likeCount}
                </Typography>
                <IconButton onClick={handleShare}>
                  <Share />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Avatar
                src={author?.avatar_url}
                alt={author?.username || "Author"}
                sx={{ mr: 1, width: 32, height: 32 }}
              />
              <Typography variant="body2">By {author?.username || "Anonymous"}</Typography>
            </Box>

            {story.description && (
              <Typography variant="body1" color="text.secondary" paragraph>
                {story.description}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              {sceneHistory.length > 0 && (
                <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleGoBack}>
                  Go Back
                </Button>
              )}

              {sceneHistory.length > 0 && (
                <Button variant="outlined" onClick={handleRestart}>
                  Restart Story
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Current Scene */}
        {currentScene && (
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="body1" paragraph sx={{ fontSize: "1.1rem", lineHeight: 1.6 }}>
              {currentScene.text}
            </Typography>

            {currentScene.choices && currentScene.choices.length > 0 ? (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  What will you do?
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                  {currentScene.choices.map((choice, index) => (
                    <Button
                      key={index}
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={() => handleChoiceClick(choice)}
                      sx={{ justifyContent: "flex-start", textTransform: "none", py: 1.5 }}
                    >
                      {choice.text}
                    </Button>
                  ))}
                </Box>
              </>
            ) : (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  The End
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={handleRestart}>
                    Start Over
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        )}
      </Box>
    </Container>
  )
}
