import type { ReactNode } from 'react'
import ClientLayout from './client-layout'

export const metadata = {
  title: 'NarrateNow', 
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <link rel="icon" type="image/png" href="/logo1.png" />
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
