import os

import psycopg2  # pyright: ignore[reportMissingModuleSource]
from dotenv import load_dotenv

_ = load_dotenv()


class ModelRepository:
    def __init__(self):
        self.models: dict[str, int] = {}
        self.conn: psycopg2.extensions.connection = self.db_connect()

    def db_connect(self):
        conn = psycopg2.connect(
            host=os.getenv("POSTGRES_HOST"),
            port=os.getenv("POSTGRES_PORT"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            dbname=os.getenv("POSTGRES_DB"),
        )
        return conn

    def create_model(
        self,
        name: str,
        version: str,
        artifact_path: str,
        status: str,
        traffic_weight: int,
    ) -> tuple[str, str, str, str, int] | None:
        cur = self.conn.cursor()
        cur.execute("""
                CREATE TABLE IF NOT EXISTS models (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    version TEXT NOT NULL,
                    artifact_path TEXT NOT NULL,
                    status TEXT NOT NULL,
                    traffic_weight INTEGER NOT NULL
                )
            """)
        cur.execute(
            """
                INSERT INTO models (name, version, artifact_path, status, traffic_weight)
                VALUES(%s, %s, %s, %s, %s)
                """,
            (name, version, artifact_path, status, traffic_weight),
        )
        row = cur.fetchone()
        self.conn.commit()
        return row

    def get_model_by_id(self, id: int) -> tuple[str, str, str, str, int] | None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM models WHERE id = %s
                """,
                (id,),
            )
            return cur.fetchone()

    def get_model_by_version(
        self, version: str
    ) -> tuple[str, str, str, str, int] | None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM models WHERE version = %s
                """,
                (version,),
            )
            return cur.fetchone()

    def list_models(self) -> list[tuple[str, str, str, str, int]]:
        # query all rows , sorted by creation time (id)
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM models ORDER BY id ASC
                """
            )
            return cur.fetchall()

    def get_active_models(self) -> list[tuple[str, str, str, str, int]]:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM models WHERE status = 'active'
                """
            )
            return cur.fetchall()

    def update_traffic_weight(self, version: str, traffic_weight: int):
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE models SET traffic_weight = %s WHERE version = %s
                """,
                (traffic_weight, version),
            )
            self.conn.commit()

    def update_status(self, version: str, status: str):
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE models SET status = %s WHERE version = %s
                """,
                (status, version),
            )
            self.conn.commit()

    def rollback_model(self, target_version: str):
        # deactivate all versions then activate target_version
        with self.conn.cursor() as cur:
            cur.execute(
                """
                UPDATE models SET status = 'inactive' WHERE status = 'active'
                """
            )
            cur.execute(
                """
                UPDATE models SET status = 'active' WHERE version = %s
                """,
                (target_version,),
            )
            self.conn.commit()
