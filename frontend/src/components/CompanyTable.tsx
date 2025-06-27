import { useState, useEffect, useCallback } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { DataGrid } from "@mui/x-data-grid";
import { getCollectionsById, toggleCompanyLike } from "../utils/jam-api";
import {
  createTransferJob,
  getTransferJobStatus,
  getCompaniesTransferStatus,
} from "../utils/transfer-api";
import { getCompanyTableColumns } from "./CompanyTableColumns";
import {
  RowStatus,
  RowStatuses,
  Collection,
  Company,
  CompanyTableComponentProps,
} from "../types";
import CompanyTableToolbar from "./CompanyTableToolbar";
import CompanyTableFooter from "./CompanyTableFooter";
import { useSearch } from "../utils/useApi";

const createRowStatuses = (): RowStatuses => ({});

const updateRowStatus = (
  rowStatuses: RowStatuses,
  rowId: number,
  status: RowStatus
): RowStatuses => ({
  ...rowStatuses,
  [rowId]: status,
});

const loadTransferStatuses = async (
  response: Company[],
  setRowStatuses: (statuses: RowStatuses) => void
) => {
  if (response.length === 0) {
    return;
  }

  try {
    const companyIds = response.map((company) => company.id);
    const transferStatuses = await getCompaniesTransferStatus(companyIds);
    const newStatuses: RowStatuses = {};

    for (const company of response) {
      const companyTransferStatuses = transferStatuses[company.id] || [];
      if (companyTransferStatuses.length > 0) {
        const latestStatus = companyTransferStatuses[0];
        if (
          latestStatus.status === "pending" ||
          latestStatus.status === "processing"
        ) {
          newStatuses[company.id] = latestStatus.status as RowStatus;
        }
      }
    }

    setRowStatuses(newStatuses);
  } catch (error) {
    console.error("Failed to load transfer statuses:", error);
  }
};
const CompanyTable = ({
  selectedCollectionId,
  collections,
  currentCollectionId,
  currentCollection,
  currentPage,
  currentPageSize,
  onPageChange,
  onPageSizeChange,
}: CompanyTableComponentProps) => {
  const [response, setResponse] = useState<Company[]>([]);
  const [total, setTotal] = useState<number>();
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const [rowStatuses, setRowStatuses] = useState<RowStatuses>(
    createRowStatuses()
  );
  const [isTransferring, setIsTransferring] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [lastTransferTarget, setLastTransferTarget] =
    useState<Collection | null>(null);

  // Search functionality
  const { searchQuery, debouncedSearchQuery, handleSearchChange } = useSearch();

  // Calculate offset from current page and page size
  const offset = currentPage * currentPageSize;

  const fetchData = useCallback(async () => {
    const startTime = performance.now();
    try {
      const newResponse = await getCollectionsById(
        selectedCollectionId,
        offset,
        currentPageSize,
        debouncedSearchQuery
      );
      const endTime = performance.now();
      const duration = endTime - startTime;
      setLoadTime(duration);
      setResponse(newResponse.companies);
      setTotal(newResponse.total);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [selectedCollectionId, offset, currentPageSize, debouncedSearchQuery]);

  useEffect(() => {
    fetchData();
  }, [
    selectedCollectionId,
    offset,
    currentPageSize,
    refreshTrigger,
    debouncedSearchQuery,
    fetchData,
  ]);

  // Reset to first page when search query changes
  useEffect(() => {
    if (currentPage !== 0) {
      onPageChange(0);
    }
  }, [debouncedSearchQuery, currentPage, onPageChange]);

  useEffect(() => {
    loadTransferStatuses(response, setRowStatuses);
  }, [response]);

  useEffect(() => {
    if (!currentJobId || !isTransferring) return;

    const pollInterval = setInterval(async () => {
      try {
        const jobStatus = await getTransferJobStatus(currentJobId);

        const newStatuses: RowStatuses = {};
        jobStatus.items.forEach((item) => {
          if (item.status === "pending" || item.status === "processing") {
            newStatuses[item.company_id] = item.status as RowStatus;
          }
        });

        setRowStatuses(newStatuses);

        if (jobStatus.pending_count === 0 && jobStatus.processing_count === 0) {
          setIsTransferring(false);
          setCurrentJobId(null);
          clearInterval(pollInterval);

          // Check if we need to refresh data for liked status updates
          const isLikesCollection =
            lastTransferTarget?.collection_name === "Liked Companies List";
          const isCurrentCollectionLikes =
            currentCollection?.collection_name === "Liked Companies List";

          // Refresh data if we're on the likes collection or if we added to likes collection
          if (isLikesCollection || isCurrentCollectionLikes) {
            setRefreshTrigger((prev) => prev + 1);
          }

          setLastTransferTarget(null);

          if (jobStatus.error_count === 0) {
            showToast(
              `Successfully added ${jobStatus.success_count} companies`,
              "success"
            );
          } else if (jobStatus.success_count === 0) {
            showToast(
              `Failed to add ${jobStatus.error_count} companies`,
              "error"
            );
          } else {
            showToast(
              `Added ${jobStatus.success_count} companies, ${jobStatus.error_count} failed`,
              "info"
            );
          }
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [
    currentJobId,
    isTransferring,
    collections,
    currentCollection,
    lastTransferTarget,
  ]);

  const showToast = (
    message: string,
    severity: "success" | "error" | "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const initiateTransfer = async (
    companyIds: number[],
    targetCollection: Collection
  ) => {
    setIsTransferring(true);
    setLastTransferTarget(targetCollection);

    try {
      const transferJob = await createTransferJob({
        company_ids: companyIds,
        source_collection_id: selectedCollectionId,
        collection_id: targetCollection.id,
      });

      setCurrentJobId(transferJob.job_id);

      companyIds.forEach((id) => {
        setRowStatuses((prev) => updateRowStatus(prev, id, "pending"));
      });

      setSelectedCompanyIds([]);
    } catch (error) {
      console.error("Failed to initiate transfer:", error);
      setIsTransferring(false);
      setLastTransferTarget(null);
      showToast("Failed to initiate transfer", "error");
    }
  };

  const onDeselectAll = () => {
    setSelectedCompanyIds([]);
  };

  const onRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const onSelectAll = async () => {
    if (total) {
      try {
        // Fetch all companies in the collection to get their actual IDs
        const allCompaniesResponse = await getCollectionsById(
          selectedCollectionId,
          0,
          total
        );
        const allCompanyIds = allCompaniesResponse.companies.map(
          (company) => company.id
        );
        setSelectedCompanyIds(allCompanyIds);
      } catch (error) {
        console.error("Failed to fetch all companies for select all:", error);
        showToast("Failed to select all companies", "error");
      }
    }
  };

  const handleToggleLike = async (companyId: number) => {
    try {
      const result = await toggleCompanyLike(companyId);

      // Update the local state immediately for better UX
      setResponse((prev) =>
        prev.map((company) =>
          company.id === companyId
            ? { ...company, liked: result.liked }
            : company
        )
      );

      showToast(result.message, "success");
    } catch (error) {
      console.error("Failed to toggle like:", error);
      showToast("Failed to update like status", "error");
    }
  };

  const columns = getCompanyTableColumns(rowStatuses, handleToggleLike);

  return (
    <>
      <CompanyTableToolbar
        isTransferring={isTransferring}
        selectedCount={selectedCompanyIds.length}
        selectedCompanyIds={selectedCompanyIds}
        collections={collections}
        currentCollectionId={currentCollectionId}
        initiateTransfer={initiateTransfer}
        onDeselectAll={onDeselectAll}
        onSelectAll={onSelectAll}
        total={total}
        loadTime={loadTime}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onRefresh={onRefresh}
      />
      <div
        className="table-container flex flex-col h-full w-full min-w-0 overflow-hidden"
        style={{ minHeight: 0 }}
      >
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
          <DataGrid
            rows={response}
            rowHeight={44}
            columns={columns}
            paginationModel={{ page: currentPage, pageSize: currentPageSize }}
            rowCount={total}
            pagination
            checkboxSelection
            onRowSelectionModelChange={(newSelection) => {
              // Convert the new selection to numbers and merge with existing selections
              const newSelectionNumbers = newSelection as number[];
              const currentSelection = new Set(selectedCompanyIds);

              // Add newly selected rows
              newSelectionNumbers.forEach((id) => currentSelection.add(id));

              // Remove deselected rows (rows that were in current selection but not in new selection)
              const currentRowIds = new Set(response.map((row) => row.id));
              selectedCompanyIds.forEach((id) => {
                if (
                  currentRowIds.has(id) &&
                  !newSelectionNumbers.includes(id)
                ) {
                  currentSelection.delete(id);
                }
              });

              setSelectedCompanyIds(Array.from(currentSelection));
            }}
            rowSelectionModel={selectedCompanyIds.filter((id) =>
              response.some((row) => row.id === id)
            )}
            paginationMode="server"
            onPaginationModelChange={(newMeta) => {
              onPageSizeChange(newMeta.pageSize);
              onPageChange(newMeta.page);
            }}
            getRowClassName={(params) => {
              const status = rowStatuses[params.id as number];
              return status === "pending"
                ? "row-pending"
                : status === "success"
                ? "row-success"
                : status === "error"
                ? "row-error"
                : "";
            }}
            sx={{
              border: "none",
              fontSize: "1rem",
              borderRadius: 3,
              height: "100%",
              "& .row-pending": {
                opacity: 0.6,
              },
              "& .row-success": {
                backgroundColor: "#f5fef9", // very faint green
                "& .MuiDataGrid-cell": {
                  borderLeft: "4px solid #8ed1b9", // thin green bar
                  borderRight: "none",
                  "&:not(:first-of-type)": {
                    borderLeft: "none",
                  },
                },
              },
              "& .row-error": {
                backgroundColor: "#fff8f6", // faint red
                "& .MuiDataGrid-cell": {
                  borderLeft: "4px solid #f28b82", // thin red bar
                  borderRight: "none",
                  "&:not(:first-of-type)": {
                    borderLeft: "none",
                  },
                },
              },
              "& .status-header": {
                background: "transparent !important",
                border: "none !important",
                pointerEvents: "none !important",
              },
              "& .status-cell": {
                cursor: "default",
                background: "transparent !important",
                pointerEvents: "none !important",
              },
              "& .status-cell:focus, & .status-cell:focus-within, & .status-cell.MuiDataGrid-cell--editing, & .status-cell.MuiDataGrid-cell--withBorder":
                {
                  outline: "none !important",
                  border: "none !important",
                  boxShadow: "none !important",
                  background: "transparent !important",
                },
              "& .MuiDataGrid-columnSeparator": {
                display: "none !important",
              },
            }}
            hideFooter={true}
            hideFooterPagination={true}
            hideFooterSelectedRowCount={true}
          />
        </div>

        <CompanyTableFooter
          offset={offset}
          pageSize={currentPageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
};

export default CompanyTable;
