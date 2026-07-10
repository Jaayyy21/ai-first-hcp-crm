from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List

import models, schemas
from database import engine, get_db
import agent
import traceback

DEBUG = True

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-First HCP CRM")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For demo purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers for consistent JSON responses
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": exc.detail},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global exception: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": str(exc), "trace": traceback.format_exc()},
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "A database error occurred while processing your request."},
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI-First HCP CRM API"}

# HCP Endpoints
@app.get("/api/hcps", response_model=List[schemas.HCP])
def get_hcps(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    hcps = db.query(models.HCP).offset(skip).limit(limit).all()
    return hcps

@app.post("/api/hcps", response_model=schemas.HCP)
def create_hcp(hcp: schemas.HCPCreate, db: Session = Depends(get_db)):
    db_hcp = models.HCP(**hcp.dict())
    db.add(db_hcp)
    db.commit()
    db.refresh(db_hcp)
    return db_hcp

# Interaction Endpoints
@app.get("/api/hcps/{hcp_id}/interactions", response_model=List[schemas.Interaction])
def get_interactions(hcp_id: int, db: Session = Depends(get_db)):
    # Check if HCP exists
    hcp = db.query(models.HCP).filter(models.HCP.id == hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail=f"HCP with ID {hcp_id} not found.")
        
    interactions = db.query(models.Interaction).filter(models.Interaction.hcp_id == hcp_id).order_by(models.Interaction.interaction_date.desc()).all()
    return interactions

@app.post("/api/interactions", response_model=schemas.Interaction)
def create_interaction(interaction: schemas.InteractionCreate, db: Session = Depends(get_db)):
    if not interaction.summary or interaction.summary.strip() == "":
        raise HTTPException(status_code=400, detail="Interaction summary is required.")
        
    hcp = db.query(models.HCP).filter(models.HCP.id == interaction.hcp_id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail=f"HCP with ID {interaction.hcp_id} not found.")
        
    db_interaction = models.Interaction(**interaction.dict())
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction

@app.put("/api/interactions/{interaction_id}", response_model=schemas.Interaction)
def update_interaction(interaction_id: int, interaction: schemas.InteractionUpdate, db: Session = Depends(get_db)):
    db_interaction = db.query(models.Interaction).filter(models.Interaction.id == interaction_id).first()
    if not db_interaction:
        raise HTTPException(status_code=404, detail=f"Interaction with ID {interaction_id} not found.")
    
    update_data = interaction.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_interaction, key, value)
        
    db.commit()
    db.refresh(db_interaction)
    return db_interaction

# Agent Endpoint
@app.post("/api/agent/chat", response_model=schemas.ChatResponse)
def chat_with_agent(request: schemas.ChatRequest):
    if not request.message or request.message.strip() == "":
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    result = agent.process_chat(request.message, request.hcp_id)
    return result
