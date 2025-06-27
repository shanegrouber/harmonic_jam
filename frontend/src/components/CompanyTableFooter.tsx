import React, { useState } from "react";
import {
  Box,
  Typography,
  MenuItem,
  IconButton,
  Select,
  FormControl,
  InputLabel,
  TextField,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface CompanyTableFooterProps {
  offset: number;
  pageSize: number;
  total?: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

const CompanyTableFooter = ({
  offset,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: CompanyTableFooterProps) => {
  const [pageInput, setPageInput] = useState<string>("");

  const currentPage = Math.floor(offset / pageSize);
  const maxPage = total ? Math.floor((total - 1) / pageSize) : 0;

  const handlePageInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPageInput(event.target.value);
  };

  const handlePageInputKeyPress = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      const pageNumber = parseInt(pageInput, 10);
      if (!isNaN(pageNumber) && pageNumber >= 0 && pageNumber <= maxPage) {
        onPageChange(pageNumber);
        setPageInput("");
      }
    }
  };

  const handlePageInputBlur = () => {
    setPageInput("");
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
        pb: 3,
        minHeight: 56,
        borderTop: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
      }}
    >
      {/* Left side - Pagination controls */}
      <Box display="flex" alignItems="center" gap={2}>
        <IconButton
          disabled={currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeftIcon />
        </IconButton>

        {/* Page indicator and input */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            Page
          </Typography>
          <TextField
            size="small"
            value={pageInput}
            onChange={handlePageInputChange}
            onKeyPress={handlePageInputKeyPress}
            onBlur={handlePageInputBlur}
            placeholder={(currentPage + 1).toString()}
            sx={{
              width: 50,
              "& .MuiInputBase-input": {
                textAlign: "center",
                padding: "8px 4px",
                fontSize: "0.875rem",
              },
            }}
          />
          <Typography variant="body2" color="text.secondary">
            of {maxPage + 1}
          </Typography>
        </Box>

        <IconButton
          disabled={currentPage >= maxPage}
          onClick={() => onPageChange(currentPage + 1)}
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

      {/* Right side - Empty for now, could add other controls in the future */}
      <Box display="flex" alignItems="center">
        {/* Placeholder for future footer controls */}
      </Box>
    </Box>
  );
};

export default CompanyTableFooter;
