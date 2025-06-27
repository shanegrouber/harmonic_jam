import { useState } from "react";

type ToastSeverity = "success" | "error" | "info";

interface ToastState {
  open: boolean;
  message: string;
  severity: ToastSeverity;
}

export const useToast = () => {
  const [snackbar, setSnackbar] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showToast = (message: string, severity: ToastSeverity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return {
    snackbar,
    showToast,
    handleCloseSnackbar,
  };
};
