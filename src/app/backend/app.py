from flask import Flask, request, jsonify, Response, redirect
from flask_cors import CORS
import google.generativeai as genai
import elevenlabs
import os
from dotenv import load_dotenv
import base64
import requests  # Import requests to call Mailgun API

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure API keys for Gemini and `Eleven`Labs
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
# ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

# # Configure ElevenLabs
# elevenlabs.set_api_key(ELEVENLABS_API_KEY)

def create_teaching_prompt(question):
    return f"""As an AI teaching assistant, provide a clear, concise, and helpful response to the following question. 
    Focus on explaining concepts in a way that's easy to understand while maintaining academic accuracy. 
    If the question is unclear, ask for clarification. If the question involves complex topics, break them down into simpler parts.
    
    Student's Question: {question}
    """

def generate_ai_response(question):
    prompt = create_teaching_prompt(question)
    response = model.generate_content(prompt)
    return response.text

# def generate_video_response(text):
#     # Generate audio using ElevenLabs
#     audio = elevenlabs.generate(
#         text=text,
#         voice="Bella",  # Using Bella voice as per documentation
#         model="eleven_monolingual_v1"
#     )
#     # Convert audio data to base64 for sending to frontend
#     audio_base64 = base64.b64encode(audio).decode('utf-8')
#     return audio_base64

# @app.route('/api/feedback', methods=['POST'])
# def feedback():
#     try:
#         data = request.json
#         question = data.get('question')
        
#         if not question:
#             return jsonify({'error    ': 'No question provided'}), 400

#         # Generate AI response using Gemini
#         ai_response = generate_ai_response(question)
        
#         # Generate video response using ElevenLabs
#         video_response = generate_video_response(ai_response)
        
#         return jsonify({
#             'response': ai_response,
#             'video': video_response
#         })

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500


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
