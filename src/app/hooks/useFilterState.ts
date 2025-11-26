import { useState, useCallback, useEffect } from "react";

export const useFilterState = (initialSearchType: "any" | "all" | null) => {
  const [searchType, setSearchType] = useState<"any" | "all">(initialSearchType || "any");
  const [yearFilter, setYearFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  
  const [selectedDocTypeValues, setSelectedDocTypeValues] = useState<Set<string>>(new Set());
  const [selectedBranchTypeValues, setSelectedBranchTypeValues] = useState<Set<string>>(new Set());
  const [selectedExtensionTypeValues, setSelectedExtensionTypeValues] = useState<Set<string>>(new Set());
  
  const [parentsOnly, setParentsOnly] = useState<boolean>(false);
  const [simpleSearchFilters, setSimpleSearchFilters] = useState<Record<string, string>>({});


    // ✅ NEW
  const [enableFuzzy, setEnableFuzzy] = useState(false);

    // ★ NEW: Sync state when URL parameter changes
  useEffect(() => {
    if (initialSearchType) {
      setSearchType(initialSearchType);
    }
  }, [initialSearchType]);


  // Generic toggle handler for Sets
  const createSetToggler = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (value: string) => {
    setter(prev => {
      const newSet = new Set(prev);
      newSet.has(value) ? newSet.delete(value) : newSet.add(value);
      return newSet;
    });
  };

  const clearAllFilters = useCallback(() => {
    setYearFilter('');
    setFromDate('');
    setToDate('');
    setSearchType('any');
    setSelectedDocTypeValues(new Set());
    setSelectedBranchTypeValues(new Set());
    setSelectedExtensionTypeValues(new Set());
    setParentsOnly(false);
    setSimpleSearchFilters({});

      // ✅ NEW: Reset fuzzy when clearing filters
    setEnableFuzzy(false);
  }, []);

  return {
    searchType, setSearchType,
    yearFilter, setYearFilter,
    fromDate, setFromDate,
    toDate, setToDate,
    selectedDocTypeValues, handleDocTypeChange: createSetToggler(setSelectedDocTypeValues),
    selectedBranchTypeValues, handleBranchTypeChange: createSetToggler(setSelectedBranchTypeValues),
    selectedExtensionTypeValues, handleExtensionTypeChange: createSetToggler(setSelectedExtensionTypeValues),
    parentsOnly, setParentsOnly,
    simpleSearchFilters, setSimpleSearchFilters,
    enableFuzzy, setEnableFuzzy,
    clearAllFilters
  };
};