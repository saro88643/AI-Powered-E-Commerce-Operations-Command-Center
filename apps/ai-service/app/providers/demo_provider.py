from typing import Dict, Any, List
from datetime import datetime
from .base import BaseAIProvider
from ..agent.tools import tools
from ..rag.retriever import policy_retriever

class DemoToolProvider(BaseAIProvider):
    def investigate(self, question: str, user_context: Dict[str, Any] = None) -> Dict[str, Any]:
        q_lower = question.lower()
        steps = []

        steps.append({
            "id": "step-1",
            "title": "Interpreted operational intent",
            "status": "completed",
            "tool": "intentClassifier",
            "summary": f"Detected operational analysis query: '{question}'",
            "timestamp": datetime.now().isoformat()
        })

        # SCENARIO 1: Coimbatore delays or Product P-204 issue
        if any(k in q_lower for k in ["coimbatore", "p-204", "wrong with product", "cause of the delivery", "delayed orders"]):
            # 1. Search delayed orders
            orders_res = tools.searchOrders(city="Coimbatore", status="delayed")
            delayed_count = orders_res.get("total", 31)
            steps.append({
                "id": "step-2",
                "title": f"Queried orders database: {delayed_count} delayed orders identified in Coimbatore corridor",
                "status": "completed",
                "tool": "searchOrders",
                "summary": f"Found {delayed_count} orders exceeding guaranteed delivery SLA",
                "timestamp": datetime.now().isoformat()
            })

            # 2. Check Origin Warehouse
            wh_info = tools.getWarehouse("wh-w03")
            steps.append({
                "id": "step-3",
                "title": "Inspected origin facility: Warehouse W03 (Coimbatore Hub)",
                "status": "completed",
                "tool": "getWarehouse",
                "summary": f"Warehouse W03 flagged with api_status='{wh_info.get('api_status', 'sync_error')}'",
                "timestamp": datetime.now().isoformat()
            })

            # 3. Audit Inventory
            inv_p204 = tools.getInventory(productId="P-204")
            steps.append({
                "id": "step-4",
                "title": "Audited inventory levels for Product P-204 across regional distribution centers",
                "status": "completed",
                "tool": "getInventory",
                "summary": "Discovered physical stockout at W03 (0 available, 18 reserved) vs healthy surplus at W02 (145 available)",
                "timestamp": datetime.now().isoformat()
            })

            # 4. Search Support Tickets in MongoDB
            tickets = tools.searchTickets(query="Coimbatore")
            steps.append({
                "id": "step-5",
                "title": "Retrieved customer complaints and escalation logs from MongoDB",
                "status": "completed",
                "tool": "searchTickets",
                "summary": f"Correlated {len(tickets)} support tickets referencing dispatch delays for P-204 from W03",
                "timestamp": datetime.now().isoformat()
            })

            # 5. Search Company Policies via RAG
            citations = tools.searchPolicies("warehouse synchronization error emergency stock transfer")
            steps.append({
                "id": "step-6",
                "title": "Retrieved remediation SOP from company knowledge base via RAG",
                "status": "completed",
                "tool": "searchPolicies",
                "summary": "Cited Warehouse SOP.pdf Section 3.2 (Sync error remediation) & Section 4.1 (Cross-warehouse transfer)",
                "timestamp": datetime.now().isoformat()
            })

            steps.append({
                "id": "step-7",
                "title": "Generated root-cause analysis and proposed verified remediation",
                "status": "completed",
                "tool": "rootCauseSynthesizer",
                "summary": "High correlation: W03 edge synchronization failure caused fulfillment block on P-204 orders",
                "timestamp": datetime.now().isoformat()
            })

            return {
                "summary": "Investigation into Product P-204 and Coimbatore delivery delays reveals that Warehouse W03 suffered an edge inventory synchronization failure. As a result, the omnichannel store accepted orders despite 0 physical inventory of P-204 at W03, stalling 31 orders (18 specifically for P-204) and causing repeated customer escalations.",
                "findings": [
                    "31 orders in Coimbatore corridor are delayed beyond the guaranteed SLA window.",
                    "18 of these orders are waiting for Product P-204 (AeroPulse Pro Fitness Band & Pulse Oximeter).",
                    "Physical inventory at Warehouse W03 is depleted (0 available / 18 backordered) while ERP showed false positive stock.",
                    "Surplus stock of 145 units exists at Warehouse W02 (Bengaluru Central Logistics Hub).",
                    "Active incident INC-2026-081 confirms W03 edge gateway synchronization failure."
                ],
                "evidence": [
                    {
                        "id": "ev-1",
                        "title": "31 Delayed Orders",
                        "type": "order",
                        "metric": "31 Orders Delayed",
                        "description": "Fulfillment blocked at Coimbatore W03 hub.",
                        "linkId": "ORD-00001",
                        "linkRoute": "/orders"
                    },
                    {
                        "id": "ev-2",
                        "title": "Incident INC-2026-081",
                        "type": "incident",
                        "metric": "Sync Failure",
                        "description": "W03 edge gateway synchronization failure affecting 143 records.",
                        "linkId": "INC-2026-081",
                        "linkRoute": "/incidents"
                    },
                    {
                        "id": "ev-3",
                        "title": "P-204 Stock Mismatch",
                        "type": "inventory",
                        "metric": "0 Available at W03 / 145 at W02",
                        "description": "Stockout discrepancy; transfer from W02 required.",
                        "linkId": "P-204",
                        "linkRoute": "/inventory"
                    },
                    {
                        "id": "ev-4",
                        "title": "Customer Support Tickets",
                        "type": "ticket",
                        "metric": "7 Urgent Tickets",
                        "description": "VIP customers in Coimbatore contacting support multiple times.",
                        "linkId": "TCK-00001",
                        "linkRoute": "/support"
                    }
                ],
                "dataSources": [
                    "PostgreSQL (Orders, Order Items, Inventory, Incidents)",
                    "MongoDB (Support Tickets, Customer Profiles)",
                    "Inventory REST API Gateway (Port 4001)",
                    "RAG Indexed Policy: Warehouse SOP.pdf"
                ],
                "citations": citations,
                "rootCauseAnalysis": {
                    "observedSymptoms": [
                        "Clustered delivery delays originating from Coimbatore corridor",
                        "Repeated customer support contacts regarding unfulfilled P-204 orders",
                        "Warehouse W03 flagged with api_status = sync_error"
                    ],
                    "evidenceSummary": "31 delayed orders, 1 inventory mismatch record, 1 active incident, and 7 customer support escalations all converge on Warehouse W03.",
                    "possibleCauses": [
                        "Logistics carrier transit failure (ruled out)",
                        "Warehouse W03 inventory synchronization breakdown and physical stockout (confirmed)"
                    ],
                    "correlations": [
                        "Coimbatore delayed orders ↔ Origin warehouse W03 (r = 0.94)",
                        "Delayed orders ↔ Product P-204 inclusion (r = 0.88)"
                    ],
                    "rootCause": "Warehouse W03 edge gateway synchronization failure caused the central order system to accept orders for Product P-204 while actual physical inventory was zero.",
                    "businessImpact": "31 customer deliveries delayed, negative customer sentiment in Coimbatore region, potential SLA penalty.",
                    "confidence": "High"
                },
                "recommendedAction": {
                    "actionType": "create_transfer",
                    "actionTitle": "Emergency Stock Transfer: W02 (Bengaluru) → W03 (Coimbatore)",
                    "reason": "Reallocate 50 units of Product P-204 from surplus hub W02 to fulfill backorders and recover safety stock buffer.",
                    "affectedRecordsCount": 31,
                    "affectedRecordsSummary": "31 delayed Coimbatore orders, 18 waiting specifically for Product P-204",
                    "expectedImpact": "Resolves backordered items within 24 hours, updates order status to processing, and mitigates incident INC-2026-081.",
                    "parameters": {
                        "productId": "P-204",
                        "fromWarehouseId": "wh-w02",
                        "toWarehouseId": "wh-w03",
                        "quantity": 50
                    },
                    "requiresConfirmation": True
                },
                "investigationSteps": steps,
                "lineage": {
                    "question": question,
                    "dataSources": ["PostgreSQL Orders", "Inventory API", "MongoDB Support", "Warehouse SOP.pdf"],
                    "toolsExecuted": ["searchOrders", "getWarehouse", "getInventory", "searchTickets", "searchPolicies"],
                    "recordsAnalyzedCount": 174,
                    "conclusion": "Inventory synchronization failure at W03 is strongly associated with the delays."
                }
            }

        # SCENARIO 2: Policy / Refund Question (e.g. Can order ORD-10291 be refunded?)
        if any(k in q_lower for k in ["refund", "can order", "eligible"]):
            citations = tools.searchPolicies("customer refund cancellation late delivery compensation")
            steps.append({
                "id": "step-2",
                "title": "Queried Refund Policy and Customer SOP via RAG",
                "status": "completed",
                "tool": "searchPolicies",
                "summary": "Retrieved Refund Policy.pdf Section 3 (Late Delivery Compensation)",
                "timestamp": datetime.now().isoformat()
            })

            return {
                "summary": "Based on Section 3 of the ShopSphere Refund Policy (Late Delivery Compensation & Automatic Goodwill Refunds), orders delayed by more than 72 hours beyond the expected delivery date due to warehouse synchronization errors or operational bottlenecks qualify for cancellation with an immediate 100% refund, or a goodwill credit of up to INR 500.",
                "findings": [
                    "Guaranteed delivery SLA exceeded by > 72 hours.",
                    "Policy authorizes full refund to original payment method or goodwill store credit.",
                    "Product categories such as electronics and wearables are fully eligible."
                ],
                "evidence": [
                    {
                        "id": "ev-ref-1",
                        "title": "Refund Policy Guidelines",
                        "type": "policy",
                        "metric": "> 72h Delay Compensation",
                        "description": "Late delivery compensation protocol per Section 3.",
                        "linkId": "DOC-REFUND-01",
                        "linkRoute": "/ai"
                    }
                ],
                "dataSources": ["Refund Policy.pdf", "Customer Support SOP.pdf"],
                "citations": citations,
                "recommendedAction": {
                    "actionType": "issue_refund",
                    "actionTitle": "Approve Delay Compensation Refund",
                    "reason": "Authorized per Refund Policy.pdf Section 3",
                    "affectedRecordsCount": 1,
                    "affectedRecordsSummary": "1 order eligible for full refund / compensation",
                    "expectedImpact": "Reimburses customer and concludes delivery delay ticket.",
                    "parameters": {"amount": 3499.00},
                    "requiresConfirmation": True
                },
                "investigationSteps": steps,
                "lineage": {
                    "question": question,
                    "dataSources": ["Refund Policy.pdf"],
                    "toolsExecuted": ["searchPolicies"],
                    "recordsAnalyzedCount": 1,
                    "conclusion": "Order is eligible for refund under late delivery compensation clause."
                }
            }

        # GENERAL OPERATIONAL QUERY
        return {
            "summary": f"Executed operational analytics across ShopSphere systems for question: '{question}'.",
            "findings": [
                "PostgreSQL transactional system: 15,000 orders, 20 warehouses active.",
                "MongoDB customer database: 10,000 customers, 5,000 support tickets active.",
                "Detected 1 active warehouse edge synchronization alert at W03 Coimbatore."
            ],
            "evidence": [
                {
                    "id": "ev-gen-1",
                    "title": "System Operational Status",
                    "type": "incident",
                    "metric": "3 Active Incidents",
                    "description": "INC-2026-081 (W03 Sync), INC-2026-079 (SpeedFast), INC-2026-074 (UPI).",
                    "linkId": "INC-2026-081",
                    "linkRoute": "/incidents"
                }
            ],
            "dataSources": ["PostgreSQL", "MongoDB", "External REST APIs"],
            "investigationSteps": steps,
            "lineage": {
                "question": question,
                "dataSources": ["PostgreSQL", "MongoDB"],
                "toolsExecuted": ["searchOrders", "getWarehouse", "searchTickets"],
                "recordsAnalyzedCount": 200,
                "conclusion": "Operational data analyzed."
            }
        }
