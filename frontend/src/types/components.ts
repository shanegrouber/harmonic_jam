import { Collection } from "./models";

export interface SidebarComponentProps {
  collections: Collection[];
  selectedCollectionId?: string;
  setSelectedCollectionId: (id: string) => void;
}

export interface CompanyTableComponentProps {
  selectedCollectionId: string;
  collections: Collection[];
  currentCollectionId: string;
  currentCollection?: Collection;
  currentPage: number;
  currentPageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
}

export interface CompanyTableToolbarComponentProps {
  isTransferring: boolean;
  selectedCount: number;
  selectedCompanyIds: number[];
  collections: Collection[];
  currentCollectionId: string;
  initiateTransfer: (
    companyIds: number[],
    targetCollection: Collection
  ) => void;
  onSelectAll: () => Promise<void>;
  onDeselectAll: () => void;
  onClearSelection: () => void;
  onRefresh?: () => void;
  total?: number;
  loadTime?: number | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}
