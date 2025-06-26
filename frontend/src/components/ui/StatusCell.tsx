import { CircularProgress } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import ErrorIcon from "@mui/icons-material/Error";
import { RowStatus } from "../../types";

const StatusCell = ({ status }: { status?: RowStatus }) => {
  if (status === "pending") return <CircularProgress size={16} />;
  if (status === "success")
    return <CheckIcon color="success" fontSize="small" />;
  if (status === "error") return <ErrorIcon color="error" fontSize="small" />;
  return null;
};

export default StatusCell;
