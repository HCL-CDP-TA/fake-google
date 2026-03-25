"use client"

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from "react"

interface SearchSuggestProps {
  query: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  compact?: boolean
  autoFocus?: boolean
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  )
}

function renderSuggestion(suggestion: string, typed: string) {
  if (suggestion.toLowerCase().startsWith(typed.toLowerCase())) {
    const prefix = suggestion.slice(0, typed.length)
    const suffix = suggestion.slice(typed.length)
    return (
      <>
        <span>{prefix}</span>
        <strong>{suffix}</strong>
      </>
    )
  }
  return <span>{suggestion}</span>
}

export default function SearchSuggest({ query, onChange, onSearch, compact = false, autoFocus }: SearchSuggestProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const suppressRef = useRef(false)

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (suppressRef.current) {
        suppressRef.current = false
        return
      }
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data: string[] = await res.json()
          setSuggestions(data)
          setIsOpen(data.length > 0)
          setSelectedIndex(-1)
        }
      } catch {
        // silent fail
      }
    }, 200)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(i => {
        if (i <= 0) {
          setIsOpen(false)
          return -1
        }
        return i - 1
      })
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setSelectedIndex(-1)
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault()
      const selected = suggestions[selectedIndex]
      suppressRef.current = true
      onChange(selected)
      onSearch(selected)
      setIsOpen(false)
    }
  }

  const handleSelect = (suggestion: string) => {
    suppressRef.current = true
    onChange(suggestion)
    onSearch(suggestion)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    onChange("")
    setSuggestions([])
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const py = compact ? "py-2" : "py-3"
  const textSize = compact ? "text-sm md:text-base" : "text-base md:text-lg"
  const iconSize = compact ? "w-4 h-4" : "w-5 h-5"

  const closedBoxClass = "rounded-full border border-[#dfe1e5] hover:shadow-[0_1px_6px_rgba(32,33,36,.28)] hover:border-transparent focus-within:shadow-[0_1px_6px_rgba(32,33,36,.28)] focus-within:border-transparent transition-shadow"
  const openBoxClass = "rounded-t-3xl border border-b-0 border-[#dfe1e5]"

  return (
    <div ref={containerRef} className="relative">
      {/* Input row */}
      <div className={`flex items-center gap-2 bg-white ${isOpen ? openBoxClass : closedBoxClass}`}>
        {/* Left icon — homepage only */}
        {!compact && (
          <div className="pl-4">
            <SearchIcon className={`${iconSize} text-[#9aa0a6] flex-shrink-0`} />
          </div>
        )}

        <input
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 outline-none bg-transparent ${textSize} google-font min-w-0 ${compact ? "pl-4" : "pl-2"} ${py}`}
          autoFocus={autoFocus}
        />

        {/* Right controls */}
        <div className="flex items-center gap-1 pr-3">
          {query && (
            <>
              <button
                type="button"
                onMouseDown={handleClear}
                className="text-[#70757a] hover:text-gray-900 p-1"
                tabIndex={-1}>
                <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
              {compact && <div className="h-5 w-px bg-[#dfe1e5]" />}
            </>
          )}
          {compact && (
            <button type="submit" className="text-[#4285f4] hover:text-[#1a73e8] p-1" tabIndex={-1}>
              <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white rounded-b-3xl border border-t-0 border-[#dfe1e5] shadow-[0_4px_6px_rgba(32,33,36,.18)] overflow-hidden pb-2">
          <div className="mx-4 border-t border-[#e8eaed] mb-1" />
          {suggestions.map((suggestion, i) => (
            <div
              key={suggestion}
              className={`flex items-center gap-3 px-4 py-2 cursor-pointer ${textSize} google-font ${i === selectedIndex ? "bg-[#f1f3f4]" : "hover:bg-[#f1f3f4]"}`}
              onMouseDown={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(i)}>
              <SearchIcon className={`${iconSize} text-[#9aa0a6] flex-shrink-0`} />
              <span>{renderSuggestion(suggestion, query)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
