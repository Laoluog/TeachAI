from flask import Flask, request, jsonify, Response, send_file, redirect
import requests
from flask_cors import CORS
from openai import OpenAI
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
import os
from dotenv import load_dotenv
import base64
from typing import IO
from io import BytesIO
import time
import sqlite3
from grade.grader import extract_and_parse, grade_with_gemini
from grade.file_utils import extract_text, parse_answer_key, parse_rubric
from datetime import datetime

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
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "send_wildcard": False,
        "max_age": 3600
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

@app.route('/grade-input-file', methods=['POST'])
def handle_grading():
    student_temp_path = None
    try:
        print("Starting grading process...")  # Debug log
        
        if 'file' not in request.files:
            return jsonify({'error': 'No student file uploaded'}), 400
            
        student_file = request.files['file']
        assignment_name = request.form.get('assignmentName')
        comments = request.form.get('comments')
        rubric_file = request.files.get('rubric')
        
        print(f"Received files: student={student_file.filename}, rubric={rubric_file.filename if rubric_file else 'None'}")  # Debug log
        
        if student_file.filename == '':
            return jsonify({'error': 'No student file selected'}), 400
            
        # Create temporary files
        student_temp_path = os.path.join(UPLOAD_FOLDER, 'student_' + student_file.filename)
        print(f"Saving student file to: {student_temp_path}")  # Debug log
        student_file.save(student_temp_path)
        
        try:
            print("Extracting Q&A pairs...")  # Debug log
            qa_pairs = extract_and_parse(student_temp_path)
            print(f"Extracted {len(qa_pairs)} Q&A pairs")  # Debug log
            
            rubric_prompt = ""
            if rubric_file and rubric_file.filename != '':
                print("Processing rubric...")  # Debug log
                rubric_temp_path = os.path.join(UPLOAD_FOLDER, 'rubric_' + rubric_file.filename)
                rubric_file.save(rubric_temp_path)
                try:
                    rubric_text = extract_text(rubric_temp_path)
                    rubric_prompt = parse_rubric(rubric_text)
                    os.remove(rubric_temp_path)
                    print("Rubric processed successfully")  # Debug log
                except Exception as rubric_error:
                    print(f"Warning: Failed to process rubric: {rubric_error}")

            print("Setting up answer key...")  # Debug log
            answer_key_text = """
            1: Sample answer 1
            2: Sample answer 2
            """
            answer_key = parse_answer_key(answer_key_text)
            
            print("Starting grading...")  # Debug log
            grading_results = grade_with_gemini(qa_pairs, answer_key, rubric_prompt)
            print("Grading completed")  # Debug log
            
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
            print(enhanced_results)
            return jsonify(enhanced_results)
            
        finally:
            if student_temp_path and os.path.exists(student_temp_path):
                print(f"Cleaning up: removing {student_temp_path}")  # Debug log
                os.remove(student_temp_path)
            
    except Exception as e:
        import traceback
        print(f"Error in handle_grading: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")  # Detailed error trace
        # Clean up if error occurred
        if student_temp_path and os.path.exists(student_temp_path):
            os.remove(student_temp_path)
        return jsonify({
            'error': str(e),
            'errorType': type(e).__name__,
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)