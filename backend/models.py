from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class HCP(Base):
    __tablename__ = "hcps"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    specialty = Column(String, index=True)
    organization = Column(String)
    
    interactions = relationship("Interaction", back_populates="hcp")


class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"))
    interaction_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    interaction_type = Column(String)  # e.g., "In-person", "Virtual", "Email"
    channel = Column(String)
    summary = Column(Text)
    topics_discussed = Column(Text)
    requested_action = Column(Text)
    follow_up_date = Column(DateTime, nullable=True)
    status = Column(String, default="Completed")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    hcp = relationship("HCP", back_populates="interactions")
    follow_ups = relationship("FollowUp", back_populates="interaction")


class FollowUp(Base):
    __tablename__ = "follow_ups"
    id = Column(Integer, primary_key=True, index=True)
    interaction_id = Column(Integer, ForeignKey("interactions.id"))
    due_date = Column(DateTime)
    description = Column(Text)
    status = Column(String, default="Pending") # Pending, Completed
    
    interaction = relationship("Interaction", back_populates="follow_ups")
