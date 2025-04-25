"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material"
import { PhotoCamera, ArrowBack, ArrowForward, Save } from "@mui/icons-material"
import StoryEditor from "@/components/story-editor"
import type { Story, Scene } from "@/types/supabase"
import { use } from "react"

const steps = ["Story Details", "Edit Scenes", "Review & Save"]

interface EditStoryPageProps {
    params: Promise<{ id: string }>
  }
  
export default function EditStoryPage({ params }: EditStoryPageProps) {
  // Unwrap the params object using React.use()
  const { id: storyId } = use(params)

  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [originalStory, setOriginalStory] = useState<Story | null>(null)
  const [story, setStory] = useState<{
    title: string
    description: string
    cover_image: string
    scenes: Scene[]
  }>({
    title: "",
    description: "",
    cover_image: "",
    scenes: [],
  })

  useEffect(() => {
    if (!user) {
      router.push("/signin?redirect=/edit-story/" + storyId)
      return
    }

    async function fetchStory() {
      try {
        setLoading(true)
        console.log("Fetching story with ID:", storyId)

        const { data, error } = await supabase.from("stories").select("*").eq("id", storyId).single()

        if (error) {
          console.error("Error fetching story:", error)
          throw error
        }

        if (!data) {
          throw new Error("Story not found")
        }

        // Check if the user is the author
        if (data.author_id !== user?.id) {
          setError("You don't have permission to edit this story")
          router.push("/my-stories")
          return
        }

        console.log("Story loaded:", data)
        setOriginalStory(data)
        setStory({
          title: data.title,
          description: data.description || "",
          cover_image: data.cover_image || "",
          scenes: data.scenes || [],
        })

        if (data.cover_image) {
          setCoverImageUrl(data.cover_image)
        }
      } catch (error: any) {
        console.error("Error in fetchStory:", error)
        setError(error.message || "Failed to load story")
      } finally {
        setLoading(false)
      }
    }

    fetchStory()
  }, [storyId, supabase, user, router])

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleCoverImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB")
        return
      }
      setCoverImage(file)
      setCoverImageUrl(URL.createObjectURL(file))
      setStory({
        ...story,
        cover_image: URL.createObjectURL(file),
      })
    }
  }

  const uploadCoverImage = async () => {
    if (!coverImage) return null

    try {
      console.log("Uploading image to server...")

      // Create a FormData instance
      const formData = new FormData()
      formData.append("image", coverImage)

      // Use our server-side route instead of directly calling Imgur
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Upload error:", errorData)
        throw new Error("Failed to upload image. Server returned an error.")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error("Failed to upload image to Imgur")
      }

      console.log("Image uploaded successfully:", data.data.link)
      return data.data.link
    } catch (error: any) {
      console.error("Error uploading image:", error)
      setError("Failed to upload cover image. Please try again.")
      return null
    }
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")
    setSaving(true)

    try {
      if (!user) {
        throw new Error("You must be logged in to update a story")
      }

      if (!originalStory) {
        throw new Error("Original story data not found")
      }

      let coverImageUrl = story.cover_image

      // Only upload a new image if the user has selected one
      if (coverImage) {
        const newCoverImageUrl = await uploadCoverImage()
        if (newCoverImageUrl) {
          coverImageUrl = newCoverImageUrl
        }
      }

      console.log("Updating story with ID:", storyId)

      const { error } = await supabase
        .from("stories")
        .update({
          title: story.title,
          description: story.description,
          cover_image: coverImageUrl,
          scenes: story.scenes,
          updated_at: new Date(),
        })
        .eq("id", storyId)

      if (error) {
        console.error("Error updating story:", error)
        throw error
      }

      setSuccess("Story updated successfully!")
      setTimeout(() => {
        router.push(`/story/${storyId}`)
      }, 2000)
    } catch (error: any) {
      console.error("Error saving story:", error)
      setError(error.message || "Failed to update story. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
            <Box component="form" noValidate sx={{ mt: 3 }}>
            <Box sx={{ mb: 3 }}>
              <TextField
                required
                fullWidth
                id="title"
                label="Story Title"
                name="title"
                value={story.title}
                onChange={(e) => setStory({ ...story, title: e.target.value })}
                disabled={saving}
              />
            </Box>
          
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                id="description"
                label="Description"
                name="description"
                multiline
                rows={3}
                value={story.description}
                onChange={(e) => setStory({ ...story, description: e.target.value })}
                disabled={saving}
                helperText="Briefly describe your story to attract readers"
              />
            </Box>
          
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Cover Image
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 2 }}>
                {coverImageUrl ? (
                  <Card sx={{ width: "100%", mb: 2 }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={coverImageUrl}
                      alt="Cover preview"
                      sx={{ objectFit: "cover" }}
                    />
                  </Card>
                ) : (
                  <Card
                    sx={{
                      width: "100%",
                      height: 200,
                      mb: 2,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      bgcolor: "grey.100",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No cover image selected
                    </Typography>
                  </Card>
                )}
                <Button component="label" variant="outlined" startIcon={<PhotoCamera />}>
                  {coverImageUrl ? "Change Cover Image" : "Upload Cover Image"}
                  <input type="file" hidden accept="image/*" onChange={handleCoverImageChange} />
                </Button>
              </Box>
            </Box>
          </Box>
          
        )
      case 1:
        return <StoryEditor scenes={story.scenes} onChange={(scenes) => setStory({ ...story, scenes })} />
      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Story
            </Typography>
            <Card sx={{ mb: 4 }}>
              <CardMedia
                component="img"
                height="200"
                image={coverImageUrl || "/placeholder.svg?height=200&width=400"}
                alt={story.title}
                sx={{ objectFit: "cover" }}
              />
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  {story.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {story.description}
                </Typography>
                <Typography variant="body2">{story.scenes.length} scenes created</Typography>
              </CardContent>
            </Card>
            <Alert severity="info" sx={{ mb: 3 }}>
              Review your changes before saving. Your story will be updated with these changes.
            </Alert>
          </Box>
        )
      default:
        return "Unknown step"
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!originalStory) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 8, mb: 8, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Story Not Found
          </Typography>
          <Button variant="contained" onClick={() => router.push("/my-stories")}>
            Back to My Stories
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container>
      <Box >
        <Typography variant="h6" component="h1" gutterBottom sx={{ fontWeight: 600, color: "primary.main", mt: 2 }}>
          Edit Your Story   
        </Typography>
        
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ pt: 2, mb: 5 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {getStepContent(activeStep)}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              color="secondary"
              disabled={activeStep === 0 || saving}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="secondary"
                  sx={{ color: "white" }}
                  onClick={handleSave}
                  disabled={saving || !story.title}
                  startIcon={<Save />}
                >
                  {saving ? <CircularProgress size={24} /> : "Save Changes"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  color="secondary"
                  sx={{ color: "white" }}
                  disabled={activeStep === 0 && !story.title}
                  endIcon={<ArrowForward />}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
      </Box>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess("")} message={success} />
    </Container>
  )
}
