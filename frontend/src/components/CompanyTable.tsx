import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { getCollectionsById, toggleCompanyLike } from "../utils/jam-api";
import { removeCompaniesFromCollection } from "../utils/transfer-api";
import { getCompanyTableColumns } from "./CompanyTableColumns";
import { CompanyTableComponentProps } from "../types";
import CompanyTableToolbar from "./CompanyTableToolbar";
import CompanyTableFooter from "./CompanyTableFooter";
import CompanyContextMenu from "./CompanyContextMenu";
import ToastNotification from "./ToastNotification";
import { useContextMenu } from "../hooks/useContextMenu";
import { useToast } from "../hooks/useToast";
import { useRowStatus } from "../hooks/useRowStatus";
import { useTransfer } from "../hooks/useTransfer";
import { useCompanyData } from "../hooks/useCompanyData";

const CompanyTable = ({
  selectedCollectionId,
  collections,
  currentCollectionId,
  currentPage,
  currentPageSize,
  onPageChange,
  onPageSizeChange,
}: CompanyTableComponentProps) => {
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Custom hooks
  const { showToast, snackbar, handleCloseSnackbar } = useToast();
  const {
    contextMenu,
    contextMenuRow,
    handleContextMenu,
    handleCloseContextMenu,
  } = useContextMenu();
  const { isTransferring, currentJobId, initiateTransfer, resetTransfer } =
    useTransfer(showToast);
  const {
    response,
    setResponse,
    total,
    setTotal,
    loadTime,
    searchQuery,
    handleSearchChange,
  } = useCompanyData(
    selectedCollectionId,
    currentPage,
    currentPageSize,
    refreshTrigger,
    onPageChange
  );
  const { rowStatuses } = useRowStatus(
    response,
    currentJobId,
    isTransferring,
    resetTransfer
  );

  // Reset selection only when the collection changes
  useEffect(() => {
    setSelectedCompanyIds([]);
  }, [selectedCollectionId]);

  const handleToggleLike = async (companyId: number) => {
    try {
      const result = await toggleCompanyLike(companyId);

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

  const handleDeleteCompany = async (companyId: number) => {
    const company = response.find((c) => c.id === companyId);
    const companyName = company?.company_name || "this company";

    try {
      await removeCompaniesFromCollection({
        company_ids: [companyId],
        collection_id: selectedCollectionId,
      });

      setResponse((prev) => prev.filter((company) => company.id !== companyId));
      setSelectedCompanyIds((prev) => prev.filter((id) => id !== companyId));
      setTotal((prev) => (prev ? prev - 1 : prev));

      showToast(`"${companyName}" removed from this collection`, "success");
    } catch (error) {
      console.error("Failed to delete company:", error);
      showToast("Failed to remove company from collection", "error");
    }
  };

  const handleCopyCompanyName = async () => {
    if (contextMenuRow) {
      try {
        await navigator.clipboard.writeText(contextMenuRow.company_name);
        showToast("Company name copied to clipboard", "success");
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        showToast("Failed to copy company name", "error");
      }
    }
    handleCloseContextMenu();
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

  const columns = getCompanyTableColumns(
    rowStatuses,
    handleToggleLike,
    handleDeleteCompany,
    currentCollectionId
  );

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
        onClearSelection={onDeselectAll}
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
              const ids = (newSelection as (number | string)[]).map(Number);
              console.log("New selection:", ids);
              setSelectedCompanyIds(ids);
            }}
            rowSelectionModel={selectedCompanyIds}
            paginationMode="server"
            onPaginationModelChange={(newMeta) => {
              onPageSizeChange(newMeta.pageSize);
              onPageChange(newMeta.page);
            }}
            getRowClassName={(params) => {
              const status = rowStatuses[params.id as number];
              const isContextMenuRow = contextMenuRow?.id === params.id;
              let className = "";

              if (status === "pending") className += "row-pending ";
              if (status === "success") className += "row-success ";
              if (status === "error") className += "row-error ";
              if (isContextMenuRow) className += "row-context-menu ";

              return className.trim();
            }}
            slotProps={{
              row: {
                onContextMenu: (event: React.MouseEvent) => {
                  const rowId = event.currentTarget.getAttribute("data-id");
                  const row = response.find((r) => r.id === Number(rowId));
                  if (row) {
                    handleContextMenu(event, row);
                  }
                },
              },
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
                backgroundColor: "#f5fef9",
                "& .MuiDataGrid-cell": {
                  borderLeft: "4px solid #8ed1b9",
                  borderRight: "none",
                  "&:not(:first-of-type)": {
                    borderLeft: "none",
                  },
                },
              },
              "& .row-error": {
                backgroundColor: "#fff8f6",
                "& .MuiDataGrid-cell": {
                  borderLeft: "4px solid #f28b82",
                  borderRight: "none",
                  "&:not(:first-of-type)": {
                    borderLeft: "none",
                  },
                },
              },
              "& .row-context-menu": {
                backgroundColor: "rgba(0, 0, 0, 0.04) !important",
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
                "& .MuiIconButton-root": {
                  pointerEvents: "auto !important",
                },
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

        <CompanyContextMenu
          contextMenu={contextMenu}
          onClose={handleCloseContextMenu}
          onCopyCompanyName={handleCopyCompanyName}
        />

        <CompanyTableFooter
          offset={currentPage * currentPageSize}
          pageSize={currentPageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />

        <ToastNotification
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={handleCloseSnackbar}
        />
      </div>
    </>
  );
};

export default CompanyTable;
