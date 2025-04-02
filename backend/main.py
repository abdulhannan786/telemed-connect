from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import logging
import firebase_admin
from firebase_admin import auth, credentials, firestore
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime
import os
from enum import Enum
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
try:
    # Path to your service account JSON file
    service_account_path = os.path.join(os.path.dirname(__file__), 'telemedicine-1dec4-firebase-adminsdk-fbsvc-9a5eb88634.json')
    
    # Check if the file exists
    if not os.path.exists(service_account_path):
        raise FileNotFoundError(f"Firebase service account file not found at: {service_account_path}")
    
    # Read the JSON file
    with open(service_account_path, 'r') as f:
        service_account = json.load(f)
    
    # Initialize Firebase Admin with the service account
    cred = credentials.Certificate(service_account)
    firebase_admin.initialize_app(cred)
    logger.info("Firebase Admin initialized successfully")
except Exception as e:
    logger.error(f"Error initializing Firebase Admin: {str(e)}")
    raise

# Initialize Firestore
db = firestore.client()

# Create FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

class UserRole(str, Enum):
    doctor = "doctor"
    patient = "patient"

class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(credentials.credentials)
        firebase_uid = decoded_token['uid']
        
        # Get user from Firestore
        user_ref = db.collection('users').document(firebase_uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            # Create new user if not exists
            firebase_user = auth.get_user(firebase_uid)
            user_data = {
                'email': firebase_user.email,
                'name': firebase_user.display_name or firebase_user.email,
                'role': UserRole.patient,  # Default role
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            }
            user_ref.set(user_data)
            return user_data
        
        return user_doc.to_dict()
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# User endpoints
@app.post("/users/")
async def create_user(email: str, password: str, name: str, role: UserRole):
    try:
        # Create user in Firebase Auth
        firebase_user = auth.create_user(
            email=email,
            password=password,
            display_name=name
        )
        
        # Create user in Firestore
        user_ref = db.collection('users').document(firebase_user.uid)
        user_data = {
            'email': email,
            'name': name,
            'role': role,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        user_ref.set(user_data)
        
        return {"message": "User created successfully", "uid": firebase_user.uid}
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/users/role")
async def get_user_role(current_user: dict = Depends(get_current_user)):
    return {"role": current_user['role']}

# Patient endpoints
@app.post("/patients/")
async def create_patient(
    name: str,
    age: int,
    gender: str,
    blood_pressure: str = None,
    heart_rate: float = None,
    temperature: float = None,
    priority: Priority = Priority.medium,
    current_user: dict = Depends(get_current_user)
):
    try:
        patient_data = {
            'user_id': current_user['id'],
            'name': name,
            'age': age,
            'gender': gender,
            'blood_pressure': blood_pressure,
            'heart_rate': heart_rate,
            'temperature': temperature,
            'priority': priority,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        # Add patient to Firestore
        patient_ref = db.collection('patients').document()
        patient_ref.set(patient_data)
        
        return {"message": "Patient created successfully", "id": patient_ref.id}
    except Exception as e:
        logger.error(f"Error creating patient: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/patients/")
async def get_patients(current_user: dict = Depends(get_current_user)):
    try:
        if current_user['role'] == UserRole.doctor:
            # Doctors can see all patients
            patients = db.collection('patients').stream()
        else:
            # Patients can only see their own records
            patients = db.collection('patients').where('user_id', '==', current_user['id']).stream()
        
        return [{"id": patient.id, **patient.to_dict()} for patient in patients]
    except Exception as e:
        logger.error(f"Error fetching patients: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Consultation endpoints
@app.post("/consultations/")
async def create_consultation(
    patient_id: str,
    diagnosis: str,
    prescription: str,
    notes: str = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        consultation_data = {
            'patient_id': patient_id,
            'doctor_id': current_user['id'],
            'diagnosis': diagnosis,
            'prescription': prescription,
            'notes': notes,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        # Add consultation to Firestore
        consultation_ref = db.collection('consultations').document()
        consultation_ref.set(consultation_data)
        
        return {"message": "Consultation created successfully", "id": consultation_ref.id}
    except Exception as e:
        logger.error(f"Error creating consultation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/consultations/{patient_id}")
async def get_consultations(patient_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Verify patient belongs to user
        patient = db.collection('patients').document(patient_id).get()
        if not patient.exists:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient_data = patient.to_dict()
        if patient_data['user_id'] != current_user['id'] and current_user['role'] != UserRole.doctor:
            raise HTTPException(status_code=403, detail="Not authorized to view these consultations")
        
        consultations = db.collection('consultations').where('patient_id', '==', patient_id).stream()
        return [{"id": consultation.id, **consultation.to_dict()} for consultation in consultations]
    except Exception as e:
        logger.error(f"Error fetching consultations: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Lab test endpoints
@app.post("/lab-tests/")
async def create_lab_test(
    patient_id: str,
    test_name: str,
    result: str,
    notes: str = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        lab_test_data = {
            'patient_id': patient_id,
            'test_name': test_name,
            'result': result,
            'notes': notes,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        # Add lab test to Firestore
        lab_test_ref = db.collection('lab_tests').document()
        lab_test_ref.set(lab_test_data)
        
        return {"message": "Lab test created successfully", "id": lab_test_ref.id}
    except Exception as e:
        logger.error(f"Error creating lab test: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/lab-tests/{patient_id}")
async def get_lab_tests(patient_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Verify patient belongs to user
        patient = db.collection('patients').document(patient_id).get()
        if not patient.exists:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient_data = patient.to_dict()
        if patient_data['user_id'] != current_user['id'] and current_user['role'] != UserRole.doctor:
            raise HTTPException(status_code=403, detail="Not authorized to view these lab tests")
        
        lab_tests = db.collection('lab_tests').where('patient_id', '==', patient_id).stream()
        return [{"id": lab_test.id, **lab_test.to_dict()} for lab_test in lab_tests]
    except Exception as e:
        logger.error(f"Error fetching lab tests: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Message endpoints
@app.post("/messages/")
async def create_message(
    patient_id: str,
    content: str,
    is_urgent: bool = False,
    current_user: dict = Depends(get_current_user)
):
    try:
        message_data = {
            'patient_id': patient_id,
            'sender_id': current_user['id'],
            'content': content,
            'is_urgent': is_urgent,
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        # Add message to Firestore
        message_ref = db.collection('messages').document()
        message_ref.set(message_data)
        
        return {"message": "Message created successfully", "id": message_ref.id}
    except Exception as e:
        logger.error(f"Error creating message: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/messages/{patient_id}")
async def get_messages(patient_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Verify patient belongs to user
        patient = db.collection('patients').document(patient_id).get()
        if not patient.exists:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient_data = patient.to_dict()
        if patient_data['user_id'] != current_user['id'] and current_user['role'] != UserRole.doctor:
            raise HTTPException(status_code=403, detail="Not authorized to view these messages")
        
        messages = db.collection('messages').where('patient_id', '==', patient_id).stream()
        return [{"id": message.id, **message.to_dict()} for message in messages]
    except Exception as e:
        logger.error(f"Error fetching messages: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 