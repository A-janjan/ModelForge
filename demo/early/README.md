# ModelForge — ML Model Serving Control Plane

A polished, frontend-only product prototype for deploying, routing, monitoring, and governing versioned ML models in production.

![React](https://img.shields.io/badge/React-TypeScript-5b50d6) ![Vite](https://img.shields.io/badge/Vite-Prototype-8469ef) ![Backend](https://img.shields.io/badge/Backend-Simulated-21a67a)

## What this demo communicates

ModelForge turns model serving from a collection of infrastructure tasks into one safe release workflow. ML engineers can register artifacts, launch canaries, compare model-version health, shift traffic, promote or roll back, investigate input drift, and control API access without leaving the control plane.

**Primary users**
- ML engineers operating production inference endpoints
- Data scientists publishing new model versions
- Product and platform teams validating canaries and experiments

**Problems addressed**
- Risky, opaque model releases
- No unified model/version inventory
- Manual traffic routing and rollback
- Fragmented serving, infrastructure, and drift signals
- Weak control over API consumers and rate limits

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Screen map

| Screen | Purpose | Key interactions |
|---|---|---|
| Production overview | Fleet-level mission control | Toggle chart metric, refresh with skeleton state, inspect alerts, open canary, launch deployment |
| Model registry | Search and govern model artifacts | Search/filter model table, inspect artifact drawer, copy endpoint, deploy a version |
| Deployments | Understand active releases and rollout history | Switch active/history tabs, open canary, resume/review actions |
| Deployment detail | Safely operate a live canary | Adjust weighted traffic, inspect metrics/logs/config/events, promote, roll back |
| Observability | Correlate platform and model signals | Change model/time range, inspect SLO budget, run drift diagnostics |
| API consumers | Manage gateway access | Create credentials, rotate/copy a key, inspect quota and auth events |
| Global command palette | Fast navigation and actions | Open with Cmd/Ctrl+K, filter commands, navigate or launch a deployment |

## Recommended product demo (3–4 minutes)

### Scenario 1 — Safely promote a canary

1. Start on **Production overview**.
2. Point out 8.42M daily predictions, 86 ms fleet p95, 99.982% availability, and the actionable “Canary ready to promote” signal.
3. Select **Review canary** for `fraud-detector v2.4.0`.
4. Explain the 90/10 traffic split and the four passing promotion guardrails.
5. Open **Request logs** briefly to show version-level routing and cache status.
6. Return to **Metrics**, choose **Adjust traffic**, and move the canary to 25% to demonstrate atomic weighted routing.
7. Choose **Promote to stable**, keep the previous version warm, and confirm.
8. Show the updated 100% allocation and success feedback.

### Scenario 2 — Launch a new model version

1. Open **Deployments** and choose **Create deployment**.
2. Select the verified `demand-forecast v4.2.0` artifact.
3. Choose **Canary rollout** and set 10% initial traffic.
4. Review readiness, automatic rollback, latency, and warm-version safeguards.
5. Deploy to production.
6. Let the simulated stages run: signature validation, container scheduling, readiness probes, and router update.
7. Open the deployment list and point out the newly created live canary.

### Scenario 3 — Investigate model drift

1. Open **Observability**.
2. Explain the separation of service health, prediction throughput, SLO budget, and model-quality alerts.
3. Select **Diagnose** on `churn-predictor` feature drift.
4. Let the analysis complete and compare the live `age_band` distribution with training data.
5. Enable the 5% capture option and choose **Create data sample**.
6. Use the confirmation toast to explain the retraining feedback loop.

### Scenario 4 — Secure inference access

1. Open **API consumers**.
2. Highlight scoped model access, per-consumer rate limits, quotas, and gateway audit events.
3. Create a consumer for **Inventory Planning Service** with access to `demand-forecast`.
4. Copy the generated key and explain that a production backend would reveal it only once.

## Simulated backend behavior

The demo intentionally has no server-side application. UI state and timed promises simulate:

- Model artifact registration and registry synchronization
- Container scheduling and readiness checks
- Atomic traffic-router changes
- Canary promotion and graceful rollback
- Live request logs and performance metrics
- Drift analysis over a realistic request sample
- API consumer creation and key rotation
- Notifications, cache outcomes, rate-limit events, and audit activity
- Loading, success, warning, empty, and confirmation states

All mock content is domain-specific and deterministic so recorded demos are repeatable.

## Tech stack

- React
- TypeScript
- Vite
- Recharts
- Lucide React icons
- Purpose-built responsive CSS design system
- Local component state for the simulated product behavior

No API, database, authentication service, ML runtime, or external asset host is required.

## Future backend integration

Replace the in-memory fixtures and timers with:

1. FastAPI control-plane endpoints for models, versions, deployments, routing, and rollback
2. PostgreSQL model registry and deployment audit data
3. Kubernetes deployment/readiness status and autoscaling signals
4. Prometheus query endpoints or an observability aggregation API
5. Structured log streaming over SSE/WebSocket
6. Drift detector jobs and stored distribution snapshots
7. API-key creation, hashing, scope policies, and Redis-backed rate limiting
8. Real workspace authentication and role-based authorization

The screen-level UI contracts are already clear enough to define API response shapes from the prototype.

## Portfolio presentation tips

### Recruiters
- Lead with the outcome: “A control plane for safely releasing and operating versioned ML models.”
- Show the production overview for 15 seconds, then move immediately into the canary promotion.
- Mention the frontend-only simulation after demonstrating the end-to-end value, not before.

### Interviewers
- Explain how the UX mirrors a control-plane/data-plane architecture.
- Discuss why release guardrails appear before the promote action and why rollback keeps a version warm.
- Call out deterministic mock state, reusable components, responsive behavior, and future API boundaries.
- Be ready to describe concurrency and idempotency requirements for a real traffic router.

### Clients
- Frame each screen around reduced operational risk and faster model iteration.
- Use their terminology for models and teams when walking through the demo.
- Ask whether their preferred release policy is canary, blue/green, or shadow traffic, then demonstrate that option in the wizard.

## UX decisions

- Dense enough for infrastructure operators, but avoids raw Grafana-style complexity
- Purple is reserved for release/change actions; green communicates stable operation
- Progressive disclosure keeps fleet health, release details, and raw logs at distinct levels
- Every dangerous production action has a scoped confirmation and visible outcome
- Responsive layouts preserve the main workflow on tablet and mobile widths
