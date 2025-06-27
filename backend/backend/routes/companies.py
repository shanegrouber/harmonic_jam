from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.db import database

router = APIRouter(
    prefix="/companies",
    tags=["companies"],
)


class CompanyOutput(BaseModel):
    id: int
    company_name: str
    liked: bool


class CompanyBatchOutput(BaseModel):
    companies: list[CompanyOutput]
    total: int


class ToggleLikeResponse(BaseModel):
    company_id: int
    liked: bool
    message: str


def fetch_companies_with_liked(
    db: Session, company_ids: list[int]
) -> list[CompanyOutput]:
    liked_list = (
        db.query(database.CompanyCollection)
        .filter(database.CompanyCollection.collection_name == "Liked Companies List")
        .first()
    )

    liked_associations = (
        db.query(database.CompanyCollectionAssociation)
        .filter(database.Company.id.in_(company_ids))
        .filter(
            database.CompanyCollectionAssociation.collection_id == liked_list.id,
        )
        .all()
    )

    liked_companies = {association.company_id for association in liked_associations}

    companies = (
        db.query(database.Company).filter(database.Company.id.in_(company_ids)).all()
    )

    results = [(company, company.id in liked_companies) for company in companies]

    return [
        CompanyOutput(
            id=company.id,
            company_name=company.company_name,
            liked=True if liked else False,
        )
        for company, liked in results
    ]


@router.get("", response_model=CompanyBatchOutput)
def get_companies(
    offset: int = Query(
        0, description="The number of items to skip from the beginning"
    ),
    limit: int = Query(10, description="The number of items to fetch"),
    db: Session = Depends(database.get_db),
):
    results = db.query(database.Company).offset(offset).limit(limit).all()

    count = db.query(database.Company).count()
    companies = fetch_companies_with_liked(db, [company.id for company in results])

    return CompanyBatchOutput(
        companies=companies,
        total=count,
    )


@router.post("/{company_id}/toggle-like", response_model=ToggleLikeResponse)
def toggle_company_like(
    company_id: int,
    db: Session = Depends(database.get_db),
):
    """Toggle the liked status of a company by adding/removing it from the Liked Companies List"""

    # Check if company exists
    company = (
        db.query(database.Company).filter(database.Company.id == company_id).first()
    )
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get the Liked Companies List collection
    liked_collection = (
        db.query(database.CompanyCollection)
        .filter(database.CompanyCollection.collection_name == "Liked Companies List")
        .first()
    )

    if not liked_collection:
        raise HTTPException(
            status_code=500, detail="Liked Companies List collection not found"
        )

    # Check if company is currently in the liked collection
    existing_association = (
        db.query(database.CompanyCollectionAssociation)
        .filter(
            database.CompanyCollectionAssociation.company_id == company_id,
            database.CompanyCollectionAssociation.collection_id == liked_collection.id,
        )
        .first()
    )

    if existing_association:
        # Remove from liked collection
        db.delete(existing_association)
        db.commit()
        return ToggleLikeResponse(
            company_id=company_id,
            liked=False,
            message="Company removed from liked list",
        )
    else:
        # Add to liked collection
        new_association = database.CompanyCollectionAssociation(
            company_id=company_id, collection_id=liked_collection.id
        )
        db.add(new_association)
        db.commit()
        return ToggleLikeResponse(
            company_id=company_id, liked=True, message="Company added to liked list"
        )
