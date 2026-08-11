ML Gateway != API + model

in reality:

ML Gateway = Control Plane + Data Plane

## data plane

Responsible for serving predictions.

```python
Client
  |
  v
Gateway
  |
  v
Router
  |
  +--> Model v1
  |
  +--> Model v2
```

## control plane

Responsible for management.

```
Admin API
      |
      v
Database
      |
      v
Deployment Manager
```

## Phase 1 MVP Architecture

```
app/

├── api/
│   └── prediction.py

├── schemas/
│   └── prediction.py

├── services/
│   └── model_service.py

├── models/
│   └── iris_model.pkl

├── tests/
│   └── test_prediction.py

├── main.py

├── requirements.txt

├── Dockerfile

└── docker-compose.yml
```

### Define the MVP Contract First

request:
```
{
  "sepal_length": 5.1,
  "sepal_width": 3.5,
  "petal_length": 1.4,
  "petal_width": 0.2
}
```

response:
```
{
  "prediction": "setosa",
  "model_version": "1.0.0"
}
```