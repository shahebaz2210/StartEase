import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_registration_and_login():
    unique_id = uuid.uuid4().hex[:8]
    email = f"test_{unique_id}@example.com"
    password = "secretpassword123"
    name = f"Test User {unique_id}"

    # 1. Register new user
    reg_response = client.post(
        "/v1/auth/register",
        json={"email": email, "password": password, "name": name},
    )
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == email
    assert reg_data["user"]["name"] == name
    token = reg_data["access_token"]

    # 2. Duplicate registration should fail
    dup_response = client.post(
        "/v1/auth/register",
        json={"email": email, "password": password},
    )
    assert dup_response.status_code == 400
    assert dup_response.json()["error"] == "EMAIL_EXISTS"

    # 3. Test /me with valid token
    me_response = client.get(
        "/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email

    # 4. Test /me with missing token
    unauth_response = client.get("/v1/auth/me")
    assert unauth_response.status_code == 401

    # 5. Test login with correct password
    login_response = client.post(
        "/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

    # 6. Test login with wrong password
    bad_login = client.post(
        "/v1/auth/login",
        json={"email": email, "password": "wrongpassword"},
    )
    assert bad_login.status_code == 401
    assert bad_login.json()["error"] == "INVALID_CREDENTIALS"
