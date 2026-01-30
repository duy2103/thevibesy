from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import re
import requests
import os
from dotenv import load_dotenv
import io
from PIL import Image
import pytesseract
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vibesy")

# Import database components
from database import SessionLocal, Base, User as DBUser, Location as DBLocation, create_tables, engine

load_dotenv()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Security configuration - Load from environment or use defaults for development
SECRET_KEY = os.getenv("SECRET_KEY", "simple-dev-key-for-side-project-CHANGE-IN-PRODUCTION")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days for convenience

# Warn if using default secret key
if SECRET_KEY == "simple-dev-key-for-side-project-CHANGE-IN-PRODUCTION":
    logger.warning("⚠️  Using default SECRET_KEY! Set SECRET_KEY in .env for production!")

# Simple password hashing for side-project (fast and simple)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=4  # Very fast rounds for side-project
)

# Create database tables
create_tables()

# Determine allowed origins based on environment
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
if "*" in ALLOWED_ORIGINS:
    logger.warning("⚠️  CORS allows all origins! Set ALLOWED_ORIGINS in .env for production!")

app = FastAPI(title="Vibesy API", description="Location sharing app with SQLite backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Pydantic models
class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: Optional[int] = None
    email: str
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class Location(BaseModel):
    id: Optional[int] = None
    user_id: Optional[int] = None
    name: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    address: Optional[str] = None
    source_url: Optional[str] = None

class ParsedLocationResponse(BaseModel):
    locations: List[dict]
    source_info: dict

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Utility functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Truncate password if longer than 72 bytes (bcrypt limitation)
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:72]
    # If there's no stored hash, treat as invalid credentials
    if not hashed_password:
        logger.warning("Empty password hash for user during verify_password")
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        # Handle UnknownHashError from passlib gracefully without requiring static import
        if e.__class__.__name__ == 'UnknownHashError':
            logger.warning("Could not identify stored password hash format; rejecting login")
            return False
        logger.exception("Unexpected error during password verification: %s", e)
        return False

def get_password_hash(password: str) -> str:
    # Truncate password if longer than 72 bytes (bcrypt limitation)
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    # Force subject to string if present
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Helper to parse legacy simple tokens (from simple backend)
def _parse_simple_token(token: str):
    if token.startswith("simple_token_"):
        parts = token.split("simple_token_")
        if len(parts) == 2 and parts[1].isdigit():
            return int(parts[1])
    return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    
    # Demo mode - allow "demo" as a token for easy testing
    if token == "demo":
        # Get or create demo user
        demo_user = db.query(DBUser).filter(DBUser.email == "demo@vibesy.app").first()
        if not demo_user:
            demo_user = DBUser(
                email="demo@vibesy.app",
                password_hash=get_password_hash("demo"),  # ensure hashed so /login works for demo
                name="Demo User",
                bio="This is a demo account for testing Vibesy features"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        return demo_user
    
    # Support legacy simple_token_<id>
    simple_id = _parse_simple_token(token)
    if simple_id is not None:
        user = db.query(DBUser).filter(DBUser.id == simple_id).first()
        if user:
            return user
        raise HTTPException(status_code=401, detail="Legacy simple token user not found")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Allow older tokens with int sub by disabling sub type verification
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_sub": False})
        user_sub = payload.get("sub")
        if user_sub is None:
            raise credentials_exception
        try:
            user_id = int(user_sub)
        except (TypeError, ValueError):
            logger.warning("Invalid sub in token (not int convertible): %s", user_sub)
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        logger.info("Token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.warning("Invalid token: %s", e)
        raise credentials_exception
    
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# API endpoints
@app.get("/")
def root():
    return {"message": "Vibesy API with SQLite backend", "status": "healthy"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "SQLite",
        "message": "API is running with SQLite database"
    }

@app.post("/register", response_model=Token)
def register(user: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(DBUser).filter(DBUser.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = DBUser(
        email=user.email,
        password_hash=hashed_password,
        name=user.email.split("@")[0]  # Default name from email
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token (ensure sub stored as int consistently)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name
        }
    }

@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    # Authenticate user
    db_user = db.query(DBUser).filter(DBUser.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user.id)}, expires_delta=access_token_expires  # store integer not string
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name
        }
    }

