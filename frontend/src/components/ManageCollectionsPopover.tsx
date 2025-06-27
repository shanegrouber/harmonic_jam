import React, { useState, useEffect } from "react";
import {
  Popover,
  Box,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { Collection } from "../types";

interface ManageCollectionsPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  collections: Collection[];
  selectedCompanyIds: number[];
  currentCollectionId: string;
  onSave: (
    updates: { collectionId: string; action: "add" | "remove" }[]
  ) => Promise<void>;
}

const ManageCollectionsPopover: React.FC<ManageCollectionsPopoverProps> = ({
  open,
  anchorEl,
  onClose,
  collections,
  selectedCompanyIds,
  currentCollectionId,
  onSave,
}) => {
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set()
  );
  const [initialSelectedCollections, setInitialSelectedCollections] = useState<
    Set<string>
  >(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const isAllCompaniesView = currentCollectionId === "all-companies";

  // Initialize selected collections based on which collections contain all selected companies
  useEffect(() => {
    if (open && selectedCompanyIds.length > 0 && collections) {
      const preSelectedCollections = new Set<string>();

      collections.forEach((collection) => {
        if (collection && collection.companies) {
          const collectionCompanyIds = collection.companies.map(
            (company) => company.id
          );
          const allSelectedInCollection = selectedCompanyIds.every(
            (companyId) => collectionCompanyIds.includes(companyId)
          );

          if (allSelectedInCollection) {
            preSelectedCollections.add(collection.id);
          }
        }
      });

      if (!isAllCompaniesView && currentCollectionId) {
        preSelectedCollections.add(currentCollectionId);
      }

      setSelectedCollections(preSelectedCollections);
      setInitialSelectedCollections(new Set(preSelectedCollections)); // Store initial state
    } else {
      setSelectedCollections(new Set());
      setInitialSelectedCollections(new Set());
    }
  }, [
    open,
    collections,
    selectedCompanyIds,
    currentCollectionId,
    isAllCompaniesView,
  ]);

  const handleCollectionToggle = (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updates: { collectionId: string; action: "add" | "remove" }[] = [];

      if (collections) {
        if (isAllCompaniesView) {
          // In "All Companies" view, only allow ADD operations
          for (const collectionId of selectedCollections) {
            const collection = collections.find((c) => c.id === collectionId);
            if (collection) {
              updates.push({ collectionId: collection.id, action: "add" });
            }
          }
        } else {
          // In regular collection view, allow both ADD and REMOVE operations
          for (const collectionId of selectedCollections) {
            if (!initialSelectedCollections.has(collectionId)) {
              const collection = collections.find((c) => c.id === collectionId);
              if (collection) {
                updates.push({ collectionId: collection.id, action: "add" });
              }
            }
          }

          for (const collectionId of initialSelectedCollections) {
            if (!selectedCollections.has(collectionId)) {
              const collection = collections.find((c) => c.id === collectionId);
              if (collection) {
                updates.push({ collectionId: collection.id, action: "remove" });
              }
            }
          }
        }
      }

      if (updates.length > 0) {
        await onSave(updates);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save collection changes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    if (isAllCompaniesView) {
      // In "All Companies" view, any selected collections are changes
      return selectedCollections.size > 0;
    }

    // Compare current selection with initial selection
    if (selectedCollections.size !== initialSelectedCollections.size) {
      return true;
    }

    for (const collectionId of selectedCollections) {
      if (!initialSelectedCollections.has(collectionId)) {
        return true;
      }
    }

    for (const collectionId of initialSelectedCollections) {
      if (!selectedCollections.has(collectionId)) {
        return true;
      }
    }

    return false;
  };

  // Don't render if collections is not available
  if (!collections) {
    return null;
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
          minWidth: 320,
          maxWidth: 400,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 2,
            color: "#111827",
            fontSize: "1rem",
          }}
        >
          Manage Collections
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            mb: 2,
            fontSize: "0.875rem",
          }}
        >
          {isAllCompaniesView
            ? `Click collections to add the ${selectedCompanyIds.length} selected companies`
            : `Click collections to add or remove the ${selectedCompanyIds.length} selected companies`}
        </Typography>

        <Box
          sx={{
            maxHeight: 300,
            overflowY: "auto",
            mb: 2,
            border: "1px solid #e5e7eb",
            borderRadius: 1,
          }}
        >
          {collections
            .filter((collection) => collection)
            .sort((a, b) => {
              // Always put current collection first (except for "All Companies" view)
              if (!isAllCompaniesView && a.id === currentCollectionId)
                return -1;
              if (!isAllCompaniesView && b.id === currentCollectionId) return 1;
              // Otherwise maintain original order (no sorting)
              return 0;
            })
            .map((collection) => (
              <Box
                key={collection.id}
                onClick={() => handleCollectionToggle(collection.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1.5,
                  cursor: "pointer",
                  backgroundColor: selectedCollections.has(collection.id)
                    ? "#fff4ee"
                    : "transparent",
                  borderBottom: "1px solid #f3f4f6",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: selectedCollections.has(collection.id)
                      ? "#ffe0b2"
                      : "#f9fafb",
                  },
                  "&:last-child": {
                    borderBottom: "none",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: "#374151",
                      fontSize: "0.875rem",
                    }}
                  >
                    {collection.collection_name}
                  </Typography>
                  {!isAllCompaniesView &&
                    collection.id === currentCollectionId && (
                      <Typography
                        variant="caption"
                        sx={{
                          backgroundColor: "#f3f4f6",
                          color: "#6b7280",
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        }}
                      >
                        Current
                      </Typography>
                    )}
                </Box>
                {selectedCollections.has(collection.id) && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#ff9800",
                    }}
                  />
                )}
              </Box>
            ))}
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1,
            pt: 1,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              flex: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
              color: "#6b7280",
              borderColor: "#d1d5db",
              "&:hover": {
                borderColor: "#9ca3af",
                backgroundColor: "#f9fafb",
              },
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasChanges()}
            sx={{
              flex: 1,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#10b981",
              color: "#ffffff",
              "&:hover": {
                backgroundColor: "#059669",
              },
              "&:disabled": {
                backgroundColor: "#e5e7eb",
                color: "#9ca3af",
              },
            }}
            variant="contained"
          >
            {isLoading ? (
              <CircularProgress size={20} sx={{ color: "#ffffff" }} />
            ) : isAllCompaniesView ? (
              "Add to Collections"
            ) : (
              "Save Changes"
            )}
          </Button>
        </Box>
      </Box>
    </Popover>
  );
};

export default ManageCollectionsPopover;
