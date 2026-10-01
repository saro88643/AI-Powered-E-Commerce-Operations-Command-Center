from typing import Dict, Any
from .base import BaseAIProvider
from ..config import settings
from ..agent.tools import tools
from ..rag.retriever import policy_retriever

class OpenAICompatibleProvider(BaseAIProvider):
    def __init__(self):
        try:
            from openai import OpenAI
            self.client = OpenAI(
                api_key=settings.LLM_API_KEY or "dummy_key",
                base_url=settings.LLM_BASE_URL
            )
            self.model = settings.LLM_MODEL
            self.has_client = bool(settings.LLM_API_KEY)
        except Exception:
            self.has_client = False

    def investigate(self, question: str, user_context: Dict[str, Any] = None) -> Dict[str, Any]:
        # If API key is not configured, fallback gracefully to tool-based deterministic analyzer
        if not self.has_client or not settings.LLM_API_KEY:
            from .demo_provider import DemoToolProvider
            return DemoToolProvider().investigate(question, user_context)

        # For configured OpenAI/compatible LLM:
        try:
            from .demo_provider import DemoToolProvider
            # Run tool retrieval first to provide real grounded context to LLM
            grounding = DemoToolProvider().investigate(question, user_context)
            
            prompt = f"""You are ShopSphere's Operations AI Agent.
Question: {question}
Grounded Data Analysis: {grounding.get('summary')}
Findings: {grounding.get('findings')}
Evidence: {grounding.get('evidence')}
Citations: {grounding.get('citations')}

Respond with accurate operational reasoning and adhere to the factual evidence."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            
            content = response.choices[0].message.content
            grounding["summary"] = content
            return grounding
        except Exception as e:
            from .demo_provider import DemoToolProvider
            fallback = DemoToolProvider().investigate(question, user_context)
            fallback["summary"] += f" (Note: LLM provider fallback due to {str(e)})"
            return fallback
