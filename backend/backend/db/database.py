# app/database.py
import os
import uuid
from datetime import datetime
from typing import Union

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    create_engine,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


Base = declarative_base()


class Settings(Base):
    __tablename__ = "harmonic_settings"

    setting_name = Column(String, primary_key=True)


class Company(Base):
    __tablename__ = "companies"

    created_at: Union[datetime, Column[datetime]] = Column(
        DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False
    )
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)


class CompanyCollection(Base):
    __tablename__ = "company_collections"

    created_at: Union[datetime, Column[datetime]] = Column(
        DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False
    )
    id: Column[uuid.UUID] = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    collection_name = Column(String, index=True)


class CompanyCollectionAssociation(Base):
    __tablename__ = "company_collection_associations"

    __table_args__ = (
        UniqueConstraint("company_id", "collection_id", name="uq_company_collection"),
    )

    created_at: Union[datetime, Column[datetime]] = Column(
        DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False
    )
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), index=True)
    collection_id = Column(
        UUID(as_uuid=True), ForeignKey("company_collections.id"), index=True
    )


class TransferJobItem(Base):
    __tablename__ = "transfer_job_items"

    id: Column[uuid.UUID] = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    job_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    source_collection_id = Column(
        UUID(as_uuid=True), ForeignKey("company_collections.id"), nullable=True
    )  # Optional: Collection the company is being added from (for tracking purposes)
    collection_id = Column(
        UUID(as_uuid=True), ForeignKey("company_collections.id"), nullable=False
    )  # Collection the company is being added TO

    created_at: Column[datetime] = Column(
        DateTime, default=datetime.utcnow, server_default=func.now(), nullable=False
    )

    status = Column(
        String, default="pending", index=True
    )  # pending, processing, success, error
    error_message = Column(String, nullable=True)

    last_attempt_at = Column(DateTime, nullable=True)
    attempt_count = Column(Integer, default=0)

    is_cancelled = Column(Boolean, default=False)
