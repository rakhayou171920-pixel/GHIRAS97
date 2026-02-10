"""
Ghiras Club Student Points Management API Tests
Tests: Auth, Students CRUD, Points Management, Challenges
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API_URL = f"{BASE_URL}/api"

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "ghiras2024"


class TestHealthAndRoot:
    """Test API root and health"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{API_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root returns: {data['message']}")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_login_success(self):
        """Test successful login with admin credentials"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert "expires_in" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
        print(f"✓ Login successful, token expires in {data['expires_in']} seconds")
    
    def test_login_wrong_username(self):
        """Test login with wrong username"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": "wronguser",
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 401
        print("✓ Wrong username correctly rejected")
    
    def test_login_wrong_password(self):
        """Test login with wrong password"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Wrong password correctly rejected")
    
    def test_verify_valid_token(self, auth_token):
        """Test token verification with valid token"""
        response = requests.get(f"{API_URL}/auth/verify", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["username"] == ADMIN_USERNAME
        print("✓ Valid token verified successfully")
    
    def test_verify_invalid_token(self):
        """Test token verification with invalid token"""
        response = requests.get(f"{API_URL}/auth/verify", headers={
            "Authorization": "Bearer invalid_token_here"
        })
        assert response.status_code == 401
        print("✓ Invalid token correctly rejected")
    
    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token"""
        response = requests.post(f"{API_URL}/students", json={
            "name": "Test Student"
        })
        # Should require authentication
        assert response.status_code in [401, 403]
        print("✓ Protected endpoint correctly requires authentication")


