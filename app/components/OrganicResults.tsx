import { getFaviconUrl } from "../utils/favicon"

type OrganicResult = {
  title: string
  url: string
  description: string
  favicon?: string
}

interface OrganicResultsProps {
  results: OrganicResult[]
  loading?: boolean
}

export default function OrganicResults({ results, loading }: OrganicResultsProps) {
  if (loading) {
    return <div className="text-gray-500 text-center py-8 google-font">Loading results...</div>
  }

  if (results.length === 0) {
    return <div className="text-gray-500 text-center py-8 google-font">No results found.</div>
  }

  return (
    <div>
      {results.map((result, i) => (
        <div key={i} className="mb-6">
          <div className="mb-1 flex items-center gap-3">
            {result.favicon ? (
              <img
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
              <img
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
            <a
              href={result.url}
              target="_blank"
              rel="noopener"
              className="text-xl text-blue-700 hover:underline visited:text-purple-700 google-font">
              {result.title}
            </a>
          </div>
          <div className="text-green-700 text-sm mb-1 ml-7 google-font">{result.url}</div>
          <div className="text-gray-700 text-sm leading-5 ml-7 google-font">{result.description}</div>
        </div>
      ))}
    </div>
  )
}
