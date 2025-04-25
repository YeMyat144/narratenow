import type { ReactNode } from 'react'
import ClientLayout from './client-layout'

export const metadata = {
  title: 'NarrateNow', 
  generator: 'v0.dev',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
