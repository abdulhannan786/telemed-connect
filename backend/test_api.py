import requests
import json

BASE_URL = 'http://localhost:8000'

def test_api():
    # Test 1: Check if API is running
    print("\n1. Testing API status:")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    # Test 2: Get all patients
    print("\n2. Getting all patients:")
    response = requests.get(f"{BASE_URL}/patients/")
    print(f"Status: {response.status_code}")
    print(f"Found {len(response.json())} patients:")
    for patient in response.json():
        print(f"- {patient['name']} (ID: {patient['patient_id']}, Priority: {patient['priority']})")

    # Test 3: Get specific patient
    print("\n3. Getting patient with ID 1:")
    response = requests.get(f"{BASE_URL}/patients/1")
    print(f"Status: {response.status_code}")
    print(f"Patient details: {json.dumps(response.json(), indent=2)}")

    # Test 4: Create consultation
    print("\n4. Creating new consultation:")
    consultation_data = {
        "patient_id": 1,
        "notes": "Test consultation notes",
        "status": "draft",
        "prescription": True,
        "followup": True,
        "bloodwork": False
    }
    response = requests.post(
        f"{BASE_URL}/consultations/",
        json=consultation_data
    )
    print(f"Status: {response.status_code}")
    print(f"Created consultation: {json.dumps(response.json(), indent=2)}")

if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API. Make sure the server is running on http://localhost:8000") 