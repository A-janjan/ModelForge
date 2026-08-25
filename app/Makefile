.PHONY: help install lint test docker-build docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  install      Install Python dependencies"
	@echo "  lint         Run ruff linter"
	@echo "  test         Run pytest with coverage"
	@echo "  docker-build Build Docker image"
	@echo "  docker-up    Start services with docker-compose"
	@echo "  docker-down  Stop services"

install:
	pip install -r requirements.txt

lint:
	ruff check .

test:
	pytest tests/ -v --cov=app --cov-report=term

docker-build:
	docker build -t modelforge .

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down