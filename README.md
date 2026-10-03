# ShopSphere — AI-Powered E-Commerce Operations Command Center

[![Tests](https://img.shields.io/badge/E2E%20Tests-29%2F29%20Passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-blue.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Node.js%20%7C%20Python%20%7C%20React-orange.svg)]()

ShopSphere is an enterprise-grade AI-powered Operations Command Center designed for Forward Deployed Engineers (FDE) and e-commerce operations teams. It consolidates distributed microservices, multi-modal databases, deterministic tool-calling AI agents, and real-time failure simulation into an unified operational cockpit.

---

## 🌟 Key Capabilities & Architectural Highlights

1. **Multi-Database Operations Core**:
   - **PostgreSQL & Embedded PGlite**: 15,000+ orders, 24,000+ line items, 10,000+ inventory SKUs across 20 national fulfillment centers, foreign-key relational consistency, and real-time ACID transactions.
   - **MongoDB Document Store**: 10,000 customer profiles and 5,000 customer support tickets with full text and sentiment analysis.
   - **Vector Store & RAG**: Semantic policy search and document citations (grounded against operational policies such as SLA refunds, carrier protocols, and warehouse handoffs).

2. **Autonomous Tool-Calling AI Investigation Agent**:
   - Root-cause analysis (RCA) orchestration across Postgres, MongoDB, live microservice diagnostic APIs, and company policy vector databases.
   - Grounded citations linking findings directly to source clauses in operating procedures.
   - Interactive evidence timeline traces with transparent reasoning cards.

3. **Human-in-the-Loop Safety Confirmation Gates**:
   - High-impact operational actions (such as cross-warehouse inventory transfers or bulk customer compensations) cannot execute autonomously.
   - Strict two-phase safety gate requiring explicit operator confirmation before writing to the ledger.
   - Automated post-execution state verification and immutable SHA-traceable audit logging.

4. **External Microservices & Chaos Simulator**:
   - **Inventory Service** (`:4001`): Live stock queries and warehouse status streams.
   - **Delivery & Carrier Service** (`:4002`): Delayed order streams and courier tracking telemetry.
   - **Payment Gateway** (`:4003`): Transaction reconciliation.
   - **CRM Gateway** (`:4004`): Customer loyalty and communication history.
   - **Chaos Engine**: Dynamic simulation of microservice latency, degraded states, and intermittent failures to test operational resilience.

5. **Forward Deployed Engineer (FDE) Tooling**:
   - **GenericRESTConnector & Ingestion Pipeline**: Pluggable enterprise connectors with schema normalization.
   - **Canonical Field Translation Matrix**: Currency normalization (USD to INR), date normalization, and code sanitization.
   - **8/8 Production Onboarding & Deployment Audit Checklist**: Complete live verification dashboard for tenant cutover.

---

## 🏗️ System Architecture

```text
                                 ┌─────────────────────────────────┐
                                 │       React + Vite Web UI       │
                                 │      (Port 5173 / Port 80)      │
                                 └───────────────┬─────────────────┘
                                                 │
                                                 ▼
                                 ┌─────────────────────────────────┐
                                 │   Express API Gateway (Port 3000)│
                                 │  - JWT Auth & RBAC Middleware   │
                                 │  - Canonical Schema Transformer │
                                 │  - Data Quality Engine          │
                                 └──────┬───────┬───────┬──────────┘
                                        │       │       │
             ┌──────────────────────────┘       │       └──────────────────────────┐
             ▼                                  ▼                                  ▼
┌─────────────────────────┐        ┌─────────────────────────┐        ┌─────────────────────────┐
│     PostgreSQL / PGlite │        │     MongoDB Document    │        │    Python AI Service    │
│  - 15,000 Orders        │        │  - 10,000 Customers     │        │       (Port 5000)       │
│  - 10,250 Inventory SKUs│        │  - 5,000 Support Tickets│        │  - Tool Orchestrator    │
│  - 20 Warehouses        │        │                         │        │  - Policy RAG Vector DB │
└─────────────────────────┘        └─────────────────────────┘        └─────────────────────────┘
                                                │
                                                ▼
                                   ┌─────────────────────────┐
                                   │  External Microservices │
                                   │  - Inventory API :4001  │
                                   │  - Delivery API  :4002  │
                                   │  - Payment API   :4003  │
                                   │  - CRM API       :4004  │
                                   └─────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: 3.10+ (for Python AI operations engine)
- **Git**

### 1. Installation
Clone the repository and install root and client dependencies:
```bash
# Install root orchestration dependencies
npm install

# Install backend dependencies
npm --prefix apps/backend install

# Install web UI dependencies
npm --prefix apps/web install

# Install Python AI service dependencies
pip install -r apps/ai-service/requirements.txt
```

### 2. Database Migration & Seeding
Initialize the relational schema and populate the databases with 15,000 orders, 10,000 customers, and 10,250 inventory records:
```bash
# Run database migrations
npm run migrate

# Seed all relational, document, and vector records
npm run seed
```

### 3. Start All Services Locally
Launch the full stack in unified watch mode:
```bash
npm run dev
```
This starts:
- **Web UI**: http://localhost:5173
- **Express API Gateway**: http://localhost:3000
- **OpenAPI Documentation**: http://localhost:3000/api/docs
- **Python AI Operations Service**: http://localhost:5000
- **External Mock Microservices**: Ports 4001, 4002, 4003, 4004

### 4. Run the End-to-End Test Suite
Run the 29 automated end-to-end integration and safety tests:
```bash
npm test
```

Expected output:
```text
================================================================
   TEST SUITE SUMMARY: 29 PASSED, 0 FAILED
================================================================
```

---

## 🐳 Docker Deployment

The application includes production Dockerfiles and an orchestration `docker-compose.yml`:

```bash
# Build and run the entire platform in Docker
docker compose up --build
```

Access the services:
- **Web Dashboard**: http://localhost:80 or http://localhost:5173
- **Backend API**: http://localhost:3000
- **AI Service**: http://localhost:5000

---

## 🔐 Credentials & Roles Hierarchy

| Email | Password | Role | Access Scope & Responsibility |
|---|---|---|---|
| `admin@shopsphere.com` | `password123` | **Admin** | Full system control, department creation, user hierarchy assignment |
| `devon.executive@shopsphere.com` | `password123` | **Overall Manager** | Executive operational oversight across all departments & org chart |
| `manager.delivery@shopsphere.com` | `password123` | **Department Manager** | Delivery & Logistics lead, supervises Team Leads and complaint escalations |
| `manager.product@shopsphere.com` | `password123` | **Department Manager** | Product & Catalog lead, handles product defect complaints |
| `hr.lead@shopsphere.com` | `password123` | **HR** | Corporate HR lead, workplace ethics & employee grievance oversight |
| `tl.express@shopsphere.com` | `password123` | **Team Lead** | Express Fleet lead, first responder to delivery alerts & team complaints |
| `emp.deliv1@shopsphere.com` | `password123` | **Employee** | Senior Dispatcher; grievances scoped strictly to TL & Manager |
| `client.reliance@enterprise.in` | `password123` | **Client (Reliance Retail)** | Commercial partner (ID: `CLI-8801`), tracks orders, lodges client complaints |
| `client.titan@enterprise.in` | `password123` | **Client (Titan Luxury)** | Commercial partner (ID: `CLI-8802`), tracks batches, files return tickets |
| `client.zomato@hyperlocal.in` | `password123` | **Client (Zomato)** | Quick commerce client (ID: `CLI-8803`), live tracking & delivery complaints |
| `ops@shopsphere.com` | `password123` | **Operations Manager** | Cross-warehouse transfers, inventory reallocations |
| `warehouse@shopsphere.com` | `password123` | **Warehouse Manager** | Warehouse intake, stock adjustments, cycle counts |
| `viewer@shopsphere.com` | `password123` | **Viewer** | Read-only compliance auditor |

---

## 🏢 Real-World Enterprise Operations Architecture

### 1. Multi-Stage Department & Organizational Hierarchy (`/organization`)
- **Structure**: Company Leadership (`Overall Manager`) → Functional Departments (`Product`, `Delivery`, `Support`, `Warehousing`, `Finance`, `HR`) → `Department Managers` → `HR & Team Leads` → `Employees / Operators`.
- **Interactive Org Chart**: Senior executives and managers can view the full hierarchy with live badges for active alerts, resolved tickets, headcount, and target SLAs.
- **Admin Tooling**: Admin can create new departments and provision employees with direct reporting manager and team lead assignments.

### 2. Immediate Officer Detection & Alerting Engine (`/complaints`)
- **Real-Time Alert Dispatch**: When a complaint is filed, the system auto-detects the affected department, designates the responsible Officer / Team Lead, and triggers an immediate high-priority alert.
- **Officer Console Alert**: Displays an urgent alert banner with synthesized audio notification chime, immediate assignment, and 1-click investigation drawer.
- **Manager & Senior Analytics**: Recharts visual dashboard with Department load comparisons, SLA compliance gauges, and Status pipeline donuts.

### 3. Strict Scoped Privacy Gate for Employee Grievances (`/my-grievances`)
- **Scoped Visibility**: When an internal employee files a workplace, shift, or equipment grievance, the backend enforces strict scoping so it is visible **ONLY to their designated Team Lead and Department Manager**. Peer workers and outside team leads cannot access it.

### 4. Real-World Commercial Client Portal (`/client`)
- **Company Credentials & Direct Contacts**: Detailed corporate footprint (20 fulfillment hubs, 450+ EV fleet, 99.2% on-time SLA guarantee, GSTIN, 24/7 hotline).
- **Live Order Telemetry & Milestone Pipeline**: 6-stage visual pipeline (`Order Confirmed` → `Routed to Hub` → `Packed & Dispatched` → `In Transit Telemetry` → `Out for Delivery` → `Delivered`) with assigned courier vehicle and driver badge.
- **1-Click Issue Filing**: Clients can lodge complaints directly for any consignment and watch real-time resolution updates.
- **Self-Registration**: New clients can self-register their commercial account and immediately start tracking orders.

---

## 🎯 Flagship Operational Scenarios

### Scenario 1: The Coimbatore Late Deliveries Mystery
1. Navigate to **AI Command Center** (`/ai`) or click the banner prompt.
2. Query: *"Why are customers from Coimbatore receiving orders late?"*
3. The AI executes an autonomous multi-source investigation:
   - Queries delayed orders in Coimbatore from Postgres.
   - Inspects delivery carrier tracking delays via Carrier Delivery API (`:4002`).
   - Discovers inventory stockout discrepancy at Warehouse W03 (Coimbatore Hub).
   - Retrieves grounded compensation policies from Vector Store.
4. Generates root cause analysis with evidence cards and actionable transfer recommendation.

### Scenario 2: Fix Product P-204 Stock Discrepancy & Safety Gate
1. Query: *"Something is wrong with Product P-204. Find out why."*
2. AI traces the stock discrepancy between physical and reported inventory.
3. Formulates a recommended remediation: *Transfer 50 units of P-204 from Warehouse W02 (Bengaluru) to Warehouse W03 (Coimbatore)*.
4. Enforces the **Human-in-the-Loop Safety Gate**: The transfer requires operator confirmation with mandatory reasoning.
5. Upon confirmation:
   - Updates relational inventory balances in both warehouses.
   - Shifts affected delayed orders to `processing` status.
   - Creates customer broadcast notification.
   - Emits immutable entry in **Audit Logs** (`/audit`).
