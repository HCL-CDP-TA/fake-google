"use client"

import dynamic from "next/dynamic"

// Dynamically import GoogleAnalytics with no SSR to avoid useSearchParams issues
const GoogleAnalytics = dynamic(() => import("./GoogleAnalytics"), {
  ssr: false,
})

interface GoogleAnalyticsClientWrapperProps {
  gaId: string
}

export default function GoogleAnalyticsClientWrapper({ gaId }: GoogleAnalyticsClientWrapperProps) {
  console.log("GoogleAnalyticsClientWrapper rendering with gaId:", gaId)
  return <GoogleAnalytics gaId={gaId} />
}
