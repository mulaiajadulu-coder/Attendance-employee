import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, Inbox } from 'lucide-react';
import Button from './Button';

const Table = ({
    columns,
    data = [],
    isLoading = false,
    emptyMessage = "No data found",
    pagination = null, // { currentPage, totalPages, onPageChange, totalItems }
    className = '',
    onRowClick,
}) => {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col ${className}`}>
            {/* Table Container - Scrollable */}
            <div className="overflow-x-auto rounded-t-xl">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-gray-700">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className={`
                    px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider
                    ${col.className || ''}
                    ${col.hidden ? 'hidden' : ''}
                  `}
                                    style={{ width: col.width }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-500">
                                        <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-500" />
                                        <p className="text-sm">Loading data...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <div className="p-4 bg-gray-50 rounded-full mb-3">
                                            <Inbox className="h-8 w-8" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">No data available</p>
                                        <p className="text-sm text-gray-500 mt-1">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIdx) => (
                                <tr
                                    key={row.id || rowIdx}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`
                    group transition-colors duration-150
                    ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : 'hover:bg-gray-50/50'}
                  `}
                                >
                                    {columns.map((col, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className={`
                        px-6 py-4 whitespace-nowrap text-sm text-gray-700
                        ${col.className || ''}
                        ${col.hidden ? 'hidden' : ''}
                      `}
                                        >
                                            {col.render ? col.render(row, rowIdx) : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {!isLoading && pagination && data.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 rounded-b-xl flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Showing page <span className="font-medium text-gray-900">{pagination.currentPage}</span> of{' '}
                        <span className="font-medium text-gray-900">{pagination.totalPages}</span>
                        {pagination.totalItems && (
                            <> ({pagination.totalItems} items)</>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.currentPage <= 1}
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.currentPage >= pagination.totalPages}
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Table;
