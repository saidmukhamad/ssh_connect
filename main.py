import paramiko
import asyncio
import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization
from pydantic import BaseModel
from uuid import uuid4


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SSHClient:
    def __init__(self):
        self.client = paramiko.SSHClient()
        self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        self.channel = None

    def connect(self, hostname, username, key_filename):
        self.client.connect(hostname=hostname, username=username, key_filename=key_filename)
        self.channel = self.client.invoke_shell()
        self.hostname = hostname
        self.username = username

    def close(self):
        if self.channel:
            self.channel.close()
        self.client.close()

    async def execute_command(self, command, websocket):
        if not self.channel:
            await websocket.send_json({"type": "error", "content": "No active SSH session"})
            return

        self.channel.send(command + "\n")
        
        await asyncio.sleep(0.1)

        output = ""
        while self.channel.recv_ready():
            chunk = self.channel.recv(4096).decode('utf-8')
            output += chunk
            await websocket.send_json({"type": "output", "content": chunk})

        await websocket.send_json({"type": "prompt", "content": f"{self.username}@{self.hostname}:~$"})

ssh_clients = {}
sessions = {}

class GenerateKeyResponse(BaseModel):
    publicKey: str
    sessionId: str

@app.post("/generate-key", response_model=GenerateKeyResponse)
async def generate_key():
    private_key = Ed25519PrivateKey.generate()

    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.OpenSSH,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    public_key = private_key.public_key()
    public_key_ssh = public_key.public_bytes(
        encoding=serialization.Encoding.OpenSSH,
        format=serialization.PublicFormat.OpenSSH
    )
    
    session_id = str(uuid4())
    sessions[session_id] = private_key_pem.decode()

    return {"publicKey": public_key_ssh.decode(), "sessionId": session_id}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    if session_id not in sessions:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    ssh_client = SSHClient()
    ssh_clients[session_id] = ssh_client
    
    try:
        while True:
            message = await websocket.receive_json()
            command = message.get("command")
            
            if command == "connect":
                host = message.get("host")
                username = message.get("username")
                try:
                    private_key_file = f'id_ed25519_{session_id}'
                    with open(private_key_file, 'w') as f:
                        f.write(sessions[session_id])
                    os.chmod(private_key_file, 0o600)
                    
                    ssh_client.connect(host, username, private_key_file)
                    await websocket.send_json({"type": "prompt", "content": f"{username}@{host}:~$"})
                except Exception as e:
                    await websocket.send_json({"type": "error", "content": str(e)})
            elif command == "execute":
                await ssh_client.execute_command(message.get("args"), websocket)
                
    except WebSocketDisconnect:
        ssh_client.close()
        ssh_clients.pop(session_id, None)
    finally:
        if os.path.exists(f'id_ed25519_{session_id}'):
            os.remove(f'id_ed25519_{session_id}')
        sessions.pop(session_id, None)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
