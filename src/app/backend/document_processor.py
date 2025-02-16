from flask import Blueprint, request, jsonify, Response
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
import sqlite3
import json

# Create blueprint
document_bp = Blueprint('document', __name__)

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx'}

# Ensure upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Database configuration
DATABASE_NAME = 'teachai.db'

def init_db():
    """Initialize database tables if they don't exist."""
    print("Initializing database...")
    try:
        with DatabaseConnection() as conn:
            c = conn.cursor()
            
            # Create files table with file_type column
            c.execute('''
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
            print("Files table created/verified")
            
            # Create document_chunks table
            c.execute('''
                CREATE TABLE IF NOT EXISTS document_chunks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_id INTEGER,
                    chunk_text TEXT,
                    chunk_index INTEGER,
                    chunk_embedding BLOB,
                    FOREIGN KEY (file_id) REFERENCES files (id)
                )
            ''')
            print("Document chunks table created/verified")
            
    except Exception as e:
        print(f"Error initializing database: {e}")
        raise

# Database connection context manager
class DatabaseConnection:
    def __init__(self):
        self.conn = None

    def __enter__(self):
        self.conn = sqlite3.connect(DATABASE_NAME)
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            if exc_type is None:
                self.conn.commit()
            else:
                self.conn.rollback()
            self.conn.close()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def process_document(file_path, file_id):
    """Process uploaded document and create vector store."""
    try:
        print(f"Processing document: {file_path}")
        # Extract text based on file type
        text = ''
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # Read file content with error handling
        try:
            # First try reading as text
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
                print("Successfully read file with UTF-8 encoding")
        except UnicodeDecodeError:
            try:
                # Try with a different encoding if UTF-8 fails
                with open(file_path, 'r', encoding='latin-1') as file:
                    text = file.read()
                    print("Successfully read file with latin-1 encoding")
            except Exception as e:
                print(f"Error reading file with text encodings: {e}")
                # If all text encodings fail, try reading as binary
                with open(file_path, 'rb') as file:
                    binary_content = file.read()
                    try:
                        # Try to decode as UTF-8 with error handling
                        text = binary_content.decode('utf-8', errors='ignore')
                        print("Successfully decoded binary content as UTF-8")
                    except Exception as e:
                        print(f"Error decoding binary content: {e}")
                        return False, "Unable to read file content"
        
        if not text.strip():
            print("Warning: Empty text content")
            return False, "File appears to be empty"
        
        print(f"Extracted text length: {len(text)}")
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        chunks = text_splitter.split_text(text)
        print(f"Split text into {len(chunks)} chunks")
        
        if not chunks:
            print("Warning: No chunks created")
            return False, "Could not split document into chunks"
        
        # Store chunks in database
        with DatabaseConnection() as conn:
            c = conn.cursor()
            print("Storing chunks in database...")
            for idx, chunk in enumerate(chunks):
                if not chunk.strip():
                    continue  # Skip empty chunks
                c.execute('''
                    INSERT INTO document_chunks (file_id, chunk_text, chunk_index, chunk_embedding)
                    VALUES (?, ?, ?, ?)
                ''', (file_id, chunk, idx, None))
            
            # Create embeddings for chunks
            print("Creating embeddings...")
            embeddings = OpenAIEmbeddings()
            
            # Create vector store directory if it doesn't exist
            vector_store_dir = os.path.join(UPLOAD_FOLDER, 'vector_stores')
            if not os.path.exists(vector_store_dir):
                os.makedirs(vector_store_dir)
            
            # Create FAISS vector store
            print("Creating FAISS vector store...")
            vector_store_path = os.path.join(vector_store_dir, f'store_{file_id}')
            vector_store = FAISS.from_texts(chunks, embeddings)
            vector_store.save_local(vector_store_path)
            print(f"Saved vector store to: {vector_store_path}")
            
            # Update vector store path in files table
            c.execute('''
                UPDATE files
                SET vector_store_path = ?
                WHERE id = ?
            ''', (vector_store_path, file_id))
            print("Updated vector store path in database")
        
        return True, None
    except Exception as e:
        import traceback
        print(f"Error processing document: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return False, str(e)

def get_relevant_context(question, k=3):
    """Get relevant context from processed documents."""
    try:
        # Get all vector stores
        with DatabaseConnection() as conn:
            c = conn.cursor()
            c.execute('SELECT id, vector_store_path FROM files WHERE vector_store_path IS NOT NULL')
            stores = c.fetchall()
        
        if not stores:
            return []
        
        # Initialize embeddings
        embeddings = OpenAIEmbeddings()
        
        # Search across all vector stores
        all_contexts = []
        for file_id, store_path in stores:
            if os.path.exists(store_path):
                vector_store = FAISS.load_local(store_path, embeddings)
                docs = vector_store.similarity_search(question, k=k)
                all_contexts.extend([doc.page_content for doc in docs])
        
        return all_contexts
    except Exception as e:
        print(f'Error getting context: {e}')
        return []

@document_bp.route('/upload', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True, methods=['POST', 'OPTIONS'], headers=['Content-Type', 'Accept'])
def upload_file():
    """Handle file upload and processing."""
    print("Received upload request")
    try:
        # Handle OPTIONS request for CORS
        if request.method == 'OPTIONS':
            return jsonify({'message': 'OK'}), 200

        print("Request files:", request.files)
        print("Request form:", request.form)

        if 'file' not in request.files:
            print("No file in request")
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        description = request.form.get('description', '')
        
        print(f"File received: {file.filename}, description: {description}")
        
        if file.filename == '':
            print("Empty filename")
            return jsonify({'error': 'No selected file'}), 400
            
        if not file:
            print("No file object")
            return jsonify({'error': 'No file uploaded'}), 400
            
        if not allowed_file(file.filename):
            print(f"Invalid file type: {file.filename}")
            return jsonify({'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
            
        try:
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            print(f"Saving file to: {file_path}")
            
            # Ensure unique filename
            base, ext = os.path.splitext(filename)
            counter = 1
            while os.path.exists(file_path):
                filename = f"{base}_{counter}{ext}"
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                counter += 1
                
            file.save(file_path)
            print("File saved successfully")
            
            # Insert file record
            with DatabaseConnection() as conn:
                c = conn.cursor()
                c.execute('''
                    INSERT INTO files (filename, description, file_path, file_type)
                    VALUES (?, ?, ?, ?)
                ''', (filename, description, file_path, os.path.splitext(filename)[1][1:]))
                file_id = c.lastrowid
                print(f"File record created with ID: {file_id}")
            
            # Process document and create vector store
            print("Starting document processing")
            success, error = process_document(file_path, file_id)
            
            if not success:
                print(f"Document processing failed: {error}")
                # Clean up the file if processing fails
                os.remove(file_path)
                with DatabaseConnection() as conn:
                    c = conn.cursor()
                    c.execute('DELETE FROM files WHERE id = ?', (file_id,))
                return jsonify({'error': f'Error processing document: {error}'}), 500
            
            print("Document processed successfully")
            return jsonify({
                'message': 'File uploaded and processed successfully',
                'file_id': file_id,
                'filename': filename
            }), 200
            
        except Exception as e:
            print(f"Error during file handling: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return jsonify({'error': f'Error saving file: {str(e)}'}), 500
        
    except Exception as e:
        print(f"Server error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@document_bp.route('/files', methods=['GET', 'OPTIONS'])
@cross_origin(supports_credentials=True, methods=['GET', 'OPTIONS'], headers=['Content-Type', 'Accept'])
def get_files():
    """Get list of uploaded files."""
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        with DatabaseConnection() as conn:
            c = conn.cursor()
            c.execute('SELECT id, filename, description, upload_date, file_type FROM files ORDER BY upload_date DESC')
            files = c.fetchall()
            
            file_list = [{
                'id': f[0],
                'name': f[1],
                'description': f[2] or '',
                'uploadDate': f[3],
                'fileType': f[4] or 'unknown'
            } for f in files]
            
            print(f"Returning {len(file_list)} files")
            return jsonify(file_list), 200
            
    except Exception as e:
        print(f"Error getting files: {e}")
        return jsonify([]), 200  # Return empty array instead of error
