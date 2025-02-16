import os
import json
from typing import Dict, Union, List, Tuple
import PyPDF2
import docx
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GOOGLE_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file."""
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {e}")

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from a Word document."""
    try:
        doc = docx.Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from Word document: {e}")

def extract_text_from_txt(file_path: str) -> str:
    """Extract text from a text file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read().strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from text file: {e}")

def extract_text_from_image(file_path: str) -> str:
    """Extract text from an image using Gemini Vision."""
    try:
        image = Image.open(file_path)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content([
            "Extract all text from this image. Return only the extracted text, no additional commentary.",
            image
        ])
        return response.text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from image: {e}")

def extract_text(file_path: str) -> str:
    """Extract text from various file types."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    ext = os.path.splitext(file_path)[1].lower()
    
    extractors = {
        '.pdf': extract_text_from_pdf,
        '.docx': extract_text_from_docx,
        '.doc': extract_text_from_docx,
        '.txt': extract_text_from_txt,
        '.png': extract_text_from_image,
        '.jpg': extract_text_from_image,
        '.jpeg': extract_text_from_image
    }
    
    extractor = extractors.get(ext)
    if not extractor:
        raise ValueError(f"Unsupported file type: {ext}")
    
    return extractor(file_path)

def parse_answer_key(text: str) -> Dict[str, str]:
    """Parse text into an answer key dictionary."""
    try:
        # First try parsing as JSON
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # If not JSON, try parsing line by line
        answers = {}
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Try different formats: "1: answer", "1. answer", "Q1: answer", etc.
            parts = None
            if ':' in line:
                parts = line.split(':', 1)
            elif '.' in line:
                parts = line.split('.', 1)
                
            if parts and len(parts) == 2:
                question_num = parts[0].strip().lower()
                answer = parts[1].strip()
                
                # Extract the number from various formats (1, Q1, Question 1, etc.)
                num = ''.join(filter(str.isdigit, question_num))
                if num and answer:
                    answers[num] = answer
        
        if not answers:
            raise ValueError("No valid question-answer pairs found in the text")
            
        return answers
        
    except Exception as e:
        raise Exception(f"Failed to parse answer key: {e}")

def parse_rubric(text: str) -> str:
    """Parse rubric text and format it for the grading prompt."""
    if not text.strip():
        return ""
        
    # Remove any obvious headers or titles
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    cleaned_lines = []
    
    for line in lines:
        # Skip lines that look like headers
        if line.lower() in ['rubric', 'grading rubric', 'grading criteria']:
            continue
        if line.isupper() or line.endswith(':'):
            continue
        cleaned_lines.append(line)
    
    return "\n".join(cleaned_lines)
