import {
  GridColDef,
  GridRenderCellParams,
  GridAlignment,
} from "@mui/x-data-grid";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { RowStatuses } from "../types";
import Box from "@mui/material/Box";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import CircularProgress from "@mui/material/CircularProgress";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

export function getCompanyTableColumns(rowStatuses: RowStatuses): GridColDef[] {
  const columns: GridColDef[] = [
    {
      field: "liked",
      headerName: "Liked",
      width: 120,
      renderCell: (params: GridRenderCellParams) =>
        params.value ? (
          <FavoriteIcon sx={{ color: "#ff6600" }} fontSize="small" />
        ) : (
          <FavoriteBorderIcon sx={{ color: "#bbb" }} fontSize="small" />
        ),
      sortable: true,
      filterable: false,
      disableColumnMenu: true,
      disableReorder: true,
      resizable: false,
      headerAlign: "center" as GridAlignment,
      align: "center" as GridAlignment,
    },

    {
      field: "company_name",
      headerName: "Company",
      minWidth: 200,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <span style={{ fontWeight: 600, color: "#222" }}>{params.value}</span>
      ),
    },
  ];

  columns.unshift({
    field: "status",
    headerName: "",
    width: 50,
    headerClassName: "status-header",
    cellClassName: "status-cell",
    renderCell: (params: GridRenderCellParams) => {
      const status = rowStatuses[params.id as number];
      if (!["pending", "success", "error"].includes(status)) {
        return "";
      }
      return (
        <Box
          display="flex-end"
          alignItems="center"
          justifyContent="center"
          width="100%"
          height="100%"
          gap={1}
        >
          {status === "success" && (
            <CheckCircleRounded sx={{ color: "#8ed1b9" }} />
          )}
          {status === "error" && (
            <ErrorOutline fontSize="small" sx={{ color: "#f28b82" }} />
          )}
          {status === "pending" && (
            <CircularProgress size={16} sx={{ color: "#888" }} />
          )}
        </Box>
      );
    },
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    resizable: false,
    editable: false,
    headerAlign: "center",
    align: "center",
  });
  return columns;
}
