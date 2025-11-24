import React, { useState, useCallback } from 'react';
import DocumentCard from './DocumentCard2';
import { Document } from '../types';
// ★ IMPORT MODAL HERE
import { Modal } from './OptionalModal2';

interface SearchResultsAreaProps {
  loading: boolean;
  error: string | null;
  documents: Document[];
  searchQuery: string[];
  searchAfter: any[] | null;
  fetchDocuments: (isLoadMore: boolean ) => void;
  handleAttachmentLinkClick: (doc: Document) => void;
  currentViewTitle?: string | null;
}

const SearchResultsArea: React.FC<SearchResultsAreaProps> = ({
  loading,
  error,
  documents,
  searchQuery,
  searchAfter,
  fetchDocuments,
  handleAttachmentLinkClick,
  currentViewTitle,
}) => {

  // ★ NEW: Centralized State for Modal and Navigation
  const [selectedDocIndex, setSelectedDocIndex] = useState<number | null>(null);
  const [modalContent, setModalContent] = useState<string>('');
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Configuration (same as it was in DocumentActions)
  const pythonServerUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || `http://localhost:8000`;

  // ★ NEW: Helper to fetch content (Moved logic from DocumentActions to here)
  const fetchDocContent = useCallback(async (doc: Document) => {
    const filePath = doc.SystemPath;
    if (!filePath) return;

    // Helper to check extension (copied from DocumentActions)
    const getFileExtension = (name: string): string | undefined => {
        const lastDot = name.lastIndexOf('.');
        if (lastDot === -1 || lastDot === 0 || lastDot === name.length - 1) return undefined;
        return name.substring(lastDot + 1).toLowerCase();
    };
    
    const fileName = doc.FileName || "Document";
    const fileExtension = getFileExtension(fileName);
    const modalViewExtensions = ['doc', 'docx', 'html'];
    const viewUrlBase = `${pythonServerUrl}/api/documents/${encodeURIComponent(filePath)}`;

    // If supported extension, load in Modal
    if (fileExtension && modalViewExtensions.includes(fileExtension)) {
        setIsModalLoading(true);
        setModalContent(''); 
        
        try {
            const response = await fetch(`${viewUrlBase}?action=view`);
            let responseText = await response.text();

            if (!response.ok) {
                // ... error handling logic ...
                setModalContent(`<p class="text-red-500">Error loading document.</p>`);
            } else {
                setModalContent(responseText || "<p>Preview is empty.</p>");
            }
        } catch (error: any) {
            setModalContent(`<p class="text-red-500">Error: ${error.message}</p>`);
        } finally {
            setIsModalLoading(false);
        }
    } else {
        // Fallback for PDF/Images: Open in new tab and close modal
        window.open(`${viewUrlBase}?action=view`, '_blank');
        setIsModalOpen(false); // Close modal if we opened it for a non-modal file
    }
  }, [pythonServerUrl]);

  // ★ NEW: Handler when "View" is clicked on a Card
  const handleViewDocument = (index: number) => {
      setSelectedDocIndex(index);
      setIsModalOpen(true);
      fetchDocContent(documents[index]);
  };

  // ★ NEW: Navigation Logic
  const handleNext = () => {
    if (selectedDocIndex !== null && selectedDocIndex < documents.length - 1) {
        const newIndex = selectedDocIndex + 1;
        setSelectedDocIndex(newIndex);
        fetchDocContent(documents[newIndex]);
    }
  };

  const handlePrev = () => {
    if (selectedDocIndex !== null && selectedDocIndex > 0) {
        const newIndex = selectedDocIndex - 1;
        setSelectedDocIndex(newIndex);
        fetchDocContent(documents[newIndex]);
    }
  };

  const hasResults = Array.isArray(documents) && documents.length > 0;
  const canLoadMore = !loading && searchAfter && !currentViewTitle;

  // Derive current document for Modal props
  const currentDoc = selectedDocIndex !== null ? documents[selectedDocIndex] : null;

  return (
    <div className="w-full">
      {/* Optional: Display context title */}
      {currentViewTitle && <h2 className="text-xl font-semibold mb-4 text-gray-700">{currentViewTitle}</h2>}

      {/* Error Display */}
      {error && !loading && <p className="text-red-500 p-4 bg-red-100 border border-red-400 rounded mb-4">Error: {error}</p>}

      {/* Loading Indicator */}
      {loading && (
          <div className="text-center mt-6">
              <p>Loading...</p>
              {/* You can add a spinner SVG or component here */}
          </div>
      )}

      {/* No Results Messages */}
      {!error && !loading && !hasResults && (searchQuery || currentViewTitle) && (
          <p className="text-gray-600">No documents found matching your criteria.</p>
      )}
      {!error && !loading && !hasResults && !searchQuery && !currentViewTitle && (
          <p className="text-gray-600">Please enter a search query or select filters to begin.</p>
      )}

      {/* Document List */}
      

      {!loading && hasResults && (
        <div className="space-y-6">
          {documents.map((doc, index) => (
            <DocumentCard
              key={doc.ProphecyId || `${doc.FileName}-${doc.DocumentDate}`}
              doc={doc}
              handleAttachmentLinkClick={handleAttachmentLinkClick}
              // ★ PASS THE VIEW HANDLER with INDEX
              onView={() => handleViewDocument(index)}
            />
          ))}
        </div>
      )}

      {canLoadMore && (
        <div className="mt-6 text-center">
          <button onClick={() => fetchDocuments(true)} className="bg-blue-500 text-white p-2 rounded">
            Load More
          </button>
        </div>
      )}

      {/* ★ RENDER MODAL ONCE HERE */}
      {currentDoc && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={currentDoc.FileName || "Document"}
            isLoading={isModalLoading}
            filePath={currentDoc.SystemPath}
            latestProphecyId={currentDoc.ProphecyId}
            isAttachment={currentDoc.IsAttachment}
            
            // ★ Pass Navigation Props
            onNext={handleNext}
            onPrev={handlePrev}
            hasNext={selectedDocIndex !== null && selectedDocIndex < documents.length - 1}
            hasPrev={selectedDocIndex !== null && selectedDocIndex > 0}
          >
            <div dangerouslySetInnerHTML={{ __html: modalContent }} />
          </Modal>
      )}
    </div>
  );
};

export default SearchResultsArea;