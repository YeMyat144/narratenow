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
  Stack,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardMedia,
} from "@mui/material"
import { PhotoCamera, ArrowBack, ArrowForward, Publish } from "@mui/icons-material"
import StoryEditor from "@/components/story-editor"
import type { Scene, Profile } from "@/types/supabase"

const steps = ["Story Details", "Create Scenes", "Review & Publish"]

export default function CreateStory() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [story, setStory] = useState({
    title: "",
    description: "",
    cover_image: "",
    scenes: [
      {
        id: "start",
        text: "Your story begins here...",
        choices: [],
      },
    ] as Scene[],
  })

  useEffect(() => {
    if (!user) {
      router.push("/signin?redirect=/create")
      return
    }

    // Check if profile exists
    async function checkProfile() {
      try {
        if (user) {
          console.log("Checking profile for user:", user.id)
        }

        const { data, error } = user
          ? await supabase.from("profiles").select("*").eq("id", user.id).single()
          : { data: null, error: { message: "User is null" } }

        if (error) {
          console.error("Error fetching profile:", error)

          if (error.code === "PGRST116") {
            // No rows returned
            console.log("Profile not found, creating new profile")

            const username =
              user?.user_metadata?.user_name ||
              user?.user_metadata?.name ||
              user?.email?.split("@")[0] ||
              "user?_" + Math.random().toString(36).substring(2, 10)

            const newProfile = {
              id: user?.id,
              username: username,
              email: user?.email,
              avatar_url: user?.user_metadata?.avatar_url || "",
            }

            const { error: insertError, data: insertData } = await supabase
              .from("profiles")
              .insert([newProfile])
              .select()

            if (insertError) {
              console.error("Error creating profile:", insertError)
              setError("Failed to create user profile. Please try again or contact support.")
            } else {
              console.log("Profile created:", insertData)
              setProfile((insertData?.[0] as Profile) || null)
            }
          } else {
            setError("Failed to load user profile. Please try again or contact support.")
          }
        } else {
          console.log("Profile found:", data)
          setProfile(data as Profile)
        }
      } catch (err) {
        console.error("Error in profile check:", err)
        setError("An unexpected error occurred. Please try again.")
      } finally {
        setProfileLoading(false)
      }
    }

    checkProfile()
  }, [user, router, supabase])

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

  const handlePublish = async () => {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      if (!user) {
        throw new Error("You must be logged in to publish a story")
      }

      if (!profile) {
        throw new Error("Your profile is not set up. Please try again or contact support.")
      }

      let coverImageUrl = story.cover_image

      if (coverImage) {
        const newCoverImageUrl = await uploadCoverImage()
        if (newCoverImageUrl) {
          coverImageUrl = newCoverImageUrl
        }
      }

      console.log("Publishing story with author_id:", user.id)

      const { data, error } = await supabase
        .from("stories")
        .insert([
          {
            title: story.title,
            description: story.description,
            cover_image: coverImageUrl,
            scenes: story.scenes,
            author_id: user.id,
          },
        ])
        .select()

      if (error) {
        console.error("Error details:", error)
        throw error
      }

      setSuccess("Story published successfully!")
      setTimeout(() => {
        if (data && data[0]) {
          router.push(`/story/${data[0].id}`)
        } else {
          router.push("/my-stories")
        }
      }, 2000)
    } catch (error: any) {
      console.error("Error publishing story:", error)
      setError(error.message || "Failed to publish story. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" noValidate >
  <Stack spacing={3}>
    {/* Title */}
    <Box>
      <TextField
        required
        fullWidth
        id="title"
        label="Story Title"
        name="title"
        value={story.title}
        onChange={(e) => setStory({ ...story, title: e.target.value })}
        disabled={loading}
      />
    </Box>

    {/* Description */}
    <Box>
      <TextField
        fullWidth
        id="description"
        label="Description"
        name="description"
        multiline
        rows={3}
        value={story.description}
        onChange={(e) => setStory({ ...story, description: e.target.value })}
        disabled={loading}
        helperText="Briefly describe your story to attract readers"
      />
    </Box>

    {/* Cover Image Upload */}
    <Box>
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
  </Stack>
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
              Once published, your story will be visible to all users. You can edit it later from your profile.
            </Alert>
          </Box>
        )
      default:
        return "Unknown step"
    }
  }

  if (!user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (profileLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading your profile...
        </Typography>
      </Box>
    )
  }

  return (
    <Container >
      
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ pt: 3, mb: 5 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {getStepContent(activeStep)}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              color="secondary"
              disabled={activeStep === 0 || loading}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePublish}
                  disabled={loading || !story.title}
                  startIcon={<Publish />}
                >
                  {loading ? <CircularProgress size={24} /> : "Publish Story"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  color="secondary"
                  sx={{ color: "info.main" }}
                  disabled={activeStep === 0 && !story.title}
                  endIcon={<ArrowForward />}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess("")} message={success} />
    </Container>
  )
}
