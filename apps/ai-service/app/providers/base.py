from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseAIProvider(ABC):
    @abstractmethod
    def investigate(self, question: str, user_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Perform tool-based multi-system investigation."""
        pass
