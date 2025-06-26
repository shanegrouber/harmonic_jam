import React, { useState, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { DataGrid } from "@mui/x-data-grid";
import { getCollectionsById } from "../utils/jam-api";
import ModernButton from "./ui/ModernButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { getCompanyTableColumns } from "../components/companyTableColumns";
import { RowStatus, RowStatuses, Collection, Company } from "../types";

interface CompanyTableProps {
  selectedCollectionId: string;
  collections: Collection[];
  currentCollectionId: string;
  currentCollection?: Collection;
}

const createRowStatuses = (): RowStatuses => ({});

const updateRowStatus = (
  rowStatuses: RowStatuses,
  rowId: number,
  status: RowStatus,
): RowStatuses => ({
  ...rowStatuses,
  [rowId]: status,
});

const CompanyTable = ({
  selectedCollectionId,
  collections,
  currentCollectionId,
  currentCollection,
}: CompanyTableProps) => {
  const [response, setResponse] = useState<Company[]>([]);
  const [total, setTotal] = useState<number>();
  const [offset, setOffset] = useState<number>(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const [rowStatuses, setRowStatuses] =
    useState<RowStatuses>(createRowStatuses());
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    getCollectionsById(selectedCollectionId, offset, pageSize).then(
      (newResponse) => {
        setResponse(newResponse.companies);
        setTotal(newResponse.total);
      },
    );
  }, [selectedCollectionId, offset, pageSize]);

  useEffect(() => {
    setOffset(0);
    setRowStatuses(createRowStatuses());
  }, [selectedCollectionId]);

  const showToast = (
    message: string,
    severity: "success" | "error" | "info",
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (selectedCompanyIds.length > 0) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMoveToCollection = async (targetCollection: Collection) => {
    setAnchorEl(null);
    await initiateTransfer(selectedCompanyIds, targetCollection);
  };

  const initiateTransfer = async (
    companyIds: number[],
    targetCollection: Collection,
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
        "success",
      );
    } else if (successCount === 0) {
      showToast(`Failed to move ${errorCount} companies`, "error");
    } else {
      showToast(
        `Moved ${successCount} companies, ${errorCount} failed`,
        "info",
      );
    }
  };

  const columns = getCompanyTableColumns(rowStatuses, currentCollection);

  const otherCollections = collections.filter(
    (col) => col.id !== currentCollectionId,
  );

  return (
    <div
      className="table-container flex flex-col h-full w-full"
      style={{ minHeight: 0 }}
    >
      <div className="flex items-center mb-2">
        <ModernButton
          onClick={handleMenuOpen}
          sx={{
            mb: 0,
            backgroundColor:
              selectedCompanyIds.length === 0 ? "#e5e7eb" : undefined,
            color: selectedCompanyIds.length === 0 ? "#888" : undefined,
          }}
          disabled={isTransferring || selectedCompanyIds.length === 0}
        >
          {selectedCompanyIds.length === 0
            ? "Select companies to move"
            : `Move ${selectedCompanyIds.length} companies`}
        </ModernButton>

        <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
          {otherCollections.length === 0 ? (
            <MenuItem disabled>No other collections</MenuItem>
          ) : (
            otherCollections.map((col) => (
              <MenuItem
                key={col.id}
                onClick={() => handleMoveToCollection(col)}
              >
                {col.collection_name}
              </MenuItem>
            ))
          )}
        </Menu>
      </div>
      <div className="flex-1 min-h-0">
        <DataGrid
          rows={response}
          rowHeight={38}
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
            setSelectedCompanyIds(newSelection as number[]);
          }}
          rowSelectionModel={selectedCompanyIds}
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
              backgroundColor: "#e6ffed",
            },
            "& .row-error": {
              backgroundColor: "#ffe6e6",
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
  );
};

export default CompanyTable;
