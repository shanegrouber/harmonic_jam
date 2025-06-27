import React from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minWidth?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  minWidth = 300,
}) => {
  const handleClearSearch = () => {
    onChange("");
  };

  return (
    <TextField
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      sx={{
        minWidth,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          "&:hover": {
            backgroundColor: "#f3f4f6",
            borderColor: "#d1d5db",
          },
          "&.Mui-focused": {
            backgroundColor: "#ffffff",
            borderColor: "#3b82f6",
            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
          },
        },
        "& .MuiOutlinedInput-input": {
          fontSize: "0.875rem",
          padding: "8px 12px",
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#6b7280", fontSize: 20 }} />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={handleClearSearch}
              sx={{
                padding: 0,
                color: "#6b7280",
                "&:hover": {
                  color: "#374151",
                  backgroundColor: "transparent",
                },
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  );
};

export default SearchBar;
