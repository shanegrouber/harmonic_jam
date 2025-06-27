const API_BASE_URL = "http://localhost:8000";

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

export interface CeleryTaskStatus {
  state: string;
  current: number;
  total: number;
  status: string;
  result?: Record<string, unknown>;
}

export const createTransferJob = async (
  transferRequest: TransferJobCreate
): Promise<TransferJobResponse> => {
  const response = await fetch(`${API_BASE_URL}/transfers/jobs`, {
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
  const response = await fetch(`${API_BASE_URL}/transfers/jobs/${jobId}`);

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
    `${API_BASE_URL}/transfers/jobs/${jobId}/items/${itemId}/status`,
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
    `${API_BASE_URL}/transfers/companies/${companyId}/status`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get company transfer status: ${response.statusText}`
    );
  }

  return response.json();
};

export const getCompaniesTransferStatus = async (
  companyIds: number[]
): Promise<Record<number, TransferJobItemResponse[]>> => {
  const response = await fetch(`${API_BASE_URL}/transfers/companies/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(companyIds),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get companies transfer status: ${response.statusText}`
    );
  }

  return response.json();
};

export const cancelTransferJob = async (jobId: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/transfers/jobs/${jobId}/cancel`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to cancel transfer job: ${response.statusText}`);
  }
};

export const getCeleryTaskStatus = async (
  taskId: string
): Promise<CeleryTaskStatus> => {
  const response = await fetch(
    `${API_BASE_URL}/transfers/tasks/${taskId}/status`
  );

  if (!response.ok) {
    throw new Error(`Failed to get task status: ${response.statusText}`);
  }

  return response.json();
};
