import sqlite3
import os
from contextlib import contextmanager

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'database', 'teachai.db')

@contextmanager
def get_db_connection():
    """Create a database connection context manager."""
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Initialize the database with required tables."""
    print("Initializing database...")
    
    # Ensure the database directory exists
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Create files table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                description TEXT,
                file_path TEXT NOT NULL,
                file_type TEXT,
                vector_store_path TEXT,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create document_chunks table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS document_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER,
                chunk_text TEXT NOT NULL,
                chunk_index INTEGER,
                chunk_embedding BLOB,
                FOREIGN KEY (file_id) REFERENCES files (id)
            )
        ''')
        
        # Create chat_history table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create questions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question TEXT NOT NULL,
                response TEXT NOT NULL,
                response_english TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                subject TEXT,
                teacher TEXT,
                language TEXT DEFAULT 'en'
            )
        ''')
        
        # Create teacher_settings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS teacher_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                allow_bot_answers BOOLEAN DEFAULT 1,
                start_time TEXT DEFAULT '09:00',
                end_time TEXT DEFAULT '17:00',
                max_questions_per_day INTEGER DEFAULT 10,
                require_approval BOOLEAN DEFAULT 0,
                auto_translate BOOLEAN DEFAULT 1,
                profanity_filter BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Note: chat_history table already created above
        
        conn.commit()
        print("Database tables created successfully")

def verify_tables_exist():
    """Verify that all required tables exist in the database."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Get list of existing tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row[0] for row in cursor.fetchall()}
        
        # Check for required tables
        required_tables = {'files', 'document_chunks', 'chat_history'}
        missing_tables = required_tables - tables
        
        if missing_tables:
            print(f"Missing tables: {missing_tables}")
            return False
            
        return True
