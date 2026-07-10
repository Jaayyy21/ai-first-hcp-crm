from langchain_core.tools import tool
from pydantic import BaseModel, Field
from typing import Optional, List
from database import SessionLocal
import models
from datetime import datetime
import dateparser
from sqlalchemy import or_

def parse_natural_date(date_str: str) -> Optional[datetime]:
    if not date_str: return None
    date_str_clean = date_str.lower().strip()
    if date_str_clean.startswith('next '):
        date_str_clean = date_str_clean[5:]
    
    parsed = dateparser.parse(date_str_clean, settings={'RELATIVE_BASE': datetime.now(), 'PREFER_DATES_FROM': 'future'})
    if not parsed:
        try:
            parsed = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except ValueError:
            pass
    return parsed

# 1. Log Interaction
class LogInteractionInput(BaseModel):
    summary: str = Field(description="Summary of the interaction notes")
    hcp_id: Optional[int] = Field(default=None, description="DO NOT provide this if the HCP is already selected.")
    interaction_type: str = Field(default="In-person", description="Type of interaction (In-person, Virtual, Email)")
    topics_discussed: str = Field(default="", description="Topics discussed during the interaction")
    requested_action: str = Field(default="", description="Any actions requested by the HCP")
    follow_up_date: Optional[str] = Field(default=None, description="Exact natural language date provided by the user (e.g. 'next Tuesday', 'tomorrow'). Do NOT invent ISO dates.")

@tool("log_interaction", args_schema=LogInteractionInput)
def log_interaction(summary: str, hcp_id: Optional[int] = None, interaction_type: str = "In-person", topics_discussed: str = "", requested_action: str = "", follow_up_date: Optional[str] = None):
    """Logs a new interaction with an HCP and saves it to the database."""
    if hcp_id is None:
        return {"status": "error", "message": "Backend failed to provide hcp_id."}
    db = SessionLocal()
    try:
        f_date = parse_natural_date(follow_up_date)
                
        new_interaction = models.Interaction(
            hcp_id=hcp_id,
            summary=summary,
            interaction_type=interaction_type,
            topics_discussed=topics_discussed,
            requested_action=requested_action,
            follow_up_date=f_date
        )
        db.add(new_interaction)
        db.commit()
        db.refresh(new_interaction)
        return {"status": "success", "interaction_id": new_interaction.id, "message": "Interaction logged successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


# 2. Edit Interaction
class EditInteractionInput(BaseModel):
    interaction_id: int = Field(description="ID of the interaction to edit")
    summary: Optional[str] = Field(default=None, description="Updated summary")
    interaction_type: Optional[str] = Field(default=None, description="Updated interaction type")
    topics_discussed: Optional[str] = Field(default=None, description="Updated topics discussed")

@tool("edit_interaction", args_schema=EditInteractionInput)
def edit_interaction(interaction_id: int, summary: Optional[str] = None, interaction_type: Optional[str] = None, topics_discussed: Optional[str] = None):
    """Edits an existing interaction."""
    db = SessionLocal()
    try:
        interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id).first()
        if not interaction:
            return {"status": "error", "message": f"Interaction {interaction_id} not found."}
        
        if summary is not None:
            interaction.summary = summary
        if interaction_type is not None:
            interaction.interaction_type = interaction_type
        if topics_discussed is not None:
            interaction.topics_discussed = topics_discussed
            
        db.commit()
        return {"status": "success", "message": "Interaction updated successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


# 3. Search HCP
class SearchHCPInput(BaseModel):
    query: str = Field(description="Name or specialty of the HCP to search for")

@tool("search_hcp", args_schema=SearchHCPInput)
def search_hcp(query: str):
    """Searches for HCPs by name or specialty."""
    db = SessionLocal()
    try:
        hcps = db.query(models.HCP).filter(
            or_(
                models.HCP.name.ilike(f"%{query}%"),
                models.HCP.specialty.ilike(f"%{query}%")
            )
        ).all()
        result = [{"id": h.id, "name": h.name, "specialty": h.specialty, "organization": h.organization} for h in hcps]
        return {"status": "success", "results": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


# 4. Interaction History
class InteractionHistoryInput(BaseModel):
    hcp_id: Optional[int] = Field(default=None, description="DO NOT provide this if the HCP is already selected.")

@tool("get_interaction_history", args_schema=InteractionHistoryInput)
def get_interaction_history(hcp_id: Optional[int] = None):
    """Fetches past interactions for a specific HCP."""
    if hcp_id is None:
        return {"status": "error", "message": "Backend failed to provide hcp_id."}
    db = SessionLocal()
    try:
        interactions = db.query(models.Interaction).filter(models.Interaction.hcp_id == hcp_id).order_by(models.Interaction.interaction_date.desc()).all()
        result = [
            {
                "id": i.id,
                "date": i.interaction_date.isoformat(),
                "type": i.interaction_type,
                "summary": i.summary,
                "topics": i.topics_discussed
            } for i in interactions
        ]
        return {"status": "success", "history": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


# 5. Schedule Follow-up
class ScheduleFollowupInput(BaseModel):
    interaction_id: int = Field(description="ID of the interaction to link this follow-up to")
    due_date: str = Field(description="Exact natural language date provided by the user (e.g. 'next Tuesday', 'tomorrow'). Do NOT invent ISO dates.")
    description: str = Field(description="Description of what needs to be followed up on")

@tool("schedule_followup", args_schema=ScheduleFollowupInput)
def schedule_followup(interaction_id: int, due_date: str, description: str):
    """Schedules a follow-up action for a specific interaction."""
    db = SessionLocal()
    try:
        f_date = parse_natural_date(due_date)
        followup = models.FollowUp(
            interaction_id=interaction_id,
            due_date=f_date,
            description=description
        )
        db.add(followup)
        # Also update interaction follow_up_date
        interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id).first()
        if interaction:
            interaction.follow_up_date = f_date
            
        db.commit()
        return {"status": "success", "message": "Follow-up scheduled successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

tools = [log_interaction, edit_interaction, search_hcp, get_interaction_history, schedule_followup]
