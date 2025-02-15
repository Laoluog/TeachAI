import openai
import os
import json
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
def grade_single_answer(question_number, student_answer, correct_answer, rubric_prompt=""):
    """
    Compares a single student's answer to the correct answer using GPT. 
    Returns a floating-point 'score' between 0.0 and 1.0 and a short explanation.
    """
    system_message = (
        "You are a grading assistant. You grade student responses on a scale from 0 to 1, "
        "where 1 is fully correct, 0 is completely incorrect, and values in between may reflect partial credit."
    )
    
    user_message = f"""
    {rubric_prompt}
    
    Question {question_number}:
    Student's answer: {student_answer}
    Correct answer (from teacher): {correct_answer}

    Please provide two lines of output:
    1) Score: A single numeric value from 0 to 1.
    2) Explanation: A short explanation of why.
    """

    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ],
        temperature=0.0
    )
    
    content = response.choices[0].message.content.strip()
    
    lines = content.split("\n", 1)
    
    score_line = lines[0].strip() if len(lines) > 0 else "Score: 0"
    explanation_line = lines[1].strip() if len(lines) > 1 else "Explanation: None"

    score_value = 0.0
    if "Score:" in score_line:
        try:
            score_str = score_line.split("Score:")[1].strip()
            score_value = float(score_str)
        except:
            score_value = 0.0
    
    return score_value, explanation_line

def grade_all_answers(qa_pairs, answer_key_path, rubric_prompt=""):
    """
    Given parsed question-answer pairs and a path to the answer key,
    compare each student's answer to the teacher's correct answer using GPT,
    and compute an overall score (0-100%).
    """
    with open(answer_key_path, "r") as f:
        answer_key = json.load(f)
    
    grading_results = []
    total_score = 0.0
    count = 0
    
    for question_number, student_answer in qa_pairs:
        if question_number in answer_key:
            correct_answer = answer_key[question_number]
            score, explanation = grade_single_answer(
                question_number,
                student_answer,
                correct_answer,
                rubric_prompt
            )
            grading_results.append({
                "question_number": question_number,
                "student_answer": student_answer,
                "correct_answer": correct_answer,
                "score": score,
                "explanation": explanation
            })
            total_score += score
            count += 1
        else:
            grading_results.append({
                "question_number": question_number,
                "student_answer": student_answer,
                "correct_answer": "N/A",
                "score": 0.0,
                "explanation": "No answer key found for this question."
            })
    
    final_score = (total_score / count) * 100 if count > 0 else 0
    return grading_results, final_score

if __name__ == "__main__":
    sample_qa_pairs = [
        ("1", "2x3=6"),
        ("2", "1+2=3")
    ]
    
    # Ensure you have answer_key.json, e.g.:
    # {
    #   "1": "2 times 3 equals 6",
    #   "2": "1 plus 2 equals 3"
    # }
    
    results, final = grade_all_answers(sample_qa_pairs, "answer_key.json")
    print("Grading results:", results)
    print("Final Score:", final, "%")
