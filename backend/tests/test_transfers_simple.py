#!/usr/bin/env python3
"""
Simple test to verify transfers are working.
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


def setup_test_data():
    """Create some test data."""
    db = SessionLocal()

    try:
        # Create test companies
        company1 = Company(company_name="Test Company 1")
        company2 = Company(company_name="Test Company 2")
        db.add_all([company1, company2])
        db.commit()

        # Create test collections
        source_collection = CompanyCollection(collection_name="Source Collection")
        target_collection = CompanyCollection(collection_name="Target Collection")
        db.add_all([source_collection, target_collection])
        db.commit()

        # Add company1 to source collection
        association = CompanyCollectionAssociation(
            company_id=company1.id, collection_id=source_collection.id
        )
        db.add(association)
        db.commit()

        return {
            "company1": company1,
            "company2": company2,
            "source_collection": source_collection,
            "target_collection": target_collection,
            "db": db,
        }
    except Exception as e:
        db.close()
        raise e


def test_single_transfer():
    """Test transferring a single company."""
    print("🧪 Testing single company transfer...")

    # Setup test data
    data = setup_test_data()
    db = data["db"]

    try:
        # Create transfer job item
        job_id = uuid.uuid4()
        transfer_item = TransferJobItem(
            job_id=job_id,
            company_id=data["company1"].id,
            source_collection_id=data["source_collection"].id,
            collection_id=data["target_collection"].id,
            status="pending",
        )
        db.add(transfer_item)
        db.commit()

        # Process the transfer as a batch with mocked Celery context
        with patch("backend.tasks.transfer_tasks.current_task") as mock_task:
            mock_task.update_state = MagicMock()

            # Create batch data structure
            batch_data = {
                "job_id": str(job_id),
                "company_ids": [data["company1"].id],
                "source_collection_id": str(data["source_collection"].id),
                "collection_id": str(data["target_collection"].id),
                "batch_number": 1,
            }
            result = process_transfer_batch(batch_data)

        # Check results
        db.refresh(transfer_item)

        print(f"✅ Transfer completed: {result}")
        print(f"   Status: {transfer_item.status}")
        print(f"   Attempts: {transfer_item.attempt_count}")

        # Verify company was added to target collection
        association = (
            db.query(CompanyCollectionAssociation)
            .filter(
                CompanyCollectionAssociation.company_id == data["company1"].id,
                CompanyCollectionAssociation.collection_id
                == data["target_collection"].id,
            )
            .first()
        )

        if association:
            print("✅ Company successfully added to target collection")
        else:
            print("❌ Company was not added to target collection")
            return False

        return transfer_item.status == "success"

    finally:
        db.close()


def test_transfer_job():
    """Test transferring multiple companies in a job."""
    print("\n🧪 Testing transfer job with multiple companies...")

    # Setup test data
    data = setup_test_data()
    db = data["db"]

    try:
        # Create transfer job with multiple items
        job_id = uuid.uuid4()
        transfer_items = []
        company_ids = []

        for company in [data["company1"], data["company2"]]:
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

        # Process as a single batch (simulating what the job would do)
        with patch("backend.tasks.transfer_tasks.current_task") as mock_task:
            mock_task.update_state = MagicMock()

            # Create batch data structure
            batch_data = {
                "job_id": str(job_id),
                "company_ids": company_ids,
                "source_collection_id": str(data["source_collection"].id),
                "collection_id": str(data["target_collection"].id),
                "batch_number": 1,
            }
            result = process_transfer_batch(batch_data)

        print(f"✅ Job completed: {result}")

        # Check all items were processed
        success_count = 0
        for item in transfer_items:
            db.refresh(item)
            if item.status == "success":
                success_count += 1
                print(f"   ✅ Company {item.company_id}: {item.status}")
            else:
                print(
                    f"   ❌ Company {item.company_id}: {item.status} - {item.error_message}"
                )

        return success_count == len(transfer_items)

    finally:
        db.close()


def test_already_in_collection():
    """Test transferring a company that's already in the target collection."""
    print("\n🧪 Testing transfer of company already in target collection...")

    # Setup test data
    data = setup_test_data()
    db = data["db"]

    try:
        # Add company to target collection first
        existing_association = CompanyCollectionAssociation(
            company_id=data["company1"].id, collection_id=data["target_collection"].id
        )
        db.add(existing_association)
        db.commit()

        # Create transfer job item
        job_id = uuid.uuid4()
        transfer_item = TransferJobItem(
            job_id=job_id,
            company_id=data["company1"].id,
            source_collection_id=data["source_collection"].id,
            collection_id=data["target_collection"].id,
            status="pending",
        )
        db.add(transfer_item)
        db.commit()

        # Process the transfer as a batch with mocked Celery context
        with patch("backend.tasks.transfer_tasks.current_task") as mock_task:
            mock_task.update_state = MagicMock()

            # Create batch data structure
            batch_data = {
                "job_id": str(job_id),
                "company_ids": [data["company1"].id],
                "source_collection_id": str(data["source_collection"].id),
                "collection_id": str(data["target_collection"].id),
                "batch_number": 1,
            }
            result = process_transfer_batch(batch_data)

        # Check results
        db.refresh(transfer_item)

        print(f"✅ Transfer completed: {result}")
        print(f"   Status: {transfer_item.status}")

        return transfer_item.status == "success"

    finally:
        db.close()


def main():
    """Run all transfer tests."""
    print("🚀 Testing Transfer Functionality")
    print("=" * 40)

    # Ensure database tables exist
    Base.metadata.create_all(engine)

    tests = [
        ("Single Transfer", test_single_transfer),
        ("Transfer Job", test_transfer_job),
        ("Already in Collection", test_already_in_collection),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        try:
            if test_func():
                print(f"✅ {test_name}: PASSED")
                passed += 1
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")

    print("\n" + "=" * 40)
    print(f"📊 Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Transfers are working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above.")
        return 1


if __name__ == "__main__":
    exit(main())
