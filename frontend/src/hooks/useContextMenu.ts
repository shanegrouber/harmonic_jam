import { useState, useEffect } from "react";
import { Company } from "../types";

interface ContextMenuState {
  mouseX: number;
  mouseY: number;
}

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [contextMenuRow, setContextMenuRow] = useState<Company | null>(null);

  const handleContextMenu = (event: React.MouseEvent, row: Company) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
    });
    setContextMenuRow(row);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setContextMenuRow(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu !== null) {
        handleCloseContextMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu]);

  return {
    contextMenu,
    contextMenuRow,
    handleContextMenu,
    handleCloseContextMenu,
  };
};
