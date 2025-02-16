from flask import Flask, request, jsonify, Response, send_file, redirect
import requests
from flask_cors import CORS, cross_origin
from openai import OpenAI
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
import os
from dotenv import load_dotenv
import base64
from io import BytesIO
import time
import sqlite3
from grade.grader import extract_and_parse, grade_with_gemini
from grade.file_utils import extract_text, parse_answer_key, parse_rubric
from datetime import datetime
from PIL import Image
from document_processor import document_bp
from database import init_db, verify_tables_exist, get_db_connection

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Initialize ElevenLabs client
elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY')
if not elevenlabs_api_key:
    print('Warning: ELEVENLABS_API_KEY not found in environment variables')
elevenlabs_client = ElevenLabs(api_key=elevenlabs_api_key)

# Add debug logging for text-to-speech
def debug_tts_status():
    try:
        if elevenlabs_api_key:
            print(f'ElevenLabs API key found (length: {len(elevenlabs_api_key)})')
        else:
            print('ElevenLabs API key not found')
    except Exception as e:
        print(f'Error checking TTS status: {e}')

debug_tts_status()

# Configuration
DATABASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database')
DATABASE_PATH = os.path.join(DATABASE_DIR, 'teachai.db')
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# Ensure required directories exist
for directory in [DATABASE_DIR, UPLOAD_FOLDER]:
    if not os.path.exists(directory):
        print(f"Creating directory: {directory}")
        os.makedirs(directory)

# Database connection context manager
class DatabaseConnection:
    def __init__(self):
        self.conn = None

    def __enter__(self):
        print(f"Connecting to database: {DATABASE_PATH}")
        self.conn = sqlite3.connect(DATABASE_PATH)
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            if exc_type is None:
                self.conn.commit()
                print("Database changes committed")
            else:
                self.conn.rollback()
                print(f"Database changes rolled back due to: {exc_type}")
            self.conn.close()
            print("Database connection closed")

def verify_db_tables():
    """Verify that all required database tables exist and have the correct schema."""
    print("Verifying database tables...")
    with DatabaseConnection() as conn:
        c = conn.cursor()
        
        # Check if tables exist
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row[0] for row in c.fetchall()}
        print(f"Existing tables: {tables}")
        
        required_tables = {'files', 'document_chunks'}
        missing_tables = required_tables - tables
        
        if missing_tables:
            print(f"Missing tables: {missing_tables}")
            return False
            
        # Verify table schemas
        try:
            c.execute("PRAGMA table_info(files)")
            files_columns = {row[1] for row in c.fetchall()}
            required_files_columns = {'id', 'filename', 'description', 'file_path', 'file_type', 'vector_store_path', 'upload_date'}
            
            c.execute("PRAGMA table_info(document_chunks)")
            chunks_columns = {row[1] for row in c.fetchall()}
            required_chunks_columns = {'id', 'file_id', 'chunk_text', 'chunk_index'}
            
            print(f"Files table columns: {files_columns}")
            print(f"Document chunks table columns: {chunks_columns}")
            
            if not (required_files_columns <= files_columns and required_chunks_columns <= chunks_columns):
                print("Schema verification failed")
                return False
                
            return True
        except Exception as e:
            print(f"Error verifying schema: {e}")
            return False

def init_db():
    """Initialize database tables if they don't exist."""
    print("Initializing database...")
    try:
        with get_db_connection() as conn:
            c = conn.cursor()
            
            # Create files table
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
                    chunk_text TEXT NOT NULL,
                    chunk_index INTEGER,
                    FOREIGN KEY (file_id) REFERENCES files (id)
                )
            ''')
            print("Document chunks table created/verified")
            
            # Create chat_history table if it doesn't exist yet
            c.execute('''
                CREATE TABLE IF NOT EXISTS chat_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            print("Chat history table created/verified")
            
            # Verify tables were created correctly
            if not verify_db_tables():
                print("Database verification failed!")
                raise Exception("Failed to verify database tables")
            
            print("Database initialization completed successfully")
            return True
            
    except sqlite3.Error as e:
        print(f"SQLite error during database initialization: {e}")
        raise Exception(f"Database initialization failed: {e}") from e
    except Exception as e:
        print(f"Unexpected error during database initialization: {e}")
        raise Exception(f"Database initialization failed: {e}") from e

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True)


