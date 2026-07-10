from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class HCPBase(BaseModel):
    name: str
    specialty: str
    organization: Optional[str] = None

class HCPCreate(HCPBase):
    pass

class HCP(HCPBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

class InteractionBase(BaseModel):
    hcp_id: int
    interaction_type: Optional[str] = "In-person"
    channel: Optional[str] = "Office"
    summary: str
    topics_discussed: Optional[str] = None
    requested_action: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    status: Optional[str] = "Completed"

class InteractionCreate(InteractionBase):
    pass

class InteractionUpdate(BaseModel):
    interaction_type: Optional[str] = None
    channel: Optional[str] = None
    summary: Optional[str] = None
    topics_discussed: Optional[str] = None
    requested_action: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    status: Optional[str] = None

class Interaction(InteractionBase):
    id: int
    interaction_date: datetime
    created_at: datetime
    updated_at: datetime
    hcp: Optional[HCP] = None

    class Config:
        orm_mode = True
        from_attributes = True

class FollowUpBase(BaseModel):
    interaction_id: int
    due_date: datetime
    description: str
    status: Optional[str] = "Pending"

class FollowUpCreate(FollowUpBase):
    pass

class FollowUp(FollowUpBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True
        
class ChatRequest(BaseModel):
    message: str
    hcp_id: Optional[int] = None
    
class ChatResponse(BaseModel):
    response: str
    structured_data: Optional[dict] = None
