from flask import Blueprint, request, jsonify
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
        # Extract text based on file type
        text = ''
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # Read file content
        with open(file_path, 'r', encoding='utf-8') as file:
            text = file.read()
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(text)
        
        # Store chunks in database
        with DatabaseConnection() as conn:
            c = conn.cursor()
            for idx, chunk in enumerate(chunks):
                c.execute('''
                    INSERT INTO document_chunks (file_id, chunk_text, chunk_index)
                    VALUES (?, ?, ?)
                ''', (file_id, chunk, idx))
            
            # Create embeddings for chunks
            embeddings = OpenAIEmbeddings()
            
            # Create vector store directory if it doesn't exist
            vector_store_dir = os.path.join(UPLOAD_FOLDER, 'vector_stores')
            if not os.path.exists(vector_store_dir):
                os.makedirs(vector_store_dir)
            
            # Create FAISS vector store
            vector_store_path = os.path.join(vector_store_dir, f'store_{file_id}')
            vector_store = FAISS.from_texts(chunks, embeddings)
            vector_store.save_local(vector_store_path)
            
            # Update vector store path in files table
            c.execute('''
                UPDATE files
                SET vector_store_path = ?
                WHERE id = ?
            ''', (vector_store_path, file_id))
        
        return True, None
    except Exception as e:
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
def upload_file():
    """Handle file upload and processing."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        description = request.form.get('description', '')
        
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            
            with DatabaseConnection() as conn:
                c = conn.cursor()
                c.execute('''
                    INSERT INTO files (filename, description, file_path, file_type)
                    VALUES (?, ?, ?, ?)
                ''', (filename, description, file_path, os.path.splitext(filename)[1][1:]))
                file_id = c.lastrowid
            
            # Process document and create vector store
            success, error = process_document(file_path, file_id)
            if not success:
                return jsonify({'error': f'Error processing document: {error}'}), 500
            
            return jsonify({
                'message': 'File uploaded and processed successfully',
                'file_id': file_id,
                'filename': filename
            }), 200
            
        return jsonify({'error': 'File type not allowed'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@document_bp.route('/files', methods=['GET'])
def get_files():
    """Get list of uploaded files."""
    try:
        with DatabaseConnection() as conn:
            c = conn.cursor()
            c.execute('SELECT id, filename, description, upload_date, file_type FROM files')
            files = c.fetchall()
            
            return jsonify([{
                'id': f[0],
                'name': f[1],
                'description': f[2],
                'uploadDate': f[3],
                'fileType': f[4]
            } for f in files]), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
