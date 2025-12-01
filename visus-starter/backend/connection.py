from typing import List
from fastapi import WebSocket

class ConnectionManager:
    """
    Manages WebSocket connections for Omniverse.
    Follows a singleton-like pattern in usage.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Omniverse Client Connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"Omniverse Client Disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Send JSON command to all connected Omniverse clients."""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
                print(f"Sent to Omniverse: {message}")
            except Exception as e:
                print(f"Failed to send to client: {e}")
                # Optionally remove dead connections here

# Global instance
manager = ConnectionManager()

