"use client";

import React, { useEffect, useState, useCallback, FormEvent } from "react";
import { FaList, FaTh } from 'react-icons/fa';

// --- Components ---
import FiltersSidebar from "../components/FiltersSidebar";
import SearchResultsArea from "../components/SearchResultsArea";
import Header from "../components/Header";
import GridView from "../components/GridView";

// --- Constants ---
import { DOCTYPES_MAP, BRANCHES_MAP, SEARCH_TYPES, EXTENSIONS_MAP } from '../constant';
import { Document } from '../types';

// --- Hooks ---
// ★ IMPORT THE HOOKS HERE ★
import { useUrlParams } from "../hooks/useUrlParams";
import { useFilterState } from "../hooks/useFilterState";
import { useDocumentApi } from "../hooks/useDocumentApi";
import { FILE } from "dns";

const DocumentList = () => {
  // 1. Initialize Custom Hooks
  const urlState = useUrlParams();
  const filterState = useFilterState(urlState.initialSearchType);
  const apiState = useDocumentApi();

  // 2. View State (Local UI state)
  const [view, setView] = useState('reader');
  const [currentViewTitle, setCurrentViewTitle] = useState<string | null>(null);
  const [gridPageSize, setGridPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  // 3. Sync Header Input with URL
  useEffect(() => {
    const formattedQuery = urlState.parsedApiQueries.map(q => `"${q}"`).join(', ');
    setHeaderSearchQuery(formattedQuery);
  }, [urlState.parsedApiQueries]);

  // --- Handlers ---
  const handleHeaderSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    filterState.setSimpleSearchFilters({}); 
    urlState.updateUrlWithQuery(headerSearchQuery, filterState.searchType);
  };

  const handleSimpleSearchSubmit = (data: { filters: Record<string, string>, query: string }) => {
    filterState.setSimpleSearchFilters(data.filters);
    setHeaderSearchQuery(data.query);
    urlState.updateUrlWithQuery(data.query, filterState.searchType);
  };

  const handleAttachmentLinkClick = useCallback(async (clickedDoc: Document) => {
    const ProphecyId = clickedDoc.ProphecyId || "";
    const is_attachment = clickedDoc.IsAttachment === true || String(clickedDoc.IsAttachment).toLowerCase() === "true";
    const parentProphecyId = clickedDoc.ParentProphecyId || "";
    
    const newUrl = `${window.location.origin}${window.location.pathname}?ProphecyId=${encodeURIComponent(ProphecyId)}&ParentProphecyId=${encodeURIComponent(parentProphecyId)}&isAttachment=${encodeURIComponent(is_attachment)}`;
    window.open(newUrl, '_blank');
  }, []);


    // ★ NEW HANDLER: Wrapper to update URL when Search Type changes
  const handleSearchTypeChangeWrapper = (newType: "any" | "all") => {
    // 1. Visually update state immediately (optional, but makes UI snappy)
    filterState.setSearchType(newType);

    // 2. Update the URL 
    // We pass the raw query string (e.g. '["analysis","information"]') 
    // The helper function logic successfully extracts terms from this format.
    urlState.updateUrlWithQuery(urlState.rawQueryFromUrl, newType);
  };


  const handleLoadMore = () => {
    apiState.fetchDocs({
        queries: urlState.parsedApiQueries,
        simpleFilters: filterState.simpleSearchFilters,
        filtersState: filterState,
        viewState: { view, currentPage, gridPageSize, searchAfter: apiState.searchAfter },
        isLoadMore: true
    });
  };

  // --- Effects (Data Wiring) ---

  // Effect A: Attachment Mode
  useEffect(() => {
    if (urlState.docIdFromUrl) {
      apiState.setDocuments([]);
      apiState.setSearchAfter(null);
      apiState.fetchDocs({
        queries: [], simpleFilters: {}, filtersState: filterState,
        viewState: { view, currentPage, gridPageSize, searchAfter: null },
        attachmentQuery: {
          ProphecyId: urlState.docIdFromUrl,
          ParentProphecyId: urlState.parentIdFromUrl,
          isAttachment: urlState.IsAttachmentFromUrl
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlState.docIdFromUrl, urlState.parentIdFromUrl, urlState.IsAttachmentFromUrl]);

  // Effect B: New Search / Filter Changes
  useEffect(() => {
    if (urlState.docIdFromUrl) return; 

    const hasSearchCriteria = urlState.parsedApiQueries.length > 0 || Object.keys(filterState.simpleSearchFilters).length > 0;

    if (hasSearchCriteria) {
      apiState.setDocuments([]);
      apiState.setSearchAfter(null);

      // If Grid view and not on page 1, reset page (Triggers Effect C)
      if (view === 'grid' && currentPage !== 1) {
        setCurrentPage(1);
      } else {
        // Fetch immediately
        apiState.fetchDocs({
            queries: urlState.parsedApiQueries,
            simpleFilters: filterState.simpleSearchFilters,
            filtersState: filterState,
            viewState: { view, currentPage: 1, gridPageSize, searchAfter: null }
        });
      }
    } else {
      apiState.setDocuments([]);
      apiState.setSearchAfter(null);
      if (urlState.rawQueryFromUrl) apiState.setError("Invalid or empty search query.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    urlState.parsedApiQueries, filterState.yearFilter, filterState.selectedDocTypeValues, 
    filterState.selectedBranchTypeValues, filterState.selectedExtensionTypeValues, 
    filterState.searchType, filterState.fromDate, filterState.toDate, 
    filterState.parentsOnly, filterState.simpleSearchFilters, urlState.docIdFromUrl,
      // ✅ NEW: Re-fetch when fuzzy search changes
    filterState.enableFuzzy,
  ]);

  // Effect C: Grid Pagination Changes
  useEffect(() => {
    const hasSearchCriteria = urlState.parsedApiQueries.length > 0 || Object.keys(filterState.simpleSearchFilters).length > 0;
    
    if (view === 'grid' && hasSearchCriteria) {
        apiState.fetchDocs({
            queries: urlState.parsedApiQueries,
            simpleFilters: filterState.simpleSearchFilters,
            filtersState: filterState,
            viewState: { view, currentPage, gridPageSize, searchAfter: null }
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, gridPageSize]); 

  // Effect D: View Switch Logic
  useEffect(() => {
    const hasSearchCriteria = urlState.parsedApiQueries.length > 0 || Object.keys(filterState.simpleSearchFilters).length > 0;
    if(hasSearchCriteria) {
        if (currentPage !== 1) setCurrentPage(1);
        else {
             apiState.fetchDocs({
                queries: urlState.parsedApiQueries,
                simpleFilters: filterState.simpleSearchFilters,
                filtersState: filterState,
                viewState: { view, currentPage: 1, gridPageSize, searchAfter: null }
            });
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // --- Render ---
  return (
    <div className="bg-white text-black">
      <Header 
        searchQuery={headerSearchQuery}
        onSearchQueryChange={setHeaderSearchQuery}
        onSearchSubmit={handleHeaderSearchSubmit}
        onSimpleSearchSubmit={handleSimpleSearchSubmit}
      />
      <div className="flex h-[calc(100vh-4rem)]">
        {view === 'reader' && (
          <FiltersSidebar
            searchQueries={urlState.parsedApiQueries}
            handleClearAllFilters={filterState.clearAllFilters}
            
            yearFilter={filterState.yearFilter} setYearFilter={filterState.setYearFilter}
            fromDate={filterState.fromDate} setFromDate={filterState.setFromDate}
            toDate={filterState.toDate} setToDate={filterState.setToDate}
            searchType={filterState.searchType} handleSearchTypeChange={handleSearchTypeChangeWrapper}
            
            selectedDocTypeValues={filterState.selectedDocTypeValues} handleDocTypeChange={filterState.handleDocTypeChange}
            docTypeCounts={apiState.docTypeCounts}
            
            selectedBranchTypeValues={filterState.selectedBranchTypeValues} handleBranchTypeChange={filterState.handleBranchTypeChange}
            branchTypeCounts={apiState.branchTypeCounts}
            
            selectedExtensionTypeValues={filterState.selectedExtensionTypeValues} handleExtensionTypeChange={filterState.handleExtensionTypeChange}
            extensionTypeCounts={apiState.extensionTypeCounts}
            
            parentsOnly={filterState.parentsOnly}
            onToggleParentsOnly={filterState.setParentsOnly}

            enableFuzzy={filterState.enableFuzzy}
            onToggleFuzzy={filterState.setEnableFuzzy}
            
            DOCTYPES_MAP={DOCTYPES_MAP}
            BRANCHES_MAP={BRANCHES_MAP}
            EXTENSIONS_MAP={EXTENSIONS_MAP}
            SEARCH_TYPES={SEARCH_TYPES}
            isLoading={apiState.loading}
          />
        )}

        <div className={`${view === 'reader' ? 'w-5/6' : 'w-full'} p-4 h-full flex flex-col`}>
          <div className="flex justify-end mb-4 flex-shrink-0">
            <button onClick={() => setView('reader')} className={`p-2 ${view === 'reader' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} title="Reader View"><FaList /></button>
            <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} title="Grid View"><FaTh /></button>
          </div>
          <div className="flex-grow min-h-0">

              {/* ✅ NEW: Smart Search Active Badge */}
              {filterState.enableFuzzy && (
                <div className="mb-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-300 text-blue-700 text-sm shadow-sm">
                    <span className="font-semibold">Smart Search Active</span>
                    <span className="text-xs text-blue-600">(spelling tolerance enabled)</span>
                  {/* ✅ NEW: Cross button to disable fuzzy */}
                  <button
                    onClick={() => filterState.setEnableFuzzy(false)}
                    className="ml-2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-blue-200 text-blue-600 hover:text-red-600 transition"
                    title="Disable Smart Search"
                  >
                    ×
                  </button>
                  </div>
                </div>
              )}
              
              {view === 'reader' ? (
                <SearchResultsArea
                loading={apiState.loading}
                error={apiState.error}
                documents={apiState.documents}
                searchQuery={urlState.parsedApiQueries}
                searchAfter={apiState.searchAfter}
                fetchDocuments={handleLoadMore} 
                handleAttachmentLinkClick={handleAttachmentLinkClick}
                currentViewTitle={currentViewTitle}
              />
            ) : (
              <GridView
                documents={apiState.documents}
                pageSize={gridPageSize}
                currentPage={currentPage}
                totalDocuments={apiState.totalDocuments}
                onPageChange={setCurrentPage}
                onPageSizeChange={setGridPageSize}
                isLoading={apiState.loading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentList;