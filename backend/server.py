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
from datetime import datetime, timedelta
import httpx
import asyncio
from models import (
    UserSubscription,
    SubscriptionUpdate,
    SubscriptionTier,
    PurchaseType,
    SubscriptionPrice
)

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

# ===== Subscription Management Endpoints =====

@api_router.get("/subscription/prices")
async def get_subscription_prices():
    """
    Get all available subscription prices and tiers
    """
    prices = [
        SubscriptionPrice(
            tier=SubscriptionTier.MONTHLY,
            price=1.99,
            billing_period="month"
        ),
        SubscriptionPrice(
            tier=SubscriptionTier.YEARLY,
            price=14.99,
            billing_period="year",
            discount_percentage=37
        ),
        SubscriptionPrice(
            tier=SubscriptionTier.LIFETIME,
            price=29.99,
            billing_period="one-time"
        ),
    ]
    
    one_time_purchases = [
        {"type": "widget_pack", "price": 1.99, "name": "Widget Pack"},
        {"type": "historical_data", "price": 2.99, "name": "Historical Data"},
        {"type": "remove_ads", "price": 3.99, "name": "Remove Ads"},
        {"type": "pro_bundle", "price": 6.99, "name": "Pro Bundle"},
    ]
    
    return {
        "subscriptions": [p.dict() for p in prices],
        "one_time_purchases": one_time_purchases
    }

@api_router.get("/subscription/{user_id}")
async def get_user_subscription(user_id: str):
    """
    Get user's subscription status
    """
    subscription = await db.subscriptions.find_one({"user_id": user_id})
    
    if not subscription:
        # Create free tier subscription for new users
        new_subscription = UserSubscription(user_id=user_id)
        await db.subscriptions.insert_one(new_subscription.dict())
        return new_subscription
    
    # Check if subscription is still active
    user_sub = UserSubscription(**subscription)
    if user_sub.subscription_end and datetime.utcnow() > user_sub.subscription_end:
        user_sub.is_active = False
        user_sub.subscription_tier = SubscriptionTier.FREE
        await db.subscriptions.update_one(
            {"user_id": user_id},
            {"$set": {"is_active": False, "subscription_tier": SubscriptionTier.FREE}}
        )
    
    return user_sub

@api_router.post("/subscription/{user_id}/subscribe")
async def subscribe_user(user_id: str, tier: SubscriptionTier):
    """
    Subscribe user to a tier (simulated - no actual payment processing)
    """
    subscription = await db.subscriptions.find_one({"user_id": user_id})
    
    now = datetime.utcnow()
    
    # Calculate subscription end date
    if tier == SubscriptionTier.MONTHLY:
        end_date = now + timedelta(days=30)
    elif tier == SubscriptionTier.YEARLY:
        end_date = now + timedelta(days=365)
    elif tier == SubscriptionTier.LIFETIME:
        end_date = now + timedelta(days=365 * 100)  # 100 years
    else:
        end_date = None
    
    update_data = {
        "subscription_tier": tier,
        "subscription_start": now,
        "subscription_end": end_date,
        "is_active": True,
        "has_widgets": True,
        "has_historical_data": True,
        "is_ad_free": True,
        "has_notifications": True,
        "has_live_timing": True,
        "updated_at": now
    }
    
    if subscription:
        await db.subscriptions.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    else:
        new_sub = UserSubscription(user_id=user_id, **update_data)
        await db.subscriptions.insert_one(new_sub.dict())
    
    updated = await db.subscriptions.find_one({"user_id": user_id})
    return UserSubscription(**updated)

@api_router.post("/subscription/{user_id}/purchase")
async def purchase_item(user_id: str, item: PurchaseType):
    """
    Purchase a one-time item (simulated - no actual payment processing)
    """
    subscription = await db.subscriptions.find_one({"user_id": user_id})
    
    if not subscription:
        new_subscription = UserSubscription(user_id=user_id)
        await db.subscriptions.insert_one(new_subscription.dict())
        subscription = await db.subscriptions.find_one({"user_id": user_id})
    
    # Add item to purchased items
    await db.subscriptions.update_one(
        {"user_id": user_id},
        {"$addToSet": {"purchased_items": item}}
    )
    
    # Update feature flags based on purchase
    updates = {"updated_at": datetime.utcnow()}
    
    if item == PurchaseType.WIDGET_PACK:
        updates["has_widgets"] = True
    elif item == PurchaseType.HISTORICAL_DATA:
        updates["has_historical_data"] = True
    elif item == PurchaseType.REMOVE_ADS:
        updates["is_ad_free"] = True
    elif item == PurchaseType.PRO_BUNDLE:
        updates["has_widgets"] = True
        updates["has_historical_data"] = True
        updates["is_ad_free"] = True
        updates["has_notifications"] = True
    
    await db.subscriptions.update_one(
        {"user_id": user_id},
        {"$set": updates}
    )
    
    updated = await db.subscriptions.find_one({"user_id": user_id})
    return UserSubscription(**updated)

@api_router.delete("/subscription/{user_id}/cancel")
async def cancel_subscription(user_id: str):
    """
    Cancel user's subscription (keeps features until end date)
    """
    subscription = await db.subscriptions.find_one({"user_id": user_id})
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Don't remove features immediately, just mark as cancelled
    # Features remain active until subscription_end date
    await db.subscriptions.update_one(
        {"user_id": user_id},
        {"$set": {
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Subscription will not renew. Features remain active until end date."}

@api_router.get("/subscription/{user_id}/features")
async def check_premium_features(user_id: str):
    """
    Check which premium features user has access to
    """
    subscription = await db.subscriptions.find_one({"user_id": user_id})
    
    if not subscription:
        return {
            "has_premium": False,
            "features": {
                "widgets": False,
                "historical_data": False,
                "ad_free": False,
                "notifications": False,
                "live_timing": False
            }
        }
    
    user_sub = UserSubscription(**subscription)
    
    # Check if subscription is active
    is_premium = user_sub.is_active or len(user_sub.purchased_items) > 0
    
    return {
        "has_premium": is_premium,
        "subscription_tier": user_sub.subscription_tier,
        "is_active": user_sub.is_active,
        "features": {
            "widgets": user_sub.has_widgets,
            "historical_data": user_sub.has_historical_data,
            "ad_free": user_sub.is_ad_free,
            "notifications": user_sub.has_notifications,
            "live_timing": user_sub.has_live_timing
        }
    }

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
