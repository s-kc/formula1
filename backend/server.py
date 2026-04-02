from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import httpx
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# F1 API Base URLs
JOLPICA_BASE_URL = "https://api.jolpi.ca/ergast/f1"
OPENF1_BASE_URL = "https://api.openf1.org/v1"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===== Models =====
class UserFavorite(BaseModel):
    user_id: str
    driver_ids: List[str] = []
    team_ids: List[str] = []
    notifications_enabled: bool = True

class UserFavoriteUpdate(BaseModel):
    driver_ids: Optional[List[str]] = None
    team_ids: Optional[List[str]] = None
    notifications_enabled: Optional[bool] = None

# ===== Helper Functions =====
async def fetch_jolpica_data(endpoint: str) -> Dict[str, Any]:
    """Fetch data from Jolpica F1 API"""
    url = f"{JOLPICA_BASE_URL}/{endpoint}"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error fetching from Jolpica API: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch F1 data: {str(e)}")

async def fetch_openf1_data(endpoint: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Fetch data from OpenF1 API"""
    url = f"{OPENF1_BASE_URL}/{endpoint}"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params or {})
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error fetching from OpenF1 API: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch OpenF1 data: {str(e)}")

# ===== F1 Data Endpoints =====

@api_router.get("/standings/drivers")
async def get_driver_standings(season: str = "current"):
    """
    Get current driver championship standings
    """
    endpoint = f"{season}/driverStandings.json"
    data = await fetch_jolpica_data(endpoint)
    return data

@api_router.get("/standings/constructors")
async def get_constructor_standings(season: str = "current"):
    """
    Get current constructor championship standings
    """
    endpoint = f"{season}/constructorStandings.json"
    data = await fetch_jolpica_data(endpoint)
    return data

@api_router.get("/schedule")
async def get_race_schedule(season: str = "current"):
    """
    Get race schedule for the season
    """
    endpoint = f"{season}.json"
    data = await fetch_jolpica_data(endpoint)
    return data

@api_router.get("/race/{round}/results")
async def get_race_results(round: str, season: str = "current"):
    """
    Get race results for a specific round
    """
    endpoint = f"{season}/{round}/results.json"
    data = await fetch_jolpica_data(endpoint)
    return data

@api_router.get("/race/{round}/qualifying")
async def get_qualifying_results(round: str, season: str = "current"):
    """
    Get qualifying results for a specific round
    """
    endpoint = f"{season}/{round}/qualifying.json"
    data = await fetch_jolpica_data(endpoint)
    return data

@api_router.get("/race/{round}/sprint")
async def get_sprint_results(round: str, season: str = "current"):
    """
    Get sprint race results for a specific round
    """
    endpoint = f"{season}/{round}/sprint.json"
    data = await fetch_jolpica_data(endpoint)
    return data

@api_router.get("/drivers")
async def get_all_drivers(season: str = "current"):
    """
    Get all drivers for the season
    """
    endpoint = f"{season}/drivers.json"
    data = await fetch_jolpica_data(endpoint)
    return data

@api_router.get("/drivers/{driver_id}")
async def get_driver_details(driver_id: str, season: str = "current"):
    """
    Get specific driver details and their season performance
    """
    try:
        # Get driver info
        driver_endpoint = f"{season}/drivers/{driver_id}.json"
        driver_data = await fetch_jolpica_data(driver_endpoint)
        
        # Get driver standings
        standings_endpoint = f"{season}/drivers/{driver_id}/driverStandings.json"
        standings_data = await fetch_jolpica_data(standings_endpoint)
        
        # Get driver results
        results_endpoint = f"{season}/drivers/{driver_id}/results.json"
        results_data = await fetch_jolpica_data(results_endpoint)
        
        return {
            "driver": driver_data,
            "standings": standings_data,
            "results": results_data
        }
    except Exception as e:
        logger.error(f"Error fetching driver details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/constructors")
async def get_all_constructors(season: str = "current"):
    """
    Get all constructors for the season
    """
    endpoint = f"{season}/constructors.json"
    data = await fetch_jolpica_data(endpoint)
    return data

@api_router.get("/constructors/{constructor_id}")
async def get_constructor_details(constructor_id: str, season: str = "current"):
    """
    Get specific constructor details and their season performance
    """
    try:
        # Get constructor info
        constructor_endpoint = f"{season}/constructors/{constructor_id}.json"
        constructor_data = await fetch_jolpica_data(constructor_endpoint)
        
        # Get constructor standings
        standings_endpoint = f"{season}/constructors/{constructor_id}/constructorStandings.json"
        standings_data = await fetch_jolpica_data(standings_endpoint)
        
        # Get constructor results
        results_endpoint = f"{season}/constructors/{constructor_id}/results.json"
        results_data = await fetch_jolpica_data(results_endpoint)
        
        return {
            "constructor": constructor_data,
            "standings": standings_data,
            "results": results_data
        }
    except Exception as e:
        logger.error(f"Error fetching constructor details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== OpenF1 Live Data Endpoints =====

@api_router.get("/live/sessions")
async def get_recent_sessions(year: Optional[int] = None):
    """
    Get recent F1 sessions (for historical/completed races)
    """
    params = {}
    if year:
        params["year"] = year
    data = await fetch_openf1_data("sessions", params)
    return data[-10:] if len(data) > 10 else data  # Return last 10 sessions

@api_router.get("/live/positions")
async def get_race_positions(session_key: int):
    """
    Get position data for a specific session
    """
    params = {"session_key": session_key}
    data = await fetch_openf1_data("position", params)
    return data

@api_router.get("/live/laps")
async def get_lap_data(session_key: int, driver_number: Optional[int] = None):
    """
    Get lap times for a specific session
    """
    params = {"session_key": session_key}
    if driver_number:
        params["driver_number"] = driver_number
    data = await fetch_openf1_data("laps", params)
    return data

@api_router.get("/live/intervals")
async def get_race_intervals(session_key: int):
    """
    Get race intervals (gaps between drivers)
    """
    params = {"session_key": session_key}
    data = await fetch_openf1_data("intervals", params)
    return data

# ===== User Favorites Endpoints =====

@api_router.get("/user/{user_id}/favorites")
async def get_user_favorites(user_id: str):
    """
    Get user's favorite drivers and teams
    """
    favorite = await db.user_favorites.find_one({"user_id": user_id})
    if not favorite:
        return UserFavorite(user_id=user_id)
    return UserFavorite(**favorite)

@api_router.post("/user/{user_id}/favorites")
async def update_user_favorites(user_id: str, update: UserFavoriteUpdate):
    """
    Update user's favorite drivers and teams
    """
    existing = await db.user_favorites.find_one({"user_id": user_id})
    
    if existing:
        # Update existing
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        await db.user_favorites.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    else:
        # Create new
        new_favorite = UserFavorite(user_id=user_id, **update.dict(exclude_none=True))
        await db.user_favorites.insert_one(new_favorite.dict())
    
    # Return updated favorites
    updated = await db.user_favorites.find_one({"user_id": user_id})
    return UserFavorite(**updated)

@api_router.post("/user/{user_id}/favorites/driver/{driver_id}")
async def add_favorite_driver(user_id: str, driver_id: str):
    """
    Add a driver to favorites
    """
    favorite = await db.user_favorites.find_one({"user_id": user_id})
    
    if favorite:
        if driver_id not in favorite.get("driver_ids", []):
            await db.user_favorites.update_one(
                {"user_id": user_id},
                {"$addToSet": {"driver_ids": driver_id}}
            )
    else:
        new_favorite = UserFavorite(user_id=user_id, driver_ids=[driver_id])
        await db.user_favorites.insert_one(new_favorite.dict())
    
    updated = await db.user_favorites.find_one({"user_id": user_id})
    return UserFavorite(**updated)

@api_router.delete("/user/{user_id}/favorites/driver/{driver_id}")
async def remove_favorite_driver(user_id: str, driver_id: str):
    """
    Remove a driver from favorites
    """
    await db.user_favorites.update_one(
        {"user_id": user_id},
        {"$pull": {"driver_ids": driver_id}}
    )
    
    updated = await db.user_favorites.find_one({"user_id": user_id})
    if updated:
        return UserFavorite(**updated)
    return UserFavorite(user_id=user_id)

@api_router.post("/user/{user_id}/favorites/team/{team_id}")
async def add_favorite_team(user_id: str, team_id: str):
    """
    Add a team to favorites
    """
    favorite = await db.user_favorites.find_one({"user_id": user_id})
    
    if favorite:
        if team_id not in favorite.get("team_ids", []):
            await db.user_favorites.update_one(
                {"user_id": user_id},
                {"$addToSet": {"team_ids": team_id}}
            )
    else:
        new_favorite = UserFavorite(user_id=user_id, team_ids=[team_id])
        await db.user_favorites.insert_one(new_favorite.dict())
    
    updated = await db.user_favorites.find_one({"user_id": user_id})
    return UserFavorite(**updated)

@api_router.delete("/user/{user_id}/favorites/team/{team_id}")
async def remove_favorite_team(user_id: str, team_id: str):
    """
    Remove a team from favorites
    """
    await db.user_favorites.update_one(
        {"user_id": user_id},
        {"$pull": {"team_ids": team_id}}
    )
    
    updated = await db.user_favorites.find_one({"user_id": user_id})
    if updated:
        return UserFavorite(**updated)
    return UserFavorite(user_id=user_id)

# ===== Health Check =====
@api_router.get("/")
async def root():
    return {"message": "Formula 1 Tracker API", "status": "active"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
