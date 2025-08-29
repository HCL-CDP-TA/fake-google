"use client"

import { useEffect } from "react"
import Script from "next/script"

interface GoogleAnalyticsProps {
  trackingId: string
}

// Google Analytics tracking events
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
        custom_parameter_1: numResults,
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
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: Record<string, unknown>[]
  }
}

export default function GoogleAnalytics({ trackingId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Initialize dataLayer if it doesn't exist
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || []
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args as unknown as Record<string, unknown>)
      }
      window.gtag("js", new Date())
      window.gtag("config", trackingId, {
        send_page_view: false, // We'll handle page views manually
      })
    }
  }, [trackingId])

  return (
    <>
      <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`} />
    </>
  )
}
