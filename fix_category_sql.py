import sqlite3
import os

# Find the database file
db_path = os.path.join('.', 'backend', 'db.sqlite3')

print(f"Database path: {db_path}")

# Connect to the database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Update the categories
try:
    cursor.execute("""
        UPDATE projects_project 
        SET category = 'Développement' 
        WHERE category LIKE 'D%veloppement'
    """)
    conn.commit()
    print(f"Updated {cursor.rowcount} records")
    
    # Verify the fix
    cursor.execute("""
        SELECT id, title, category FROM projects_project
    """)
    projects = cursor.fetchall()
    print("\nAll projects after fixing:")
    for project in projects:
        print(f"ID: {project[0]}, Title: {project[1]}, Category: '{project[2]}'")
        
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
finally:
    conn.close()
