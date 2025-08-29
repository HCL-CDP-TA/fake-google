import Link from "next/link"
import { ChangeEvent, FormEvent, useState, useEffect } from "react"
import PaidAds from "./PaidAds"
import OrganicResults from "./OrganicResults"
import UTMTracker from "./UTMTracker"

type PaidAd = {
  title: string
  display_url: string
  url: string
  description: string
  description2?: string
}

type OrganicResult = {
  title: string
  url: string
  description: string
  favicon?: string
}

interface SearchResultsPageProps {
  query: string
  setQuery: (query: string) => void
  onSearch: (e: FormEvent<HTMLFormElement>) => void
  onLogoClick: () => void
  ads: PaidAd[]
  organicResults: OrganicResult[]
  loading: boolean
  search?: string // Add search state to know if a search has been performed
}

export default function SearchResultsPage({
  query,
  setQuery,
  onSearch,
  onLogoClick,
  ads,
  organicResults,
  loading,
  search = "",
}: SearchResultsPageProps) {
  const [showUTMTracker, setShowUTMTracker] = useState(false)
  const [appVersion, setAppVersion] = useState<string>("")

  // Fetch application version
  useEffect(() => {
    fetch("/api/version")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAppVersion(data.version)
        }
      })
      .catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-white relative">
      {/* Admin gear icon - positioned in very top right */}
      <Link
        href="/admin"
        className="fixed top-4 right-4 z-50 text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="Admin">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Link>

      {/* Header with search */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="px-6 py-3">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <button onClick={onLogoClick} className="text-2xl font-light text-gray-700 google-font">
              <span className="text-blue-500">F</span>
              <span className="text-red-500">a</span>
              <span className="text-yellow-500">k</span>
              <span className="text-blue-500">e</span>
              <span className="text-green-500"> </span>
              <span className="text-red-500">G</span>
              <span className="text-blue-500">o</span>
              <span className="text-green-500">o</span>
              <span className="text-yellow-500">g</span>
              <span className="text-blue-500">l</span>
              <span className="text-red-500">e</span>
            </button>

            {/* Search box */}
            <form onSubmit={onSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:outline-none focus:border-transparent focus:ring-1 focus:ring-blue-500 google-font"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </form>

            {/* Right side - currently empty */}
            <div className="flex items-center gap-4"></div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="px-6">
          <div className="flex gap-8 text-sm google-font" style={{ marginLeft: "180px" }}>
            <button className="text-blue-600 border-b-2 border-blue-600 pb-3 px-1 flex items-center gap-1 google-font">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              All
            </button>
            <button className="text-gray-700 hover:text-gray-900 pb-3 px-1 flex items-center gap-1 google-font">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              Images
            </button>
            <button className="text-gray-700 hover:text-gray-900 pb-3 px-1 flex items-center gap-1 google-font">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              Videos
            </button>
            <button className="text-gray-700 hover:text-gray-900 pb-3 px-1 flex items-center gap-1 google-font">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
                  clipRule="evenodd"
                />
                <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
              </svg>
              News
            </button>
            <button className="text-gray-700 hover:text-gray-900 pb-3 px-1 flex items-center gap-1 google-font">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Shopping
            </button>
            <button className="text-gray-700 hover:text-gray-900 pb-3 px-1 flex items-center gap-1 google-font">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
              More
            </button>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="px-6 py-4">
        <div className="max-w-2xl" style={{ marginLeft: "174px" }}>
          {/* Results info - only show if a search has been performed */}
          {search && (
            <div className="text-sm text-gray-600 mb-4 google-font">
              {loading ? "Searching..." : <>About {ads.length + organicResults.length} results (0.42 seconds)</>}
            </div>
          )}

          {/* Paid Ads */}
          <PaidAds ads={ads} loading={loading && ads.length === 0} currentQuery={query} />

          {/* Organic Results */}
          <OrganicResults
            results={organicResults}
            loading={loading && organicResults.length === 0}
            hasSearched={!!search}
            currentQuery={query}
          />
        </div>
      </main>

      {/* UTM Tracker for Martech Demos */}
      <UTMTracker visible={showUTMTracker} onToggle={() => setShowUTMTracker(!showUTMTracker)} />

      {/* Footer with version info */}
      {appVersion && <footer className="fixed bottom-4 left-4 text-xs text-gray-400 google-font">v{appVersion}</footer>}
    </div>
  )
}
