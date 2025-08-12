import Link from "next/link"
import { ChangeEvent, FormEvent } from "react"

interface GoogleHomepageProps {
  query: string
  setQuery: (query: string) => void
  onSearch: (e: FormEvent<HTMLFormElement>) => void
}

export default function GoogleHomepage({ query, setQuery, onSearch }: GoogleHomepageProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-4">
        <div></div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="text-gray-700 hover:underline">
            Admin
          </Link>
          <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">Sign in</button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-32">
        <div className="text-center">
          <h1 className="text-7xl font-light text-gray-700 mb-8 google-font">
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
          </h1>

          <form onSubmit={onSearch} className="mb-8">
            <div className="relative max-w-xl mx-auto">
              <input
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder=""
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:outline-none focus:border-transparent focus:ring-1 focus:ring-blue-500 google-font"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <button
                type="submit"
                className="bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm google-font">
                Google Search
              </button>
              <button
                type="button"
                className="bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm google-font">
                I&apos;m Feeling Lucky
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
