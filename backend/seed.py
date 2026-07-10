from database import SessionLocal, engine
from models import HCP, Base

def seed_data():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if we already have data
    if db.query(HCP).count() == 0:
        hcp1 = HCP(name="Dr. Sharma", specialty="Cardiology", organization="City Hospital")
        hcp2 = HCP(name="Dr. Patel", specialty="Neurology", organization="General Medical Center")
        hcp3 = HCP(name="Dr. Kim", specialty="General Practice", organization="Community Clinic")
        
        db.add_all([hcp1, hcp2, hcp3])
        db.commit()
        print("Database seeded with sample HCPs.")
    else:
        print("Database already contains data.")
        
    db.close()

if __name__ == "__main__":
    seed_data()
