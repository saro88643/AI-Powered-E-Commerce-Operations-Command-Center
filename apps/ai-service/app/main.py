import uvicorn
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

import sys

# Ensure parent directory is in sys.path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from app.config import settings
    from app.providers.demo_provider import DemoToolProvider
    from app.providers.openai_provider import OpenAICompatibleProvider
    from app.rag.retriever import policy_retriever
except ImportError:
    from .config import settings
    from .providers.demo_provider import DemoToolProvider
    from .providers.openai_provider import OpenAICompatibleProvider
    from .rag.retriever import policy_retriever

app = FastAPI(
    title="ShopSphere AI Operations Service",
    version="1.0.0",
    description="Tool-calling AI Agent & RAG Pipeline for E-Commerce Operations Command Center"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Select provider based on configuration
def get_provider():
    if settings.AI_PROVIDER == "openai" or settings.LLM_API_KEY:
        return OpenAICompatibleProvider()
    return DemoToolProvider()

provider = get_provider()

class InvestigationRequest(BaseModel):
    question: str
    user: Optional[Dict[str, Any]] = None
    conversationHistory: Optional[List[Dict[str, Any]]] = []

class PolicySearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3

@app.get("/health")
def health_check():
    return {
        "service": "shopsphere-ai-service",
        "status": "healthy",
        "provider": settings.AI_PROVIDER,
        "model": settings.LLM_MODEL if settings.AI_PROVIDER == "openai" else "deterministic-tool-orchestrator",
        "port": settings.PORT
    }

@app.post("/investigate")
def investigate_operational_query(req: InvestigationRequest):
    if not req.question:
        raise HTTPException(status_code=400, detail="question is required")
    
    try:
        current_provider = get_provider()
        response = current_provider.investigate(req.question, req.user)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Investigation failed: {str(e)}")

@app.post("/policies/search")
def search_policies(req: PolicySearchRequest):
    return policy_retriever.retrieve_policies(req.query, top_k=req.top_k)

if __name__ == "__main__":
    port = int(os.getenv("AI_SERVICE_PORT", 5000))
    print(f"🚀 Starting ShopSphere Python AI Operations Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
