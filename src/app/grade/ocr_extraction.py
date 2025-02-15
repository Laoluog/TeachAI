import openai
import base64
import os
from dotenv import load_dotenv

load_dotenv()
def encode_image_to_base64(image_path: str) -> str:
    """
    Encode an image file to a Base64 string.
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

def extract_text_from_image_with_openai(image_path: str) -> str:
    """
    Extract text from the given image file using OpenAI's Vision capabilities.
    
    Parameters:
        image_path (str): Path to the image file.
    
    Returns:
        str: Extracted text from the image.
    """
    # Retrieve the API key from the environment variable
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set.")

    # Set up the OpenAI API key
    openai.api_key = api_key

    # Encode the image to Base64
    base64_image = encode_image_to_base64(image_path)

    try:
        # Make the API call
        response = openai.chat.completions.create(
            model="gpt-4o",  # Use the Vision-capable model
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract the text from this image:",
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                            },
                        },
                    ],
                }
            ],
            max_tokens=300,
        )

        # Return the extracted text
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from the image: {e}")

if __name__ == "__main__":
    try:
        text_output = extract_text_from_image_with_openai("testesttest.jpg")
        print("Extracted Text:")
        print(text_output)
    except Exception as e:
        print(f"Error: {e}")
