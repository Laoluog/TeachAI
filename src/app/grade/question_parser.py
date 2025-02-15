# question_parser.py
import re

def parse_questions_answers(ocr_text: str):
    """
    Parse the OCR-extracted text into a list of (question_number, answer_text).
    This is naive and depends on test formatting.
    
    Example approach: each question starts with 'Q1.' or '1.' or '1)'
    """
    # Regex to match question headings like "Q1." or "1." or "1)" capturing the number
    pattern = r"(?:Q?(\d+)[\.\)])"
    
    # Split text by question patterns
    chunks = re.split(pattern, ocr_text)
    
    # Example result from re.split with a capturing group:
    # [text_before_Q1, '1', text_of_question_1, '2', text_of_question_2, ...]
    # We want to pair question_number -> text_of_that_question
    
    parsed = []
    i = 1
    while i < len(chunks):
        question_number = chunks[i].strip()
        if i + 1 < len(chunks):
            answer_text = chunks[i + 1].strip()
        else:
            answer_text = ""
        parsed.append((question_number, answer_text))
        i += 2
    
    return parsed

if __name__ == "__main__":
    # Example usage
    sample_text = """
    Name: John Doe
    Q1. This is the student's answer for question 1.
    Q2. This is the student's answer for question 2.
    Some other text...
    """
    qa_pairs = parse_questions_answers(sample_text)
    print(qa_pairs)
