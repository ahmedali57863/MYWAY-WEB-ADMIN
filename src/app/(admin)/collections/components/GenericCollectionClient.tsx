'use client'

import { useState, useMemo } from 'react'
import { deleteCollectionRecord } from '../actions'

export default function GenericCollectionClient({
  table,
  data: initialData,
}: {
  table: string
  data: any[]
}) {
  const [data, setData] = useState<any[]>(initialData)
  const [search, setSearch] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState(false)

  const columns = data.length > 0 ? Object.keys(data[0]) : []

  const filteredData = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(q)
      )
    )
  }, [data, search])

  const handleDelete = async (rowId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to permanently delete this record (${rowId}) from ${table}?`)) {
      return
    }
    setDeletingId(rowId)
    try {
      await deleteCollectionRecord(table, rowId)
      setData((prev) => prev.filter((r) => r.id !== rowId))
      if (expandedIdx !== null) setExpandedIdx(null)
    } catch (err: any) {
      alert(err.message || 'Failed to delete record')
    } finally {
      setDeletingId(null)
    }
  }

  const displayName = table.replace(/_/g, ' ')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-800">
              Database Table
            </span>
            <span className="text-xs text-gray-500 font-mono">public.{table}</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mt-1 capitalize">{displayName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Showing latest {filteredData.length} records</p>
        </div>

        <div className="relative sm:w-72">
          <input
            type="text"
            placeholder={`Search in ${displayName}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto max-w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wider">
              {columns.map((col) => (
                <th key={col} className="py-3.5 px-4 whitespace-nowrap">{col}</th>
              ))}
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-800">
            {filteredData.map((row, idx) => {
              const isExpanded = expandedIdx === idx
              const rowId = row.id ? String(row.id) : null
              const isDeleting = rowId && deletingId === rowId

              return (
                <tr
                  key={rowId || idx}
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer select-none"
                >
                  {columns.map((col) => {
                    const val = row[col]
                    let formatted = ''
                    if (typeof val === 'object' && val !== null) {
                      formatted = JSON.stringify(val)
                    } else if (typeof val === 'boolean') {
                      formatted = val ? 'true' : 'false'
                    } else if (val === null || val === undefined) {
                      formatted = '-'
                    } else {
                      formatted = String(val)
                    }

                    return (
                      <td key={col} className="py-3 px-4 truncate max-w-[200px] font-mono" title={formatted}>
                        {formatted}
                      </td>
                    )
                  })}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-indigo-600 font-bold hover:underline">
                        {isExpanded ? 'Collapse' : 'Inspect'}
                      </span>
                      {rowId && (
                        <button
                          onClick={(e) => handleDelete(rowId, e)}
                          disabled={Boolean(isDeleting)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition disabled:opacity-50"
                        >
                          {isDeleting ? '...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded Inspector Drawer */}
      {expandedIdx !== null && filteredData[expandedIdx] && (
        <div className="bg-[#0B132B] text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Record #{expandedIdx + 1} Telemetry</h4>
              <p className="text-sm font-bold text-white mt-0.5">
                {filteredData[expandedIdx].id ? `ID: ${filteredData[expandedIdx].id}` : `Row Index: ${expandedIdx}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {filteredData[expandedIdx].id && (
                <button
                  onClick={(e) => handleDelete(String(filteredData[expandedIdx].id), e)}
                  className="text-xs font-bold text-rose-300 hover:bg-rose-900/40 border border-rose-500/30 px-3.5 py-1.5 bg-rose-600/20 rounded-xl transition"
                >
                  Delete Record Permanently
                </button>
              )}
              <button
                onClick={() => setExpandedIdx(null)}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>

          {/* Formatted Key-Value Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(filteredData[expandedIdx]).map(([key, val]) => (
              <div key={key} className="bg-[#1C2541] p-3.5 rounded-xl border border-slate-700/60 overflow-hidden">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider truncate">{key}</p>
                <p className="text-xs font-mono text-slate-200 mt-1 truncate" title={String(val)}>
                  {typeof val === 'object' && val !== null
                    ? JSON.stringify(val)
                    : val === null || val === undefined
                    ? 'null'
                    : String(val)}
                </p>
              </div>
            ))}
          </div>

          {/* Optional Developer JSON view */}
          <div className="pt-2">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/80 transition"
            >
              <span>{showRaw ? '▼ Hide Developer JSON' : '▶ Show Developer JSON'}</span>
            </button>

            {showRaw && (
              <pre className="text-xs font-mono bg-[#050B14] p-4 rounded-xl text-emerald-400 overflow-x-auto max-h-80 mt-3 shadow-inner">
                {JSON.stringify(filteredData[expandedIdx], null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
