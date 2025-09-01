"use client"

import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"

interface GoogleAnalyticsProps {
  gaId: string
}

// Declare gtag function
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: Record<string, unknown>[]
    gtagUtils?: typeof gtag
  }
}

// GA tracking functions
export const gtag = {
  // Page view tracking
  pageview: (url: string) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", process.env.NEXT_PUBLIC_GA_TRACKING_ID!, {
        page_path: url,
      })
    }
  },

  // Event tracking
  event: (action: string, parameters?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", action, parameters)
    }
  },

  // Search tracking
  search: (searchTerm: string, numResults: number) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "search", {
        search_term: searchTerm,
        content_category: "search_results",
        num_results: numResults,
      })
    }
  },

  // Ad click tracking
  adClick: (adTitle: string, adUrl: string, keyword: string, position: number) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ad_click", {
        event_category: "advertisement",
        event_label: adTitle,
        ad_url: adUrl,
        search_keyword: keyword,
        ad_position: position,
        value: 1,
      })
    }
  },

  // Organic result click tracking
  organicClick: (resultTitle: string, resultUrl: string, keyword: string, position: number) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "organic_click", {
        event_category: "organic_result",
        event_label: resultTitle,
        result_url: resultUrl,
        search_keyword: keyword,
        result_position: position,
        value: 1,
      })
    }
  },

  // Admin actions tracking
  adminAction: (action: string, details?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "admin_action", {
        event_category: "admin",
        event_label: action,
        ...details,
      })
    }
  },

  // Campaign management tracking
  campaignAction: (action: string, keyword: string, adTitle?: string) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "campaign_management", {
        event_category: "campaign",
        event_label: action,
        keyword: keyword,
        ad_title: adTitle,
      })
    }
  },

  // AI generation tracking
  aiGeneration: (keyword: string, numAds: number, success: boolean) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "ai_ad_generation", {
        event_category: "ai_features",
        event_label: success ? "success" : "failure",
        keyword: keyword,
        num_ads_generated: numAds,
        value: success ? 1 : 0,
      })
    }
  },

  // Test function
  test: () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "nextjs_test", {
        event_category: "testing",
        event_label: "nextjs_script_component",
        test_timestamp: Date.now(),
        hostname: window.location.hostname,
        value: 1,
      })
      console.log("✅ Next.js GA4 test event sent - check your dashboard!")
    } else {
      console.error("❌ gtag not available")
    }
  },
}

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
      gtag.pageview(url)
    }
  }, [pathname, searchParams])

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        onLoad={() => {
          console.log("Next.js GA4: Script loaded successfully")

          // Initialize gtag
          window.gtag = function gtag(...args: unknown[]) {
            window.dataLayer = window.dataLayer || []
            window.dataLayer.push(args as unknown as Record<string, unknown>)
          }

          // Configure GA4 with proper localhost handling
          const isLocalhost = window.location.hostname === "localhost"
          const config = {
            debug_mode: isLocalhost,
            send_page_view: false, // We handle page views manually
            ...(isLocalhost && {
              // For localhost, don't try to set cookies for a different domain
              storage: "none", // Disable storage to avoid cookie conflicts
              client_storage: "none", // Disable client storage
              page_location: `https://fake-google.demo.now.hclsoftware.cloud${window.location.pathname}${window.location.search}`,
              // Don't set cookie_domain for localhost - let it default
            }),
          }

          window.gtag("js", new Date())
          window.gtag("config", gaId, config)

          console.log("Next.js GA4: Configured with domain override for localhost:", isLocalhost)

          // Make gtag available globally for testing
          window.gtagUtils = gtag

          // Send initial test event
          setTimeout(() => {
            window.gtag!("event", "nextjs_initialized", {
              event_category: "initialization",
              event_label: "nextjs_script_component",
              localhost_override: isLocalhost,
            })
            console.log("Next.js GA4: Initialization event sent")
          }, 1000)
        }}
        onError={() => {
          console.error("Next.js GA4: Failed to load script")
        }}
      />
    </>
  )
}
