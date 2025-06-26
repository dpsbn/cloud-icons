import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

// Define the base URL for the application
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cloudicons.example.com'

export const metadata: Metadata = {
  // Basic metadata
  title: "Cloud Icons - Azure, AWS, GCP Icons",
  description: "Download, copy and paste Cloud icons in SVG and PNG format for your projects. Free, high-quality icons for cloud architecture diagrams.",

  // Keywords for search engines
  keywords: ["cloud icons", "azure icons", "aws icons", "gcp icons", "cloud architecture", "svg icons", "png icons", "cloud diagrams", "cloud services"],

  // Canonical URL
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },

  // Open Graph metadata for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Cloud Icons',
    title: 'Cloud Icons - Azure, AWS, GCP Icons for Your Projects',
    description: 'Free, high-quality cloud provider icons for your architecture diagrams and projects. Download in SVG and PNG formats.',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Cloud Icons Preview',
      },
    ],
  },

  // Twitter card metadata
  twitter: {
    card: 'summary_large_image',
    title: 'Cloud Icons - Azure, AWS, GCP Icons',
    description: 'Free, high-quality cloud provider icons for your architecture diagrams and projects.',
    images: [`${baseUrl}/twitter-image.png`],
    creator: '@cloudicons',
  },

  // Additional metadata
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification for search engines
  verification: {
    google: 'google-site-verification-code', // Replace with actual verification code
    yandex: 'yandex-verification-code', // Replace with actual verification code
  },

  // Application information
  applicationName: 'Cloud Icons',
  authors: [{ name: 'Cloud Icons Team', url: baseUrl }],
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  creator: 'Cloud Icons Team',
  publisher: 'Cloud Icons',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800'>
          {children}
        </div>
      </body>
    </html>
  )
}
