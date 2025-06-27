import axios from "axios";
import { CompanyBatchResponse, Collection } from "../types";

const BASE_URL = "http://localhost:8000";

export async function getCompanies(
  offset?: number,
  limit?: number
): Promise<CompanyBatchResponse> {
  try {
    const response = await axios.get(`${BASE_URL}/companies`, {
      params: {
        offset,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

export async function getCollectionsById(
  id: string,
  offset?: number,
  limit?: number,
  search?: string
): Promise<Collection> {
  try {
    const response = await axios.get(`${BASE_URL}/collections/${id}`, {
      params: {
        offset,
        limit,
        search,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

export async function getCollectionsMetadata(): Promise<Collection[]> {
  try {
    const response = await axios.get(`${BASE_URL}/collections`);
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

// Transfer API functions
export interface TransferJobCreate {
  company_ids: number[];
  source_collection_id?: string;
  collection_id: string;
}

export interface TransferJobItemResponse {
  id: string;
  job_id: string;
  company_id: number;
  collection_id: string;
  status: string;
  error_message?: string;
  created_at: string;
  last_attempt_at?: string;
  attempt_count: number;
  is_cancelled: boolean;
}

export interface TransferJobResponse {
  job_id: string;
  items: TransferJobItemResponse[];
  total_items: number;
  pending_count: number;
  processing_count: number;
  success_count: number;
  error_count: number;
  cancelled_count: number;
}

export const createTransferJob = async (
  transferRequest: TransferJobCreate
): Promise<TransferJobResponse> => {
  const response = await fetch(`${BASE_URL}/transfers/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transferRequest),
  });

  if (!response.ok) {
    throw new Error(`Failed to create transfer job: ${response.statusText}`);
  }

  return response.json();
};

export const getTransferJobStatus = async (
  jobId: string
): Promise<TransferJobResponse> => {
  const response = await fetch(`${BASE_URL}/transfers/jobs/${jobId}`);

  if (!response.ok) {
    throw new Error(
      `Failed to get transfer job status: ${response.statusText}`
    );
  }

  return response.json();
};

export const updateTransferItemStatus = async (
  jobId: string,
  itemId: string,
  status: string,
  errorMessage?: string
): Promise<void> => {
  const response = await fetch(
    `${BASE_URL}/transfers/jobs/${jobId}/items/${itemId}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, error_message: errorMessage }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to update transfer item status: ${response.statusText}`
    );
  }
};

export const getCompanyTransferStatus = async (
  companyId: number
): Promise<TransferJobItemResponse[]> => {
  const response = await fetch(
    `${BASE_URL}/transfers/companies/${companyId}/status`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get company transfer status: ${response.statusText}`
    );
  }

  return response.json();
};

export const cancelTransferJob = async (jobId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/transfers/jobs/${jobId}/cancel`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to cancel transfer job: ${response.statusText}`);
  }
};

export interface ToggleLikeResponse {
  company_id: number;
  liked: boolean;
  message: string;
}

export async function toggleCompanyLike(
  companyId: number
): Promise<ToggleLikeResponse> {
  try {
    const response = await axios.post(
      `${BASE_URL}/companies/${companyId}/toggle-like`
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling company like:", error);
    throw error;
  }
}
