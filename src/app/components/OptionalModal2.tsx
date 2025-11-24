import React, { useEffect } from "react";
// ★ NEW ICONS for Navigation
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  viewUrl?: string;
  onDownload?: () => void;
  onDownloadAll?: () => void;
  downloadLabel?: string;
  downloadAllLabel?: string;
  filePath?: string;
  latestProphecyId?: string;
  isAttachment?: boolean;

  // ★ NEW: Navigation Props
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  isLoading,
  viewUrl,
  onDownload,
  onDownloadAll,
  downloadLabel = "Download this",
  downloadAllLabel = "Download all",
  filePath,
  latestProphecyId,
  isAttachment,
  // ★ Destructure new props
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}) => {


  useEffect(() => {
  if (isOpen) {
    // Lock background scroll
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }

  return () => {
    document.body.style.overflow = "";
  };
}, [isOpen]);

  
  // Close on Escape & Handle Left/Right Arrow keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      // ★ NEW: Keyboard navigation
      if (event.key === "ArrowRight" && hasNext && onNext) onNext();
      if (event.key === "ArrowLeft" && hasPrev && onPrev) onPrev();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, hasNext, hasPrev, onNext, onPrev]);

  if (!isOpen) return null;

  const disabled = !!isLoading;
  const baseServer = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || "http://192.168.10.144:8000";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
    >
      {/* 
         ★ LEFT FLOATING BUTTON (Previous) 
         - Absolute positioned to left of screen
         - Centered vertically
         - Visible on Medium screens and up (md:block)
      */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev && onPrev(); }}
          className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 p-3 bg-white/20 hover:bg-white text-white hover:text-blue-600 rounded-full shadow-2xl transition-all duration-200 backdrop-blur-sm hidden md:block"
          title="Previous Document"
        >
          <FaChevronLeft size={30} />
        </button>
      )}

      {/* 
         ★ RIGHT FLOATING BUTTON (Next) 
         - Absolute positioned to right of screen
      */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext && onNext(); }}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 p-3 bg-white/20 hover:bg-white text-white hover:text-blue-600 rounded-full shadow-2xl transition-all duration-200 backdrop-blur-sm hidden md:block"
          title="Next Document"
        >
          <FaChevronRight size={30} />
        </button>
      )}

      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col z-50"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          
          <div className="flex items-center space-x-4 overflow-hidden">
            <h2 className="text-xl font-semibold text-gray-800 break-all truncate max-w-md" title={title}>
              {title}
            </h2>
            
            {/* ★ REMOVED: The small buttons from the header are gone now. */}
          </div>

          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 mr-2">
              {/* Single-file download */}
              {filePath ? (
                <a
                  onClick={(e) => e.stopPropagation()}
                  href={`${baseServer.replace(/\/$/, "")}/api/documents/${encodeURIComponent(filePath)}?action=download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={downloadLabel}
                  aria-label={downloadLabel}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-700 hover:shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M3 14a1 1 0 011-1h3v-4a1 1 0 112 0v4h3a1 1 0 011 1v1a1 1 0 11-2 0v-1H6v1a1 1 0 11-2 0v-1zM9 3a1 1 0 012 0v6h2.293a1 1 0 01.707 1.707l-3.293 3.293a1 1 0 01-1.414 0L6 10.707A1 1 0 016.707 9H9V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">{downloadLabel}</span>
                </a>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); if (!disabled && onDownload) onDownload(); }}
                  disabled={disabled || !onDownload}
                  title={downloadLabel}
                  aria-label={downloadLabel}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    disabled || !onDownload ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:shadow-sm"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M3 14a1 1 0 011-1h3v-4a1 1 0 112 0v4h3a1 1 0 011 1v1a1 1 0 11-2 0v-1H6v1a1 1 0 11-2 0v-1zM9 3a1 1 0 012 0v6h2.293a1 1 0 01.707 1.707l-3.293 3.293a1 1 0 01-1.414 0L6 10.707A1 1 0 016.707 9H9V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">{downloadLabel}</span>
                </button>
              )}

              {/* Download all */}
              {latestProphecyId ? (
                <a
                  onClick={(e) => e.stopPropagation()}
                  href={`${baseServer.replace(/\/$/, "")}/download_all?parent_app_id=${encodeURIComponent(latestProphecyId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={downloadAllLabel}
                  aria-label={downloadAllLabel}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-white text-gray-700 hover:shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M4 3a1 1 0 00-1 1v9a3 3 0 003 3h8a3 3 0 003-3V6.414A2 2 0 0015.586 5L12 1.414A2 2 0 0010.586 1H7a1 1 0 00-1 1z" />
                    <path d="M7 8a1 1 0 012 0v3h2V8a1 1 0 112 0v3h1a1 1 0 110 2H6a1 1 0 110-2h1V8z" />
                  </svg>
                  <span className="hidden sm:inline">{downloadAllLabel}</span>
                </a>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); if (!disabled && onDownloadAll) onDownloadAll(); }}
                  disabled={disabled || !onDownloadAll}
                  title={downloadAllLabel}
                  aria-label={downloadAllLabel}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    disabled || !onDownloadAll ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:shadow-sm"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M4 3a1 1 0 00-1 1v9a3 3 0 003 3h8a3 3 0 003-3V6.414A2 2 0 0015.586 5L12 1.414A2 2 0 0010.586 1H7a1 1 0 00-1 1z" />
                    <path d="M7 8a1 1 0 012 0v3h2V8a1 1 0 112 0v3h1a1 1 0 110 2H6a1 1 0 110-2h1V8z" />
                  </svg>
                  <span className="hidden sm:inline">{downloadAllLabel}</span>
                </button>
              )}
            </div>

            {/* "Open in new page" link */}
            {viewUrl ? (
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mr-2 hidden sm:inline"
              >
                Open in new page
              </a>
            ) : null}

            {/* Close button */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="text-gray-500 hover:text-gray-700 text-2xl p-1 leading-none flex-shrink-0 ml-2"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>


        
        </div>

        {/* Content */}
        <div className="p-5 flex-grow overflow-y-auto bg-gray-50">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-600">Loading preview...</p>
            </div>
          ) : (
            <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-4xl mx-auto bg-white p-8 rounded-sm shadow-sm">
              {children}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 rounded-b">
           {/* ★ NEW: Navigation Buttons in Footer (for mobile convenience) */}
           <div className="flex space-x-2">
              <button 
                onClick={onPrev} 
                disabled={!hasPrev || isLoading}
                className={`px-3 py-1 rounded text-sm ${!hasPrev ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}
              >
                Previous
              </button>
              <button 
                onClick={onNext} 
                disabled={!hasNext || isLoading}
                className={`px-3 py-1 rounded text-sm ${!hasNext ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-50'}`}
              >
                Next
              </button>
           </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};