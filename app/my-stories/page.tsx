"use client"

import { useState, useEffect, type MouseEvent } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material"
import { Add, Delete, Edit, MoreVert, Visibility, Favorite, Close } from "@mui/icons-material"
import type { Story } from "@/types/supabase"

export default function MyStoriesPage() {
  const router = useRouter()
  const { supabase, user, loading: userLoading } = useSupabase()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null)
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null)
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)

  useEffect(() => {
    if (userLoading) return

    if (!user) {
      router.push("/signin?redirect=/my-stories")
      return
    }

    async function fetchMyStories() {
      try {
        const { data, error } = await supabase
          .from("stories")
          .select("*, story_likes(count)")
          .eq("author_id", user?.id || "")
          .order("created_at", { ascending: false })

        if (error) throw error
        setStories(data || [])
      } catch (error) {
        console.error("Error fetching stories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMyStories()
  }, [supabase, user, router, userLoading])

  const handleMenuOpen = (event: MouseEvent<HTMLElement>, storyId: string) => {
    setMenuAnchorEl(event.currentTarget)
    setSelectedStoryId(storyId)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleEditStory = () => {
    router.push(`/edit-story/${selectedStoryId}`)
    handleMenuClose()
  }

  const handleViewStory = () => {
    router.push(`/story/${selectedStoryId}`)
    handleMenuClose()
  }

  const handleDeleteClick = () => {
    setStoryToDelete(selectedStoryId)
    setDeleteDialogOpen(true)
    handleMenuClose()
  }

  const handleDeleteConfirm = async () => {
    try {
      const { error } = await supabase.from("stories").delete().eq("id", storyToDelete)

      if (error) throw error

      setStories(stories.filter((story) => story.id !== storyToDelete))
    } catch (error) {
      console.error("Error deleting story:", error)
    } finally {
      setDeleteDialogOpen(false)
      setStoryToDelete(null)
    }
  }

  if (userLoading || (loading && user)) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return null // Redirect handled in useEffect
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Stories
        </Typography>
        <Button variant="contained" color="secondary" sx={{color: "info.main"}} startIcon={<Add />} onClick={() => router.push("/create")}>
          Create New Story
        </Button>
      </Box>

      {stories.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            You haven't created any stories yet
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Add />}
            onClick={() => router.push("/create")}
            sx={{ mt: 2, color: "white" }}
          >
            Create Your First Story
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            "& > *": {
              flex: "1 1 300px",
              maxWidth: "280px",
            },
          }}
        >
          {stories.map((story) => (
            <Card
              key={story.id}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardActionArea onClick={() => router.push(`/story/${story.id}`)}>
                <CardMedia
                  component="img"
                  height="160"
                  image={story.cover_image || "/placeholder.svg?height=160&width=320"}
                  alt={story.title}
                />
              </CardActionArea>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {story.title}
                  </Typography>
                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, story.id)} aria-label="story options">
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    mb: 2,
                  }}
                >
                  {story.description || "No description provided."}
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Chip
                    icon={<Visibility fontSize="small" />}
                    label={story.view_count || 0}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Favorite fontSize="small" />}
                    label={story.story_likes?.length || 0}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Story Options Menu */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleViewStory}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Story
        </MenuItem>
        <MenuItem onClick={handleEditStory}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Story
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: "error.main" }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete Story
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          Confirm Deletion
          <IconButton
            aria-label="close"
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this story? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}