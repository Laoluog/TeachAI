# main.py
import sys
from ocr_extraction import extract_text_from_image_with_openai
from question_parser import parse_questions_answers
from grader import grade_all_answers

def main(image_path, answer_key_path, rubric_prompt=""):
    # 1. Extract text from the image using Tesseract OCR
    ocr_text = extract_text_from_image_with_openai(image_path)
    
    # 2. Parse questions/answers from the extracted text
    qa_pairs = parse_questions_answers(ocr_text)
    
    # 3. Grade answers using OpenAI GPT
    grading_results, final_score = grade_all_answers(qa_pairs, answer_key_path, rubric_prompt)
    
    # Print or store results
    print("=== Grading Report ===")
    for result in grading_results:
        print(f"Question {result['question_number']}:")
        print(f"  Student Answer: {result['student_answer']}")
        print(f"  Correct Answer: {result['correct_answer']}")
        print(f"  Score: {result['score']}")
        print(f"  Explanation: {result['explanation']}\n")
        
    print(f"Final Score: {final_score:.2f}%")
    
if __name__ == "__main__":
    # Usage: python3 main.py test1.png answer_key.json [optional_rubric_prompt]
    if len(sys.argv) < 3:
        print("Usage: python main.py <image_path> <answer_key.json> [optional_rubric_prompt]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    answer_key_path = sys.argv[2]
    rubric_prompt = sys.argv[3] if len(sys.argv) > 3 else ""
    
    main(image_path, answer_key_path, rubric_prompt)
