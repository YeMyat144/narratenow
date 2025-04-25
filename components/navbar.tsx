"use client"

import { useState, useEffect, type MouseEvent } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSupabase } from "@/lib/supabase-provider"
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from "@mui/material"
import { Menu as MenuIcon, AccountCircle, Create, Logout, Login, PersonAdd, Home, Explore } from "@mui/icons-material"
import type { Profile } from "@/types/supabase"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Story", href: "/browse" },
    { label: "Create", href: "/create" },
  ];

  const { supabase, user } = useSupabase()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  useEffect(() => {
    async function getProfile() {
      if (user) {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        if (!error && data) setProfile(data)
      }
    }

    getProfile()
  }, [supabase, user])

  const handleMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => setAnchorEl(null)
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    handleClose()
    router.push("/")
  }

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/">
            
            <ListItemText primary="Home"/>
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/browse">
            
            <ListItemText primary="Story" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/create">
            
            <ListItemText primary="Create" />
          </ListItemButton>
        </ListItem>
        {!user ? (
          <>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/signin">
                
                <ListItemText primary="Sign In" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/signup">
                
                <ListItemText primary="Sign Up" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/profile">
                <ListItemIcon>
                  <AccountCircle />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleSignOut}>
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText primary="Sign Out" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  )

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1} sx={{ backgroundColor: "primary.main", color: "white" }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Link href="/" style={{ flexGrow: isMobile ? 0 : 1 }}>
            <img
              src="/logo1.png"
              alt="NarrateNow Logo"
              style={{
                height: 40,
                objectFit: 'contain',
                cursor: 'pointer',
                }}
            />
          </Link>

          {!isMobile && (
            <Box sx={{ display: "flex" }}>
            {navItems.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                sx={{
                  color: pathname === item.href ? "secondary.main" : "white",
                  fontWeight: pathname === item.href ? "bold" : "normal",
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          )}

          <Box sx={{ flexGrow: isMobile ? 1 : 0 }} />

          {!user
            ? !isMobile && (
                <Box>
                  <Button color="inherit" component={Link} href="/signin" sx={{ color: "white" }}>
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    component={Link}
                    href="/signup"
                    sx={{
                      ml: 1,
                      color: "white",
                      "&:active": { color: "white" },
                      "&:focus": { color: "white" },
                    }}
                  >
                    Sign Up
                  </Button>
                </Box>
              )
            : !isMobile && (
                <Box>
                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                  >
                    {profile?.avatar_url ? (
                      <Avatar
                        src={profile.avatar_url}
                        alt={profile.username || user.email || ""}
                        sx={{ width: 32, height: 32 }}
                      />
                    ) : (
                      <AccountCircle />
                    )}
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem
                      onClick={() => {
                        handleClose()
                        router.push("/profile")
                      }}
                    >
                      Profile
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleClose()
                        router.push("/my-stories")
                      }}
                    >
                      My Stories
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                  </Menu>
                </Box>
              )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 140 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  )
}
