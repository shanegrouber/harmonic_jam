import uuid
from datetime import datetime

from celery import current_task

from backend.celery_app import celery_app
from backend.db.database import SessionLocal


@celery_app.task(bind=True, name="backend.tasks.transfer_tasks.process_transfer_batch")
def process_transfer_batch(self, batch_data: dict):
    """
    Process a batch of transfer items as a single unit
    batch_data contains: {
        'job_id': str,
        'company_ids': List[int],
        'source_collection_id': Optional[str],
        'collection_id': str,
        'batch_number': int
    }
    """
    db = SessionLocal()
    try:
        from backend.db.database import CompanyCollectionAssociation, TransferJobItem

        job_id = batch_data["job_id"]
        company_ids = batch_data["company_ids"]
        source_collection_id = batch_data.get("source_collection_id")
        collection_id = batch_data["collection_id"]
        batch_number = batch_data["batch_number"]

        print(f"Processing batch {batch_number} with {len(company_ids)} companies")

        # Update task status
        current_task.update_state(
            state="PROGRESS",
            meta={
                "current": 0,
                "total": len(company_ids),
                "status": f"Processing batch {batch_number}...",
            },
        )

        success_count = 0
        error_count = 0
        errors = []

        # Bulk check which companies are already in the target collection
        existing_associations = (
            db.query(CompanyCollectionAssociation.company_id)
            .filter(CompanyCollectionAssociation.company_id.in_(company_ids))
            .filter(CompanyCollectionAssociation.collection_id == collection_id)
            .all()
        )
        existing_company_ids = {assoc.company_id for assoc in existing_associations}

        print(
            f"Batch {batch_number}: {len(existing_company_ids)} companies already in target collection"
        )

        # Process each company in the batch
        for i, company_id in enumerate(company_ids):
            try:
                # Get the transfer item for this company
                transfer_item = (
                    db.query(TransferJobItem)
                    .filter(
                        TransferJobItem.job_id == uuid.UUID(job_id),
                        TransferJobItem.company_id == company_id,
                        TransferJobItem.collection_id == collection_id,
                    )
                    .first()
                )

                if not transfer_item:
                    error_count += 1
                    errors.append(f"Company {company_id}: Transfer item not found")
                    continue

                # Mark as processing
                transfer_item.status = "processing"
                transfer_item.last_attempt_at = datetime.utcnow()
                transfer_item.attempt_count += 1

                # Check if already in target collection (using pre-fetched data)
                if company_id in existing_company_ids:
                    # Already in collection, mark as success
                    transfer_item.status = "success"
                    success_count += 1
                else:
                    # Add to target collection
                    new_association = CompanyCollectionAssociation(
                        company_id=company_id,
                        collection_id=collection_id,
                    )
                    db.add(new_association)

                    # Mark as success
                    transfer_item.status = "success"
                    success_count += 1

                # Commit after each company for real-time updates
                db.commit()

                # Update progress every 100 items
                if (i + 1) % 100 == 0:
                    current_task.update_state(
                        state="PROGRESS",
                        meta={
                            "current": i + 1,
                            "total": len(company_ids),
                            "status": f"Batch {batch_number}: Processed {i + 1}/{len(company_ids)}...",
                        },
                    )

            except Exception as e:
                error_count += 1
                errors.append(f"Company {company_id}: {str(e)}")
                print(f"Error processing company {company_id}: {e}")

                # Mark transfer item as error
                if "transfer_item" in locals():
                    transfer_item.status = "error"
                    transfer_item.error_message = str(e)
                    db.commit()  # Commit error status

        print(
            f"Batch {batch_number} completed: {success_count} success, {error_count} errors"
        )

        # Determine batch status
        if error_count == 0:
            batch_status = "success"
            message = f"Batch {batch_number} completed successfully: {success_count} companies transferred"
        else:
            batch_status = "partial_success" if success_count > 0 else "error"
            message = f"Batch {batch_number} completed with errors: {success_count} success, {error_count} errors"

        return {
            "status": batch_status,
            "message": message,
            "batch_number": batch_number,
            "success_count": success_count,
            "error_count": error_count,
            "total_count": len(company_ids),
            "errors": errors[:10] if errors else [],  # Limit error details
        }

    except Exception as e:
        print(f"Batch {batch_data.get('batch_number', 'unknown')} failed: {e}")
        return {
            "status": "error",
            "message": f"Batch {batch_data.get('batch_number', 'unknown')} failed: {str(e)}",
            "batch_number": batch_data.get("batch_number", 0),
            "success_count": 0,
            "error_count": len(batch_data.get("company_ids", [])),
            "total_count": len(batch_data.get("company_ids", [])),
            "errors": [str(e)],
        }
    finally:
        db.close()


