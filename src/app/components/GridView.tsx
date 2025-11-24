"use client";

import React, { useState, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    SortingState,
    ColumnDef,
    RowSelectionState,
} from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import { Document } from '../types';
import { Modal } from './OptionalModal2';

import { IoClose, IoEyeOutline, IoDownloadOutline, IoSearchOutline, IoCheckbox, IoSquareOutline, IoCloseCircleOutline } from 'react-icons/io5';
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
    currentPage: number;
    totalDocuments: number;
    onPageChange: (page: number) => void;
}

const GridView: React.FC<GridViewProps> = ({ documents, pageSize, onPageSizeChange, isLoading, currentPage, totalDocuments, onPageChange }) => {
    // Existing State
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);

    // State for Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [isModalContentLoading, setIsModalContentLoading] = useState(false);
    const [documentToView, setDocumentToView] = useState<Document | null>(null);
    
    // State for Search and Multi-Download
    const [globalFilter, setGlobalFilter] = useState('');
    const [multiDownloadMode, setMultiDownloadMode] = useState(false);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

    const pythonServerUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || `http://localhost:8000`;

    // (Helper functions: getFileExtension, handleOpenDocument, handleDownloadDocument remain the same)
    const getFileExtension = (name: string): string | undefined => {
        const lastDot = name.lastIndexOf('.');
        if (lastDot === -1 || lastDot === 0 || lastDot === name.length - 1) return undefined;
        return name.substring(lastDot + 1).toLowerCase();
    };

    const handleOpenDocument = async (doc: Document) => {
        if (!doc.SystemPath) {
            console.error("No file path provided for viewing.");
            alert("File path is missing, cannot open document.");
            return;
        }
        
        setDocumentToView(doc);
        const parts = doc.SystemPath? doc.SystemPath.split('/'):[] ;
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
                    } catch (e) { /* Not JSON */ }
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

       // ★ CORRECTED Multi-Download Handler ★
    const handleMultiDownload = () => {
        const selectedRows = table.getSelectedRowModel().flatRows;
        if (selectedRows.length === 0) {
            alert("Please select at least one document to download.");
            return;
        }

        const prophecyIds = selectedRows.map(row => row.original.ProphecyId);
        
        // Use the absolute URL from your pythonServerUrl variable
        const downloadUrl = `${pythonServerUrl}/download_multiple`;

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = downloadUrl; // Use the full URL here
        form.target = '_blank';

        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'prophecy_ids';
        input.value = JSON.stringify(prophecyIds);
        form.appendChild(input);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);

        setMultiDownloadMode(false);
        setRowSelection({});
    };

    
    const pageCount = useMemo(() => {
        return pageSize > 0 ? Math.ceil(totalDocuments / pageSize) : 0;
    }, [totalDocuments, pageSize]);

    const columns = useMemo<ColumnDef<Document>[]>(() => {
        const baseColumns: ColumnDef<Document>[] = multiDownloadMode ? [
            {
                id: 'select',
                header: ({ table }) => (
                     <IndeterminateCheckbox
                        {...{
                            checked: table.getIsAllPageRowsSelected(),
                            indeterminate: table.getIsSomePageRowsSelected(),
                            onChange: table.getToggleAllPageRowsSelectedHandler(),
                        }}
                    />
                ),
                cell: ({ row }) => (
                    <div className="px-1 flex justify-center">
                         <IndeterminateCheckbox
                            {...{
                                checked: row.getIsSelected(),
                                disabled: !row.getCanSelect(),
                                indeterminate: row.getIsSomeSelected(),
                                onChange: row.getToggleSelectedHandler(),
                            }}
                        />
                    </div>
                ),
            }
        ] : [];
        
        if (documents.length === 0) return baseColumns;

        const dataKeys = Object.keys(documents[0]).filter(key => key !== 'Text' && key !== 'highlighted_text');
        const dataColumns: ColumnDef<Document>[] = dataKeys.map(key => ({
            accessorKey: key,
            header: () => <span>{formatHeader(key)}</span>,
            cell: info => {
                const value = info.getValue();
                if (typeof value === 'string' && value.length > 50) return `${value.substring(0, 50)}...`;
                if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                return value === null || typeof value === 'undefined' ? 'N/A' : String(value);
            },
        }));

        return [...baseColumns, ...dataColumns];
    }, [documents, multiDownloadMode]);

    const table = useReactTable({
        data: documents,
        columns,
        pageCount,
        state: {
            sorting,
            pagination: { pageIndex: currentPage - 1, pageSize },
            globalFilter,
            rowSelection,
        },
        manualPagination: true,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
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
        getFilteredRowModel: getFilteredRowModel(),
        autoResetPageIndex: false,
    });

    const handleRowClick = (doc: Document) => {
        if (multiDownloadMode) return;
        setSelectedDoc(prevDoc => (prevDoc === doc ? null : doc));
    };

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
                <div className="flex items-center justify-between p-2 border-b bg-white flex-shrink-0">
                    <div className="relative">
                        <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={globalFilter ?? ''}
                            onChange={e => setGlobalFilter(e.target.value)}
                            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm w-80 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                            placeholder="Search grid..."
                        />
                    </div>
                    <div>
                        {!multiDownloadMode ? (
                            <button
                                onClick={() => setMultiDownloadMode(true)}
                                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors"
                            >
                                <IoDownloadOutline />
                                Download Multiple
                            </button>
                        ) : (
                            <AnimatePresence>
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="text-sm font-medium text-gray-700">
                                        {Object.keys(rowSelection).length} selected
                                    </span>
                                    <button
                                        onClick={handleMultiDownload}
                                        disabled={Object.keys(rowSelection).length === 0}
                                        className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        <IoDownloadOutline />
                                        Download Selected
                                    </button>
                                    <button
                                        onClick={() => { setMultiDownloadMode(false); setRowSelection({}); }}
                                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                                        aria-label="Cancel multi-download"
                                    >
                                        <IoCloseCircleOutline size={22} />
                                    </button>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                <div className="flex-grow overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-slate-100 sticky top-0 z-10">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} onClick={header.column.getToggleSortingHandler()} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                             {header.id !== 'select' && <span className="ml-2">{{ asc: '▲', desc: '▼' }[header.column.getIsSorted() as string] ?? null}</span>}
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
                                    className={`transition-all duration-200 ease-in-out border-l-4 
                                        ${!multiDownloadMode ? 'cursor-pointer' : ''}
                                        ${row.getIsSelected() ? 'bg-sky-100 border-sky-600' : 
                                         (selectedDoc === row.original ? 'bg-sky-50 border-sky-500' : 'border-transparent hover:bg-gray-100')}
                                    `}
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

            {/* ★ FIXED: Sidebar with restored content */}
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

function IndeterminateCheckbox({
    indeterminate,
    className = '',
    ...rest
}: { indeterminate?: boolean } & React.HTMLProps<HTMLInputElement>) {
    const ref = React.useRef<HTMLInputElement>(null!);

    React.useEffect(() => {
        if (typeof indeterminate === 'boolean') {
            ref.current.indeterminate = !rest.checked && indeterminate;
        }
    }, [ref, indeterminate, rest.checked]);
    
    // Changed the icon logic slightly for better visual feedback
    const icon = rest.checked ? <IoCheckbox className="text-sky-600" /> : 
                 indeterminate ? <IoCheckbox className="text-sky-400" /> : 
                 <IoSquareOutline className="text-gray-400" />;

    return (
        <label className="flex items-center justify-center cursor-pointer">
            <input
                type="checkbox"
                ref={ref}
                className="opacity-0 absolute h-0 w-0"
                {...rest}
            />
            <div className="text-xl">
                 {icon}
            </div>
        </label>
    );
}

export default GridView;