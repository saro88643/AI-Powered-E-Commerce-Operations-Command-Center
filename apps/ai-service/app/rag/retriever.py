from typing import List, Dict, Any
from .vector_store import vector_store

class PolicyRetriever:
    @staticmethod
    def retrieve_policies(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        results = vector_store.search(query, top_k=top_k)
        formatted = []
        for r in results:
            formatted.append({
                "documentId": r.get("document_id"),
                "documentName": r.get("document_name"),
                "section": r.get("section"),
                "page": r.get("page"),
                "chunkId": r.get("chunk_id"),
                "content": r.get("content")
            })
        return formatted

policy_retriever = PolicyRetriever()