@celery_app.task(bind=True, name="backend.tasks.transfer_tasks.process_transfer_job")
def process_transfer_job(self, job_id: str, batch_size: int = 100):
    """
    Process a transfer job by creating batches of companies
    """
    db = SessionLocal()
    try:
        from backend.db.database import TransferJobItem

        # Get all pending items for this job
        pending_items = (
            db.query(TransferJobItem)
            .filter(TransferJobItem.job_id == uuid.UUID(job_id))
            .filter(TransferJobItem.status == "pending")
            .filter(TransferJobItem.is_cancelled == False)
            .all()
        )

        if not pending_items:
            return {"status": "success", "message": "No pending items to process"}

        total_items = len(pending_items)
        print(f"Processing {total_items} items in batches of {batch_size}")

        # Update task status
        current_task.update_state(
            state="PROGRESS",
            meta={
                "current": 0,
                "total": total_items,
                "status": f"Creating batches for {total_items} items...",
            },
        )

        # Group items by batch
        batches = []
        for i in range(0, len(pending_items), batch_size):
            batch_items = pending_items[i : i + batch_size]
            batch_data = {
                "job_id": job_id,
                "company_ids": [item.company_id for item in batch_items],
                "source_collection_id": batch_items[0].source_collection_id
                if batch_items
                else None,
                "collection_id": batch_items[0].collection_id if batch_items else None,
                "batch_number": len(batches) + 1,
            }
            batches.append(batch_data)

        print(f"Created {len(batches)} batches")

        # Start all batches
        batch_tasks = []
        for batch_data in batches:
            try:
                batch_task = process_transfer_batch.delay(batch_data)
                batch_tasks.append(batch_task)
                print(f"Started batch {batch_data['batch_number']}")
            except Exception as e:
                print(f"Failed to start batch {batch_data['batch_number']}: {e}")

        # Update task status
        current_task.update_state(
            state="PROGRESS",
            meta={
                "current": total_items,
                "total": total_items,
                "status": f"Started {len(batch_tasks)} batches",
            },
        )

        return {
            "status": "started",
            "message": f"Started processing {total_items} items in {len(batches)} batches",
            "total_items": total_items,
            "batches_created": len(batches),
            "batch_tasks_started": len(batch_tasks),
            "batch_task_ids": [task.id for task in batch_tasks],
        }

    except Exception as e:
        print(f"Error processing transfer job {job_id}: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="backend.tasks.transfer_tasks.retry_failed_batches")
def retry_failed_batches(job_id: str):
    """
    Retry failed batches for a job
    """
    db = SessionLocal()
    try:
        from backend.db.database import TransferJobItem

        # Get failed items that can be retried
        failed_items = (
            db.query(TransferJobItem)
            .filter(TransferJobItem.job_id == uuid.UUID(job_id))
            .filter(TransferJobItem.status == "error")
            .all()
        )

        if not failed_items:
            return {"status": "success", "message": "No failed items to retry"}

        print(f"Retrying {len(failed_items)} failed items")

        # Reset status to pending for retry
        for item in failed_items:
            item.status = "pending"
            item.error_message = None
        db.commit()

        # Start a new job to process the retry items
        celery_task = process_transfer_job.delay(str(job_id))

        return {
            "status": "success",
            "message": f"Retrying {len(failed_items)} failed items",
            "retry_count": len(failed_items),
            "celery_task_id": celery_task.id,
        }

    except Exception as e:
        print(f"Error retrying failed batches for job {job_id}: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="backend.tasks.transfer_tasks.cleanup_old_transfers")
def cleanup_old_transfers():
    """
    Clean up old transfer records (older than 30 days)
    """
    db = SessionLocal()
    try:
        from datetime import timedelta

        from backend.db.database import TransferJobItem

        # Delete transfers older than 30 days
        cutoff_date = datetime.utcnow() - timedelta(days=30)

        old_transfers = (
            db.query(TransferJobItem)
            .filter(TransferJobItem.created_at < cutoff_date)
            .filter(TransferJobItem.status.in_(["success", "error"]))
            .all()
        )

        for transfer in old_transfers:
            db.delete(transfer)

        db.commit()

        return {
            "status": "success",
            "message": f"Cleaned up {len(old_transfers)} old transfer records",
        }

    except Exception as e:
        print(f"Error cleaning up old transfers: {e}")
        raise
    finally:
        db.close()