@app.get("/demo-login", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """Easy demo login for side-project testing - no password needed!"""
    # Get or create demo user
    demo_user = db.query(DBUser).filter(DBUser.email == "demo@vibesy.app").first()
    if not demo_user:
        demo_user = DBUser(
            email="demo@vibesy.app",
            password_hash=get_password_hash("demo"),  # ensure hashed so /login works for demo
            name="Demo User",
            bio="This is a demo account for testing Vibesy features"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
    
    return {
        "access_token": "demo",
        "token_type": "bearer",
        "user": {
            "id": demo_user.id,
            "email": demo_user.email,
            "name": demo_user.name
        }
    }

@app.get("/profile", response_model=User)
def get_profile(current_user: DBUser = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "bio": current_user.bio,
        "avatar_url": current_user.avatar_url
    }

@app.put("/profile")
def update_profile(user_data: UserUpdate, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    # Update user profile
    if user_data.name is not None:
        current_user.name = user_data.name
    if user_data.bio is not None:
        current_user.bio = user_data.bio
    if user_data.avatar_url is not None:
        current_user.avatar_url = user_data.avatar_url
    
    db.commit()
    return {"message": "Profile updated successfully"}

@app.get("/locations", response_model=List[Location])
def get_locations(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    locations = db.query(DBLocation).filter(DBLocation.user_id == current_user.id).all()
    return [
        {
            "id": loc.id,
            "user_id": loc.user_id,
            "name": loc.name,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "description": loc.description,
            "address": loc.address,
            "source_url": loc.source_url
        }
        for loc in locations
    ]

@app.post("/locations", response_model=Location)
def add_location(location: Location, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    db_location = DBLocation(
        user_id=current_user.id,
        name=location.name,
        latitude=location.latitude,
        longitude=location.longitude,
        description=location.description,
        address=location.address,
        source_url=location.source_url
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    
    return {
        "id": db_location.id,
        "user_id": db_location.user_id,
        "name": db_location.name,
        "latitude": db_location.latitude,
        "longitude": db_location.longitude,
        "description": db_location.description,
        "address": db_location.address,
        "source_url": db_location.source_url
    }

@app.delete("/locations/{location_id}")
def delete_location(location_id: int, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    location = db.query(DBLocation).filter(
        DBLocation.id == location_id,
        DBLocation.user_id == current_user.id
    ).first()
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    db.delete(location)
    db.commit()
    return {"message": "Location deleted successfully"}

# Location parsing functions
def extract_locations_from_text(text: str) -> List[dict]:
    """Extract location mentions from text using improved pattern matching"""
    locations = []
    logger.info(f"Extracting locations from text (length: {len(text)})")
    
    # Enhanced patterns with broader matching
    patterns = [
        # Location emoji followed by text (highest priority)
        (r'📍\s*([^\n📍🏠🌴🏖️🎭🍕☕🗺️🏛️]{3,150})', 0.95),
        
        # Other location emojis
        (r'[🏠🌴🏖️🎭🍕☕🗺️🏛️🏨🏰🗼🌉🏙️🌆]\s*([^\n📍🏠🌴🏖️🎭🍕☕🗺️🏛️]{3,150})', 0.9),
        
        # Explicit location keywords (multilingual)
        (r'(?:Location|Address|Place|Venue|Located at|Visit|Check out|At|Visiting|Địa chỉ|位置|場所|위치|Ubicación|Adresse|Indirizzo|Endereço|地址|Lokasi|สถานที่)[\s:]+([^\n]{5,150})', 0.92),
        
        # City, Country format (improved to catch more variations)
        (r'\b([A-ZÀ-Ž][a-zA-ZÀ-ž\s\-\']{2,45},\s*[A-ZÀ-Ž][a-zA-ZÀ-ž\s\-\']{2,45})\b', 0.88),
        
        # Famous places and cities (expanded list with more global locations)
        (r'\b(New York|NYC|Manhattan|Brooklyn|San Francisco|Los Angeles|LA|Hollywood|Paris|London|Tokyo|Rome|Barcelona|Amsterdam|Berlin|Prague|Vienna|Budapest|Dublin|Edinburgh|Stockholm|Copenhagen|Madrid|Athens|Istanbul|Dubai|Bangkok|Singapore|Sydney|Melbourne|Brisbane|Perth|Vancouver|Toronto|Montreal|Chicago|Miami|Seattle|Boston|Austin|Portland|Denver|Las Vegas|Honolulu|Santorini|Mykonos|Oia|Fira|Bali|Ubud|Phuket|Krabi|Kyoto|Seoul|Hong Kong|Macau|Shanghai|Beijing|Guangzhou|Shenzhen|Hanoi|Ho Chi Minh|Saigon|Manila|Jakarta|Kuala Lumpur|Penang|Taipei|Osaka|Fukuoka|Busan|Jeju|Reykjavik|Lisbon|Porto|Monaco|Venice|Florence|Milan|Naples|Zurich|Geneva|Marrakech|Cairo|Cape Town|Nairobi|Rio|Sao Paulo|Buenos Aires|Lima|Cusco|Machu Picchu|Bogota|Cartagena|Cancun|Tulum|Playa del Carmen|Mexico City|San Diego|Phoenix|Dallas|Houston|Philadelphia|Washington|Atlanta|New Orleans|Nashville|Memphis|Charleston|Savannah|Key West|Napa|Yosemite|Yellowstone|Grand Canyon|Zion|Tahoe|Aspen|Vail|Whistler|Banff|Queenstown|Auckland|Wellington|Christchurch|Fiji|Tahiti|Maldives|Seychelles|Mauritius|Bora Bora|Santorini|Mykonos|Ibiza|Mallorca|Capri|Amalfi|Positano|Cinque Terre|Dubrovnik|Split|Hvar|Montenegro|Croatia|Slovenia|Lake Como|Lake Garda|Swiss Alps|French Riviera|Cannes|Nice|Monaco|St Tropez|Bordeaux|Lyon|Marseille|Strasbourg|Normandy|Bruges|Brussels|Antwerp|Luxembourg|Edinburgh|Glasgow|Oxford|Cambridge|Bath|Brighton|Cornwall|Lake District|Yorkshire|Cotswolds|Santorini|Crete|Rhodes|Corfu|Zakynthos|Paros|Naxos)\b', 0.93),
        
        # Places with type suffix (improved and expanded)
        (r'\b([A-ZÀ-Ž][a-zA-ZÀ-ž\s\-\']{2,60}\s+(?:Beach|Beaches|Park|Parks|Tower|Towers|Museum|Museums|Temple|Temples|Castle|Castles|Palace|Palaces|Fort|Forts|Cathedral|Cathedrals|Church|Churches|Mosque|Mosques|Shrine|Shrines|Monastery|Monasteries|Square|Squares|Plaza|Plazas|Market|Markets|Bazaar|Bazaars|Bay|Bays|Island|Islands|Lake|Lakes|River|Rivers|Mountain|Mountains|Hill|Hills|Valley|Valleys|Garden|Gardens|Bridge|Bridges|Airport|Airports|Station|Stations|Hotel|Hotels|Resort|Resorts|Restaurant|Restaurants|Cafe|Cafes|Bistro|Bistros|Bar|Bars|Pub|Pubs|Club|Clubs|Mall|Malls|Center|Centre|Centers|Centres|Village|Villages|Town|Towns|City|Cities|Waterfall|Waterfalls|Canyon|Canyons|Pier|Piers|Harbor|Harbour|Marina|Marinas|Port|Ports|Zoo|Zoos|Aquarium|Aquariums|Stadium|Stadiums|Arena|Arenas|Theater|Theatre|Spa|Spas|Winery|Wineries|Vineyard|Vineyards|Brewery|Breweries|Distillery|Distilleries|Bakery|Bakeries|Deli|Delis|Lounge|Lounges|Gallery|Galleries|Library|Libraries|University|Universities|College|Colleges|Hospital|Hospitals|Clinic|Clinics))\b', 0.89),
        
        # Preposition + Location (improved with more prepositions)
        (r'(?:at|in|from|to|visiting|near|around|by|beside|next to|across from|opposite|behind|@)\s+(?:the\s+)?([A-ZÀ-Ž][a-zA-ZÀ-ž\s,\-\'&]{3,80})', 0.78),
        
        # Street addresses (numbers + street names) - improved
        (r'\b(\d+\s+[A-ZÀ-Ž][a-zA-ZÀ-ž\s\-\']{3,60}(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Boulevard|Blvd\.?|Lane|Ln\.?|Drive|Dr\.?|Way|Court|Ct\.?|Place|Pl\.?|Terrace|Ter\.?|Circle|Cir\.?))\b', 0.84),
        
        # Hashtags with location names (common on social media)
        (r'#([A-ZÀ-Ž][a-zA-ZÀ-ž]{3,30}(?:[A-Z][a-zA-ZÀ-ž]{2,30})*)', 0.72),
        
        # Multiple capitalized words (potential location names)
        (r'\b([A-ZÀ-Ž][a-zA-ZÀ-ž]+(?:\s+[A-ZÀ-Ž][a-zA-ZÀ-ž]+){1,5})\b', 0.65),
        
        # @ mentions that might be places (e.g., @CentralPark)
        (r'@([A-ZÀ-Ž][a-zA-ZÀ-ž0-9_]{2,40})', 0.68),
    ]
    
    for pattern, confidence in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE if confidence < 0.8 else 0)
        for match in matches:
            location_text = match.group(1).strip() if len(match.groups()) > 0 else match.group(0).strip()
            
            # Clean up the text
            location_text = re.sub(r'\s+', ' ', location_text)  # Normalize spaces
            location_text = re.sub(r'[^\w\s,.\-\'À-ÿĀ-ſƀ-ɏḀ-ỿ一-龯ぁ-ゟァ-ヿ가-힣]', '', location_text)
            location_text = location_text.strip()
            
            # Filter out common non-location words and phrases
            skip_words = {'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'they', 'will', 'what', 'when', 'where', 'your', 'more', 'said', 'each', 'about', 'than', 'having', 'best', 'time', 'next', 'week', 'visiting'}
            
            # Check if text starts or ends with common non-location words
            words = location_text.lower().split()
            if words and (words[0] in skip_words or words[-1] in skip_words):
                # If starts/ends with skip word and confidence is low, skip it
                if confidence < 0.9:
                    continue
            
            if location_text.lower() in skip_words:
                continue
            
            # Validate length and content quality
            if 3 <= len(location_text) <= 100:
                # Boost confidence if it contains location indicators
                if any(word in location_text.lower() for word in ['beach', 'park', 'hotel', 'restaurant', 'cafe', 'bay', 'island', 'museum', 'tower', 'square', 'airport', 'station']):
                    confidence = min(confidence + 0.1, 0.98)
                
                locations.append({
                    "name": location_text,
                    "confidence": confidence,
                    "source": "text_pattern"
                })
    
    # Remove duplicates and filter false positives
    unique_locations = []
    seen = set()
    
    # Sort by confidence first
    sorted_locations = sorted(locations, key=lambda x: x["confidence"], reverse=True)
    
    for loc in sorted_locations:
        loc_lower = loc["name"].lower().strip()
        
        # Skip if already seen or too short
        if loc_lower in seen or len(loc_lower) < 3:
            continue
            
        # Skip if it's a substring of an already added location (keep longer, more specific one)
        is_substring = False
        for existing in unique_locations:
            existing_lower = existing["name"].lower().strip()
            if loc_lower in existing_lower or existing_lower in loc_lower:
                # Keep the one with higher confidence, or longer name if same confidence
                if loc["confidence"] < existing["confidence"]:
                    is_substring = True
                    break
                elif loc["confidence"] == existing["confidence"] and len(loc_lower) <= len(existing_lower):
                    is_substring = True
                    break
                else:
                    # Remove the existing one, add this one
                    unique_locations.remove(existing)
                    seen.discard(existing_lower)
                    break
        
        if not is_substring:
            seen.add(loc_lower)
            unique_locations.append(loc)
    
    # Limit to top 15 most confident locations to avoid overwhelming the user
    unique_locations = sorted(unique_locations, key=lambda x: x["confidence"], reverse=True)[:15]
    
    logger.info(f"Found {len(unique_locations)} unique locations after deduplication")
    return unique_locations

def geocode_location(location_name: str) -> dict:
    """Geocode a location name to get coordinates with retry logic"""
    import time
    
    max_retries = 2
    for attempt in range(max_retries):
        try:
            # Use Nominatim for geocoding (free service)
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                "q": location_name,
                "format": "json",
                "limit": 1,
                "addressdetails": 1
            }
            headers = {
                "User-Agent": "Vibesy/1.0 (contact@vibesy.app)"
            }
            
            logger.info(f"Geocoding '{location_name}' (attempt {attempt + 1}/{max_retries})")
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data and len(data) > 0:
                result = data[0]
                logger.info(f"Successfully geocoded '{location_name}' to ({result['lat']}, {result['lon']})")
                return {
                    "latitude": float(result["lat"]),
                    "longitude": float(result["lon"]),
                    "address": result.get("display_name", location_name),
                    "geocoded": True
                }
            
            logger.warning(f"No geocoding results for '{location_name}'")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Geocoding request error for '{location_name}': {e}")
            if attempt < max_retries - 1:
                time.sleep(1)  # Wait before retry
                continue
        except Exception as e:
            logger.error(f"Geocoding error for '{location_name}': {e}")
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
    
    return {"geocoded": False}

@app.post("/locations/from-parsed")
def save_parsed_locations(locations_data: dict, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Save multiple locations parsed from a link"""
    try:
        locations = locations_data.get('locations', [])
        saved_count = 0
        
        for location in locations:
            try:
                # Create location object
                db_location = DBLocation(
                    user_id=current_user.id,
                    name=location.get('name'),
                    latitude=location.get('latitude'),
                    longitude=location.get('longitude'),
                    description=location.get('description', f"Parsed from {locations_data.get('source_info', {}).get('platform', 'social media')}"),
                    address=location.get('address'),
                    source_url=location.get('source_url')
                )
                
                db.add(db_location)
                db.commit()
                saved_count += 1
                    
            except Exception as e:
                print(f"Error saving location {location.get('name', 'unknown')}: {e}")
                db.rollback()
                continue
        
        return {
            "message": f"Successfully saved {saved_count} of {len(locations)} locations",
            "saved_count": saved_count,
            "total_count": len(locations)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving locations: {str(e)}")

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB limit
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

@app.post("/parse-screenshot", response_model=ParsedLocationResponse)
async def parse_screenshot(
    current_user: DBUser = Depends(get_current_user),
    file: UploadFile = File(...)
):
    """Parse locations from a screenshot image using OCR with improved processing"""
    if file is None:
        raise HTTPException(status_code=400, detail="No file uploaded (field name must be 'file')")
    
    logger.info(f"Screenshot parse request from user {current_user.id}: {file.filename} ({file.content_type})")
    
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type. Use JPEG/PNG/WEBP.")
    
    # Read and validate file size
    contents = await file.read()
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (limit 5MB).")
    
    try:
        # Open and preprocess image for better OCR
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if image.mode not in ['RGB', 'L']:
            image = image.convert('RGB')
        
        # Resize if too large (improves OCR performance)
        max_dimension = 3000
        if max(image.size) > max_dimension:
            ratio = max_dimension / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            logger.info(f"Resized image to {new_size}")
        
        # Enhanced image preprocessing for better OCR
        from PIL import ImageEnhance, ImageFilter, ImageOps
        
        # Convert to grayscale for better text detection
        image_gray = ImageOps.grayscale(image)
        
        # Increase sharpness significantly
        enhancer = ImageEnhance.Sharpness(image_gray)
        image_sharp = enhancer.enhance(3.0)
        
        # Increase contrast significantly
        enhancer = ImageEnhance.Contrast(image_sharp)
        image_contrast = enhancer.enhance(2.5)
        
        # Apply slight blur to reduce noise, then sharpen
        image_processed = image_contrast.filter(ImageFilter.MedianFilter(size=3))
        
        # Final sharpening pass
        enhancer = ImageEnhance.Sharpness(image_processed)
        image_final = enhancer.enhance(2.0)
        
        logger.info(f"Processing image: {image.size} pixels, mode: {image.mode}")
        
        # Perform OCR with optimized config - try multiple configurations
        ocr_text = ""
        try:
            # Configuration 1: Standard block detection (best for screenshots)
            config1 = r'--oem 3 --psm 6 -c preserve_interword_spaces=1'
            text1 = pytesseract.image_to_string(image_final, lang='eng', config=config1)
            
            # Configuration 2: Sparse text detection (good for social media)
            config2 = r'--oem 3 --psm 11 -c preserve_interword_spaces=1'
            text2 = pytesseract.image_to_string(image_final, lang='eng', config=config2)
            
            # Configuration 3: Single column of text
            config3 = r'--oem 3 --psm 4 -c preserve_interword_spaces=1'
            text3 = pytesseract.image_to_string(image_final, lang='eng', config=config3)
            
            # Also try with original enhanced image (not grayscale)
            config4 = r'--oem 3 --psm 6 -c preserve_interword_spaces=1'
            image_color_enhanced = image.convert('RGB')
            enhancer = ImageEnhance.Sharpness(image_color_enhanced)
            image_color_sharp = enhancer.enhance(2.5)
            enhancer = ImageEnhance.Contrast(image_color_sharp)
            image_color_final = enhancer.enhance(2.0)
            text4 = pytesseract.image_to_string(image_color_final, lang='eng', config=config4)
            
            # Combine all results and deduplicate
            all_texts = [text1, text2, text3, text4]
            # Use the longest text as base
            ocr_text = max(all_texts, key=len)
            
            # Also append unique lines from other attempts
            all_lines = set()
            for text in all_texts:
                all_lines.update(text.strip().split('\n'))
            
            # Combine unique lines
            combined_text = '\n'.join(sorted(all_lines, key=lambda x: len(x), reverse=True))
            if len(combined_text) > len(ocr_text):
                ocr_text = combined_text
            
            logger.info(f"OCR extracted {len(ocr_text)} characters using multi-pass approach")
            
            # Log sample of extracted text for debugging
            if ocr_text:
                sample = ocr_text[:300].replace('\n', ' ')
                logger.info(f"OCR sample: {sample}...")
            
        except pytesseract.TesseractNotFoundError:
            logger.error("Tesseract OCR not installed on server")
            return {
                "locations": [],
                "source_info": {
                    "platform": "screenshot",
                    "url": None,
                    "parsed_content": "OCR engine not installed on server. Please install Tesseract.",
                    "total_locations_found": 0,
                    "meta": {
                        "filename": file.filename,
                        "content_type": file.content_type,
                        "ocr_available": False
                    }
                }
            }
        except Exception as ocr_error:
            logger.error(f"OCR error: {ocr_error}")
            raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(ocr_error)}")
        
        # Validate OCR output
        if not ocr_text or len(ocr_text.strip()) < 3:
            logger.warning("No text extracted from image")
            return {
                "locations": [],
                "source_info": {
                    "platform": "screenshot",
                    "url": None,
                    "parsed_content": ocr_text or "",
                    "total_locations_found": 0,
                    "meta": {
                        "filename": file.filename,
                        "content_type": file.content_type,
                        "message": "No readable text found in image"
                    }
                }
            }
        
        # Extract location mentions from OCR text
        locations = extract_locations_from_text(ocr_text)
        logger.info(f"Extracted {len(locations)} potential locations from text")
        
        # Geocode locations (with optimized rate limiting)
        geocoded_locations = []
        import time
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        # Limit to top 20 most confident locations to avoid rate limiting
        locations_to_geocode = sorted(locations, key=lambda x: x["confidence"], reverse=True)[:20]
        
        def geocode_with_delay(loc_data, index):
            """Helper function for parallel geocoding with delay"""
            # Stagger requests to respect rate limits (max 1 req/sec for Nominatim)
            time.sleep(index * 1.1)  # 1.1 second delay between each request
            
            geo = geocode_location(loc_data["name"])
            if geo.get("geocoded"):
                return {
                    "name": loc_data["name"],
                    "latitude": geo["latitude"],
                    "longitude": geo["longitude"],
                    "address": geo.get("address", loc_data["name"]),
                    "confidence": loc_data["confidence"],
                    "source": "ocr_screenshot",
                    "source_url": None
                }
            return None
        
        # Use ThreadPoolExecutor for parallel geocoding (but with delays)
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                executor.submit(geocode_with_delay, loc, i): loc 
                for i, loc in enumerate(locations_to_geocode)
            }
            
            for future in as_completed(futures):
                try:
                    result = future.result(timeout=15)
                    if result:
                        geocoded_locations.append(result)
                        logger.info(f"✓ Geocoded: {result['name']}")
                except Exception as e:
                    loc = futures[future]
                    logger.warning(f"✗ Failed to geocode {loc['name']}: {e}")
        
        logger.info(f"Successfully geocoded {len(geocoded_locations)} of {len(locations)} locations")
        
        return {
            "locations": geocoded_locations,
            "source_info": {
                "platform": "screenshot",
                "url": None,
                "parsed_content": ocr_text[:500] + "..." if len(ocr_text) > 500 else ocr_text,
                "total_locations_found": len(geocoded_locations),
                "meta": {
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "ocr_length": len(ocr_text),
                    "locations_extracted": len(locations),
                    "locations_geocoded": len(geocoded_locations)
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error parsing screenshot")
        raise HTTPException(status_code=500, detail=f"Error parsing screenshot: {str(e)}")

@app.get("/locations/refresh", response_model=List[Location])
def refresh_locations(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return current user's saved locations (helper endpoint)."""
    locs = db.query(DBLocation).filter(DBLocation.user_id == current_user.id).all()
    return [{
        "id": l.id,
        "user_id": l.user_id,
        "name": l.name,
        "latitude": l.latitude,
        "longitude": l.longitude,
        "description": l.description,
        "address": l.address,
        "source_url": l.source_url
    } for l in locs]

@app.get("/debug/token")
def debug_token(token: str):
    """Decode a JWT token to inspect payload (dev helper)."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"valid": True, "payload": payload}
    except Exception as e:
        return {"valid": False, "error": str(e)}

@app.get("/debug/auth")
def debug_auth(authorization: Optional[str] = None):
    """Return details about provided Authorization header (dev only)."""
    if not authorization:
        return {"provided": False, "error": "No Authorization header"}
    token = authorization.replace("Bearer ", "").strip()
    details = {"provided": True}
    if token == "demo":
        details["token_type"] = "demo"
        return details
    simple_id = _parse_simple_token(token)
    if simple_id is not None:
        details["token_type"] = "simple_token"
        details["user_id"] = simple_id
        return details
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        details["token_type"] = "jwt"
        details["payload"] = payload
    except jwt.ExpiredSignatureError:
        details["error"] = "expired"
    except Exception as e:
        details["error"] = str(e)
    return details

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
