"use client"

import { useState } from "react"
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material"
import { Add, Delete, Edit, Link as LinkIcon, ArrowForward, Close } from "@mui/icons-material"
import type { Scene, Choice } from "@/types/supabase"

interface StoryEditorProps {
  scenes: Scene[]
  onChange: (scenes: Scene[]) => void
}

export default function StoryEditor({ scenes, onChange }: StoryEditorProps) {
  const [selectedSceneId, setSelectedSceneId] = useState<string>("start")
  const [choiceDialogOpen, setChoiceDialogOpen] = useState<boolean>(false)
  const [newChoice, setNewChoice] = useState<Choice>({ text: "", targetSceneId: "" })
  const [editingChoice, setEditingChoice] = useState<number | null>(null)
  const [newSceneDialogOpen, setNewSceneDialogOpen] = useState<boolean>(false)
  const [newScene, setNewScene] = useState<{ id: string; text: string }>({ id: "", text: "" })

  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) || scenes[0]

  const handleSceneTextChange = (text: string) => {
    const updatedScenes = scenes.map((scene) => (scene.id === selectedSceneId ? { ...scene, text } : scene))
    onChange(updatedScenes)
  }

  const handleAddChoice = () => {
    setNewChoice({ text: "", targetSceneId: "" })
    setEditingChoice(null)
    setChoiceDialogOpen(true)
  }

  const handleEditChoice = (index: number) => {
    const choice = selectedScene.choices[index]
    setNewChoice({ ...choice })
    setEditingChoice(index)
    setChoiceDialogOpen(true)
  }

  const handleDeleteChoice = (index: number) => {
    const updatedChoices = [...selectedScene.choices]
    updatedChoices.splice(index, 1)

    const updatedScenes = scenes.map((scene) =>
      scene.id === selectedSceneId ? { ...scene, choices: updatedChoices } : scene,
    )

    onChange(updatedScenes)
  }

  const handleSaveChoice = () => {
    if (!newChoice.text || !newChoice.targetSceneId) return

    let updatedScenes

    if (editingChoice !== null) {
      // Edit existing choice
      const updatedChoices = [...selectedScene.choices]
      updatedChoices[editingChoice] = newChoice

      updatedScenes = scenes.map((scene) =>
        scene.id === selectedSceneId ? { ...scene, choices: updatedChoices } : scene,
      )
    } else {
      // Add new choice
      updatedScenes = scenes.map((scene) =>
        scene.id === selectedSceneId ? { ...scene, choices: [...scene.choices, newChoice] } : scene,
      )
    }

    onChange(updatedScenes)
    setChoiceDialogOpen(false)
  }

  const handleAddScene = () => {
    setNewScene({ id: "", text: "" })
    setNewSceneDialogOpen(true)
  }

  const handleSaveNewScene = () => {
    if (!newScene.id || !newScene.text) return

    // Check if ID already exists
    if (scenes.some((scene) => scene.id === newScene.id)) {
      alert("A scene with this ID already exists. Please choose a different ID.")
      return
    }

    const updatedScenes = [...scenes, { ...newScene, choices: [] }]
    onChange(updatedScenes)
    setNewSceneDialogOpen(false)
    setSelectedSceneId(newScene.id)
  }

  const getTargetSceneTitle = (targetId: string) => {
    const scene = scenes.find((s) => s.id === targetId)
    if (!scene) return "Unknown scene"
    return scene.text.substring(0, 30) + (scene.text.length > 30 ? "..." : "")
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
  {/* Left Panel - Scenes List */}
  <Box sx={{ flex: { xs: "none", md: 4 }, width: { xs: "100%", md: "33%" } }}>
    <Paper sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Scenes
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
        {scenes.map((scene) => (
          <Button
            key={scene.id}
            variant={selectedSceneId === scene.id ? "contained" : "outlined"}
            onClick={() => setSelectedSceneId(scene.id)}
            sx={{ justifyContent: "flex-start", textTransform: "none" }}
          >
            {scene.id === "start" ? "Start Scene" : scene.id}
          </Button>
        ))}
        <Button
          variant="outlined"
          color="primary"
          startIcon={<Add />}
          onClick={handleAddScene}
          sx={{ mt: 2 }}
        >
          Add New Scene
        </Button>
      </Box>
    </Paper>
  </Box>

  {/* Right Panel - Scene Details */}
  <Box sx={{ flex: { xs: "none", md: 8 }, width: { xs: "100%", md: "67%" } }}>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {selectedSceneId === "start" ? "Start Scene" : `Scene: ${selectedSceneId}`}
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={6}
        label="Scene Text"
        value={selectedScene.text}
        onChange={(e) => handleSceneTextChange(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Typography variant="subtitle1" gutterBottom>
        Choices
      </Typography>

      {selectedScene.choices.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          This is an ending scene (no choices). Add choices to continue the story.
        </Alert>
      ) : (
        <Box sx={{ mb: 3 }}>
          {selectedScene.choices.map((choice, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent sx={{ pb: 1 }}>
                <Typography variant="body1">{choice.text}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <LinkIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Leads to: {getTargetSceneTitle(choice.targetSceneId)}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <IconButton size="small" onClick={() => handleEditChoice(index)}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDeleteChoice(index)}>
                  <Delete fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Button variant="outlined" startIcon={<Add />} onClick={handleAddChoice}>
        Add Choice
      </Button>
    </Paper>
  </Box>
</Box>


      {/* Choice Dialog */}
      <Dialog open={choiceDialogOpen} onClose={() => setChoiceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingChoice !== null ? "Edit Choice" : "Add New Choice"}
          <IconButton
            aria-label="close"
            onClick={() => setChoiceDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Choice Text"
            fullWidth
            value={newChoice.text}
            onChange={(e) => setNewChoice({ ...newChoice, text: e.target.value })}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            This choice leads to:
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
            {scenes.map(
              (scene) =>
                scene.id !== selectedSceneId && (
                  <Button
                    key={scene.id}
                    variant={newChoice.targetSceneId === scene.id ? "contained" : "outlined"}
                    onClick={() => setNewChoice({ ...newChoice, targetSceneId: scene.id })}
                    sx={{ justifyContent: "flex-start", textTransform: "none" }}
                    endIcon={newChoice.targetSceneId === scene.id ? <ArrowForward /> : null}
                  >
                    {scene.id === "start" ? "Start Scene" : scene.id}
                  </Button>
                ),
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChoiceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveChoice} variant="contained" disabled={!newChoice.text || !newChoice.targetSceneId}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Scene Dialog */}
      <Dialog open={newSceneDialogOpen} onClose={() => setNewSceneDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add New Scene
          <IconButton
            aria-label="close"
            onClick={() => setNewSceneDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Scene ID"
            fullWidth
            value={newScene.id}
            onChange={(e) => setNewScene({ ...newScene, id: e.target.value })}
            helperText="A unique identifier for this scene (e.g., 'forest', 'cave', 'ending1')"
            sx={{ mb: 3 }}
          />

          <TextField
            margin="dense"
            label="Scene Text"
            fullWidth
            multiline
            rows={4}
            value={newScene.text}
            onChange={(e) => setNewScene({ ...newScene, text: e.target.value })}
            helperText="The narrative text that will be shown to the reader"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSceneDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNewScene} variant="contained" disabled={!newScene.id || !newScene.text}>
            Create Scene
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
