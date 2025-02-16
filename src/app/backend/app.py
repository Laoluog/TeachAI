from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
from openai import OpenAI
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
import os
from dotenv import load_dotenv
import base64
from typing import IO
from io import BytesIO
import sqlite3

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

# Configure CORS with specific options
cors = CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Health check endpoint
@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    return jsonify({'status': 'ok'})

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
        
        # Files table
        c.execute('''
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                description TEXT,
                upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_path TEXT NOT NULL
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
    messages = create_teaching_prompt(question)
    response = openai_client.chat.completions.create(
        model="gpt-4o",  # Using gpt-3.5-turbo as gpt-4o doesn't exist
        messages=messages,
        temperature=0.7,
        max_tokens=500
    )
    
    return response.choices[0].message.content
    
def text_to_speech_stream(text):
    if not elevenlabs_api_key:
        print("No ElevenLabs API key found. Audio generation disabled.")
        return None
        
    try:
        print(f"Generating audio for text: {text[:100]}...")
        # Perform the text-to-speech conversion
        response = elevenlabs_client.text_to_speech.convert(
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
        
        # Write each chunk of audio data to the stream
        chunk_count = 0
        for chunk in response:
            if chunk:
                audio_stream.write(chunk)
                chunk_count += 1
        
        # Reset stream position to the beginning
        audio_stream.seek(0)
        print(f"Successfully generated audio: {chunk_count} chunks written")
        return audio_stream
        
    except Exception as e:
        print(f"Error generating audio: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return None

@app.route('/questions', methods=['GET'])
def get_questions():
    try:
        conn = sqlite3.connect('questions.db')
        c = conn.cursor()
        c.execute('SELECT * FROM questions ORDER BY timestamp DESC')
        questions = c.fetchall()
        conn.close()
        
        return jsonify([{
            'id': q[0],
            'question': q[1],
            'response': q[2],
            'timestamp': q[3],
            'subject': q[4],
            'teacher': q[5]
        } for q in questions])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
                model="gpt-3.5-turbo",
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

@app.route('/upload', methods=['POST'])
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
            
            conn = sqlite3.connect('teachai.db')
            c = conn.cursor()
            c.execute('INSERT INTO files (filename, description, file_path) VALUES (?, ?, ?)',
                      (filename, description, file_path))
            conn.commit()
            conn.close()
            
            return jsonify({'message': 'File uploaded successfully'})
            
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

@app.route('/teacher/chat', methods=['POST'])
def teacher_chat():
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400

        # Get context from questions database
        conn = sqlite3.connect('teachai.db')
        c = conn.cursor()
        c.execute('SELECT question, response FROM questions ORDER BY timestamp DESC LIMIT 10')
        recent_questions = c.fetchall()
        conn.close()

        # Create context for the AI
        context = "Recent student questions and answers:\n"
        for q, r in recent_questions:
            context += f"Q: {q}\nA: {r}\n\n"

        # Generate AI response with context
        messages = [
            {
                "role": "system",
                "content": "You are a teaching assistant helping a teacher analyze student questions and performance. "
                           "Use the context provided to give insights about student understanding and common questions."
            },
            {
                "role": "user",
                "content": f"{context}\n\nTeacher's question: {data['message']}"
            }
        ]

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        return jsonify({'response': response.choices[0].message.content})

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