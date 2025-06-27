#!/usr/bin/env python3
"""
Test script to verify batch transfer processing works correctly.
"""

import uuid
from unittest.mock import MagicMock, patch

from backend.db.database import (
    Base,
    Company,
    CompanyCollection,
    CompanyCollectionAssociation,
    SessionLocal,
    TransferJobItem,
    engine,
)
from backend.tasks.transfer_tasks import process_transfer_batch


def create_test_data(num_companies=150):
    """Create test data for batch processing."""
    db = SessionLocal()

    try:
        # Create test companies
        companies = []
        for i in range(num_companies):
            company = Company(company_name=f"Test Company {i+1}")
            db.add(company)
            companies.append(company)
        db.commit()

        # Create test collections
        source_collection = CompanyCollection(collection_name="Source Collection")
        target_collection = CompanyCollection(collection_name="Target Collection")
        db.add_all([source_collection, target_collection])
        db.commit()

        # Add some companies to source collection
        for company in companies[:50]:  # First 50 companies
            association = CompanyCollectionAssociation(
                company_id=company.id, collection_id=source_collection.id
            )
            db.add(association)
        db.commit()

        return {
            "companies": companies,
            "source_collection": source_collection,
            "target_collection": target_collection,
            "db": db,
        }
    except Exception as e:
        db.close()
        raise e


def test_batch_processing():
    """Test batch processing with 150 companies."""
    print("🧪 Testing batch processing with 150 companies...")

    # Setup test data
    data = create_test_data(150)
    db = data["db"]

    try:
        # Create transfer job with 150 items
        job_id = uuid.uuid4()
        transfer_items = []
        company_ids = []

        for company in data["companies"]:
            item = TransferJobItem(
                job_id=job_id,
                company_id=company.id,
                source_collection_id=data["source_collection"].id,
                collection_id=data["target_collection"].id,
                status="pending",
            )
            db.add(item)
            transfer_items.append(item)
            company_ids.append(company.id)

        db.commit()

        print(f"✅ Created transfer job with {len(transfer_items)} items")
        print(f"   Job ID: {job_id}")

        # Test batch processing using the actual batch function
        batch_size = 100
        batches = []
        for i in range(0, len(company_ids), batch_size):
            batch_company_ids = company_ids[i : i + batch_size]
            batch_data = {
                "job_id": str(job_id),
                "company_ids": batch_company_ids,
                "source_collection_id": str(data["source_collection"].id),
                "collection_id": str(data["target_collection"].id),
                "batch_number": len(batches) + 1,
            }
            batches.append(batch_data)

        print(f"✅ Split into {len(batches)} batches of {batch_size} items each")

        # Process each batch using the actual batch function
        with patch("backend.tasks.transfer_tasks.current_task") as mock_task:
            mock_task.update_state = MagicMock()

            for i, batch_data in enumerate(batches):
                print(
                    f"   Processing batch {i+1}/{len(batches)} ({len(batch_data['company_ids'])} items)"
                )
                result = process_transfer_batch(batch_data)
                print(f"   ✅ Batch {i+1} completed: {result}")

        print("✅ All batches completed")

        # Verify results
        success_count = (
            db.query(TransferJobItem)
            .filter(
                TransferJobItem.job_id == job_id, TransferJobItem.status == "success"
            )
            .count()
        )

        print(f"✅ Verification: {success_count} items marked as success")

        return success_count == len(transfer_items)

    finally:
        db.close()


def test_batch_partial_success():
    """Test batch where some transfers succeed and some fail."""
    print("\n🧪 Testing batch with partial success/failure...")

    # Setup test data
    data = create_test_data(10)
    db = data["db"]

    try:
        # Create transfer job with valid companies only
        job_id = uuid.uuid4()
        transfer_items = []
        valid_company_ids = [c.id for c in data["companies"][:8]]
        invalid_company_ids = [999999, 888888]  # IDs that do not exist

        # Only create TransferJobItem records for valid companies
        for company_id in valid_company_ids:
            item = TransferJobItem(
                job_id=job_id,
                company_id=company_id,
                source_collection_id=data["source_collection"].id,
                collection_id=data["target_collection"].id,
                status="pending",
            )
            db.add(item)
            transfer_items.append(item)
        db.commit()

        # Create batch data that includes both valid and invalid company IDs
        all_company_ids = valid_company_ids + invalid_company_ids
        batch_data = {
            "job_id": str(job_id),
            "company_ids": all_company_ids,
            "source_collection_id": str(data["source_collection"].id),
            "collection_id": str(data["target_collection"].id),
            "batch_number": 1,
        }

        # Process the batch
        with patch("backend.tasks.transfer_tasks.current_task") as mock_task:
            mock_task.update_state = MagicMock()
            result = process_transfer_batch(batch_data)

        print(f"   ✅ Batch result: {result}")

        # Check results for valid companies
        for item in transfer_items:
            db.refresh(item)
            print(f"      Company {item.company_id}: {item.status}")

        # Assertions
        success_items = [item for item in transfer_items if item.status == "success"]
        error_items = [item for item in transfer_items if item.status == "error"]

        # All valid companies should succeed (they exist and can be transferred)
        assert len(success_items) == len(
            valid_company_ids
        ), f"Expected {len(valid_company_ids)} successes, got {len(success_items)}"
        assert (
            len(error_items) == 0
        ), f"Expected 0 errors for valid companies, got {len(error_items)}"

        # The batch result should show success for valid companies and errors for invalid ones
        assert (
            result["success_count"] == len(valid_company_ids)
        ), f"Expected {len(valid_company_ids)} successes in result, got {result['success_count']}"
        assert (
            result["error_count"] == len(invalid_company_ids)
        ), f"Expected {len(invalid_company_ids)} errors in result, got {result['error_count']}"
        assert (
            result["status"] == "partial_success"
        ), f"Expected 'partial_success' status, got {result['status']}"

        print("✅ Partial batch success/failure test passed!")

    finally:
        db.close()


def main():
    """Run the batch processing tests."""
    print("🚀 Testing Batch Transfer Processing")
    print("=" * 50)

    Base.metadata.create_all(engine)

    all_passed = True

    try:
        if test_batch_processing():
            print("\n🎉 Batch processing test PASSED!")
        else:
            print("\n❌ Batch processing test FAILED!")
            all_passed = False
        # Run the partial success/failure test
        test_batch_partial_success()
    except Exception as e:
        print(f"\n❌ Test error: {e}")
        all_passed = False

    return 0 if all_passed else 1


if __name__ == "__main__":
    exit(main())
