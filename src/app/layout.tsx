import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme-context'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Fixtral - AI Photoshop Assistant',
  description: 'Automate image edits from Reddit\'s r/PhotoshopRequest using Google Gemini AI. Transform your images with AI-powered editing tools.',
  keywords: ['AI image editing', 'Photoshop automation', 'Reddit PhotoshopRequest', 'Google Gemini AI', 'image transformation', 'AI art generation'],
  authors: [{ name: 'Fariz Anjum' }],
  creator: 'Fariz Anjum',
  publisher: 'Fixtral',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Basic meta tags
  metadataBase: new URL('https://fixtral.com'), // Replace with your actual domain
  alternates: {
    canonical: '/',
  },

  // Open Graph / Facebook
  openGraph: {
    type: 'website',
    url: '/',
    title: 'Fixtral - AI Photoshop Assistant',
    description: 'Transform your images with AI-powered editing. Automate edits from Reddit\'s r/PhotoshopRequest using Google Gemini AI.',
    siteName: 'Fixtral',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Fixtral - AI Photoshop Assistant',
      },
    ],
    locale: 'en_US',
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Fixtral - AI Photoshop Assistant',
    description: 'Transform your images with AI-powered editing. Automate edits from Reddit\'s r/PhotoshopRequest using Google Gemini AI.',
    images: ['/og-image.jpg'],
    creator: '@anjumfariz',
  },

  // Favicons and icons
  icons: {
    icon: '/favicon.ico',
  },

  // Additional meta tags
  other: {
    'theme-color': '#000000',
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification (add your actual verification codes)
  verification: {
    google: 'your-google-site-verification-code',
    yandex: 'your-yandex-verification-code',
    // Note: Bing verification is handled through other means
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} dark antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
