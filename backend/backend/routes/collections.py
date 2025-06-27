import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.db import database
from backend.routes.companies import CompanyBatchOutput, CompanyOutput

router = APIRouter(
    prefix="/collections",
    tags=["collections"],
)


class CompanyCollectionMetadata(BaseModel):
    id: uuid.UUID
    collection_name: str


class CompanyCollectionOutput(CompanyBatchOutput, CompanyCollectionMetadata):
    pass


@router.get("", response_model=list[CompanyCollectionMetadata])
def get_all_collection_metadata(
    db: Session = Depends(database.get_db),
):
    collections = db.query(database.CompanyCollection).all()

    return [
        CompanyCollectionMetadata(
            id=collection.id,
            collection_name=collection.collection_name,
        )
        for collection in collections
    ]


@router.get("/{collection_id}", response_model=CompanyCollectionOutput)
def get_company_collection_by_id(
    collection_id: uuid.UUID,
    offset: int = Query(
        0, description="The number of items to skip from the beginning"
    ),
    limit: int = Query(10, description="The number of items to fetch"),
    db: Session = Depends(database.get_db),
):
    # Single query to get companies and total count
    query = (
        db.query(
            database.Company.id,
            database.Company.company_name,
            database.CompanyCollection.collection_name,
            func.count().over().label("total_count"),
        )
        .select_from(database.CompanyCollectionAssociation)
        .join(
            database.Company,
            database.CompanyCollectionAssociation.company_id == database.Company.id,
        )
        .join(
            database.CompanyCollection,
            database.CompanyCollectionAssociation.collection_id
            == database.CompanyCollection.id,
        )
        .filter(database.CompanyCollectionAssociation.collection_id == collection_id)
        .order_by(database.Company.id)
        .offset(offset)
        .limit(limit)
    )

    results = query.all()

    if not results:
        # Collection might exist but be empty, or collection doesn't exist
        collection = (
            db.query(database.CompanyCollection)
            .filter(database.CompanyCollection.id == collection_id)
            .first()
        )

        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")

        return CompanyCollectionOutput(
            id=collection_id,
            collection_name=collection.collection_name,
            companies=[],
            total=0,
        )

    collection_name = results[0].collection_name
    total_count = results[0].total_count
    company_ids = [result.id for result in results]

    liked_list = (
        db.query(database.CompanyCollection)
        .filter(database.CompanyCollection.collection_name == "Liked Companies List")
        .first()
    )

    liked_companies = set()

    if liked_list:
        liked_associations = (
            db.query(database.CompanyCollectionAssociation.company_id)
            .filter(database.CompanyCollectionAssociation.company_id.in_(company_ids))
            .filter(
                database.CompanyCollectionAssociation.collection_id == liked_list.id
            )
            .all()
        )
        liked_companies = {assoc.company_id for assoc in liked_associations}

    companies = [
        CompanyOutput(
            id=result.id,
            company_name=result.company_name,
            liked=result.id in liked_companies,
        )
        for result in results
    ]

    return CompanyCollectionOutput(
        id=collection_id,
        collection_name=collection_name,
        companies=companies,
        total=total_count,
    )
