'use client'

import React from 'react'
import { Inter } from 'next/font/google'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { SupabaseProvider } from '@/lib/supabase-provider'
import Navbar from '@/components/navbar'
import Box from '@mui/material/Box'

const inter = Inter({ subsets: ['latin'] })

const theme = createTheme({
  palette: {
    primary: { main: '#2c2e48' },
    secondary: { main: '#28b67e' },
    error: { main: '#1d4c4f' },
    info: { main: '#fff' },
    warning: { main: '#ff6961' },
    background: { default: '#f5f5f7' },
  },
  typography: {
    fontFamily: inter.style.fontFamily,
  },
})

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SupabaseProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <Box component="main" sx={{ flexGrow: 1 }}>
            {children}
          </Box>
        </Box>
      </SupabaseProvider>
    </ThemeProvider>
  )
}
