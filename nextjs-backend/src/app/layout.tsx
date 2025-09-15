import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Icon Manager API',
  description: 'Next.js backend for icon management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}