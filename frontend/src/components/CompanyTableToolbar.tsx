import React, { useState } from "react";
import {
  Box,
  Typography,
  MenuItem,
  IconButton,
  Menu,
  Divider,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Collection, CompanyTableToolbarComponentProps } from "../types";
import ModernButton from "./ui/ModernButton";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

function formatResultsCount(count: number | undefined) {
  if (!count) return "";
  if (count >= 1000) {
    const thousands = count / 1000;
    return `${
      thousands % 1 === 0 ? Math.floor(thousands) : thousands.toFixed(1)
    }k results`;
  }
  return `${count} results`;
}

const CompanyTableToolbar = ({
  offset,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  isTransferring,
  selectedCount,
  selectedCompanyIds,
  collections,
  currentCollectionId,
  initiateTransfer,
  onSelectAll,
  onDeselectAll,
}: CompanyTableToolbarComponentProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const currentPage = Math.floor(offset / pageSize);
  const maxPage = total ? Math.floor((total - 1) / pageSize) : 0;

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

  const otherCollections = collections.filter(
    (col: Collection) => col.id !== currentCollectionId
  );

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      gap={2}
      sx={{
        px: 2,
        py: 1.5,
        minHeight: 56,
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* Left side - Pagination controls */}
      <Box display="flex" alignItems="center" gap={2}>
        <IconButton
          disabled={currentPage === 0}
          onClick={() => onPageChange(offset - pageSize)}
        >
          <ChevronLeftIcon />
        </IconButton>
        <IconButton
          disabled={currentPage >= maxPage}
          onClick={() => onPageChange(offset + pageSize)}
        >
          <ChevronRightIcon />
        </IconButton>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Page Size</InputLabel>
          <Select
            value={pageSize}
            label="Page Size"
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <MenuItem value={10}>10 rows</MenuItem>
            <MenuItem value={25}>25 rows</MenuItem>
            <MenuItem value={50}>50 rows</MenuItem>
            <MenuItem value={100}>100 rows</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Right side - Selection controls and other elements */}
      <Box display="flex" alignItems="center" gap={2}>
        {selectedCount > 0 && (
          <>
            <Typography variant="body2" color="text.secondary">
              {selectedCount} selected
            </Typography>

            <Divider orientation="vertical" flexItem />

            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: "pointer", fontWeight: 500 }}
              onClick={onDeselectAll}
            >
              Deselect all
            </Typography>
          </>
        )}

        {total && total > 0 && (
          <>
            <Divider orientation="vertical" flexItem />

            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: "pointer", fontWeight: 500 }}
              onClick={onSelectAll}
            >
              Select all ({total})
            </Typography>
          </>
        )}

        <ModernButton
          onClick={handleMenuOpen}
          endIcon={<KeyboardArrowDownIcon />}
          sx={{
            mb: 0,
            backgroundColor:
              selectedCompanyIds.length === 0 ? "#e5e7eb" : undefined,
            color: selectedCompanyIds.length === 0 ? "#888" : undefined,
            borderRadius: 2,
            minWidth: 110,
          }}
          disabled={isTransferring || selectedCompanyIds.length === 0}
        >
          Add to collection
        </ModernButton>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: "bold" }}
        >
          {formatResultsCount(total)}
        </Typography>
      </Box>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
        {otherCollections.length === 0 ? (
          <MenuItem disabled>No other collections</MenuItem>
        ) : (
          otherCollections.map((collection) => (
            <MenuItem
              key={collection.id}
              onClick={() => handleMoveToCollection(collection)}
            >
              Add to {collection.collection_name}
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
};

export default CompanyTableToolbar;
