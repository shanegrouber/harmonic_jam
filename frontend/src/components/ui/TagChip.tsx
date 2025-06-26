import { Chip, ChipProps } from "@mui/material";

const TagChip = (props: ChipProps) => (
  <Chip
    size="small"
    sx={{
      borderRadius: "999px",
      background: "#f1f5f9",
      color: "#2563eb",
      fontWeight: 500,
      fontSize: "0.85rem",
      px: 1.5,
      ...props.sx,
    }}
    {...props}
  />
);

export default TagChip;
