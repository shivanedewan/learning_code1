// import { Link } from "react-router-dom"; // <-- add this import
import Link from 'next/link';
import React, { FormEvent, useState } from 'react';
import { FaSearch, FaUserCircle, FaCog, FaFilter } from 'react-icons/fa';
import SimpleSearchDialog from './SimpleSearchDialog';

interface HeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  // *** MODIFIED: The handler now expects the object with filters and query ***
  onSimpleSearchSubmit: (data: { filters: Record<string, string>; query: string }) => void;
}

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchQueryChange, onSearchSubmit, onSimpleSearchSubmit }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
      <Link
        href="/"
        className="text-2xl font-bold hover:text-blue-400 transition-colors duration-200"
      >
        DOCUVISION
      </Link>

      <div className="flex-1 max-w-xl mx-4">
        <form onSubmit={onSearchSubmit} className="relative">
          <FaSearch className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            placeholder='e.g., "machine learning" "data science trends"'
            className="bg-gray-700 text-white w-full pl-10 pr-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
          />
        </form>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-700" onClick={() => setIsDialogOpen(true)}>
          <FaFilter />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-700">
          <FaCog />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-700">
          <FaUserCircle size={24} />
        </button>
      </div>

      {isDialogOpen && (
        <SimpleSearchDialog
          // *** NEW: Pass the current search query to the dialog ***
          initialQuery={searchQuery}
          onClose={() => setIsDialogOpen(false)}
          // *** MODIFIED: The data object is passed directly to the page's handler ***
          onSubmit={(data) => {
            setIsDialogOpen(false);
            onSimpleSearchSubmit(data);
          }}
        />
      )}
    </header>
  );
};

export default Header;


// i added a filter in header and named it simple search... it take the fields and lets users put values to the field and then 
// submit... i made a SimpleSearchDialogbox which lets me do it 