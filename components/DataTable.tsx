'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';

/**
 * Premium Enterprise Data Table Component
 * Zebra striping, hover effects, status badges
 * Clean borders and perfect alignment
 */
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  searchable?: boolean;
  sortable?: boolean;
}

export default function DataTable<T extends { _id?: string; id?: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  searchable = true,
  sortable = true,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  // Filter data
  const filteredData = safeData.filter((row) => {
    if (!searchTerm) return true;
    return columns.some((col) => {
      const value = row[col.key as keyof T];
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Sort data
  const sortedData = Array.isArray(filteredData) ? [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn as keyof T];
    const bVal = b[sortColumn as keyof T];
    
    if (aVal === bVal) return 0;
    const comparison = aVal > bVal ? 1 : -1;
    return sortDirection === 'asc' ? comparison : -comparison;
  }) : [];

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column: keyof T | string) => {
    if (!sortable) return;
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="card-premium overflow-hidden">
      {/* Search Bar - Premium Style */}
      {searchable && (
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium w-full"
          />
        </div>
      )}

      {/* Table - Premium Styling */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => handleSort(col.key)}
                  className={`px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider ${
                    sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.header}</span>
                    {sortable && sortColumn === col.key && (
                      <ArrowUpDown className={`w-4 h-4 text-orange-500 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl">📊</span>
                    </div>
                    <p className="text-slate-600 font-medium">No data available</p>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={row._id || row.id || index}
                  className={`hover:bg-slate-50 transition-colors duration-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {col.render ? col.render(row) : String(row[col.key as keyof T] || '-')}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105 shadow-sm"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - Premium Style */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
            >
              <ChevronsLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="px-4 py-2 text-sm font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
            >
              <ChevronsRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
