// Make this a Client Component because we need state and event handlers
'use client';

import React, { useState, FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DocuVisionLogo from './DocuvisionLogo';

// Define the search type options
type SearchType = 'all' | 'any';

export default function HomePage() {
    const [query, setQuery] = useState<string>('');
    const [searchType, setSearchType] = useState<SearchType>('all');
    const router = useRouter();

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault(); 

        if (!query.trim()) {
            console.log('Search query is empty');
            return;
        }

        const phraseMatches = query.matchAll(/"([^"]*)"/g);
        let extractedPhrases = Array.from(phraseMatches, match => match[1])
                                     .filter(phrase => phrase.trim() !== "");

        if (extractedPhrases.length === 0 && query.trim() !== "") {
            extractedPhrases = [query.trim()];
        }

        if (extractedPhrases.length === 0) {
             console.log('No valid phrases found in query:', query);
             alert('Please enter search terms enclosed in double quotes, e.g., "term one" "term two".');
             return;
        }

        const params = new URLSearchParams({
            q: JSON.stringify(extractedPhrases), 
            type: searchType,
        });
        router.push(`/SearchTest?${params.toString()}`);
    };

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-start p-4 pt-36 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Subtle mesh gradient background */}
            {/* Subtle mesh gradient background */}
            <div className="absolute inset-0 opacity-40" style={{
                backgroundImage: `radial-gradient(at 15% 25%, rgba(168, 85, 247, 0.2) 0px, transparent 50%),
                                 radial-gradient(at 85% 75%, rgba(236, 72, 153, 0.2) 0px, transparent 50%),
                                 radial-gradient(at 50% 50%, rgba(129, 140, 248, 0.15) 0px, transparent 50%)`
            }}></div>


            <div className="relative w-full max-w-2xl flex flex-col items-center z-10">
                {/* Logo */}
                <div className="mb-8 flex justify-center"> 
                    <div style={{ width: '900px', height: '120px' }}>
                        <DocuVisionLogo />
                    </div>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="w-full flex flex-col items-center">
                    {/* Search Input */}
                    <div className="relative w-full max-w-xl mb-6">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder='e.g., "machine learning" "data science trends"'
                            className="w-full px-6 py-4 bg-white border border-gray-200 rounded-full shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:shadow-md transition-all duration-200"
                            aria-label="Search documents"
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-sm hover:shadow-md"
                            aria-label="Submit search"
                        >
                            <svg
                                className="h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Search Options & Submit Button */}
                    <div className="bg-white rounded-2xl px-8 py-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                        {/* Radio Buttons for Search Type */}
                        <fieldset className="flex space-x-6">
                            <legend className="sr-only">Search Type</legend>
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="searchAll"
                                    name="searchType"
                                    value="all"
                                    checked={searchType === 'all'}
                                    onChange={() => setSearchType('all')}
                                    className="mr-2 w-4 h-4 accent-purple-500 cursor-pointer"
                                />
                                <label htmlFor="searchAll" className="text-sm font-medium text-gray-700 cursor-pointer hover:text-purple-600 transition-colors">
                                    All of these phrases
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="searchAny"
                                    name="searchType"
                                    value="any"
                                    checked={searchType === 'any'}
                                    onChange={() => setSearchType('any')}
                                    className="mr-2 w-4 h-4 accent-purple-500 cursor-pointer"
                                />
                                <label htmlFor="searchAny" className="text-sm font-medium text-gray-700 cursor-pointer hover:text-purple-600 transition-colors">
                                    Any of these phrases
                                </label>
                            </div>
                        </fieldset>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-semibold py-2.5 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            Search Documents
                        </button>
                    </div>
                </form>

                {/* Helper text */}
                <p className="mt-6 text-xs text-gray-500 bg-white/60 rounded-full px-4 py-2 backdrop-blur-sm">
                   Enter phrases enclosed in double quotes. e.g., "term one" "another term"
                </p>
            </div>
        </main>
    );
}

