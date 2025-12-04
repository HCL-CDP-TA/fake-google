import Image from "next/image"
import { getFaviconUrl } from "../utils/favicon"
import { addOrganicTrackingToUrl } from "../utils/googleTracking"
import { gtag } from "./GoogleAnalytics"
import { SmartLink } from "./SmartLink"

type OrganicResult = {
  title: string
  url: string
  description: string
  favicon?: string
}

interface OrganicResultsProps {
  results: OrganicResult[]
  loading?: boolean
  hasSearched?: boolean
  currentQuery?: string
}

export default function OrganicResults({
  results,
  loading,
  hasSearched = false,
  currentQuery = "",
}: OrganicResultsProps) {
  const getResultUrl = (result: OrganicResult, index: number): string => {
    if (!currentQuery) return result.url
    return addOrganicTrackingToUrl(result.url, currentQuery, index)
  }

  const handleResultClick = (result: OrganicResult, index: number) => {
    // Track organic click in Google Analytics
    gtag.organicClick(result.title, result.url, currentQuery, index + 1)

    // Emit custom event for organic result tracking
    const resultClickEvent = new CustomEvent("organicClick", {
      detail: {
        url: result.url,
        query: currentQuery,
        title: result.title,
        position: index + 1,
      },
    })
    window.dispatchEvent(resultClickEvent)
  }
  if (loading) {
    return <div className="text-gray-500 text-center py-8 google-font">Loading results...</div>
  }

  if (results.length === 0 && hasSearched) {
    return <div className="text-gray-500 text-center py-8 google-font">No results found.</div>
  }

  if (results.length === 0) {
    return null // Don't show anything if no search has been performed
  }

  return (
    <div>
      {results.map((result, i) => (
        <div key={i} className="mb-4 md:mb-6">
          <div className="mb-1 flex items-center gap-2 md:gap-3">
            {result.favicon ? (
              <Image
                src={result.favicon}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4 rounded-sm flex-shrink-0"
                onError={e => {
                  // Fallback to Google's favicon service
                  const fallbackUrl = getFaviconUrl(result.url)
                  if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
                    e.currentTarget.src = fallbackUrl
                  } else {
                    e.currentTarget.style.display = "none"
                  }
                }}
              />
            ) : (
              <Image
                src={getFaviconUrl(result.url)}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4 rounded-sm flex-shrink-0"
                onError={e => {
                  e.currentTarget.style.display = "none"
                }}
              />
            )}
            <SmartLink
              href={getResultUrl(result, i)}
              target="_blank"
              rel="noopener"
              onClick={() => handleResultClick(result, i)}
              className="text-base md:text-xl text-blue-700 hover:underline visited:text-purple-700 google-font">
              {result.title}
            </SmartLink>
          </div>
          <div className="text-green-700 text-xs md:text-sm mb-1 ml-0 md:ml-7 google-font">{result.url}</div>
          <div className="text-gray-700 text-xs md:text-sm leading-5 ml-0 md:ml-7 google-font">
            {result.description}
          </div>
        </div>
      ))}
    </div>
  )
}
