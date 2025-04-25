"use client"

import type React from "react"

import { useState, useEffect, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
} from "@mui/material"
import { PhotoCamera, Save } from "@mui/icons-material"
import type { Profile } from "@/types/supabase"

export default function ProfilePage() {
  const router = useRouter()
  const { supabase, user } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    id: "",
    username: "",
    bio: "",
    avatar_url: "",
    website: "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/signin")
      return
    }

    async function getProfile() {
      try {
        if (!user) {
          console.error("User is null")
          return
        }
        console.log("Fetching profile for user ID:", user.id)

        // First check if profile exists
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching profile:", error)

          // If profile doesn't exist, create one
          if (error.code === "PGRST116") {
            // No rows returned
            console.log("Profile not found, creating new profile")

            const username =
              user.user_metadata?.user_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "user_" + Math.random().toString(36).substring(2, 10)

            const newProfile = {
              id: user.id,
              username: username,
              email: user.email,
              avatar_url: user.user_metadata?.avatar_url || "",
            }

            const { error: insertError } = await supabase.from("profiles").insert([newProfile])

            if (insertError) {
              console.error("Error creating profile:", insertError)
              throw insertError
            }

            setProfile(newProfile as Profile)
          } else {
            throw error
          }
        } else if (data) {
          console.log("Profile found:", data)
          setProfile({
            id: data.id || "",
            username: data.username || "",
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
            website: data.website || "",
            email: data.email || user.email || "",
          })
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [supabase, user, router])

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB")
        return
      }
      setAvatarFile(file)
      setProfile({
        ...profile,
        avatar_url: URL.createObjectURL(file),
      })
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return null

    try {
      console.log("Uploading avatar to server...")

      // Create a FormData instance
      const formData = new FormData()
      formData.append("image", avatarFile)

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

      console.log("Avatar uploaded successfully:", data.data.link)
      return data.data.link
    } catch (error) {
      console.error("Error uploading image:", error)
      setError("Failed to upload image. Please try again.")
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    try {
      let avatarUrl = profile.avatar_url

      if (avatarFile) {
        const newAvatarUrl = await uploadAvatar()
        if (newAvatarUrl) {
          avatarUrl = newAvatarUrl
        }
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user?.id,
        username: profile.username,
        bio: profile.bio,
        avatar_url: avatarUrl,
        website: profile.website,
        updated_at: new Date(),
      })

      if (error) throw error

      setSuccess("Profile updated successfully!")
      setProfile({
        ...profile,
        avatar_url: avatarUrl,
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 8 }}>
       
        <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
  {/* Avatar Card */}
  <Box sx={{ flex: 1 }}>
    
        <Avatar
          src={profile.avatar_url}
          alt={profile.username || user?.email}
          sx={{ width: 120, height: 120, mb: 2 }}
        />
        <Typography variant="h6" gutterBottom>
          {profile.username || user?.email}
        </Typography>
        {profile.bio && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {profile.bio}
          </Typography>
        )}
      
        <Button component="label" variant="outlined" startIcon={<PhotoCamera />} >
          Upload
          <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
        </Button>
  </Box>

  {/* Profile Form */}
  <Box sx={{ flex: 2 }}>
    {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="Username"
          name="username"
          value={profile.username}
          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          disabled={saving}
        />

        <TextField
          margin="normal"
          fullWidth
          id="bio"
          label="Bio"
          name="bio"
          multiline
          rows={3}
          value={profile.bio || ""}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          disabled={saving}
          helperText="Tell us a bit about yourself"
        />

        <TextField
          margin="normal"
          fullWidth
          id="website"
          label="Website"
          name="website"
          value={profile.website || ""}
          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
          disabled={saving}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          startIcon={<Save />}
          sx={{ mt: 3 }}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : "Save Changes"}
        </Button>
      </form>
  </Box>
</Stack>

      </Box>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess("")} message={success} />
    </Container>
  )
}
