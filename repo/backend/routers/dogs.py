from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter()


@router.get("/", response_model=List[schemas.Dog])
def get_dogs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    dogs = db.query(models.Dog).offset(skip).limit(limit).all()
    return dogs


@router.post("/", response_model=schemas.Dog)
def create_dog(dog: schemas.DogCreate, db: Session = Depends(get_db)):
    db_dog = models.Dog(**dog.model_dump())
    db.add(db_dog)
    db.commit()
    db.refresh(db_dog)
    return db_dog


@router.get("/{dog_id}", response_model=schemas.Dog)
def get_dog(dog_id: int, db: Session = Depends(get_db)):
    dog = db.query(models.Dog).filter(models.Dog.id == dog_id).first()
    if dog is None:
        raise HTTPException(status_code=404, detail="Dog not found")
    return dog


@router.put("/{dog_id}", response_model=schemas.Dog)
def update_dog(dog_id: int, dog_update: schemas.DogUpdate, db: Session = Depends(get_db)):
    dog = db.query(models.Dog).filter(models.Dog.id == dog_id).first()
    if dog is None:
        raise HTTPException(status_code=404, detail="Dog not found")
    
    for key, value in dog_update.model_dump(exclude_unset=True).items():
        setattr(dog, key, value)
    
    db.commit()
    db.refresh(dog)
    return dog


@router.delete("/{dog_id}")
def delete_dog(dog_id: int, db: Session = Depends(get_db)):
    dog = db.query(models.Dog).filter(models.Dog.id == dog_id).first()
    if dog is None:
        raise HTTPException(status_code=404, detail="Dog not found")
    
    db.delete(dog)
    db.commit()
    return {"message": "Dog deleted successfully"}
