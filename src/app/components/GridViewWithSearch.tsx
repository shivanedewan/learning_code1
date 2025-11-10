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
} from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import { Document } from '../types';
import { Modal } from './OptionalModal2';

import { IoClose, IoEyeOutline, IoDownloadOutline } from 'react-icons/io5';
import { HiOutlineDocumentText } from "react-icons/hi";

// A simple loading spinner component
const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-500"></div>
    </div>
);

// Helper to format object keys into readable headers
const formatHeader = (key: string): string => key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());


interface GridViewProps {
    documents: Document[];
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    isLoading: boolean;
    currentPage: number;
    totalDocuments: number;
    onPageChange: (page: number) => void;
}

const GridView: React.FC<GridViewProps> = ({ documents, pageSize, onPageSizeChange, isLoading, currentPage, totalDocuments, onPageChange }) => {
    // State for the currently selected document for the sidebar
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    // State for table sorting
    const [sorting, setSorting] = useState<SortingState>([]);

    // State for the document viewer modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [isModalContentLoading, setIsModalContentLoading] = useState(false);
    const [documentToView, setDocumentToView] = useState<Document | null>(null);

    // Environment variable for the backend server URL
    const pythonServerUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || `http://192.168.10.144:8000`;

    // Utility function to get file extension from a file name
    const getFileExtension = (name: string): string | undefined => {
        const lastDot = name.lastIndexOf('.');
        if (lastDot === -1 || lastDot === 0 || lastDot === name.length - 1) {
            return undefined;
        }
        return name.substring(lastDot + 1).toLowerCase();
    };

    // Handler to open a document, either in a modal or a new tab
    const handleOpenDocument = async (doc: Document) => {
        if (!doc.SystemPath) {
            console.error("No file path provided for viewing.");
            alert("File path is missing, cannot open document.");
            return;
        }

        setDocumentToView(doc);
        const parts = doc.SystemPath ? doc.SystemPath.split('/') : [];
        const fileName = parts.pop() || "";
        const fileExtension = getFileExtension(fileName);
        const viewUrlBase = `${pythonServerUrl}/api/documents/${encodeURIComponent(doc.SystemPath)}`;
        const modalViewExtensions = ['doc', 'docx', 'html'];

        if (fileExtension && modalViewExtensions.includes(fileExtension)) {
            setIsModalContentLoading(true);
            setModalContent('');
            setIsModalOpen(true);

            try {
                const response = await fetch(`${viewUrlBase}?action=view`);
                let responseText = await response.text();

                if (!response.ok) {
                    let errorDetail = responseText;
                    try {
                        const errorJson = JSON.parse(responseText);
                        errorDetail = errorJson.detail || errorJson.message || responseText;
                    } catch (e) {
                        // Response was not JSON
                    }
                    throw new Error(`Preview generation failed: ${response.status} ${response.statusText}. ${errorDetail}`);
                }
                setModalContent(responseText.trim() ? responseText : "<p>Preview is empty or could not be generated.</p>");
            } catch (error) {
                console.error("Error fetching document content for modal:", error);
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                setModalContent(`<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded"><p><strong>Error Loading Preview:</strong></p><p>${errorMessage}</p></div>`);
            } finally {
                setIsModalContentLoading(false);
            }
        } else {
            const viewUrl = `${viewUrlBase}?action=view`;
            try {
                const newTab = window.open(viewUrl, '_blank', 'noopener,noreferrer');
                if (!newTab) {
                    alert("Failed to open the document. Your browser's pop-up blocker might have prevented it.");
                }
            } catch (error) {
                console.error("Error opening document in new tab:", error);
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                alert(`Failed to open document: ${errorMessage}`);
            }
        }
    };

    // Handler to download the selected document
    const handleDownloadDocument = (doc: Document) => {
        if (!doc.SystemPath) {
            console.error("No file path provided for downloading.");
            alert("File path is missing, cannot download document.");
            return;
        }
        const downloadUrl = `${pythonServerUrl}/api/documents/${encodeURIComponent(doc.SystemPath)}?action=download`;

        try {
            window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            console.error("Error initiating download:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            alert(`Failed to initiate download: ${errorMessage}`);
        }
    };

    // Memoize page count calculation
    const pageCount = useMemo(() => {
        return pageSize > 0 ? Math.ceil(totalDocuments / pageSize) : 0;
    }, [totalDocuments, pageSize]);

    // Memoize column definitions
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

    // React Table instance setup
    const table = useReactTable({
        data: documents,
        columns,
        pageCount: pageCount,
        state: {
            sorting,
            pagination: {
                pageIndex: currentPage - 1,
                pageSize,
            },
        },
        manualPagination: true,
        onSortingChange: setSorting,
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newPaginationState = updater({ pageIndex: currentPage - 1, pageSize });
                onPageChange(newPaginationState.pageIndex + 1);
                onPageSizeChange(newPaginationState.pageSize);
            } else {
                onPageChange(updater.pageIndex + 1);
                onPageSizeChange(updater.pageSize);
            }
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        autoResetPageIndex: false,
    });

    // Handler for clicking a table row to show the sidebar
    const handleRowClick = (doc: Document) => {
        setSelectedDoc(prevDoc => (prevDoc === doc ? null : doc));
    };

    // Framer Motion variants for animations
    const gridVariants = { full: { width: '100%' }, shrunk: { width: '65%' } };
    const sidebarVariants = { hidden: { x: '100%', opacity: 0 }, visible: { x: 0, opacity: 1 } };

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
                </div>

                <div className="flex items-center justify-between p-2 border-t bg-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={e => {
                                const newSize = Number(e.target.value);
                                onPageChange(1);
                                onPageSizeChange(newSize);
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

            <AnimatePresence>
                {selectedDoc && (
                    <motion.div
                        className="absolute top-0 right-0 h-full w-[35%] bg-white border-l-2 border-gray-200 shadow-2xl flex flex-col z-30"
                        initial="hidden" animate="visible" exit="hidden" variants={sidebarVariants} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="flex justify-between items-center p-4 border-b bg-slate-50 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <HiOutlineDocumentText className="text-2xl text-sky-600" />
                                <h3 className="text-lg font-bold text-gray-800">Document Details</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleOpenDocument(selectedDoc)} className="text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full p-2 transition-colors" aria-label="View document">
                                    <IoEyeOutline size={20} />
                                </button>
                                <button onClick={() => handleDownloadDocument(selectedDoc)} className="text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full p-2 transition-colors" aria-label="Download document">
                                    <IoDownloadOutline size={20} />
                                </button>
                                <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full p-1 transition-colors" aria-label="Close">
                                    <IoClose size={24} />
                                </button>
                            </div>
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
            
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={documentToView?.FileName || 'Document'}
                isLoading={isModalContentLoading}
            >
                <div dangerouslySetInnerHTML={{ __html: modalContent }} />
            </Modal>
        </div>
    );
};

export default GridView;