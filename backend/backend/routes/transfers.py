import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.db import database
from backend.tasks.transfer_tasks import process_transfer_job

router = APIRouter(
    prefix="/transfers",
    tags=["transfers"],
)


class TransferJobCreate(BaseModel):
    company_ids: list[int]
    source_collection_id: Optional[uuid.UUID] = None
    collection_id: uuid.UUID


class TransferJobCreateForCollection(BaseModel):
    source_collection_id: uuid.UUID
    collection_id: uuid.UUID


class RemoveCompaniesRequest(BaseModel):
    company_ids: list[int]
    collection_id: uuid.UUID


class TransferJobItemResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    company_id: int
    source_collection_id: Optional[uuid.UUID]
    collection_id: uuid.UUID
    status: str
    error_message: Optional[str]
    created_at: datetime
    last_attempt_at: Optional[datetime]
    attempt_count: int
    is_cancelled: bool

    class Config:
        from_attributes = True


class TransferJobResponse(BaseModel):
    job_id: uuid.UUID
    items: list[TransferJobItemResponse]
    total_items: int
    pending_count: int
    processing_count: int
    success_count: int
    error_count: int
    cancelled_count: int
    celery_task_id: Optional[str] = None


@router.post("/jobs", response_model=TransferJobResponse)
def create_transfer_job(
    transfer_request: TransferJobCreate,
    db: Session = Depends(database.get_db),
):
    """Create a new transfer job with multiple company transfers"""
    job_id = uuid.uuid4()

    transfer_items = []
    for company_id in transfer_request.company_ids:
        transfer_item = database.TransferJobItem(
            job_id=job_id,
            company_id=company_id,
            source_collection_id=transfer_request.source_collection_id,
            collection_id=transfer_request.collection_id,
            status="pending",
        )
        db.add(transfer_item)
        transfer_items.append(transfer_item)

    db.commit()

    try:
        batch_size = 100
        celery_task = process_transfer_job.delay(str(job_id), batch_size)
    except Exception:
        raise

    return get_transfer_job_status(job_id, db, celery_task.id)


@router.post("/jobs/collection", response_model=TransferJobResponse)
def create_transfer_job_for_collection(
    transfer_request: TransferJobCreateForCollection,
    db: Session = Depends(database.get_db),
):
    """Create a new transfer job for all companies in a collection"""
    job_id = uuid.uuid4()

    # Get all company IDs from the source collection
    if not transfer_request.source_collection_id:
        raise HTTPException(status_code=400, detail="Source collection ID is required")

    # Get companies from specific collection
    company_associations = (
        db.query(database.CompanyCollectionAssociation.company_id)
        .filter(
            database.CompanyCollectionAssociation.collection_id
            == transfer_request.source_collection_id
        )
        .all()
    )
    company_ids = [assoc.company_id for assoc in company_associations]

    transfer_items = [
        database.TransferJobItem(
            job_id=job_id,
            company_id=company_id,
            source_collection_id=transfer_request.source_collection_id,
            collection_id=transfer_request.collection_id,
            status="pending",
        )
        for company_id in company_ids
    ]

    db.bulk_save_objects(transfer_items)
    db.commit()

    try:
        batch_size = 100
        celery_task = process_transfer_job.delay(str(job_id), batch_size)
    except Exception:
        raise

    return get_transfer_job_status(job_id, db, celery_task.id)


@router.post("/remove")
def remove_companies_from_collection(
    remove_request: RemoveCompaniesRequest,
    db: Session = Depends(database.get_db),
):
    """Remove companies from a collection"""
    try:
        # Check if the collection exists
        collection = (
            db.query(database.CompanyCollection)
            .filter(database.CompanyCollection.id == remove_request.collection_id)
            .first()
        )

        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")

        # Find existing associations to remove
        associations_to_remove = (
            db.query(database.CompanyCollectionAssociation)
            .filter(
                database.CompanyCollectionAssociation.company_id.in_(
                    remove_request.company_ids
                ),
                database.CompanyCollectionAssociation.collection_id
                == remove_request.collection_id,
            )
            .all()
        )

        if not associations_to_remove:
            return {
                "message": "No companies found in the specified collection",
                "removed_count": 0,
                "company_ids": [],
            }

        # Get the company IDs that were actually removed
        removed_company_ids = [assoc.company_id for assoc in associations_to_remove]

        # Remove the associations
        for association in associations_to_remove:
            db.delete(association)

        db.commit()

        return {
            "message": f"Successfully removed {len(removed_company_ids)} companies from collection",
            "removed_count": len(removed_company_ids),
            "company_ids": removed_company_ids,
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to remove companies: {str(e)}"
        )


@router.post("/jobs/{job_id}/retry")
def retry_failed_batches(job_id: uuid.UUID):
    """Retry failed batches for a job"""
    from backend.tasks.transfer_tasks import retry_failed_batches

    try:
        celery_task = retry_failed_batches.delay(str(job_id))
        return {
            "message": "Retry job started",
            "celery_task_id": celery_task.id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to start retry job: {str(e)}"
        )


