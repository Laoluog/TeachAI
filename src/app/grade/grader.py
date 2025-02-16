import os
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure the Gemini API
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY environment variable is not set.")
genai.configure(api_key=api_key)

def extract_and_parse(image_path):
    """
    Use Gemini Vision to extract text from an image and parse it into Q&A pairs.
    Returns a list of tuples in the format [(question_number, answer), ...]
    """
    try:
        # Load the image
        image = Image.open(image_path)
        
        # Set up the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate content from the image with specific instructions
        response = model.generate_content([
            """Please analyze this image and extract all text.
            Format your response as a list of question-answer pairs.
            For each line, start with the question number followed by a colon and then the answer.
            Example format:
            1: The answer to question 1
            2: The answer to question 2
            Only include actual answers, no explanations or additional text.""",
            image
        ])
        
        # Parse the response into question-answer pairs
        qa_pairs = []
        lines = response.text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Try to parse lines in format "1: answer" or "1. answer" or similar
            try:
                # Split on first occurrence of : or .
                parts = line.split(':', 1) if ':' in line else line.split('.', 1)
                if len(parts) == 2:
                    question_num = parts[0].strip()
                    answer = parts[1].strip()
                    
                    # Convert question number to string, removing any non-digit characters
                    question_num = ''.join(filter(str.isdigit, question_num))
                    
                    if question_num and answer:
                        qa_pairs.append((question_num, answer))
            except Exception as parsing_error:
                print(f"Warning: Could not parse line: {line}. Error: {parsing_error}")
                continue
        
        if not qa_pairs:
            raise Exception("No valid question-answer pairs found in the extracted text")
            
        return qa_pairs

    except Exception as e:
        raise Exception(f"Failed to extract and parse text: {e}")

def grade_with_gemini(qa_pairs, answer_key, rubric_prompt=""):
    """
    Grade student answers using Gemini, considering alternative formats and synonyms.
    qa_pairs: list of tuples (question_number, student_answer)
    answer_key: dict mapping question numbers to correct answers
    rubric_prompt: optional additional grading instructions
    """
    try:
        if not qa_pairs:
            raise Exception("No question-answer pairs provided")
            
        # Set up the model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        grading_results = []
        total_score = 0.0
        count = 0

        for question_number, student_answer in qa_pairs:
            # Convert question_number to string if it isn't already
            question_number = str(question_number)
            
            # Get correct answer, defaulting to "Not provided" if not found
            correct_answer = answer_key.get(question_number, "Not provided")
            
            prompt = f"""You are a grading assistant. Grade this answer:            
            Question {question_number}:
            Student answer: {student_answer}
            Correct answer: {correct_answer}

            {rubric_prompt if rubric_prompt else ''}

            Rules:
            - Consider alternative formats (e.g., '2 x 4', '2*4', '2 times 4' are equivalent)
            - Grade on a scale from 0 to 1
            - Be lenient with formatting but strict with correctness
            
            Respond in exactly this format:
            Score: [number between 0-1]
            Explanation: [one brief sentence]
            """

            try:
                response = model.generate_content(prompt)

                # Get the response text and split into lines
                content = response.text.strip()
                lines = content.split("\n", 1)

                # Parse the score from the first line
                score_line = lines[0].strip() if len(lines) > 0 else "Score: 0"
                explanation_line = lines[1].strip() if len(lines) > 1 else "No explanation provided"

                # Extract score value
                score_value = 0.0
                if "Score:" in score_line:
                    try:
                        score_str = score_line.split("Score:")[1].strip()
                        score_value = float(score_str)
                        score_value = max(0.0, min(1.0, score_value))  # Ensure score is between 0 and 1
                    except:
                        score_value = 0.0

                # Add to results
                result = {
                    "question": question_number,
                    "student_answer": student_answer,
                    "correct_answer": correct_answer,
                    "score": score_value,
                    "explanation": explanation_line
                }
                grading_results.append(result)
                
                total_score += score_value
                count += 1

            except Exception as e:
                # If grading this question fails, add it with a score of 0
                result = {
                    "question": question_number,
                    "student_answer": student_answer,
                    "correct_answer": correct_answer,
                    "score": 0.0,
                    "explanation": f"Error grading this answer: {str(e)}"
                }
                grading_results.append(result)
                count += 1

        # Calculate average score
        average_score = total_score / count if count > 0 else 0.0
        
        return {
            "individual_results": grading_results,
            "average_score": average_score
        }
        
    except Exception as e:
        raise Exception(f"Failed to grade answers: {e}")


if __name__ == "__main__":
    # Test the grading function
    sample_qa_pairs = [("1", "2x3=6"), ("2", "1+2=3")]
    sample_answer_key = {
        "1": "2 times 3 equals 6",
        "2": "1 plus 2 equals 3"
    }
    
    try:
        results = grade_with_gemini(sample_qa_pairs, sample_answer_key)
        print("Grading Results:")
        for result in results["individual_results"]:
            print(f"\nQuestion {result['question']}:")
            print(f"Student Answer: {result['student_answer']}")
            print(f"Correct Answer: {result['correct_answer']}")
            print(f"Score: {result['score']}")
            print(f"Explanation: {result['explanation']}")
        print(f"\nAverage Score: {results['average_score'] * 100:.2f}%")
    except Exception as e:
        print(f"Error: {e}")

