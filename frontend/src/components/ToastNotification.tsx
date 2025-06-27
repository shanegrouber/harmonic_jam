import React from "react";
import { Snackbar, Alert } from "@mui/material";

interface ToastNotificationProps {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  open,
  message,
  severity,
  onClose,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
};

export default ToastNotification;
