import Script from "next/script"

interface GoogleAnalyticsProps {
  gaId: string
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: Record<string, unknown>[]
  }
}

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  )
}

// Export gtag functions for use throughout the app
export const gtag = {
  pageview: (url: string) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", process.env.NEXT_PUBLIC_GA_TRACKING_ID!, {
        page_path: url,
      })
    }
  },

  event: (action: string, parameters?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", action, parameters)
    }
  },

  search: (searchTerm: string, numResults: number) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "search", {
        search_term: searchTerm,
        content_category: "search_results",
        num_results: numResults,
      })
    }
  },

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

  adminAction: (action: string, details?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "admin_action", {
        event_category: "admin",
        event_label: action,
        ...details,
      })
    }
  },

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

  test: () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "nextjs_test", {
        event_category: "testing",
        event_label: "nextjs_script_component",
        test_timestamp: Date.now(),
        hostname: window.location.hostname,
        value: 1,
      })
      console.log("✅ GA4 test event sent")
    } else {
      console.error("❌ gtag not available")
    }
  },
}
