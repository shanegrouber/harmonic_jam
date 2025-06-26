import { Button, ButtonProps } from "@mui/material";

const ModernButton = (props: ButtonProps) => (
  <Button
    variant="contained"
    color="primary"
    sx={{
      borderRadius: 2,
      fontWeight: 600,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      textTransform: "none",
      fontSize: "1rem",
      px: 3,
      py: 1.2,
      ...props.sx,
    }}
    {...props}
  />
);

export default ModernButton;
