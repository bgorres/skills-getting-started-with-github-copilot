import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data

def test_signup_and_unregister():
    # Use a unique email for testing
    test_email = "pytestuser@mergington.edu"
    activity = "Chess Club"

    # Ensure not already signed up
    client.delete(f"/activities/{activity}/unregister?email={test_email}")

    # Sign up
    response = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert response.status_code == 200
    assert f"Signed up {test_email}" in response.json()["message"]

    # Unregister
    response = client.delete(f"/activities/{activity}/unregister?email={test_email}")
    assert response.status_code == 200
    assert f"Unregistered {test_email}" in response.json()["message"]

    # Unregister again should 404
    response = client.delete(f"/activities/{activity}/unregister?email={test_email}")
    assert response.status_code == 404

def test_signup_duplicate():
    test_email = "pytestdupe@mergington.edu"
    activity = "Programming Class"
    # Clean up
    client.delete(f"/activities/{activity}/unregister?email={test_email}")
    # First signup
    response = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert response.status_code == 200
    # Duplicate signup
    response = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]
    # Clean up
    client.delete(f"/activities/{activity}/unregister?email={test_email}")