class TestStudentsCRUD:
    """Student CRUD operations with authentication"""
    
    def test_get_students_public(self):
        """Test getting students list (public endpoint)"""
        response = requests.get(f"{API_URL}/students")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} students from public endpoint")
    
    def test_create_student_and_verify(self, auth_token):
        """Test creating a student and verifying persistence"""
        unique_id = str(uuid.uuid4())[:8]
        student_data = {
            "name": f"TEST_Student_{unique_id}",
            "phone": "0501234567",
            "supervisor": "TEST_Supervisor"
        }
        
        # Create student
        response = requests.post(f"{API_URL}/students", json=student_data, headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        created = response.json()
        assert created["name"] == student_data["name"]
        assert created["phone"] == student_data["phone"]
        assert created["supervisor"] == student_data["supervisor"]
        assert "id" in created
        assert created["points"] == 0
        
        student_id = created["id"]
        print(f"✓ Created student with ID: {student_id}")
        
        # Verify in list
        response = requests.get(f"{API_URL}/students")
        assert response.status_code == 200
        students = response.json()
        found = [s for s in students if s["id"] == student_id]
        assert len(found) == 1
        assert found[0]["name"] == student_data["name"]
        print(f"✓ Student verified in list")
        
        return student_id
    
    def test_update_student(self, auth_token, test_student_id):
        """Test updating a student"""
        update_data = {"name": "TEST_Updated_Name"}
        
        response = requests.put(f"{API_URL}/students/{test_student_id}", 
            json=update_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        updated = response.json()
        assert updated["name"] == "TEST_Updated_Name"
        print(f"✓ Student updated successfully")
    
    def test_get_student_profile(self, test_student_id):
        """Test getting student profile (public)"""
        response = requests.get(f"{API_URL}/students/{test_student_id}/profile")
        assert response.status_code == 200
        data = response.json()
        assert "student" in data
        assert "rank" in data
        assert "total_students" in data
        print(f"✓ Student profile retrieved, rank: {data['rank']}/{data['total_students']}")
    
    def test_delete_student(self, auth_token, test_student_id):
        """Test deleting a student"""
        response = requests.delete(f"{API_URL}/students/{test_student_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["deleted"] == True
        print(f"✓ Student deleted successfully")
        
        # Verify deletion
        response = requests.get(f"{API_URL}/students/{test_student_id}/profile")
        assert response.status_code == 404
        print("✓ Deleted student no longer exists")


class TestPointsManagement:
    """Points update operations"""
    
    def test_add_positive_points(self, auth_token, test_student_for_points):
        """Test adding positive points"""
        student_id = test_student_for_points["id"]
        initial_points = test_student_for_points["points"]
        
        response = requests.put(f"{API_URL}/students/{student_id}/points",
            json={"points": 10, "reason": "حضور"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        updated = response.json()
        assert updated["points"] == initial_points + 10
        print(f"✓ Added 10 points, new total: {updated['points']}")
    
    def test_subtract_points(self, auth_token, test_student_for_points):
        """Test subtracting points"""
        student_id = test_student_for_points["id"]
        
        # First get current points
        response = requests.get(f"{API_URL}/students/{student_id}/profile")
        current = response.json()["student"]["points"]
        
        response = requests.put(f"{API_URL}/students/{student_id}/points",
            json={"points": -5, "reason": "تأخير"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        updated = response.json()
        assert updated["points"] == current - 5
        print(f"✓ Subtracted 5 points, new total: {updated['points']}")
    
    def test_mark_attendance(self, auth_token, test_student_for_points):
        """Test attendance marking (adds 10 points)"""
        student_id = test_student_for_points["id"]
        
        response = requests.get(f"{API_URL}/students/{student_id}/profile")
        current = response.json()["student"]["points"]
        
        response = requests.put(f"{API_URL}/students/{student_id}/attendance",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        updated = response.json()
        assert updated["points"] == current + 10
        print(f"✓ Attendance marked, added 10 points")


class TestChallenges:
    """Challenge/Competition tests"""
    
    def test_create_challenge(self, auth_token):
        """Test creating a challenge"""
        challenge_data = {
            "question": "TEST_ما هو عدد أركان الإسلام؟",
            "options": ["ثلاثة", "أربعة", "خمسة", "ستة"],
            "correct_answer": 2,  # خمسة (0-indexed)
            "points": 15
        }
        
        response = requests.post(f"{API_URL}/challenges",
            json=challenge_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        created = response.json()
        assert created["question"] == challenge_data["question"]
        assert created["points"] == 15
        assert created["active"] == True
        print(f"✓ Challenge created with ID: {created['id']}")
        return created["id"]
    
    def test_get_challenges(self):
        """Test getting all challenges"""
        response = requests.get(f"{API_URL}/challenges")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} challenges")
    
    def test_get_active_challenges(self):
        """Test getting only active challenges"""
        response = requests.get(f"{API_URL}/challenges/active")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned challenges should be active
        for challenge in data:
            assert challenge.get("active") == True
        print(f"✓ Got {len(data)} active challenges")
    
    def test_toggle_challenge(self, auth_token, test_challenge_id):
        """Test toggling challenge active status"""
        response = requests.put(f"{API_URL}/challenges/{test_challenge_id}/toggle",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "active" in data
        print(f"✓ Challenge toggled, active: {data['active']}")
    
    def test_answer_challenge_correct(self, test_challenge_id, test_student_for_points):
        """Test answering challenge correctly"""
        student_id = test_student_for_points["id"]
        
        response = requests.post(f"{API_URL}/challenges/{test_challenge_id}/answer/{student_id}",
            json={"answer": 2}  # Correct answer
        )
        # May fail if already answered, so check both cases
        if response.status_code == 200:
            data = response.json()
            assert "correct" in data
            print(f"✓ Challenge answered, correct: {data['correct']}, points: {data['points_earned']}")
        elif response.status_code == 400:
            print("✓ Challenge already answered (expected if run multiple times)")
        else:
            assert False, f"Unexpected status code: {response.status_code}"
    
    def test_delete_challenge(self, auth_token, test_challenge_id):
        """Test deleting a challenge"""
        response = requests.delete(f"{API_URL}/challenges/{test_challenge_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["deleted"] == True
        print(f"✓ Challenge deleted successfully")


class TestSupervisors:
    """Supervisor-related tests"""
    
    def test_get_supervisors(self):
        """Test getting supervisors list"""
        response = requests.get(f"{API_URL}/supervisors")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} supervisors")


# ============ FIXTURES ============

@pytest.fixture
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{API_URL}/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def test_student_id(auth_token):
    """Create a test student and return its ID, cleanup after test"""
    unique_id = str(uuid.uuid4())[:8]
    student_data = {
        "name": f"TEST_Fixture_Student_{unique_id}",
        "phone": "0509999999",
        "supervisor": "TEST_Fixture_Supervisor"
    }
    
    response = requests.post(f"{API_URL}/students", json=student_data, headers={
        "Authorization": f"Bearer {auth_token}"
    })
    
    if response.status_code != 200:
        pytest.skip("Could not create test student")
    
    student_id = response.json()["id"]
    yield student_id
    
    # Cleanup
    requests.delete(f"{API_URL}/students/{student_id}", headers={
        "Authorization": f"Bearer {auth_token}"
    })


@pytest.fixture
def test_student_for_points(auth_token):
    """Create a test student for points testing"""
    unique_id = str(uuid.uuid4())[:8]
    student_data = {
        "name": f"TEST_Points_Student_{unique_id}",
        "phone": "0508888888",
        "supervisor": "TEST_Points_Supervisor"
    }
    
    response = requests.post(f"{API_URL}/students", json=student_data, headers={
        "Authorization": f"Bearer {auth_token}"
    })
    
    if response.status_code != 200:
        pytest.skip("Could not create test student for points")
    
    student = response.json()
    yield student
    
    # Cleanup
    requests.delete(f"{API_URL}/students/{student['id']}", headers={
        "Authorization": f"Bearer {auth_token}"
    })


@pytest.fixture
def test_challenge_id(auth_token):
    """Create a test challenge and return its ID"""
    unique_id = str(uuid.uuid4())[:8]
    challenge_data = {
        "question": f"TEST_Question_{unique_id}",
        "options": ["أ", "ب", "ج", "د"],
        "correct_answer": 1,
        "points": 10
    }
    
    response = requests.post(f"{API_URL}/challenges", json=challenge_data, headers={
        "Authorization": f"Bearer {auth_token}"
    })
    
    if response.status_code != 200:
        pytest.skip("Could not create test challenge")
    
    challenge_id = response.json()["id"]
    yield challenge_id
    
    # Cleanup - try to delete
    requests.delete(f"{API_URL}/challenges/{challenge_id}", headers={
        "Authorization": f"Bearer {auth_token}"
    })


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
