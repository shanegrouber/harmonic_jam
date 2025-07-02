import React, { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { CompanyTableToolbarComponentProps } from "../types";
import ModernButton from "./ui/ModernButton";
import SearchBar from "./ui/SearchBar";
import ManageCollectionsPopover from "./ManageCollectionsPopover";
import { removeCompaniesFromCollection } from "../utils/transfer-api";
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
  selectedCount,
  selectedCompanyIds,
  collections,
  currentCollectionId,
  initiateTransfer,
  onDeselectAll,
  onClearSelection,
  onRefresh,
  total,
  loadTime,
  searchQuery,
  onSearchChange,
  onToggleStateChange,
  selectAllToggle,
}: CompanyTableToolbarComponentProps) => {
  const [manageCollectionsAnchorEl, setManageCollectionsAnchorEl] =
    useState<null | HTMLElement>(null);
  const manageCollectionsOpen = Boolean(manageCollectionsAnchorEl);

  const handleManageCollectionsOpen = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (selectedCompanyIds.length > 0 || selectAllToggle) {
      setManageCollectionsAnchorEl(event.currentTarget);
    }
  };

  const handleManageCollectionsClose = () => {
    setManageCollectionsAnchorEl(null);
  };

  const handleManageCollectionsSave = async (
    updates: { collectionId: string; action: "add" | "remove" }[]
  ) => {
    // Check if we're in "All Companies" view
    const isAllCompaniesView = currentCollectionId === "all-companies";

    // Process each update
    for (const update of updates) {
      if (update.action === "add") {
        const targetCollection = collections.find(
          (c) => c.id === update.collectionId
        );
        if (targetCollection) {
          await initiateTransfer(
            selectedCompanyIds,
            targetCollection,
            isAllCompaniesView ? "all-companies" : currentCollectionId,
            selectAllToggle
          );
        }
      } else if (update.action === "remove" && !isAllCompaniesView) {
        // Only allow remove operations when not in "All Companies" view
        await removeCompaniesFromCollection({
          company_ids: selectedCompanyIds,
          collection_id: update.collectionId,
        });

        // Clear selection after successful remove
        onClearSelection();

        // Refresh the UI after remove operation
        if (onRefresh) {
          onRefresh();
        }
      }
    }
  };

  const handleSelectAllToggle = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const enabled = event.target.checked;
    onToggleStateChange?.(enabled);
    if (!enabled) {
      // Clear selection when toggle is disabled
      onClearSelection();
    }
    // Notify parent of toggle state change
    if (onToggleStateChange) {
      onToggleStateChange(enabled);
    }
  };

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
        {(selectedCount > 0 || selectAllToggle) && (
          <Box display="flex" alignItems="center" gap={3}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                backgroundColor: selectAllToggle ? "#10b981" : "#f3f4f6",
                color: selectAllToggle ? "#ffffff" : "#374151",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.875rem",
                border: "1px solid #d1d5db",
                userSelect: "none",
                pointerEvents: "none",
              }}
            >
              {selectAllToggle
                ? `${total} selected`
                : `${selectedCount} selected`}
            </Typography>

            {!selectAllToggle && (
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
            )}
            <Divider orientation="vertical" flexItem />
          </Box>
        )}

        <Box display="flex" alignItems="center" gap={3}>
          <FormControlLabel
            control={
              <Switch
                checked={selectAllToggle}
                onChange={handleSelectAllToggle}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#10b981",
                    "&:hover": {
                      backgroundColor: "rgba(16, 185, 129, 0.08)",
                    },
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#10b981",
                  },
                }}
              />
            }
            label={
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: selectAllToggle ? "#10b981" : "#374151",
                }}
              >
                Select all
              </Typography>
            }
            sx={{ margin: 0 }}
          />

          <ModernButton
            endIcon={<KeyboardArrowDownIcon />}
            onClick={handleManageCollectionsOpen}
            sx={{
              mb: 0,
              color:
                selectedCompanyIds.length === 0 && !selectAllToggle
                  ? "#888"
                  : "#ffffff",
              borderRadius: 2,
              minWidth: 140,
              "&:hover": {
                transform: "scale(1)",
              },
              "&:focus-visible": {
                outline: "none",
              },
              "&.Mui-focusVisible": {
                outline: "none",
              },
              "&:focus": {
                outline: "none",
                boxShadow: "none",
              },
            }}
            disabled={selectedCompanyIds.length === 0 && !selectAllToggle}
          >
            Manage collections
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

      <ManageCollectionsPopover
        open={manageCollectionsOpen}
        anchorEl={manageCollectionsAnchorEl}
        onClose={handleManageCollectionsClose}
        collections={collections}
        selectedCompanyIds={selectedCompanyIds}
        currentCollectionId={currentCollectionId}
        onSave={handleManageCollectionsSave}
      />
    </Box>
  );
};

export default CompanyTableToolbar;
