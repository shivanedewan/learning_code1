import React, { useState, useEffect } from 'react';

// import { Modal } from './Modal';
import {Modal} from './OptionalModal2'

interface DocumentActionsProps {
  filePath: string; 
  fileName: string;
  isAttachment?: boolean;
  latestProphecyId?: string;
  onView : ()=> void;

}



const DocumentActions: React.FC<DocumentActionsProps> = ({ filePath, fileName, onView }) => {
  
  // Download logic remains here as it doesn't affect navigation
  const handleDownloadDocument = () => {
    const pythonServerUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || `http://localhost:8000`;
    const downloadUrl = `${pythonServerUrl}/api/documents/${encodeURIComponent(filePath)}?action=download`;
    try {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
        alert("Failed to initiate download.");
    }
  };

  return (
    <div className="flex space-x-2 my-2">
      {/* ★ View button now just calls the prop */}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        onClick={onView}
        title="Open or preview document"
      >
        View
      </button>

      <button
        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        onClick={handleDownloadDocument}
        title="Download document"
      >
        Download
      </button>
      
      {/* ★ NO MODAL HERE anymore */}
    </div>
  );
};

export default DocumentActions;