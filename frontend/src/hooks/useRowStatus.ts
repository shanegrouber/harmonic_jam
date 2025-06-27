import { useState, useEffect } from "react";
import { RowStatus, RowStatuses, Company } from "../types";
import {
  getCompaniesTransferStatus,
  getTransferJobStatus,
} from "../utils/transfer-api";

const createRowStatuses = (): RowStatuses => ({});

const updateRowStatus = (
  rowStatuses: RowStatuses,
  rowId: number,
  status: RowStatus
): RowStatuses => ({
  ...rowStatuses,
  [rowId]: status,
});

const loadTransferStatuses = async (
  response: Company[],
  setRowStatuses: (statuses: RowStatuses) => void
) => {
  if (response.length === 0) {
    return;
  }

  try {
    const companyIds = response.map((company) => company.id);
    const transferStatuses = await getCompaniesTransferStatus(companyIds);
    const newStatuses: RowStatuses = {};

    for (const company of response) {
      const companyTransferStatuses = transferStatuses[company.id] || [];
      if (companyTransferStatuses.length > 0) {
        const latestStatus = companyTransferStatuses[0];
        if (
          latestStatus.status === "pending" ||
          latestStatus.status === "processing"
        ) {
          newStatuses[company.id] = latestStatus.status as RowStatus;
        }
      }
    }

    setRowStatuses(newStatuses);
  } catch (error) {
    console.error("Failed to load transfer statuses:", error);
  }
};

export const useRowStatus = (
  response: Company[],
  currentJobId: string | null,
  isTransferring: boolean,
  resetTransfer?: () => void
) => {
  const [rowStatuses, setRowStatuses] = useState<RowStatuses>(
    createRowStatuses()
  );

  useEffect(() => {
    loadTransferStatuses(response, setRowStatuses);
  }, [response]);

  useEffect(() => {
    if (!currentJobId || !isTransferring) return;

    const pollInterval = setInterval(async () => {
      try {
        const jobStatus = await getTransferJobStatus(currentJobId);

        const newStatuses: RowStatuses = {};
        let hasActiveTransfers = false;

        jobStatus.items.forEach((item) => {
          if (item.status === "pending" || item.status === "processing") {
            newStatuses[item.company_id] = item.status as RowStatus;
            hasActiveTransfers = true;
          }
        });

        setRowStatuses(newStatuses);

        // If no active transfers remain, reset the transfer state
        if (!hasActiveTransfers && resetTransfer) {
          resetTransfer();
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
        // If there's an error, also reset the transfer state
        if (resetTransfer) {
          resetTransfer();
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [currentJobId, isTransferring, resetTransfer]);

  const updateStatus = (rowId: number, status: RowStatus) => {
    setRowStatuses((prev) => updateRowStatus(prev, rowId, status));
  };

  return {
    rowStatuses,
    updateStatus,
  };
};
