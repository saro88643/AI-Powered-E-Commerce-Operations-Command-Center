import json
import os
import math
import re
from typing import List, Dict, Any

class VectorStore:
    def __init__(self):
        self.documents = []
        self.vocab = {}
        self.doc_vectors = []
        self._load_policies()

    def _load_policies(self):
        # Locate project root data directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.abspath(os.path.join(current_dir, '..', '..', '..', '..'))
        policies_path = os.path.join(base_dir, 'data', 'documents', 'company_policies.json')

        if os.path.exists(policies_path):
            with open(policies_path, 'r', encoding='utf-8') as f:
                self.documents = json.load(f)
            self._build_index()
            print(f"[RAG] Vector Store successfully indexed {len(self.documents)} policy chunks.")
        else:
            print(f"[RAG] Warning: {policies_path} not found.")

    def _tokenize(self, text: str) -> List[str]:
        return [w.lower() for w in re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', text)]

    def _build_index(self):
        # Build TF-IDF Vocabulary and Document Vectors
        df = {}
        tf_list = []

        for doc in self.documents:
            tokens = self._tokenize(doc['content'] + " " + doc['section'] + " " + doc['document_name'])
            tf = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
            for t in set(tokens):
                df[t] = df.get(t, 0) + 1
            tf_list.append(tf)

        N = len(self.documents)
        idf = {term: math.log((N + 1) / (freq + 1)) + 1 for term, freq in df.items()}
        self.vocab = idf

        self.doc_vectors = []
        for tf in tf_list:
            vec = {}
            norm = 0.0
            for term, count in tf.items():
                w = count * idf.get(term, 1.0)
                vec[term] = w
                norm += w * w
            norm = math.sqrt(norm) if norm > 0 else 1.0
            self.doc_vectors.append({term: w / norm for term, w in vec.items()})

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if not self.documents:
            return []

        q_tokens = self._tokenize(query)
        q_tf = {}
        for t in q_tokens:
            q_tf[t] = q_tf.get(t, 0) + 1

        q_vec = {}
        norm = 0.0
        for t, count in q_tf.items():
            if t in self.vocab:
                w = count * self.vocab[t]
                q_vec[t] = w
                norm += w * w
        norm = math.sqrt(norm) if norm > 0 else 1.0
        q_vec = {t: w / norm for t, w in q_vec.items()}

        scores = []
        for idx, doc_vec in enumerate(self.doc_vectors):
            dot = sum(q_vec.get(term, 0.0) * val for term, val in doc_vec.items())
            scores.append((dot, self.documents[idx]))

        scores.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scores[:top_k] if score > 0.05] or [self.documents[0]]

vector_store = VectorStore()
