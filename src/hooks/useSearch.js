// Search logic hook — used by the Home page
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchPapers, searchByDOI, normalizePaper } from '../api/openAlex'
import { detectInput } from '../utils/detectInput'
import useStore from '../store/useStore'

export default function useSearch() {
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [yearFilter, setYearFilter] = useState(null)
  const addRecentSearch = useStore(s => s.addRecentSearch)

  const isDOI = detectInput(submittedQuery) === 'doi'

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', submittedQuery, page, yearFilter],
    queryFn: async () => {
      if (!submittedQuery) return null
      const raw = isDOI
        ? await searchByDOI(submittedQuery)
        : await searchPapers(submittedQuery, page, yearFilter)
      return {
        results: (raw.results || []).map(normalizePaper),
        total: raw.meta?.count || 0,
      }
    },
    enabled: !!submittedQuery,
  })

  function handleSearch(q = query) {
    if (!q.trim()) return
    setSubmittedQuery(q.trim())
    setPage(1)
    addRecentSearch(q.trim())
  }

  function handlePageChange(newPage) {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return {
    query, setQuery,
    submittedQuery,
    page, yearFilter, setYearFilter,
    results: data?.results || [],
    total: data?.total || 0,
    isLoading,
    error,
    handleSearch,
    handlePageChange,
    hasSearched: !!submittedQuery,
  }
}