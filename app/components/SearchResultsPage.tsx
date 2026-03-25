import Link from "next/link"
import { FormEvent, useState, useEffect } from "react"
import PaidAds from "./PaidAds"
import OrganicResults from "./OrganicResults"
import UTMTracker from "./UTMTracker"
import { gtag } from "./GoogleAnalytics"
import SearchSuggest from "./SearchSuggest"

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
  onSuggestionSearch: (query: string) => void
  onLogoClick: () => void
  ads: PaidAd[]
  organicResults: OrganicResult[]
  loading: boolean
  search?: string
}

export default function SearchResultsPage({
  query,
  setQuery,
  onSearch,
  onSuggestionSearch,
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

  const handleAdminClick = () => {
    // Track admin access in Google Analytics
    gtag.adminAction("admin_access", { source: "header_button" })
  }

  const handleLogoClick = () => {
    // Track logo click in Google Analytics
    gtag.event("logo_click", {
      event_category: "navigation",
      event_label: "header_logo",
    })
    onLogoClick()
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Admin gear icon - positioned in very top right */}
      <Link
        href="/admin"
        onClick={handleAdminClick}
        className="hidden lg:block fixed top-4 right-4 z-50 text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
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
        <div className="px-3 py-2 md:px-6 md:py-3">
          <div className="flex items-center gap-3 md:gap-8">
            {/* Logo */}
            <button onClick={handleLogoClick} className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 272 92" className="w-20 md:w-24 h-auto">
                <path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                <path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
                <path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
                <path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/>
                <path fill="#EA4335" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
                <path fill="#4285F4" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/>
              </svg>
            </button>

            {/* Search box */}
            <form onSubmit={onSearch} className="flex-1 max-w-full md:max-w-2xl">
              <SearchSuggest
                query={query}
                onChange={setQuery}
                onSearch={onSuggestionSearch}
                compact
                autoFocus
              />
            </form>

            {/* Right side - currently empty */}
            <div className="flex items-center gap-4"></div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="hidden md:block px-3 md:px-6">
          <div className="flex gap-0 text-sm google-font overflow-x-auto scrollbar-hide md:ml-[172px]">
            {[
              { label: "AI Mode" },
              { label: "All", active: true },
              { label: "Shopping" },
              { label: "Short videos" },
              { label: "Images" },
              { label: "Forums" },
              { label: "Videos" },
              { label: "More ▾" },
              { label: "Tools ▾" },
            ].map(({ label, active }) => (
              <button
                key={label}
                className={`px-3 pb-2 pt-1 whitespace-nowrap google-font border-b-2 transition-colors ${
                  active
                    ? "text-[#202124] font-medium border-[#1a73e8]"
                    : "text-[#70757a] border-transparent hover:text-[#202124] hover:border-gray-300"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="px-6 py-4">
        <div className="max-w-full px-3 md:px-0 md:max-w-2xl md:ml-[174px]">
          {/* Results info - only show if a search has been performed */}
          {search && (
            <div className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4 google-font">
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
      <div className="hidden lg:block">
        <UTMTracker visible={showUTMTracker} onToggle={() => setShowUTMTracker(!showUTMTracker)} />
      </div>

      {/* Footer with version info */}
      {appVersion && <footer className="fixed bottom-2 left-2 md:bottom-4 md:left-4 text-[10px] md:text-xs text-gray-400 google-font">v{appVersion}</footer>}
    </div>
  )
}
