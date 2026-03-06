import requests
import json
import sys

API_BASE_URL = "http://localhost:8000/api"

def test_project_creation():
    # Test 1: Create a new project with "Développement" category
    print("Test 1: Creating project with Développement category")
    project_data = {
        "title": "Test Project 1",
        "category": "Développement",  # This has an accented character
        "description": "Test project description",
        "thumbnail": "https://picsum.photos/seed/test1/800/600.jpg",
        "featured": False,
        "is_active": True,
        "show_registration": True,
        "technologies": ["Python", "Django"]
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/projects/",
            json=project_data,
            headers={
                "Content-Type": "application/json"
            },
            cookies={"sessionid": "your_session_id_here"}
        )
        
        print(f"Status code: {response.status_code}")
        print(f"Response content: {response.text}")
        
        if response.status_code == 201:
            project = response.json()
            print(f"\nProject created successfully!")
            print(f"ID: {project['id']}")
            print(f"Title: {project['title']}")
            print(f"Category: {project['category']}")
            print(f"Category bytes: {project['category'].encode('utf-8')}")
            
            # Check if category was correctly stored
            if project['category'] != "Développement":
                print("\n❌ Category mismatch!")
                print(f"Expected: 'Développement'")
                print(f"Got: '{project['category']}'")
            else:
                print("\n✅ Category is correct!")
        
        # Test 2: Check existing projects
        print("\nTest 2: Fetching all projects")
        response = requests.get(f"{API_BASE_URL}/projects/")
        
        if response.status_code == 200:
            projects = response.json()['results']
            print(f"\nFound {len(projects)} projects:")
            for project in projects:
                print(f"\n- ID: {project['id']}")
                print(f"  Title: {project['title']}")
                print(f"  Category: '{project['category']}'")
                print(f"  Category bytes: {project['category'].encode('utf-8')}")
                
    except Exception as e:
        print(f"Error: {e}")
        return False
        
    return True

if __name__ == "__main__":
    print("Testing project creation and category encoding")
    print("=" * 60)
    success = test_project_creation()
    print("\n" + "=" * 60)
    print("Test completed" + (" successfully" if success else " with errors"))