@router.get("/jobs/{job_id}", response_model=TransferJobResponse)
def get_transfer_job_status(
    job_id: uuid.UUID,
    db: Session = Depends(database.get_db),
    celery_task_id: Optional[str] = None,
):
    """Get the status of a transfer job and all its items"""
    items = (
        db.query(database.TransferJobItem)
        .filter(database.TransferJobItem.job_id == job_id)
        .all()
    )

    if not items:
        raise HTTPException(status_code=404, detail="Transfer job not found")

    status_counts = {
        "pending": 0,
        "processing": 0,
        "success": 0,
        "error": 0,
        "cancelled": 0,
    }

    for item in items:
        status_counts[item.status] += 1

    return TransferJobResponse(
        job_id=job_id,
        items=items,
        total_items=len(items),
        pending_count=status_counts["pending"],
        processing_count=status_counts["processing"],
        success_count=status_counts["success"],
        error_count=status_counts["error"],
        cancelled_count=status_counts["cancelled"],
        celery_task_id=celery_task_id,
    )


@router.get("/jobs/{job_id}/items", response_model=list[TransferJobItemResponse])
def get_transfer_job_items(
    job_id: uuid.UUID,
    db: Session = Depends(database.get_db),
):
    """Get all items for a specific transfer job"""
    items = (
        db.query(database.TransferJobItem)
        .filter(database.TransferJobItem.job_id == job_id)
        .all()
    )

    if not items:
        raise HTTPException(status_code=404, detail="Transfer job not found")

    return items


@router.put("/jobs/{job_id}/items/{item_id}/status")
def update_transfer_item_status(
    job_id: uuid.UUID,
    item_id: uuid.UUID,
    status: str,
    error_message: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    """Update the status of a specific transfer item"""
    item = (
        db.query(database.TransferJobItem)
        .filter(
            database.TransferJobItem.job_id == job_id,
            database.TransferJobItem.id == item_id,
        )
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Transfer item not found")

    item.status = status
    item.error_message = error_message
    item.last_attempt_at = datetime.utcnow()
    item.attempt_count += 1

    db.commit()

    return {"message": "Status updated successfully"}


@router.post("/jobs/{job_id}/cancel")
def cancel_transfer_job(
    job_id: uuid.UUID,
    db: Session = Depends(database.get_db),
):
    """Cancel all pending items in a transfer job"""
    items = (
        db.query(database.TransferJobItem)
        .filter(
            database.TransferJobItem.job_id == job_id,
            database.TransferJobItem.status.in_(["pending", "processing"]),
        )
        .all()
    )

    for item in items:
        item.status = "cancelled"
        item.is_cancelled = True

    db.commit()

    return {"message": f"Cancelled {len(items)} transfer items"}


@router.get(
    "/companies/{company_id}/status", response_model=list[TransferJobItemResponse]
)
def get_company_transfer_status(
    company_id: int,
    db: Session = Depends(database.get_db),
):
    """Get all transfer statuses for a specific company"""
    items = (
        db.query(database.TransferJobItem)
        .filter(database.TransferJobItem.company_id == company_id)
        .order_by(database.TransferJobItem.created_at.desc())
        .all()
    )

    return items


@router.post(
    "/companies/status", response_model=dict[int, list[TransferJobItemResponse]]
)
def get_companies_transfer_status(
    company_ids: list[int],
    db: Session = Depends(database.get_db),
):
    """Get transfer statuses for multiple companies in a single query"""
    items = (
        db.query(database.TransferJobItem)
        .filter(database.TransferJobItem.company_id.in_(company_ids))
        .order_by(database.TransferJobItem.created_at.desc())
        .all()
    )

    # Group by company_id
    result = {}
    for item in items:
        if item.company_id not in result:
            result[item.company_id] = []
        result[item.company_id].append(item)

    # Ensure all requested company_ids are in the result (even if empty)
    for company_id in company_ids:
        if company_id not in result:
            result[company_id] = []

    return result


@router.get("/tasks/{task_id}/status")
def get_celery_task_status(task_id: str):
    """Get the status of a Celery task"""
    from backend.celery_app import celery_app

    task = celery_app.AsyncResult(task_id)

    if task.state == "PENDING":
        response = {
            "state": task.state,
            "current": 0,
            "total": 1,
            "status": "Task is pending...",
        }
    elif task.state != "FAILURE":
        response = {
            "state": task.state,
            "current": task.info.get("current", 0),
            "total": task.info.get("total", 1),
            "status": task.info.get("status", ""),
        }
        if "result" in task.info:
            response["result"] = task.info["result"]
    else:
        response = {
            "state": task.state,
            "current": 1,
            "total": 1,
            "status": str(task.info),  # This is the exception raised
        }

    return response
