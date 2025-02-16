import os
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def extract_text_from_image(image_path: str) -> str:
    """
    Extract text from the given image file using Google's Gemini Vision model.
    
    Parameters:
        image_path (str): Path to the image file.
    
    Returns:
        str: Extracted text from the image.
    """
    # Retrieve the API key from the environment variable
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY environment variable is not set.")

    # Configure the Gemini API
    genai.configure(api_key=api_key)

    # Set up the model
    model = genai.GenerativeModel('gemini-1.5-flash')

    try:
        # Load and process the image
        image = Image.open(image_path)
        
        # Generate content from the image
        response = model.generate_content([
            "Extract and return only the text content from this image. Return the raw text without any additional commentary or formatting.",
            image
        ])
        
        # Get the response text
        return response.text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from the image: {e}")

if __name__ == "__main__":
    try:
        text_output = extract_text_from_image("testesttest.jpg")
        print("Extracted Text:")
        print(text_output)
    except Exception as e:
        print(f"Error: {e}")
