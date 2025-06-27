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
import IconButton from "@mui/material/IconButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export function getCompanyTableColumns(
  rowStatuses: RowStatuses,
  onToggleLike?: (companyId: number) => Promise<void>,
  onDeleteCompany?: (companyId: number) => Promise<void>,
  currentCollectionId?: string
): GridColDef[] {
  const columns: GridColDef[] = [
    {
      field: "liked",
      headerName: "Liked",
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const isLiked = params.value;
        const companyId = params.row.id;

        const handleClick = async (event: React.MouseEvent) => {
          event.stopPropagation();
          if (onToggleLike) {
            try {
              await onToggleLike(companyId);
            } catch (error) {
              console.error("Failed to toggle like:", error);
            }
          }
        };

        return (
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{
              padding: 0,
              "&:hover": {
                backgroundColor: "transparent",
                transform: "scale(1.1)",
              },
              "&:focus": {
                outline: "none",
                backgroundColor: "transparent",
              },
              "&:focus-visible": {
                outline: "none",
                backgroundColor: "transparent",
              },
              "&.Mui-focusVisible": {
                outline: "none",
                backgroundColor: "transparent",
              },
            }}
          >
            {isLiked ? (
              <FavoriteIcon sx={{ color: "#ff6600" }} fontSize="small" />
            ) : (
              <FavoriteBorderIcon sx={{ color: "#bbb" }} fontSize="small" />
            )}
          </IconButton>
        );
      },
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
    width: 80,
    headerClassName: "status-header",
    cellClassName: "status-cell",
    renderCell: (params: GridRenderCellParams) => {
      const status = rowStatuses[params.id as number];
      const companyId = params.row.id;

      const handleDelete = async (event: React.MouseEvent) => {
        event.stopPropagation();
        if (onDeleteCompany) {
          try {
            await onDeleteCompany(companyId);
          } catch (error) {
            console.error("Failed to delete company:", error);
          }
        }
      };

      return (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          height="100%"
          gap={1}
        >
          <Box display="flex" alignItems="center" justifyContent="center">
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

          {onDeleteCompany && currentCollectionId !== "all-companies" && (
            <IconButton
              onClick={handleDelete}
              size="small"
              sx={{
                padding: 1,
                opacity: 0.6,
                "&:hover": {
                  opacity: 1,
                  backgroundColor: "rgba(244, 67, 54, 0.1)",
                  color: "#f44336",
                },
                "&:focus": {
                  outline: "none",
                },
                "&:focus-visible": {
                  outline: "none",
                },
                "&.Mui-focusVisible": {
                  outline: "none",
                },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
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
