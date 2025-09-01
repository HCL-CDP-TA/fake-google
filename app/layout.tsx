import type { Metadata } from "next"
import { Roboto } from "next/font/google"
import "./globals.css"
import GoogleAnalytics from "./components/GoogleAnalytics"

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Fake Google",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/google-favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/google-favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/google-favicon-32x32.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID || "G-XXXXXXXXXX"

  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased font-roboto`}>
        {gaTrackingId && gaTrackingId !== "G-XXXXXXXXXX" && <GoogleAnalytics gaId={gaTrackingId} />}
        {children}
      </body>
    </html>
  )
}
