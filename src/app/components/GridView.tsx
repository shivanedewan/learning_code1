"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  ColumnDef,
  PaginationState, // ★ FIX 1: Import PaginationState type
  getFilteredRowModel, // It's good practice to add these
  getFacetedRowModel,
  getFacetedUniqueValues,
} from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import { Document } from '../types'; 

import { IoClose } from 'react-icons/io5';
import { HiOutlineDocumentText } from "react-icons/hi";

// (LoadingSpinner and formatHeader helpers remain the same)
const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-500"></div>
  </div>
);
const formatHeader = (key: string): string => key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());


interface GridViewProps {
  documents: Document[];
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isLoading: boolean;
  // ★ NEW: Add props for server-side pagination
  currentPage: number;
  totalDocuments: number;
  onPageChange: (page: number) => void;
}

const GridView: React.FC<GridViewProps> = ({ documents, pageSize, onPageSizeChange, isLoading, currentPage,totalDocuments,onPageChange }) => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // ★ NEW: Calculate page count based on the total from the server
  const pageCount = useMemo(() => {
    return pageSize > 0 ? Math.ceil(totalDocuments / pageSize) : 0;
  }, [totalDocuments, pageSize]);
  
  // ★ FIX 3: Add a useEffect to sync pageSize from props with our local state
  // This is important for when the user changes the "Rows per page" dropdown.
//   useEffect(() => {
//     setPagination(currentPagination => ({
//       ...currentPagination,
//       pageSize: pageSize,
//     }));
//   }, [pageSize]);

//   // (useEffect for selectedDoc and useMemo for columns remain the same)
//   useEffect(() => {
//     // This is the debug log you had, which is good to keep for now
//     console.log('%c[EFFECT] Selected document state changed to:', 'color: green;', selectedDoc);
//   }, [selectedDoc]);

  const columns = useMemo<ColumnDef<Document>[]>(() => {
    if (documents.length === 0) return [];
    const validKeys = Object.keys(documents[0]).filter(key => key !== 'Text' && key !== 'highlighted_text');
    return validKeys.map(key => ({
      accessorKey: key,
      header: () => <span>{formatHeader(key)}</span>,
      cell: info => {
        const value = info.getValue();
        if (typeof value === 'string' && value.length > 50) return `${value.substring(0, 50)}...`;
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return value === null || typeof value === 'undefined' ? 'N/A' : String(value);
      },
    }));
  }, [documents]);

  const table = useReactTable({
    data: documents,
    columns,
    pageCount: pageCount, // ★ NEW: Tell the table the total number of pages
    
    state: { 
      sorting, 
      // ★ FIX: The pagination state is now derived directly from props
      pagination: {
        pageIndex: currentPage - 1, // Convert 1-based page to 0-based index
        pageSize,
      },
    },
    manualPagination: true,
    onSortingChange: setSorting,
    // ★ FIX: Handle pagination changes by calling the parent's callback
    onPaginationChange: (updater) => {
        if (typeof updater === 'function') {
            const newPaginationState = updater({ pageIndex: currentPage - 1, pageSize });
            onPageChange(newPaginationState.pageIndex + 1); // Convert back to 1-based page
            onPageSizeChange(newPaginationState.pageSize);
        } else {
            onPageChange(updater.pageIndex + 1);
            onPageSizeChange(updater.pageSize);
        }
    },
    
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // This is a useful flag, it prevents the page index from resetting on data changes
    autoResetPageIndex: false, 
  });

  const handleRowClick = (doc: Document) => {
    setSelectedDoc(prevDoc => (prevDoc === doc ? null : doc));
  };
  
  // (variants and render logic remain the same)
  const gridVariants = { full: { width: '100%' }, shrunk: { width: '65%' } };
  const sidebarVariants = { hidden: { x: '100%', opacity: 0 }, visible: { x: 0, opacity: 1 } };
  
  console.log('%c[RENDER] GridView is rendering. selectedDoc is:', 'color: orange;', selectedDoc);

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden relative">
      {isLoading && <LoadingSpinner />}
      
      <motion.div
        className="flex flex-col h-full"
        animate={selectedDoc ? 'shrunk' : 'full'}
        variants={gridVariants}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex-grow overflow-auto">
           {/* Table remains the same */}
           <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-100 sticky top-0 z-10">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} onClick={header.column.getToggleSortingHandler()} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="ml-2">{{ asc: '▲', desc: '▼' }[header.column.getIsSorted() as string] ?? null}</span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  onClick={() => handleRowClick(row.original)}
                  className={`cursor-pointer transition-all duration-200 ease-in-out border-l-4 ${selectedDoc === row.original ? 'bg-sky-50 border-sky-500' : 'border-transparent hover:bg-gray-100'}`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {/* ... */}
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between p-2 border-t bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select 
              value={pageSize} 
              onChange={e => { 
                const newSize=Number(e.target.value)
                // We only need to notify the parent component. The useEffect will handle the rest.
                onPageChange(1)
                onPageSizeChange(Number(newSize)); 
              }} 
              className="p-1 border border-gray-300 rounded-md bg-gray-50 text-sm focus:ring-1 focus:ring-sky-500 focus:border-sky-500">
              {[10, 25, 50, 100].map(size => (<option key={size} value={size}>{size}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 hover:enabled:bg-gray-300 transition-colors">{'<'}</button>
            <span className="text-sm font-medium text-gray-700">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 hover:enabled:bg-gray-300 transition-colors">{'>'}</button>
          </div>
        </div>
      </motion.div>
      
      {/* Sidebar remains the same */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            className="absolute top-0 right-0 h-full w-[35%] bg-white border-l-2 border-gray-200 shadow-2xl flex flex-col z-30"
            initial="hidden" animate="visible" exit="hidden" variants={sidebarVariants} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
           {/* ... sidebar content ... */}
           <div className="flex justify-between items-center p-4 border-b bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <HiOutlineDocumentText className="text-2xl text-sky-600"/>
                <h3 className="text-lg font-bold text-gray-800">Document Metadata</h3>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full p-1 transition-colors" aria-label="Close">
                <IoClose size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-grow">
              <ul>
                {Object.entries(selectedDoc).map(([key, value]) => (
                  <li key={key} className="border-b border-gray-200 py-3">
                    <strong className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{formatHeader(key)}</strong>
                    <div className="text-md text-gray-900 break-words">{String(value) || <span className="text-gray-400 italic">Not available</span>}</div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GridView;