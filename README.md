# ModelForge

**A learning-focused ML model serving gateway built with FastAPI.**

ModelForge is a backend project for exploring the core concepts behind an ML model serving platform, including **model versioning, traffic routing, multi-version serving, inference orchestration, and model deployment management**.

> **Note:** ModelForge is an educational and evolving project. It is not intended to be a production-ready ML platform.

## What It Does

ModelForge provides a foundation for serving machine learning models through an API while supporting multiple model versions.

The project explores concepts such as:

* ML model serving
* Model versioning
* Multi-version model loading
* Weighted traffic routing
* Canary-style deployments
* Model registration and management
* Rollback operations
* PostgreSQL model metadata storage
* Redis-based caching
* API authentication and middleware
* Automated testing
* Docker-based development

### Example: Traffic Routing

Suppose two versions of a model are deployed:

```text
Model v1 → 90% of traffic
Model v2 → 10% of traffic
```

ModelForge can route incoming prediction requests between these versions based on their configured traffic weights.

```text
Client
   │
   ▼
Prediction API
   │
   ▼
Inference Service
   │
   ▼
Traffic Router
   │
   ▼
Model Service
   │
   ▼
Prediction
```

## Project Structure

```text
ModelForge/
├── api/            # API endpoints
├── db/             # Database configuration
├── middleware/     # Application middleware
├── models/         # ML models and training code
├── repositories/   # Database access layer
├── schemas/        # Request and response schemas
├── services/       # Business and inference logic
├── tests/          # Automated tests
├── Dockerfile
├── docker-compose.yml
├── main.py
└── requirements.txt
```

## Tech Stack

* Python
* FastAPI
* PostgreSQL
* Redis
* Scikit-learn
* SQLAlchemy
* Pytest
* Docker

## Learn How ModelForge Was Built

This repository contains the current implementation, but the **GitHub Wiki documents the development process behind the project**.

If you want to understand how the architecture evolved, why different components were introduced, and how the project was built step by step, please start with the **[ModelForge Wiki](../../wiki)**.

The wiki covers topics such as:

* The initial project architecture
* Building the prediction API
* Creating the model service
* Adding PostgreSQL and the repository layer
* Implementing multi-version model serving
* Building the traffic router
* Creating the inference service
* Adding tests
* Developing the Admin API
* Adding Redis and caching
* Middleware and production-oriented features

> **If you are here to learn, the Wiki is the best place to start.**

## Project Status

ModelForge is actively evolving as a learning and engineering project.

The current implementation focuses on building a solid foundation for an ML model serving platform. Additional production-oriented features and improvements will continue to be added over time.

## Getting Started

Clone the repository:

```bash
git clone <your-repository-url>
cd ModelForge
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the application:

```bash
uvicorn main:app --reload
```

Then open the API documentation:

```text
http://localhost:8000/docs
```

For a deeper explanation of the codebase and the development journey, see the **[GitHub Wiki](../../wiki)**.

## License

This project is intended primarily for learning and experimentation. License information will be added or updated as the project evolves.
