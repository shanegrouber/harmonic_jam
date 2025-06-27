import React from "react";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

interface CompanyContextMenuProps {
  contextMenu: { mouseX: number; mouseY: number } | null;
  onClose: () => void;
  onCopyCompanyName: () => void;
}

const CompanyContextMenu: React.FC<CompanyContextMenuProps> = ({
  contextMenu,
  onClose,
  onCopyCompanyName,
}) => {
  return (
    <Menu
      open={contextMenu !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
      sx={{
        "& .MuiPaper-root": {
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          border: "1px solid #e5e7eb",
        },
      }}
    >
      <MenuItem onClick={onCopyCompanyName}>
        <ListItemIcon>
          <ContentCopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Copy company name</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default CompanyContextMenu;
