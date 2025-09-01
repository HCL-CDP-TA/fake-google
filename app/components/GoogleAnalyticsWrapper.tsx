"use client"

import { Suspense } from "react"
import GoogleAnalytics from "./GoogleAnalytics"

interface GoogleAnalyticsWrapperProps {
  gaId: string
}

export default function GoogleAnalyticsWrapper({ gaId }: GoogleAnalyticsWrapperProps) {
  return (
    <Suspense fallback={null}>
      <GoogleAnalytics gaId={gaId} />
    </Suspense>
  )
}
