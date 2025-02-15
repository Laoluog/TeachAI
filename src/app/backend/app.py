from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import google.generativeai as genai
import elevenlabs
import os
from dotenv import load_dotenv
import base64

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure API keys
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

# Configure ElevenLabs
elevenlabs.set_api_key(ELEVENLABS_API_KEY)

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

def generate_video_response(text):
    # Generate audio using ElevenLabs
    audio = elevenlabs.generate(
        text=text,
        voice="Bella",  # Using Bella voice as per documentation
        model="eleven_monolingual_v1"
    )
    # Convert audio data to base64 for sending to frontend
    audio_base64 = base64.b64encode(audio).decode('utf-8')
    return audio_base64

@app.route('/api/feedback', methods=['POST'])
def feedback():
    try:
        data = request.json
        question = data.get('question')
        
        if not question:
            return jsonify({'error': 'No question provided'}), 400

        # Generate AI response using Gemini
        ai_response = generate_ai_response(question)
        
        # Generate video response using ElevenLabs
        video_response = generate_video_response(ai_response)
        
        return jsonify({
            'response': ai_response,
            'video': video_response
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
