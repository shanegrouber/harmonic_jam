import React, { useState } from "react";
import { Box, Typography, MenuItem, Menu, Divider } from "@mui/material";
import { Collection, CompanyTableToolbarComponentProps } from "../types";
import ModernButton from "./ui/ModernButton";
import SearchBar from "./ui/SearchBar";
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

function formatLoadTime(loadTime: number): string {
  if (loadTime < 1000) {
    return `${loadTime.toFixed(0)}ms`;
  }
  return `${(loadTime / 1000).toFixed(1)}s`;
}

const CompanyTableToolbar = ({
  isTransferring,
  selectedCount,
  selectedCompanyIds,
  collections,
  currentCollectionId,
  initiateTransfer,
  onSelectAll,
  onDeselectAll,
  total,
  loadTime,
  searchQuery,
  onSearchChange,
}: CompanyTableToolbarComponentProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const menuOpen = Boolean(anchorEl);

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

  const handleSelectAll = async () => {
    setIsSelectingAll(true);
    try {
      await onSelectAll();
    } catch (error) {
      console.error("Failed to select all:", error);
    } finally {
      setIsSelectingAll(false);
    }
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
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* Left side - Search bar */}
      <Box display="flex" alignItems="center" gap={2}>
        <SearchBar
          placeholder="Search companies by name"
          value={searchQuery}
          onChange={onSearchChange}
          minWidth={300}
        />
      </Box>

      {/* Right side - Selection controls and other elements */}
      <Box display="flex" alignItems="center" gap={2}>
        {selectedCount > 0 && (
          <Box display="flex" alignItems="center" gap={3}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                backgroundColor: "#f3f4f6",
                color: "#374151",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.875rem",
                border: "1px solid #d1d5db",
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              {selectedCount} selected
            </Typography>

            <Typography
              variant="body2"
              color="primary"
              sx={{
                cursor: "pointer",
                fontWeight: 500,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  color: "primary.dark",
                  transform: "translateY(-1px)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                },
              }}
              onClick={onDeselectAll}
            >
              Deselect all
            </Typography>
            <Divider orientation="vertical" flexItem />
          </Box>
        )}

        <Box display="flex" alignItems="center" gap={3}>
          <ModernButton
            onClick={handleSelectAll}
            disabled={isSelectingAll}
            sx={{
              mb: 0,
              borderRadius: 2,
              minWidth: 80,
              height: 32,
              fontSize: "0.875rem",
              backgroundColor: "#10b981",
              color: "#ffffff",
              "&:hover": {
                backgroundColor: "#059669",
              },
            }}
          >
            {isSelectingAll ? "Selecting..." : "Select all"}
          </ModernButton>

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
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: "bold" }}
        >
          {formatResultsCount(total)}
          {loadTime && (
            <span
              style={{ fontSize: "0.75rem", opacity: 0.7, marginLeft: "4px" }}
            >
              ({formatLoadTime(loadTime)})
            </span>
          )}
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
