from flask import Flask, request, jsonify, Response, send_file, redirect
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

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('teachai.db')
    c = conn.cursor()
    
    # Questions table
    c.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            response TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            subject TEXT DEFAULT 'Computer Science',
            teacher TEXT DEFAULT 'Dr. Smith'
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
    
    conn.commit()
    conn.close()

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
        "Don't be too verbose, and make sure to return only plain text."
        "If needed, make sure to put out content in LaTeX format or use the conventions specific to that genre of question."
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
    
    # Store question and response in database
    conn = sqlite3.connect('questions.db')
    c = conn.cursor()
    c.execute('INSERT INTO questions (question, response) VALUES (?, ?)',
              (question, response.choices[0].message.content))
    conn.commit()
    conn.close()
    
    return response.choices[0].message.content

def text_to_speech_stream(text):
    try:
        # Perform the text-to-speech conversion
        response = elevenlabs_client.text_to_speech.convert(
            voice_id="XrExE9yKIg1WjnnlVkGX",  # Matilda voice
            output_format="mp3_22050_32",
            text=text,
            model_id="eleven_multilingual_v2",
            voice_settings=VoiceSettings(
                stability=0.0,
                similarity_boost=1.0,
                style=0.0,
                use_speaker_boost=True,
            ),
        )
        # Create a BytesIO object to hold the audio data in memory
        audio_stream = BytesIO()
        # Write each chunk of audio data to the stream
        for chunk in response:
            if chunk:
                audio_stream.write(chunk)
        # Reset stream position to the beginning
        audio_stream.seek(0)
        return audio_stream
    except Exception as e:
        print("Error generating audio: {}".format(str(e)))
        raise

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


@app.route('/feedback', methods=['POST'])
def feedback():
    try:
        data = request.json
        if not data or 'question' not in data:
            return jsonify({'error': 'No question provided'}), 400

        question = data['question']
        
        # Generate AI response
        ai_response = generate_ai_response(question)
        
        # Generate audio stream
        audio_stream = text_to_speech_stream(ai_response)
        
        # Get class info
        conn = sqlite3.connect('teachai.db')
        c = conn.cursor()
        c.execute('SELECT subject, teacher FROM questions ORDER BY id DESC LIMIT 1')
        subject, teacher = c.fetchone()
        conn.close()
        
        return jsonify({
            'audio': base64.b64encode(audio_stream.read()).decode('utf-8'),
            'response': ai_response,
            'subject': subject,
            'teacher': teacher
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


#TODO: had send_email(subkject, body, recipients) just go through and override everywhere he did that
@app.route('/api/send-email', methods=['POST'])
def send_email():
    try:
        # Support both JSON and form data
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
        
        recipient = data.get('recipient')
        subject = data.get('subject')
        message = data.get('message')

        if not all([recipient, subject, message]):
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

        response = requests.post(
            f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
            auth=("api", MAILGUN_API_KEY),
            data={
                "from": sender_email,
                "to": [recipient],
                "subject": subject,
                "text": message,
            },
        )

        if response.status_code in [200, 202]:
            # For form submissions, redirect to your Next.js teacher page.
            if not request.is_json:
                return redirect("http://localhost:3000/teacherPage")
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
    
if __name__ == '__main__':
    app.run(debug=True, port=5000)