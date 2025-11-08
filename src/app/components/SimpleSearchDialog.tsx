"use client";
import React, { useState } from "react";
import { Document } from "../types";
import { FaPlus, FaTrash, FaTimes } from "react-icons/fa";

interface SimpleSearchDialogProps {
  onClose: () => void;
  // *** MODIFIED: onSubmit now returns an object with filters AND the updated query ***
  onSubmit: (data: { filters: Record<string, string>; query: string }) => void;
  // *** NEW: Receive the initial query from the header search bar ***
  initialQuery: string;
}

const documentFields: (keyof Document)[] = [
  "DocType",
  "Branch",
  "From",
  "To",
  "FileName",
  "DocumentDate",
  "ReportNumber",
  "IngestionDate",
  "IsAttachment",
];

const SimpleSearchDialog: React.FC<SimpleSearchDialogProps> = ({
  onClose,
  onSubmit,
  initialQuery,
}) => {
  const [filters, setFilters] = useState<{ field: string; value: string }[]>([
    { field: "", value: "" },
  ]);
  // *** NEW: State to manage the query string inside the dialog ***
  const [query, setQuery] = useState(initialQuery);

  const handleFieldChange = (index: number, newField: string) => {
    const updated = [...filters];
    updated[index].field = newField;
    setFilters(updated);
  };

  const handleValueChange = (index: number, newValue: string) => {
    const updated = [...filters];
    updated[index].value = newValue;
    setFilters(updated);
  };

  const addFilterRow = () => {
    setFilters([...filters, { field: "", value: "" }]);
  };

  const removeFilterRow = (index: number) => {
    const updated = filters.filter((_, i) => i !== index);
    setFilters(updated);
  };

  const handleSubmit = () => {
    const nonEmptyFilters = filters.filter(
      (f) => f.field && f.value.trim() !== ""
    );
    const result: Record<string, string> = {};
    nonEmptyFilters.forEach((f) => (result[f.field] = f.value));
    
    // *** MODIFIED: Submit both the filters and the current query value ***
    onSubmit({ filters: result, query });
  };

  return (
    <div
      className="
        fixed inset-0 
        flex justify-center items-center 
        bg-black bg-opacity-60 
        backdrop-blur-sm
        z-[9999]
      "
    >
      <div
        className="
          relative 
          bg-gray-900 text-white 
          rounded-xl 
          shadow-2xl 
          w-[600px] 
          max-h-[85vh] 
          overflow-hidden 
          flex flex-col
          border border-gray-700
        "
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-700 px-6 py-4 bg-gray-800">
          <h2 className="text-lg font-semibold">🔍 Refine Your Search</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* *** NEW: Keywords input field *** */}
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <label htmlFor="keywords-input" className="block text-sm font-medium text-gray-300 mb-2">Keywords</label>
            <input
              id="keywords-input"
              type="text"
              value={query}
              placeholder='e.g., "machine learning"'
              onChange={(e) => setQuery(e.target.value)}
              className="
                bg-gray-900 text-white 
                border border-gray-600 
                p-2 rounded-md w-full
                placeholder-gray-400
                focus:ring-2 focus:ring-blue-500 focus:outline-none
              "
            />
          </div>

          {filters.map((filter, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg border border-gray-700"
            >
              <select
                value={filter.field}
                onChange={(e) => handleFieldChange(index, e.target.value)}
                className="
                  bg-gray-900 text-white 
                  border border-gray-600 
                  p-2 rounded-md flex-1 
                  focus:ring-2 focus:ring-blue-500 focus:outline-none
                "
              >
                <option value="">Select Field</option>
                {documentFields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={filter.value}
                placeholder="Enter value"
                onChange={(e) => handleValueChange(index, e.target.value)}
                className="
                  bg-gray-900 text-white 
                  border border-gray-600 
                  p-2 rounded-md flex-1 
                  placeholder-gray-400
                  focus:ring-2 focus:ring-blue-500 focus:outline-none
                "
              />

              <button
                onClick={() => removeFilterRow(index)}
                className="p-2 rounded-md text-red-400 hover:bg-red-800/30"
                title="Remove filter"
              >
                <FaTrash />
              </button>
            </div>
          ))}

          {/* Add Filter Button */}
          <button
            onClick={addFilterRow}
            className="
              flex items-center gap-2 px-4 py-2 
              bg-blue-600 text-white 
              rounded-md hover:bg-blue-700 transition
            "
          >
            <FaPlus size={14} /> Add Filter
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 border-t border-gray-700 px-6 py-4 bg-gray-800">
          <button
            onClick={onClose}
            className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleSearchDialog;