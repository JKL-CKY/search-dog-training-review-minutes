from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.Handler])
def get_handlers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    handlers = db.query(models.Handler).offset(skip).limit(limit).all()
    return handlers


@router.post("/", response_model=schemas.Handler)
def create_handler(handler: schemas.HandlerCreate, db: Session = Depends(get_db)):
    db_handler = models.Handler(**handler.model_dump())
    db.add(db_handler)
    db.commit()
    db.refresh(db_handler)
    return db_handler


@router.get("/{handler_id}", response_model=schemas.Handler)
def get_handler(handler_id: int, db: Session = Depends(get_db)):
    handler = db.query(models.Handler).filter(models.Handler.id == handler_id).first()
    if handler is None:
        raise HTTPException(status_code=404, detail="Handler not found")
    return handler


@router.put("/{handler_id}", response_model=schemas.Handler)
def update_handler(handler_id: int, handler_update: schemas.HandlerUpdate, db: Session = Depends(get_db)):
    handler = db.query(models.Handler).filter(models.Handler.id == handler_id).first()
    if handler is None:
        raise HTTPException(status_code=404, detail="Handler not found")
    
    for key, value in handler_update.model_dump(exclude_unset=True).items():
        setattr(handler, key, value)
    
    db.commit()
    db.refresh(handler)
    return handler


@router.delete("/{handler_id}")
def delete_handler(handler_id: int, db: Session = Depends(get_db)):
    handler = db.query(models.Handler).filter(models.Handler.id == handler_id).first()
    if handler is None:
        raise HTTPException(status_code=404, detail="Handler not found")
    
    db.delete(handler)
    db.commit()
    return {"message": "Handler deleted successfully"}
