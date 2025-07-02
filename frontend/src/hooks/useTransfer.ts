import { useState } from "react";
import { Collection } from "../types";
import {
  createTransferJob,
  createTransferJobForCollection,
} from "../utils/transfer-api";

export const useTransfer = (
  showToast: (message: string, severity: "success" | "error" | "info") => void,
  onTransferComplete?: (targetCollection: Collection) => void
) => {
  const [isTransferring, setIsTransferring] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [lastTransferTarget, setLastTransferTarget] =
    useState<Collection | null>(null);

  const initiateTransfer = async (
    companyIds: number[],
    targetCollection: Collection,
    sourceCollectionId: string,
    isSelectAllToggle?: boolean
  ) => {
    setIsTransferring(true);
    setLastTransferTarget(targetCollection);

    try {
      let transferJob;

      if (isSelectAllToggle) {
        // Use collection-based transfer when toggle is enabled
        transferJob = await createTransferJobForCollection({
          source_collection_id: sourceCollectionId,
          collection_id: targetCollection.id,
        });
      } else {
        // Use regular transfer with selected company IDs
        transferJob = await createTransferJob({
          company_ids: companyIds,
          collection_id: targetCollection.id,
        });
      }

      setCurrentJobId(transferJob.job_id);
    } catch (error) {
      console.error("Failed to initiate transfer:", error);
      setIsTransferring(false);
      setLastTransferTarget(null);
      showToast("Failed to initiate transfer", "error");
    }
  };

  const resetTransfer = () => {
    setIsTransferring(false);
    setCurrentJobId(null);

    // Call the completion callback if we have a target collection and callback
    if (lastTransferTarget && onTransferComplete) {
      onTransferComplete(lastTransferTarget);
    }

    setLastTransferTarget(null);
  };

  return {
    isTransferring,
    currentJobId,
    lastTransferTarget,
    initiateTransfer,
    resetTransfer,
  };
};
