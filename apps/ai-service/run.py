import os
import sys
import uvicorn

# Add current dir to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

if __name__ == '__main__':
    port = int(os.getenv("AI_SERVICE_PORT", 5000))
    print(f">> Starting ShopSphere Python AI Operations Service on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
