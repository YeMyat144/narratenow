"use client"

import { useState, useEffect } from "react"
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
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Chip,
  Avatar,
} from "@mui/material"
import { Search, Favorite } from "@mui/icons-material"
import type { Story } from "@/types/supabase"

export default function BrowsePage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const storiesPerPage = 9

  useEffect(() => {
    async function fetchStories() {
      try {
        let query = supabase.from("stories").select("*, profiles(username, avatar_url), story_likes(count)")

        if (sortBy === "newest") {
          query = query.order("created_at", { ascending: false })
        } else if (sortBy === "oldest") {
          query = query.order("created_at", { ascending: true })
        } else if (sortBy === "popular") {
          query = query.order("likes_count", { ascending: false })
        }

        const { data, error, count } = await query

        if (error) throw error

        const total = Math.ceil((count || data.length) / storiesPerPage)
        setTotalPages(total || 1)
        setStories(data || [])
      } catch (error) {
        console.error("Error fetching stories:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [supabase, sortBy])

  const filteredStories = stories.filter(
    (story) =>
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const paginatedStories = filteredStories.slice((page - 1) * storiesPerPage, page * storiesPerPage)

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    window.scrollTo(0, 0)
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4}}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 4, alignItems: "center" }}>
        <TextField
          placeholder="Search stories..."
          size="small"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setPage(1)
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, maxWidth: { xs: "100%", sm: "300px" } }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="oldest">Oldest</MenuItem>
            {/* <MenuItem value="popular">Popular</MenuItem> */}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              "& > *": {
                flex: "1 1 300px",
                maxWidth: "270px",
              },
            }}
          >
            {paginatedStories.map((story) => (
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
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Typography gutterBottom variant="h6" component="div" noWrap color="white">
                        {story.title}
                      </Typography>
                      {/* <Chip
                        icon={<Favorite fontSize="small" />}
                        label={story.story_likes?.length || 0}
                        size="small"
                        variant="outlined"
                      /> */}
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Avatar
                        src={story.profiles?.avatar_url}
                        alt={story.profiles?.username || "Author"}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      />
                      <Typography variant="body2" color="#cccccc" >
                        {story.profiles?.username || "Anonymous"}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="white"
                      sx={{
                        mt: 3,
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
          </Box>

          {filteredStories.length === 0 && (
            <Box sx={{ width: "100%", textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="white">
                No stories found. Try a different search term.
              </Typography>
            </Box>
          )}

          {filteredStories.length > storiesPerPage && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
              <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
            </Box>
          )}
        </>
      )}
    </Container>
  )
}