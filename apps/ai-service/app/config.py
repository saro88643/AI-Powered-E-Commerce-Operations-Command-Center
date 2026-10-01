import os

class Settings:
    PORT: int = int(os.getenv("AI_SERVICE_PORT", 5000))
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:3000")
    INVENTORY_API_URL: str = os.getenv("INVENTORY_API_URL", "http://localhost:4001")
    DELIVERY_API_URL: str = os.getenv("DELIVERY_API_URL", "http://localhost:4002")
    PAYMENT_API_URL: str = os.getenv("PAYMENT_API_URL", "http://localhost:4003")
    CRM_API_URL: str = os.getenv("CRM_API_URL", "http://localhost:4004")
    
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/shopsphere")
    
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "demo").lower()
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")

settings = Settings()
