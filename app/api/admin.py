"""
POST /admin/models

> Register Model
POST /admin/models
Example request:
    {
      "name": "iris",
      "version": "2.0.0",
      "artifact_path": "app/models/iris_v2.pkl"
    }

> List Models
GET /admin/models
[
  {
    "version": "1.0.0",
    "status": "active"
  },
  {
    "version": "2.0.0",
    "status": "testing"
  }
]
"""
