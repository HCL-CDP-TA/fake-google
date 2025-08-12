import Link from "next/link"
import { ChangeEvent, FormEvent } from "react"
import PaidAds from "./PaidAds"
import OrganicResults from "./OrganicResults"

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
  // Localization props
  country?: string
  setCountry?: (country: string) => void
  language?: string
  setLanguage?: (language: string) => void
  location?: string
  setLocation?: (location: string) => void
}

export default function SearchResultsPage({
  query,
  setQuery,
  onSearch,
  onLogoClick,
  ads,
  organicResults,
  loading,
  country = "us",
  setCountry = () => {},
  language = "en",
  setLanguage = () => {},
  location = "",
  setLocation = () => {},
}: SearchResultsPageProps) {
  return (
    <div className="min-h-screen bg-white">
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

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Localization Controls */}
              <div className="flex items-center gap-3 text-sm">
                {/* Country/Region */}
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="text-gray-700 bg-transparent border border-gray-300 rounded px-2 py-1 text-xs google-font hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="us">🇺🇸 United States</option>
                  <option value="uk">🇬🇧 United Kingdom</option>
                  <option value="ca">🇨🇦 Canada</option>
                  <option value="au">🇦🇺 Australia</option>
                  <option value="de">🇩🇪 Germany</option>
                  <option value="fr">🇫🇷 France</option>
                  <option value="es">🇪🇸 Spain</option>
                  <option value="it">🇮🇹 Italy</option>
                  <option value="jp">🇯🇵 Japan</option>
                  <option value="br">🇧🇷 Brazil</option>
                  <option value="mx">🇲🇽 Mexico</option>
                  <option value="in">🇮🇳 India</option>
                </select>

                {/* Language */}
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="text-gray-700 bg-transparent border border-gray-300 rounded px-2 py-1 text-xs google-font hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                  <option value="ru">Русский</option>
                  <option value="ar">العربية</option>
                </select>

                {/* Location Input */}
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Location (optional)"
                  className="text-gray-700 bg-transparent border border-gray-300 rounded px-2 py-1 text-xs google-font hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
                />
              </div>

              <Link href="/admin" className="text-gray-700 hover:underline text-sm google-font">
                Admin
              </Link>
            </div>
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
          {/* Results info */}
          <div className="text-sm text-gray-600 mb-4 google-font">
            {loading ? (
              "Searching..."
            ) : (
              <>
                About {ads.length + organicResults.length} results (0.42 seconds)
                {(country !== "us" || language !== "en" || location) && (
                  <span className="ml-2 text-xs text-gray-500">
                    • {country.toUpperCase()}
                    {language !== "en" && `, ${language.toUpperCase()}`}
                    {location && `, ${location}`}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Paid Ads */}
          <PaidAds ads={ads} loading={loading && ads.length === 0} />

          {/* Organic Results */}
          <OrganicResults results={organicResults} loading={loading && organicResults.length === 0} />
        </div>
      </main>
    </div>
  )
}