# Initialize database
try:
    init_db()
    if not verify_tables_exist():
        print("Database verification failed, recreating tables...")
        init_db()
    print("Database initialized and verified successfully")
except Exception as e:
    print(f"Error initializing database: {e}")

# Configure CORS
# Configure CORS to be completely open while supporting credentials
CORS(app, 
    resources={r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Accept", "Authorization", "X-Requested-With", "x-csrf-token"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 86400
    }},
    supports_credentials=True)

# Register blueprints
app.register_blueprint(document_bp, url_prefix='/document')

# Health check endpoint
@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Accept')
    return response

# Initialize SQLite database
def init_db():
    with DatabaseConnection() as conn:
        c = conn.cursor()
        
        # Questions table
        c.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question TEXT NOT NULL,
                response TEXT NOT NULL,
                response_english TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                subject TEXT DEFAULT 'Computer Science',
                teacher TEXT DEFAULT 'Dr. Smith',
                language TEXT DEFAULT 'en-US'
            )
        ''')
        
        # Files table with vector store path
        c.execute('''
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                description TEXT,
                upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_path TEXT NOT NULL,
                vector_store_path TEXT,
                file_type TEXT NOT NULL
            )
        ''')
        
        # Document chunks table for context
        c.execute('''
            CREATE TABLE IF NOT EXISTS document_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER,
                chunk_text TEXT NOT NULL,
                chunk_index INTEGER,
                FOREIGN KEY (file_id) REFERENCES files (id)
            )
        ''')
        
        # Students table
        c.execute('''
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL
            )
        ''')

init_db()

# Configure file upload settings
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Configure API keys
load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')

if not OPENAI_API_KEY:
    raise ValueError("OPENAI API key not found in environment variables")
if not ELEVENLABS_API_KEY:
    raise ValueError("ELEVENLABS API key not found in environment variables")

# Configure OpenAI
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Configure ElevenLabs
elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

# Configure ElevenLabs - using generate function directly as per quickstart
# The API key will be loaded automatically from environment

def create_teaching_prompt(question):
    return [{
        "role": "system",
        "content": "You are an AI teaching assistant. Provide clear, concise, and helpful responses. "
        "Focus on explaining concepts in a way that's easy to understand while maintaining academic accuracy. "
        "If a question is unclear, ask for clarification. If topics are complex, break them down into simpler parts."
        "Be somewhat concise, and make sure to return only plain text."
        "If needed, make sure to put out content in LaTeX format or use the conventions specific to that genre of question."
        "Always respond in English - translation will be handled separately if needed."
        "Be a great teacher!"
    },
    {
        "role": "user",
        "content": question
    }]

def generate_ai_response(question):
    # Get relevant context from documents
    contexts = get_relevant_context(question)
    context_text = '\n'.join(contexts) if contexts else ''
    
    # Create messages with context
    messages = [
        {
            "role": "system",
            "content": "You are an AI teaching assistant. Provide clear, concise, and helpful responses. "
            "Focus on explaining concepts in a way that's easy to understand while maintaining academic accuracy. "
            "If a question is unclear, ask for clarification. If topics are complex, break them down into simpler parts. "
            "Be somewhat concise, and make sure to return only plain text. "
            "If needed, make sure to put out content in LaTeX format or use the conventions specific to that genre of question. "
            "Always respond in English - translation will be handled separately if needed. "
            "Use the provided context to inform your responses when relevant."
        }
    ]
    
    # Add context if available
    if context_text:
        messages.append({
            "role": "system",
            "content": (
                f"Context from relevant documents:\n{context_text}"
                f"For reference, the user is working on a Computer Science study guide with the following 5 questions (Q) and answers."
                """
                Q: What is recursion? Answer: Recursion is a programming technique where a function calls itself to solve a problem by breaking it down into smaller, more manageable subproblems. 
                Q: Define a linked list. Answer: A linked list is a linear data structure where elements, called nodes, are stored in sequence, with each node containing data and a reference (or link) to the next node in the sequence.
                Q: What is the purpose of a base case in recursion? Answer: The base case in recursion provides a condition under which the recursive function stops calling itself, preventing infinite loops and ensuring that the problem is eventually solved.
                Q: Explain the difference between a stack and a queue. Answer: A stack is a data structure that follows the Last-In-First-Out (LIFO) principle, where the last element added is the first to be removed. In contrast, a queue follows the First-In-First-Out (FIFO) principle, where the first element added is the first to be removed.
                Q: What is a binary search tree (BST)? Answer: A binary search tree is a tree data structure in which each node has at most two children, referred to as the left and right child. For each node, all elements in the left subtree are less than the node's key, and all elements in the right subtree are greater than the node's key.
                """
            )
        })
    
    # Add user question
    messages.append({
        "role": "user",
        "content": question
    })
    
    # Generate response
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.7,
        max_tokens=1000
    )
    
    return response.choices[0].message.content
    
def text_to_speech_stream(text):
    if not elevenlabs_api_key:
        print("No ElevenLabs API key found. Audio generation disabled.")
        return None
        
    try:
        print(f"Generating audio for text: {text[:100]}...")
        # Perform the text-to-speech conversion
        audio_data = elevenlabs_client.text_to_speech.convert(
            voice_id="XrExE9yKIg1WjnnlVkGX",  # Matilda voice
            output_format="mp3_44100_128",  # Higher quality audio
            text=text,
            model_id="eleven_multilingual_v2",
            voice_settings=VoiceSettings(
                stability=0.5,  # Increased stability
                similarity_boost=0.75,
                style=0.0,
                use_speaker_boost=True,
            ),
        )
        
        # Create a BytesIO object to hold the audio data in memory
        audio_stream = BytesIO()
        
        # Write the audio data to the stream
        if isinstance(audio_data, bytes):
            audio_stream.write(audio_data)
        else:
            # Handle streaming response
            chunk_count = 0
            for chunk in audio_data:
                if chunk:
                    audio_stream.write(chunk)
                    chunk_count += 1
            print(f"Successfully generated audio: {chunk_count} chunks written")
        
        # Reset stream position to the beginning
        audio_stream.seek(0)
        return audio_stream
        
    except Exception as e:
        print(f"Error generating audio: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return None

@app.route('/questions', methods=['GET', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def get_questions():
    try:
        print("\n=== GET /questions ===\n")
        print(f"Database path: {DATABASE_PATH}")
        print("Attempting to fetch questions from database...")

        with get_db_connection() as conn:
            c = conn.cursor()
            
            # First, verify the table exists and its schema
            c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'")
            table_exists = c.fetchone()
            print(f"Questions table exists: {bool(table_exists)}")
            
            if not table_exists:
                print("Questions table does not exist!")
                return jsonify({'error': 'Questions table not found'}), 500
                
            c.execute('SELECT * FROM questions ORDER BY timestamp DESC')
            questions = c.fetchall()
            print(f"Found {len(questions)} questions in database")
            
            if questions:
                print("Sample question data:")
                print(f"First row: {questions[0]}")
            
            questions_list = [{
                'id': q[0],
                'question': q[1],
                'response': q[2],
                'response_english': q[3],
                'timestamp': q[4],
                'subject': q[5],
                'teacher': q[6],
                'language': q[7]
            } for q in questions]

            print(f"Formatted {len(questions_list)} questions for response")
            print("\n=== END GET /questions ===\n")
            return jsonify(questions_list)
    except Exception as e:
        print("\n=== ERROR in GET /questions ===\n")
        print(f'Error fetching questions: {str(e)}')
        import traceback
        print(f'Traceback: {traceback.format_exc()}')
        print("\n=== END ERROR ===\n")
        return jsonify({'error': str(e)}), 500

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def safe_generate_response(question):
    """Safely generate AI response with error handling"""
    try:
        return generate_ai_response(question)
    except Exception as e:
        print(f"Error generating AI response: {e}")
        return f"I apologize, but I encountered an error while processing your question. Please try again. Error: {str(e)}"

def safe_generate_audio(text):
    """Safely generate audio with error handling"""
    try:
        return text_to_speech_stream(text)
    except Exception as e:
        print(f"Error generating audio: {e}")
        return None

@app.route('/feedback', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def feedback():
    try:
        data = request.json
        if not data or 'question' not in data:
            return jsonify({'error': 'No question provided'}), 400

        question = data['question']
        language = data.get('language', 'en-US')
        
        # Generate English response first
        response_english = safe_generate_response(question)
        
        # If language is not English, get translated response
        if not language.startswith('en'):
            translation_messages = [
                {"role": "system", "content": f"You are a translator. Translate the following text to {language} while preserving any formatting, LaTeX, or special notation:"},
                {"role": "user", "content": response_english}
            ]
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=translation_messages,
                temperature=0.3
            ).choices[0].message.content
        else:
            response = response_english
        
        # Generate audio stream with error handling
        audio_stream = safe_generate_audio(response)
        
        # If audio generation failed, continue without audio
        audio_base64 = ''
        if audio_stream:
            audio_base64 = base64.b64encode(audio_stream.read()).decode('utf-8')
        
        # Get class info and store new question in a single transaction
        with get_db_connection() as conn:
            c = conn.cursor()
            
            # Get latest class info
            c.execute('SELECT subject, teacher FROM questions ORDER BY id DESC LIMIT 1')
            result = c.fetchone()
            subject = result[0] if result else 'Computer Science'
            teacher = result[1] if result else 'Dr. Smith'
            
            # Store the new question with both responses
            c.execute('''
                INSERT INTO questions 
                (question, response, response_english, subject, teacher, language) 
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (question, response, response_english, subject, teacher, language))
            conn.commit()
        
        return jsonify({
            'audio': audio_base64,
            'response': response,
            'response_english': response_english,
            'subject': subject,
            'teacher': teacher
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

############### single send version#################
# @app.route('/api/send-email', methods=['POST', 'OPTIONS'])
# def send_email():
#     if request.method == 'OPTIONS':
#         return jsonify({'status': 'ok'})
#     try:
#         # Support both JSON and form data
#         if request.is_json:
#             data = request.get_json()
#         else:
#             data = request.form
        
#         recipient = data.get('recipient')
#         subject = data.get('subject')
#         message = data.get('message')

#         if not all([recipient, subject, message]):
#             error_response = jsonify({'error': 'Missing required email parameters'})
#             error_response.status_code = 400
#             return error_response

#         MAILGUN_API_KEY = os.getenv('MAILGUN_API_KEY')
#         MAILGUN_DOMAIN = os.getenv('MAILGUN_DOMAIN')
#         sender_email = os.getenv('SENDER_EMAIL')

#         if not MAILGUN_API_KEY or not MAILGUN_DOMAIN or not sender_email:
#             error_response = jsonify({'error': 'Mailgun configuration is missing'})
#             error_response.status_code = 500
#             return error_response

#         response = requests.post(
#             f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
#             auth=("api", MAILGUN_API_KEY),
#             data={
#                 "from": sender_email,
#                 "to": [recipient],
#                 "subject": subject,
#                 "text": message,
#             },
#         )

#         if response.status_code in [200, 202]:
#             # For form submissions, redirect to your Next.js teacher page.
#             if not request.is_json:
#                 return redirect("http://localhost:3000/teacher")
#             # For JSON requests, return JSON.
#             else:
#                 return jsonify({'message': 'Email sent successfully!'}), 200
#         else:
#             error_response = jsonify({'error': 'Failed to send email.', 'details': response.text})
#             error_response.status_code = response.status_code
#             return error_response

#     except Exception as e:
#         error_response = jsonify({'error': str(e)})
#         error_response.status_code = 500
#         return error_response
#########################################################
# 
# 
@app.route('/api/send-email', methods=['POST', 'OPTIONS'])
def send_email():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'})
    try:
        # Support both JSON and form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
        
        subject = data.get('subject')
        message = data.get('message')

        if not all([subject, message]):
            error_response = jsonify({'error': 'Missing required email parameters'})
            error_response.status_code = 400
            return error_response

        MAILGUN_API_KEY = os.getenv('MAILGUN_API_KEY')
        MAILGUN_DOMAIN = os.getenv('MAILGUN_DOMAIN')
        sender_email = os.getenv('SENDER_EMAIL')

        if not MAILGUN_API_KEY or not MAILGUN_DOMAIN or not sender_email:
            error_response = jsonify({'error': 'Mailgun configuration is missing'})
            error_response.status_code = 500
            return error_response

        recipients = ['laoluoguneye@gmail.com', 'varunmkute@gmail.com','samuelt0207@gmail.com']
        for recipient in recipients:
            response = requests.post(
                f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
                auth=("api", MAILGUN_API_KEY),
                data={
                    "from": sender_email,
                    "to": recipient,
                    "subject": subject,
                    "text": message,
                },
            )
            time.sleep(1);
                
            
        

        if response.status_code in [200, 202]:
            # For form submissions, redirect to your Next.js teacher page.
            if not request.is_json:
                return redirect("http://localhost:3000/teacher")
            # For JSON requests, return JSON.
            else:
                return jsonify({'message': 'Email sent successfully!'}), 200
        else:
            error_response = jsonify({'error': 'Failed to send email.', 'details': response.text})
            error_response.status_code = response.status_code
            return error_response

    except Exception as e:
        error_response = jsonify({'error': str(e)})
        error_response.status_code = 500
        return error_response
    
@app.route('/grade-input-file', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def handle_grading():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'})

    student_temp_path = None
    try:
        print("Starting grading process...")

        if 'file' not in request.files:
            return jsonify({'error': 'No student file uploaded'}), 400

        student_file = request.files['file']
        assignment_name = request.form.get('assignmentName')
        comments = request.form.get('comments')
        rubric_file = request.files.get('rubric')

        print(f"Received files: student={student_file.filename}, rubric={rubric_file.filename if rubric_file else 'None'}")

        if student_file.filename == '':
            return jsonify({'error': 'No student file selected'}), 400

        student_temp_path = os.path.join(UPLOAD_FOLDER, 'student_' + student_file.filename)
        print(f"Saving student file to: {student_temp_path}")

        student_file.save(student_temp_path)

        print("Extracting Q&A pairs...")
        with Image.open(student_temp_path) as img:
            qa_pairs = extract_and_parse(student_temp_path)
        print(f"Extracted {len(qa_pairs)} Q&A pairs")

        rubric_prompt = ""
        if rubric_file and rubric_file.filename != '':
            print("Processing rubric...")
            rubric_temp_path = os.path.join(UPLOAD_FOLDER, 'rubric_' + rubric_file.filename)
            rubric_file.save(rubric_temp_path)
            try:
                rubric_text = extract_text(rubric_temp_path)
                rubric_prompt = parse_rubric(rubric_text)
                os.remove(rubric_temp_path)
                print("Rubric processed successfully")
            except Exception as rubric_error:
                print(f"Warning: Failed to process rubric: {rubric_error}")

        print("Setting up answer key...")
        answer_key_text = """
        1: Sample answer 1
        2: Sample answer 2
        """
        answer_key = parse_answer_key(answer_key_text)

        print("Starting grading...")
        grading_results = grade_with_gemini(qa_pairs, answer_key, rubric_prompt)
        print("Grading completed")

        enhanced_results = {
            'success': True,
            'results': grading_results,
            'metadata': {
                'assignmentName': assignment_name,
                'comments': comments,
                'hasRubric': bool(rubric_prompt),
                'submissionDate': datetime.now().isoformat(),
                'numberOfQuestions': len(qa_pairs)
            }
        }

        return jsonify(enhanced_results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def process_document(file_path, file_id):
    try:
        # Extract text based on file type
        text = ''
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.pdf':
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
        elif file_ext in ['.txt', '.doc', '.docx']:
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
        with get_db_connection() as conn:
            c = conn.cursor()
            for idx, chunk in enumerate(chunks):
                c.execute('''
                    INSERT INTO document_chunks (file_id, chunk_text, chunk_index)
                    VALUES (?, ?, ?)
                ''', (file_id, chunk, idx))
            
            # Create TF-IDF vectorizer and transform chunks
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform(chunks)
            
            # Create vector store directory if it doesn't exist
            vector_store_dir = os.path.join(UPLOAD_FOLDER, 'vector_stores')
            if not os.path.exists(vector_store_dir):
                os.makedirs(vector_store_dir)
            
            # Save vectorizer and matrix
            vector_store_path = os.path.join(vector_store_dir, f'store_{file_id}')
            import joblib
            joblib.dump((vectorizer, tfidf_matrix), vector_store_path)
            
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
    try:
        # Get all vector stores
        with get_db_connection() as conn:
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

@app.route('/document/upload', methods=['POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        description = request.form.get('description', '')
        
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            
            # Ensure upload directory exists
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
                
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            
            try:
                with get_db_connection() as conn:
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
            except sqlite3.Error as e:
                print(f'Database error during file upload: {e}')
                return jsonify({'error': f'Database error: {str(e)}'}), 500
            
        return jsonify({'error': 'File type not allowed'}), 400
        
    except Exception as e:
        print(f'Error in upload_file: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/document/files', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_files():
    try:
        with get_db_connection() as conn:
            c = conn.cursor()
            c.execute('SELECT id, filename, description, upload_date, file_type FROM files ORDER BY upload_date DESC')
            files = c.fetchall()
            
            file_list = [{
                'id': f[0],
                'name': f[1],
                'description': f[2],
                'uploadDate': f[3],
                'fileType': f[4]
            } for f in files]
            return jsonify(file_list)
            
    except Exception as e:
        print(f'Error in get_files: {e}')
        return jsonify({'error': str(e)}), 500

# Chat history table initialization
def init_chat_history_table():
    with DatabaseConnection() as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

# Initialize chat history table
init_chat_history_table()

@app.route('/teacher/chat', methods=['POST'])
def teacher_chat():
    try:
        print("1. Starting teacher_chat endpoint")
        data = request.json
        print("2. Received data:", data)
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400

        print("3. Creating database connection")
        with get_db_connection() as conn:
            print("4. Database connection created")
            c = conn.cursor()
            
            print("5. Getting questions from database")
            try:
                c.execute('SELECT question, response, subject FROM questions ORDER BY timestamp DESC LIMIT 5')
                recent_questions = c.fetchall()
                print("6. Got questions:", len(recent_questions))
            except Exception as e:
                print("Error getting questions:", str(e))
                recent_questions = []
            
            print("7. Getting files from database")
            try:
                c.execute('SELECT filename, description FROM files ORDER BY upload_date DESC LIMIT 5')
                recent_files = c.fetchall()
                print("8. Got files:", len(recent_files))
            except Exception as e:
                print("Error getting files:", str(e))
                recent_files = []
            
            # Build context
            context = "Context from your teaching environment:\n\n"
            
            if recent_questions:
                context += "Recent student questions:\n"
                for q, r, s in recent_questions:
                    context += f"Subject: {s}\nQ: {q}\nA: {r}\n\n"
            
            if recent_files:
                context += "\nRecent teaching materials:\n"
                for name, desc in recent_files:
                    context += f"- {name}: {desc}\n"

            print("9. Getting chat history")
            try:
                c.execute('SELECT role, content FROM chat_history ORDER BY timestamp DESC LIMIT 5')
                chat_history = c.fetchall()
                print("10. Got chat history:", len(chat_history))
            except Exception as e:
                print("Error getting chat history:", str(e))
                chat_history = []
            
            # Prepare messages for GPT-4
            messages = [
                {
                    "role": "system",
                    "content": f"You are an AI teaching assistant helping a teacher. "
                               f"You have access to student questions, teaching materials, and chat history. "
                               f"Use this context to provide informed responses.\n\n{context}"
                }
            ]
            
            # Add chat history to messages
            for role, content in reversed(chat_history):
                messages.append({"role": role, "content": content})
            
            # Add current message
            messages.append({"role": "user", "content": data['message']})

            print("11. Generating AI response")
            try:
                print("12. Messages to send:", messages)
                response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=250
                )
                print("13. Got AI response")
            except Exception as e:
                print(f'OpenAI API error: {str(e)}')
                return jsonify({'error': f'Failed to generate AI response: {str(e)}'}), 500
            
            ai_response = response.choices[0].message.content
            
            print("14. Storing messages in chat history")
            try:
                c.execute('INSERT INTO chat_history (role, content) VALUES (?, ?)',
                          ('user', data['message']))
                c.execute('INSERT INTO chat_history (role, content) VALUES (?, ?)',
                          ('assistant', ai_response))
                print("15. Stored messages successfully")
            except Exception as e:
                print("Error storing chat history:", str(e))
                return jsonify({'error': f'Failed to store chat history: {str(e)}'}), 500
            
            # Get updated chat history
            c.execute('SELECT role, content, timestamp FROM chat_history ORDER BY timestamp ASC')
            full_history = [{
                'role': role,
                'content': content,
                'timestamp': timestamp
            } for role, content, timestamp in c.fetchall()]
            
            return jsonify({
                'response': ai_response,
                'history': full_history
            })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/teacher/chat/history', methods=['GET'])
def get_chat_history():
    try:
        with get_db_connection() as conn:
            c = conn.cursor()
            c.execute('SELECT role, content, timestamp FROM chat_history ORDER BY timestamp ASC')
            history = [{
                'role': role,
                'content': content,
                'timestamp': timestamp
            } for role, content, timestamp in c.fetchall()]
            return jsonify(history)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/teacher/chat/clear', methods=['POST'])
def clear_chat_history():
    try:
        with get_db_connection() as conn:
            c = conn.cursor()
            c.execute('DELETE FROM chat_history')
            return jsonify({'message': 'Chat history cleared successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# @app.route('/teacher/email', methods=['POST'])
# def send_email_blast():
#     try:
#         data = request.json
#         if not data or 'subject' not in data or 'body' not in data:
#             return jsonify({'error': 'Missing subject or body'}), 400

#         # Get all student emails
#         conn = sqlite3.connect('teachai.db')
#         c = conn.cursor()
#         c.execute('SELECT email FROM students')
#         student_emails = [row[0] for row in c.fetchall()]
#         conn.close()

#         if not student_emails:
#             return jsonify({'error': 'No student emails found'}), 400

#         # Send email
#         success = send_email(data['subject'], data['body'], student_emails)
#         if success:
#             return jsonify({'message': 'Email sent successfully'})
#         else:
#             return jsonify({'error': 'Failed to send email'}), 500

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

#     except Exception as e:
#         print("Error in feedback route: {}".format(str(e)))  # Add server-side logging
#         return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)