"use client"
import GoogleHomepage from "./components/GoogleHomepage"
import SearchResultsPage from "./components/SearchResultsPage"
import { useSearch } from "./hooks/useSearch"

export default function Home() {
  const { query, setQuery, search, ads, organic, loading, handleSearch, goHome } = useSearch()

  if (!search) {
    return <GoogleHomepage query={query} setQuery={setQuery} onSearch={handleSearch} />
  }

  return (
    <SearchResultsPage
      query={query}
      setQuery={setQuery}
      onSearch={handleSearch}
      onLogoClick={goHome}
      ads={ads}
      organicResults={organic}
      loading={loading}
    />
  )
}
