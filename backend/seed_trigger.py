import requests
import json

def seed_database():
    url = "http://127.0.0.1:8000/seed"
    try:
        response = requests.post(url)
        if response.status_code == 200:
            print("Successfully seeded the database!")
            print(response.json())
        else:
            print(f"Failed to seed. Status: {response.status_code}")
            print(response.text)
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the backend server.")
        print("Make sure you run 'uvicorn backend.main:app --reload' first.")

if __name__ == "__main__":
    seed_database()
