import os

import psycopg2  # pyright: ignore[reportMissingModuleSource]
from dotenv import load_dotenv

_ = load_dotenv()

VALID_STATUSES = {
    "pending",
    "active",
    "inactive",
    "archived",
    "failed",
}


class ModelRepository:
    def __init__(self):
        self.models: dict[str, int] = {}
        self.conn: psycopg2.extensions.connection = self.db_connect()
        self._ensure_schema()

    def db_connect(self):
        conn = psycopg2.connect(
            host=os.getenv("POSTGRES_HOST"),
            port=os.getenv("POSTGRES_PORT"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            dbname=os.getenv("POSTGRES_DB"),
        )
        return conn

    def _ensure_schema(self):
        """Create the models table if it doesn't exist."""
        with self.conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS models (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    version TEXT NOT NULL UNIQUE,
                    artifact_path TEXT NOT NULL,
                    status TEXT NOT NULL,
                    traffic_weight INTEGER NOT NULL
                )
            """)
        self.conn.commit()

    def _validate_status(self, status: str) -> str:
        status = status.lower()

        if status not in VALID_STATUSES:
            raise ValueError(f"Invalid status value: {status}")

        return status

    def create_model(
        self,
        name: str,
        version: str,
        artifact_path: str,
        status: str,
        traffic_weight: int,
    ) -> tuple[int, str, str, str, str, int] | None:
        """Insert a new model and return the full record."""
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO models (name, version, artifact_path, status, traffic_weight)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (version) DO UPDATE SET
                    name = EXCLUDED.name,
                    artifact_path = EXCLUDED.artifact_path,
                    status = EXCLUDED.status,
                    traffic_weight = EXCLUDED.traffic_weight
                RETURNING *
                """,
                (name, version, artifact_path, status, traffic_weight),
            )
            row = cur.fetchone()
            self.conn.commit()
            return row

    def get_model_by_id(self, id: int) -> tuple[int, str, str, str, str, int] | None:
        """Retrieve a model by its primary key."""
        with self.conn.cursor() as cur:
            cur.execute("SELECT * FROM models WHERE id = %s", (id,))
            return cur.fetchone()

    def get_model_by_version(
        self, version: str
    ) -> tuple[int, str, str, str, str, int] | None:
        """Retrieve a model by its version string."""
        with self.conn.cursor() as cur:
            cur.execute("SELECT * FROM models WHERE version = %s", (version,))
            return cur.fetchone()

    def list_models(self) -> list[tuple[int, str, str, str, str, int]]:
        """Return all models, ordered by creation (ID)."""
        with self.conn.cursor() as cur:
            cur.execute("SELECT * FROM models ORDER BY id ASC")
            return cur.fetchall()

    def get_active_models(self) -> list[tuple[int, str, str, str, str, int]]:
        """Return only models with status 'active'."""
        with self.conn.cursor() as cur:
            cur.execute("SELECT * FROM models WHERE status = 'active'")
            return cur.fetchall()

    def update_traffic_weight(self, version: str, traffic_weight: int) -> bool:
        """
        Update traffic_weight for a given version.
        Returns True if at least one row was updated, False otherwise.
        """
        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE models SET traffic_weight = %s WHERE version = %s",
                (traffic_weight, version),
            )
            updated = cur.rowcount > 0
            self.conn.commit()
            return updated

    def update_status_by_version(self, version: str, status: str) -> bool:
        """
        Update status for a given version.
        Returns True if at least one row was updated, False otherwise.
        """

        status = self._validate_status(status)

        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE models SET status = %s WHERE version = %s",
                (status, version),
            )
            updated = cur.rowcount > 0
            self.conn.commit()
            return updated

    def update_status_by_id(self, model_id: int, status: str) -> bool:
        """
        Update status for a given id.
        Returns True if at least one row was updated, False otherwise.
        """

        status = self._validate_status(status)

        with self.conn.cursor() as cur:
            cur.execute(
                "UPDATE models SET status = %s WHERE id = %s",
                (status, model_id),
            )
            updated = cur.rowcount > 0
            self.conn.commit()
            return updated

    def rollback_model(self, target_version: str) -> bool:
        """
        Deactivate all active models, then activate the specified version.
        Returns True if the target version exists and was activated, False otherwise.
        """
        with self.conn.cursor() as cur:
            # First check if the target version exists
            cur.execute("SELECT 1 FROM models WHERE version = %s", (target_version,))
            exists = cur.fetchone() is not None
            if not exists:
                return False

            # Deactivate all active models
            cur.execute("UPDATE models SET status = 'inactive' WHERE status = 'active'")
            # Activate the target version
            cur.execute(
                "UPDATE models SET status = 'active' WHERE version = %s",
                (target_version,),
            )
            self.conn.commit()
            return True

    def delete_model(self, model_id: int) -> bool:
        """
        Delete a model by its ID.
        Returns True if a row was deleted, False otherwise.
        """
        with self.conn.cursor() as cur:
            cur.execute("DELETE FROM models WHERE id = %s", (model_id,))
            deleted = cur.rowcount > 0
            self.conn.commit()
            return deleted
