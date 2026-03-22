from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class SubscriptionTier(str, Enum):
    FREE = "free"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    LIFETIME = "lifetime"

class PurchaseType(str, Enum):
    WIDGET_PACK = "widget_pack"
    HISTORICAL_DATA = "historical_data"
    REMOVE_ADS = "remove_ads"
    PRO_BUNDLE = "pro_bundle"

class UserSubscription(BaseModel):
    user_id: str
    subscription_tier: SubscriptionTier = SubscriptionTier.FREE
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
    is_active: bool = False
    
    # One-time purchases
    purchased_items: List[PurchaseType] = []
    
    # Premium features
    has_widgets: bool = False
    has_historical_data: bool = False
    is_ad_free: bool = False
    has_notifications: bool = False
    has_live_timing: bool = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SubscriptionUpdate(BaseModel):
    subscription_tier: Optional[SubscriptionTier] = None
    purchased_items: Optional[List[PurchaseType]] = None

class SubscriptionPrice(BaseModel):
    tier: SubscriptionTier
    price: float
    currency: str = "USD"
    billing_period: Optional[str] = None
    discount_percentage: Optional[int] = None
