"use client"

import { useEffect } from "react"
import { install, gtag } from "gtag"

interface GoogleAnalyticsProps {
  trackingId: string
}

export default function GoogleAnalyticsOfficial({ trackingId }: GoogleAnalyticsProps) {
  useEffect(() => {
    console.log("Official GA4: Installing with tracking ID:", trackingId)

    // Install Google Analytics using the official library
    install(trackingId, {
      debug_mode: window.location.hostname === "localhost",
      page_location:
        window.location.hostname === "localhost"
          ? `https://fake-google.demo.now.hclsoftware.cloud${window.location.pathname}${window.location.search}`
          : window.location.href,
      cookie_domain: window.location.hostname === "localhost" ? "fake-google.demo.now.hclsoftware.cloud" : "auto",
    })
      .then(() => {
        console.log("Official GA4: Installation complete")

        // Send initial page view
        gtag("event", "page_view", {
          page_title: document.title,
          page_location:
            window.location.hostname === "localhost"
              ? `https://fake-google.demo.now.hclsoftware.cloud${window.location.pathname}${window.location.search}`
              : window.location.href,
          custom_parameter: "official_library_test",
        })

        console.log("Official GA4: Initial page view sent")

        // Make gtag available globally for testing
        if (typeof window !== "undefined") {
          ;(window as any).gtagOfficial = gtag
          console.log("Official GA4: gtag available as window.gtagOfficial")
        }

        // Send test event after a delay
        setTimeout(() => {
          gtag("event", "official_test", {
            event_category: "testing",
            event_label: "official_library",
            value: 1,
          })
          console.log("Official GA4: Test event sent via official library")
        }, 1000)
      })
      .catch(error => {
        console.error("Official GA4: Installation failed:", error)
      })
  }, [trackingId])

  return null
}

// Export utility functions using the official library
export const gtagUtils = {
  search: (searchTerm: string, numResults: number) => {
    gtag("event", "search", {
      search_term: searchTerm,
      content_category: "search_results",
      num_results: numResults,
    })
  },

  adClick: (adTitle: string, adUrl: string, keyword: string, position: number) => {
    gtag("event", "ad_click", {
      event_category: "advertisement",
      event_label: adTitle,
      ad_url: adUrl,
      search_keyword: keyword,
      ad_position: position,
      value: 1,
    })
  },

  organicClick: (resultTitle: string, resultUrl: string, keyword: string, position: number) => {
    gtag("event", "organic_click", {
      event_category: "organic_result",
      event_label: resultTitle,
      result_url: resultUrl,
      search_keyword: keyword,
      result_position: position,
      value: 1,
    })
  },

  adminAction: (action: string, details?: Record<string, unknown>) => {
    gtag("event", "admin_action", {
      event_category: "admin",
      event_label: action,
      ...details,
    })
  },

  test: () => {
    gtag("event", "manual_test", {
      event_category: "testing",
      event_label: "official_library_manual_test",
      test_timestamp: Date.now(),
      value: 1,
    })
    console.log("✅ Official GA4 test event sent - check your dashboard!")
  },
}
