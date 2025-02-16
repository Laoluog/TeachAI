from flask import Flask, request, jsonify, Response
from flask_cors import CORS, cross_origin
from openai import OpenAI
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
import os
from dotenv import load_dotenv
import base64
from io import BytesIO
import sqlite3
from document_processor import document_bp

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv('OPENAI'))

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

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
app.config['CORS_HEADERS'] = 'Content-Type'
cors = CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"],
        "expose_headers": ["Content-Type", "Accept"],
        "supports_credentials": True,
        "send_wildcard": False
    }
})

# Register blueprints
app.register_blueprint(document_bp)

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

# Configure email settings
EMAIL_SERVER = os.getenv('EMAIL_SERVER', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USERNAME = os.getenv('EMAIL_USERNAME')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')

# Configure file upload settings
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Configure API keys
load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI')
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
            "content": f"Context from relevant documents:\n{context_text}"
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
        with DatabaseConnection() as conn:
            c = conn.cursor()
            c.execute('SELECT * FROM questions ORDER BY timestamp DESC')
            questions = c.fetchall()
            
            return jsonify([{
                'id': q[0],
                'question': q[1],
                'response': q[2],
                'response_english': q[3],
                'timestamp': q[4],
                'subject': q[5],
                'teacher': q[6],
                'language': q[7]
            } for q in questions])
    except Exception as e:
        print(f'Error fetching questions: {str(e)}')
        return jsonify({'error': str(e)}), 500



def send_email(subject, body, recipients):
    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg['From'] = EMAIL_USERNAME
    msg['To'] = ', '.join(recipients)
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(EMAIL_SERVER, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

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

@app.route('/feedback', methods=['POST'])
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
        with DatabaseConnection() as conn:
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
        
        return jsonify({
            'audio': audio_base64,
            'response': response,
            'response_english': response_english,
            'subject': subject,
            'teacher': teacher
        })

    except Exception as e:
        print(f"Error in feedback route: {e}")
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
        with DatabaseConnection() as conn:
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

@app.route('/upload', methods=['POST', 'OPTIONS'])
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

@app.route('/files', methods=['GET'])
def get_files():
    try:
        conn = sqlite3.connect('teachai.db')
        c = conn.cursor()
        c.execute('SELECT id, filename, description, upload_date FROM files ORDER BY upload_date DESC')
        files = c.fetchall()
        conn.close()
        
        return jsonify([{
            'id': f[0],
            'name': f[1],
            'description': f[2],
            'uploadDate': f[3]
        } for f in files])
        
    except Exception as e:
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
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400

        with DatabaseConnection() as conn:
            c = conn.cursor()
            
            # Get context from questions database
            c.execute('SELECT question, response, subject FROM questions ORDER BY timestamp DESC LIMIT 5')
            recent_questions = c.fetchall()
            
            # Get context from files
            c.execute('SELECT filename, description FROM files ORDER BY upload_date DESC LIMIT 5')
            recent_files = c.fetchall()
            
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

            # Get recent chat history for context (limit to last 5 messages to avoid token limits)
            c.execute('SELECT role, content FROM chat_history ORDER BY timestamp DESC LIMIT 5')
            chat_history = c.fetchall()
            
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

            # Generate AI response with error handling
            try:
                response = openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=250
                )
            except Exception as e:
                print(f'OpenAI API error: {str(e)}')
                return jsonify({'error': 'Failed to generate AI response'}), 500
            
            ai_response = response.choices[0].message.content
            
            # Store messages in chat history
            c.execute('INSERT INTO chat_history (role, content) VALUES (?, ?)',
                      ('user', data['message']))
            c.execute('INSERT INTO chat_history (role, content) VALUES (?, ?)',
                      ('assistant', ai_response))
            
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
        with DatabaseConnection() as conn:
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
        with DatabaseConnection() as conn:
            c = conn.cursor()
            c.execute('DELETE FROM chat_history')
            return jsonify({'message': 'Chat history cleared successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/teacher/email', methods=['POST'])
def send_email_blast():
    try:
        data = request.json
        if not data or 'subject' not in data or 'body' not in data:
            return jsonify({'error': 'Missing subject or body'}), 400

        # Get all student emails
        conn = sqlite3.connect('teachai.db')
        c = conn.cursor()
        c.execute('SELECT email FROM students')
        student_emails = [row[0] for row in c.fetchall()]
        conn.close()

        if not student_emails:
            return jsonify({'error': 'No student emails found'}), 400

        # Send email
        success = send_email(data['subject'], data['body'], student_emails)
        if success:
            return jsonify({'message': 'Email sent successfully'})
        else:
            return jsonify({'error': 'Failed to send email'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    except Exception as e:
        print("Error in feedback route: {}".format(str(e)))  # Add server-side logging
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)