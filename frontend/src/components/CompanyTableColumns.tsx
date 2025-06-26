import {
  GridColDef,
  GridRenderCellParams,
  GridAlignment,
} from "@mui/x-data-grid";
import FavoriteIcon from "@mui/icons-material/Favorite";
import RemoveIcon from "@mui/icons-material/Remove";
import { RowStatuses, Collection } from "../types";
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import ErrorIcon from "@mui/icons-material/Error";

export function getCompanyTableColumns(
  rowStatuses: RowStatuses,
  currentCollection?: Collection,
): GridColDef[] {
  const columns: GridColDef[] = [
    ...(currentCollection?.collection_name === "My List"
      ? [
          {
            field: "liked",
            headerName: "Liked",
            width: 120,
            renderCell: (params: GridRenderCellParams) =>
              params.value ? (
                <FavoriteIcon sx={{ color: "#ff6600" }} fontSize="small" />
              ) : (
                <RemoveIcon sx={{ color: "#bbb" }} fontSize="small" />
              ),
            sortable: true,
            filterable: false,
            disableColumnMenu: true,
            disableReorder: true,
            resizable: false,
            headerAlign: "center" as GridAlignment,
            align: "center" as GridAlignment,
          },
        ]
      : []),
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
      if (status === "pending") return <CircularProgress size={16} />;
      if (status === "success") return <CheckIcon color="success" />;
      if (status === "error") return <ErrorIcon color="error" />;
      return null;
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
