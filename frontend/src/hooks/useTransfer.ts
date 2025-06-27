import { useState } from "react";
import { Collection } from "../types";
import { createTransferJob } from "../utils/transfer-api";

export const useTransfer = (
  showToast: (message: string, severity: "success" | "error" | "info") => void
) => {
  const [isTransferring, setIsTransferring] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [lastTransferTarget, setLastTransferTarget] =
    useState<Collection | null>(null);

  const initiateTransfer = async (
    companyIds: number[],
    targetCollection: Collection
  ) => {
    setIsTransferring(true);
    setLastTransferTarget(targetCollection);

    try {
      const transferJob = await createTransferJob({
        company_ids: companyIds,
        collection_id: targetCollection.id,
      });

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
