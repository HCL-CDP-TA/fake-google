"use client"

import SearchResultsPage from "./components/SearchResultsPage"
import { useSearch } from "./hooks/useSearch"
import { useEffect } from "react"

export default function Home() {
  const { query, setQuery, search, ads, organic, loading, handleSearch, goHome } = useSearch()

  useEffect(() => {
    if (search) {
      document.title = `${search} - Fake Google`
    } else {
      document.title = "Fake Google"
    }
  }, [search])

  // if (!search) {
  //   return <GoogleHomepage query={query} setQuery={setQuery} onSearch={handleSearch} />
  // }

  return (
    <SearchResultsPage
      query={query}
      setQuery={setQuery}
      onSearch={handleSearch}
      onLogoClick={goHome}
      ads={ads}
      organicResults={organic}
      loading={loading}
      search={search}
    />
  )
}
