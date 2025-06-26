import { useState, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { DataGrid } from "@mui/x-data-grid";
import { getCollectionsById } from "../utils/jam-api";
import { getCompanyTableColumns } from "./CompanyTableColumns";
import {
  RowStatus,
  RowStatuses,
  Collection,
  Company,
  CompanyTableComponentProps,
} from "../types";
import CompanyTableToolbar from "./CompanyTableToolbar";

const createRowStatuses = (): RowStatuses => ({});

const updateRowStatus = (
  rowStatuses: RowStatuses,
  rowId: number,
  status: RowStatus
): RowStatuses => ({
  ...rowStatuses,
  [rowId]: status,
});

const CompanyTable = ({
  selectedCollectionId,
  collections,
  currentCollectionId,
  currentCollection,
}: CompanyTableComponentProps) => {
  const [response, setResponse] = useState<Company[]>([]);
  const [total, setTotal] = useState<number>();
  const [offset, setOffset] = useState<number>(0);
  const [pageSize, setPageSize] = useState(25);
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

  useEffect(() => {
    getCollectionsById(selectedCollectionId, offset, pageSize).then(
      (newResponse) => {
        setResponse(newResponse.companies);
        setTotal(newResponse.total);
      }
    );
  }, [selectedCollectionId, offset, pageSize]);

  useEffect(() => {
    setOffset(0);
    setRowStatuses(createRowStatuses());
  }, [selectedCollectionId]);

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
    companyIds.forEach((id) => {
      setRowStatuses((prev) => updateRowStatus(prev, id, "pending"));
    });
    let successCount = 0;
    let errorCount = 0;
    for (let i = 0; i < companyIds.length; i++) {
      const companyId = companyIds[i];
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setRowStatuses((prev) => updateRowStatus(prev, companyId, "success"));
        successCount++;
      } catch (error) {
        setRowStatuses((prev) => updateRowStatus(prev, companyId, "error"));
        errorCount++;
      }
    }
    setIsTransferring(false);
    setSelectedCompanyIds([]);
    if (errorCount === 0) {
      showToast(
        `Successfully moved ${successCount} companies to ${targetCollection.collection_name}`,
        "success"
      );
    } else if (successCount === 0) {
      showToast(`Failed to move ${errorCount} companies`, "error");
    } else {
      showToast(
        `Moved ${successCount} companies, ${errorCount} failed`,
        "info"
      );
    }
  };

  const onDeselectAll = () => {
    setSelectedCompanyIds([]);
  };

  const onSelectAll = () => {
    if (total) {
      // Generate IDs for all records (assuming IDs are sequential from 1 to total)
      const allIds = Array.from({ length: total }, (_, index) => index + 1);
      setSelectedCompanyIds(allIds);
    }
  };

  const columns = getCompanyTableColumns(rowStatuses, currentCollection);

  return (
    <>
      <CompanyTableToolbar
        offset={offset}
        pageSize={pageSize}
        onPageChange={setOffset}
        onPageSizeChange={setPageSize}
        total={total}
        isTransferring={isTransferring}
        selectedCount={selectedCompanyIds.length}
        selectedCompanyIds={selectedCompanyIds}
        collections={collections}
        currentCollectionId={currentCollectionId}
        initiateTransfer={initiateTransfer}
        onDeselectAll={onDeselectAll}
        onSelectAll={onSelectAll}
      />
      <div
        className="table-container flex flex-col h-full w-full"
        style={{ minHeight: 0 }}
      >
        <div className="flex-1 min-h-0">
          <DataGrid
            rows={response}
            rowHeight={44}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 25 },
              },
            }}
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
              setPageSize(newMeta.pageSize);
              setOffset(newMeta.page * newMeta.pageSize);
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
