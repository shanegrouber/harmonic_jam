import { useEffect, useState, useRef } from "react";
import CompanyTable from "./CompanyTable";
import { getCollectionsMetadata } from "../utils/jam-api";
import useApi from "../utils/useApi";
import Sidebar from "./Sidebar";

const Page = () => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>();
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [currentPageSize, setCurrentPageSize] = useState<number>(25);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  const [previousCollectionId, setPreviousCollectionId] = useState<string>();
  const { data: collectionResponse } = useApi(() => getCollectionsMetadata());

  // Use ref to track if we're updating URL to prevent infinite loops
  const isUpdatingUrl = useRef(false);

  // Read initial state from URL parameters (only once on mount)
  useEffect(() => {
    if (hasInitialized) return;

    const urlParams = new URLSearchParams(window.location.search);
    const collectionParam = urlParams.get("collection");
    const pageParam = urlParams.get("page");
    const pageSizeParam = urlParams.get("pageSize");

    if (collectionParam) {
      setSelectedCollectionId(collectionParam);
      setPreviousCollectionId(collectionParam);
    }
    if (pageParam) {
      setCurrentPage(parseInt(pageParam, 10));
    }
    if (pageSizeParam) {
      setCurrentPageSize(parseInt(pageSizeParam, 10));
    }

    setHasInitialized(true);
  }, [hasInitialized]);

  // Set default collection if none selected
  useEffect(() => {
    if (
      !selectedCollectionId &&
      collectionResponse &&
      collectionResponse.length > 0
    ) {
      setSelectedCollectionId(collectionResponse[0].id);
      setPreviousCollectionId(collectionResponse[0].id);
    }
  }, [collectionResponse, selectedCollectionId]);

  // Trigger URL update when default collection is set
  useEffect(() => {
    if (
      hasInitialized &&
      selectedCollectionId &&
      !window.location.search.includes("collection=")
    ) {
      // Force a URL update when we set a default collection
      isUpdatingUrl.current = false;
    }
  }, [hasInitialized, selectedCollectionId]);

  // Handle collection changes - reset page to 0 when collection changes
  useEffect(() => {
    if (
      hasInitialized &&
      selectedCollectionId &&
      previousCollectionId &&
      selectedCollectionId !== previousCollectionId
    ) {
      setCurrentPage(0);
      setPreviousCollectionId(selectedCollectionId);
    } else if (
      hasInitialized &&
      selectedCollectionId &&
      !previousCollectionId
    ) {
      setPreviousCollectionId(selectedCollectionId);
    }
  }, [selectedCollectionId, previousCollectionId, hasInitialized]);

  // Update URL parameters when state changes
  useEffect(() => {
    if (!hasInitialized || isUpdatingUrl.current) return;

    isUpdatingUrl.current = true;

    const urlParams = new URLSearchParams();

    if (selectedCollectionId) {
      urlParams.set("collection", selectedCollectionId);
    }

    // Always include page parameter to maintain state
    urlParams.set("page", currentPage.toString());

    // Always include pageSize parameter if it's not the default (25)
    if (currentPageSize !== 25) {
      urlParams.set("pageSize", currentPageSize.toString());
    }

    const newUrl = urlParams.toString()
      ? `?${urlParams.toString()}`
      : window.location.pathname;
    window.history.pushState({}, "", newUrl);

    // Reset the flag after a short delay to allow state updates to settle
    setTimeout(() => {
      isUpdatingUrl.current = false;
    }, 0);
  }, [selectedCollectionId, currentPage, currentPageSize, hasInitialized]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    // Calculate what page would maintain a similar position in the data
    const currentFirstItemIndex = currentPage * currentPageSize;
    const newPage = Math.floor(currentFirstItemIndex / newPageSize);

    setCurrentPageSize(newPageSize);
    setCurrentPage(newPage);
  };

  return (
    <div className="fixed inset-0 flex h-screen w-screen bg-[#f7f8fa] overflow-hidden">
      <Sidebar
        collections={collectionResponse || []}
        selectedCollectionId={selectedCollectionId}
        setSelectedCollectionId={setSelectedCollectionId}
      />
      {/* Main Content fills rest, only table scrolls */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <div className="flex-1 h-full min-w-0 overflow-hidden p-8">
          {selectedCollectionId && (
            <CompanyTable
              selectedCollectionId={selectedCollectionId}
              collections={collectionResponse || []}
              currentCollectionId={selectedCollectionId}
              currentCollection={collectionResponse?.find(
                (col) => col.id === selectedCollectionId
              )}
              currentPage={currentPage}
              currentPageSize={currentPageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Page;
