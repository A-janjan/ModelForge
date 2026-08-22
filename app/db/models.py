from datetime import datetime, timezone
from enum import Enum
from typing import override

from sqlalchemy import (  # pyright: ignore[reportMissingImports]
    Column,  # pyright: ignore[reportUnknownVariableType]
    DateTime,  # pyright: ignore[reportUnknownVariableType]
    Float,  # pyright: ignore[reportUnknownVariableType]
    Integer,  # pyright: ignore[reportUnknownVariableType]
    String,  # pyright: ignore[reportUnknownVariableType]
)
from sqlalchemy import (  # pyright: ignore[reportMissingImports]
    Enum as SQLEnum,  # pyright: ignore[reportUnknownVariableType]
)
from sqlalchemy.orm import (  # pyright: ignore[reportMissingImports]
    declarative_base,  # pyright: ignore[reportUnknownVariableType]
)

Base = declarative_base()  # pyright: ignore[reportUnknownVariableType]


class ModelStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
    FAILED = "failed"


class Model(Base):  # pyright: ignore[reportUntypedBaseClass]
    """
    ORM model representing metadata about a deployed model version.

    Table: models

    Columns:
        id              - Primary key.
        name            - Name of the model (e.g. "iris").
        version         - Version string (e.g. "1.0.0").
        artifact_path   - Filesystem/object-store path to the model artifact.
        status          - Current lifecycle status of the model version.
        traffic_weight  - Percentage of traffic (0-100) routed to this version.
                           Supports canary deployments, e.g.:

                               id=1, name=iris, version=1.0.0, traffic_weight=90
                               id=2, name=iris, version=2.0.0, traffic_weight=10

        created_at      - Timestamp of when this model version was registered.
    """

    __tablename__: str = "models"

    id: int = Column(Integer, primary_key=True, autoincrement=True)  # pyright: ignore[reportUnknownVariableType]
    name: str = Column(String, nullable=False, index=True)  # pyright: ignore[reportUnknownVariableType]
    version: str = Column(String, nullable=False)  # pyright: ignore[reportUnknownVariableType]
    artifact_path: str = Column(String, nullable=False)  # pyright: ignore[reportUnknownVariableType]
    status: ModelStatus = Column(  # pyright: ignore[reportUnknownVariableType]
        SQLEnum(ModelStatus), nullable=False, default=ModelStatus.PENDING
    )
    traffic_weight: float = Column(Float, nullable=False, default=0.0)  # pyright: ignore[reportUnknownVariableType]
    created_at: datetime = Column(  # pyright: ignore[reportUnknownVariableType]
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    @override
    def __repr__(self) -> str:
        return (
            f"<Model(id={self.id}, name={self.name!r}, version={self.version!r}, "
            f"status={self.status}, traffic_weight={self.traffic_weight})>"
        )
