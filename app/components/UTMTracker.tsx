"use client"
import { useState, useEffect } from "react"

type UTMParams = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  [key: string]: string | undefined
}

interface UTMTrackerProps {
  visible: boolean
  onToggle: () => void
}

export default function UTMTracker({ visible, onToggle }: UTMTrackerProps) {
  const [recentClicks, setRecentClicks] = useState<
    Array<{
      timestamp: Date
      url: string
      utmParams: UTMParams
      keyword: string
      adTitle: string
    }>
  >([])

  useEffect(() => {
    // Listen for ad clicks from PaidAds component
    const handleAdClick = (event: CustomEvent) => {
      const { url, keyword, adTitle } = event.detail

      // Parse UTM parameters from URL
      const urlObj = new URL(url)
      const utmParams: UTMParams = {}

      urlObj.searchParams.forEach((value, key) => {
        if (key.startsWith("utm_")) {
          utmParams[key] = value
        }
      })

      // Add to recent clicks
      setRecentClicks(prev => [
        {
          timestamp: new Date(),
          url,
          utmParams,
          keyword,
          adTitle,
        },
        ...prev.slice(0, 9),
      ]) // Keep last 10 clicks
    }

    window.addEventListener("adClick", handleAdClick as EventListener)
    return () => window.removeEventListener("adClick", handleAdClick as EventListener)
  }, [])

  if (!visible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 z-50">
        📊
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 google-font">UTM Tracker</h3>
        <button onClick={onToggle} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {recentClicks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm google-font">Click on ads to see UTM tracking</div>
            <div className="text-xs text-gray-500 google-font mt-1">
              Perfect for demonstrating attribution to clients
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentClicks.map((click, index) => (
              <div key={index} className="border border-gray-200 rounded p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 google-font">{click.adTitle}</span>
                  <span className="text-xs text-gray-500 google-font">{click.timestamp.toLocaleTimeString()}</span>
                </div>

                <div className="text-xs text-gray-600 google-font mb-2">
                  Keyword: <span className="text-blue-600">{click.keyword}</span>
                </div>

                <div className="space-y-1 text-xs">
                  {Object.entries(click.utmParams).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500 google-font">{key}:</span>
                      <span className="text-gray-900 google-font font-mono">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-xs text-gray-500 google-font break-all">
                  <a
                    href={click.url}
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-blue-700 hover:underline visited:text-purple-700 google-font">
                    {click.url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
