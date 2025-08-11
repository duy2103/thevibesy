from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials are not set in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Helper to decode Supabase JWT and extract user_id (sub)
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Supabase JWTs are signed with RS256, but for MVP we just decode without verification
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: no user_id")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Location(BaseModel):
    id: Optional[str]
    user_id: str
    name: str
    latitude: float
    longitude: float
    description: Optional[str] = None

@app.post("/register")
def register(user: UserRegister):
    resp = supabase.auth.sign_up({"email": user.email, "password": user.password})
    if resp.get("error"):
        raise HTTPException(status_code=400, detail=resp["error"]["message"])
    return {"message": "User registered successfully"}

@app.post("/login")
def login(user: UserLogin):
    resp = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
    if resp.get("error"):
        raise HTTPException(status_code=400, detail=resp["error"]["message"])
    return {"access_token": resp["session"]["access_token"]}

@app.get("/locations", response_model=List[Location])
def get_locations(user_id: str = Depends(get_current_user)):
    resp = supabase.table("locations").select("*").eq("user_id", user_id).execute()
    if resp.get("error"):
        raise HTTPException(status_code=400, detail=resp["error"]["message"])
    return resp["data"]

@app.post("/locations", response_model=Location)
def add_location(location: Location, user_id: str = Depends(get_current_user)):
    data = location.dict(exclude_unset=True)
    data["user_id"] = user_id
    resp = supabase.table("locations").insert(data).execute()
    if resp.get("error"):
        raise HTTPException(status_code=400, detail=resp["error"]["message"])
    return resp["data"][0]

@app.delete("/locations/{location_id}")
def delete_location(location_id: str, user_id: str = Depends(get_current_user)):
    resp = supabase.table("locations").delete().eq("id", location_id).eq("user_id", user_id).execute()
    if resp.get("error"):
        raise HTTPException(status_code=400, detail=resp["error"]["message"])
    return {"message": "Location deleted"}
