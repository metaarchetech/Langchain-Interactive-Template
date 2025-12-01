import asyncio
import websockets
import json
import omni.kit.commands
from pxr import Usd, UsdGeom, Gf, Sdf
import omni.usd

async def connect_to_backend():
    uri = "ws://localhost:8000/ws/omniverse"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to Backend!")
            while True:
                try:
                    message = await websocket.recv()
                    print(f"Received: {message}")
                    data = json.loads(message)
                    await execute_command(data)
                except websockets.exceptions.ConnectionClosed:
                    print("Connection closed")
                    break
    except Exception as e:
        print(f"Connection failed: {e}")

async def execute_command(data):
    """
    Executes commands received from the backend.
    Expected format: {"command": "action_name", "parameters": "{json_string}"}
    """
    command_name = data.get("command")
    params_str = data.get("parameters", "{}")
    
    try:
        params = json.loads(params_str)
    except json.JSONDecodeError:
        print(f"Invalid parameters JSON: {params_str}")
        return

    stage = omni.usd.get_context().get_stage()
    if not stage:
        print("No active USD stage")
        return

    print(f"Executing: {command_name} with {params}")

    if command_name == "create_cube":
        # Example: {"command": "create_cube", "parameters": "{\"path\": \"/World/MyCube\", \"size\": 100}"}
        path = params.get("path", "/World/Cube")
        size = params.get("size", 100.0)
        
        omni.kit.commands.execute('CreateMeshPrimWithDefaultXform',
            prim_type='Cube',
            prim_path=path)
        
        # Set scale/size if needed (basic cube is usually unit size or 100 depending on setup)
        prim = stage.GetPrimAtPath(path)
        if prim:
            xform = UsdGeom.Xformable(prim)
            # Reset transform for simplicity or just leave as created
            print(f"Created cube at {path}")

    elif command_name == "move":
        # Example: {"command": "move", "parameters": "{\"path\": \"/World/Cube\", \"x\": 10, \"y\": 20, \"z\": 0}"}
        path = params.get("path", "/World/Cube")
        x = params.get("x", 0.0)
        y = params.get("y", 0.0)
        z = params.get("z", 0.0)
        
        prim = stage.GetPrimAtPath(path)
        if not prim:
            print(f"Prim not found: {path}")
            return

        # Using Kit Commands for undoability
        omni.kit.commands.execute('TransformPrimSRT',
            path=path,
            new_translation=Gf.Vec3d(x, y, z),
            old_translation=Gf.Vec3d(0, 0, 0), # In real scenario, we should get current pos
        )
        print(f"Moved {path} to ({x}, {y}, {z})")

    elif command_name == "rotate":
        # Example: {"command": "rotate", "parameters": "{\"path\": \"/World/Cube\", \"x\": 0, \"y\": 90, \"z\": 0}"}
        path = params.get("path", "/World/Cube")
        x = params.get("x", 0.0)
        y = params.get("y", 0.0)
        z = params.get("z", 0.0)
        
        omni.kit.commands.execute('TransformPrimSRT',
            path=path,
            new_rotation_euler=Gf.Vec3d(x, y, z),
        )
        print(f"Rotated {path} to ({x}, {y}, {z})")

    else:
        print(f"Unknown command: {command_name}")

# Entry point for running in Script Editor
def main():
    # Omniverse uses its own asyncio loop usually
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # If running in an existing loop (like Kit's main loop), create a task
        asyncio.ensure_future(connect_to_backend())
    else:
        loop.run_until_complete(connect_to_backend())

if __name__ == "__main__":
    main()

