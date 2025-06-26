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
}

export interface CompanyTableToolbarComponentProps {
  offset: number;
  pageSize: number;
  total?: number;
  onPageChange: (newOffset: number) => void;
  onPageSizeChange: (newSize: number) => void;
  isTransferring: boolean;
  selectedCount: number;
  selectedCompanyIds: number[];
  collections: Collection[];
  currentCollectionId: string;
  initiateTransfer: (
    companyIds: number[],
    targetCollection: Collection
  ) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}
