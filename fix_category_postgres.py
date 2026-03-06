import os
import sys
import psycopg2
from psycopg2 import OperationalError

# Get database credentials from environment variables
DB_NAME = os.environ.get('DB_NAME', 'portfolio_db')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5432')

def create_connection():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        return conn
    except OperationalError as e:
        print(f"The error '{e}' occurred")
        return None

def fix_categories():
    conn = create_connection()
    if not conn:
        return False
        
    try:
        cur = conn.cursor()
        
        # First, check the current state of the projects
        print("Current project categories:")
        cur.execute("""
            SELECT id, title, category FROM projects_project
        """)
        projects = cur.fetchall()
        for project in projects:
            print(f"ID: {project[0]}, Title: {project[1]}, Category: '{project[2]}'")
        
        # Update the categories
        print("\nUpdating categories...")
        cur.execute("""
            UPDATE projects_project 
            SET category = 'Développement' 
            WHERE category LIKE 'D%veloppement'
        """)
        conn.commit()
        print(f"Updated {cur.rowcount} records")
        
        # Verify the fix
        print("\nUpdated project categories:")
        cur.execute("""
            SELECT id, title, category FROM projects_project
        """)
        projects = cur.fetchall()
        for project in projects:
            print(f"ID: {project[0]}, Title: {project[1]}, Category: '{project[2]}'")
            
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    print("Fixing project category encoding issues...")
    print("=" * 60)
    
    success = fix_categories()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ Categories fixed successfully!")
    else:
        print("❌ Failed to fix categories")