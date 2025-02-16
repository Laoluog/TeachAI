import sys
import os
from grader import extract_and_parse, grade_with_gemini
from file_utils import extract_text, parse_answer_key, parse_rubric
from typing import Optional, Dict, List, Tuple
import argparse

def setup_argparser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description='Grade student homework using AI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
        Supported file formats:
        - Student homework: PNG, JPG, JPEG
        - Answer key: TXT, PDF, DOCX, PNG, JPG, JPEG
        - Rubric: TXT, PDF, DOCX, PNG, JPG, JPEG
        
        Example usage:
        python main.py --student homework.jpg --answers key.txt --rubric rubric.pdf
        ''')
    
    parser.add_argument('-s', '--student', required=True,
                    help='Path to student homework image')
    
    parser.add_argument('-a', '--answers', required=True,
                    help='Path to answer key file')
    
    parser.add_argument('-r', '--rubric', required=False,
                    help='Path to rubric file (optional)')
    
    parser.add_argument('-o', '--output', required=False,
                    help='Path to save results (optional)')
    
    return parser

def save_results(results: Dict, output_path: str) -> None:
    """Save grading results to a file."""
    try:
        ext = os.path.splitext(output_path)[1].lower()
        if ext == '.txt':
            with open(output_path, 'w') as f:
                f.write("=== Grading Report ===\n\n")
                for result in results['individual_results']:
                    f.write(f"Question {result['question']}:\n")
                    f.write(f"  Student Answer: {result['student_answer']}\n")
                    f.write(f"  Correct Answer: {result['correct_answer']}\n")
                    f.write(f"  Score: {result['score']:.2f}\n")
                    f.write(f"  Explanation: {result['explanation']}\n\n")
                f.write(f"Final Score: {results['average_score'] * 100:.2f}%\n")
        else:
            import json
            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2)
        print(f"\nResults saved to {output_path}")
    except Exception as e:
        print(f"Warning: Failed to save results: {e}")

def main(student_path: str, answer_key_path: str, rubric_path: Optional[str] = None,
         output_path: Optional[str] = None) -> Optional[Dict]:
    try:
        # Validate input files
        if not os.path.exists(student_path):
            raise FileNotFoundError(f"Student homework file not found: {student_path}")
        if not os.path.exists(answer_key_path):
            raise FileNotFoundError(f"Answer key file not found: {answer_key_path}")

        # 1. Extract text from student homework
        print("\nExtracting text from student homework...")
        qa_pairs = extract_and_parse(student_path)
        
        if not qa_pairs:
            raise ValueError("No question-answer pairs were extracted from the homework")
        
        print(f"Found {len(qa_pairs)} questions")
        
        # 2. Extract and parse answer key
        print("\nProcessing answer key...")
        answer_key_text = extract_text(answer_key_path)
        answer_key = parse_answer_key(answer_key_text)
        
        if not answer_key:
            raise ValueError("No valid answers found in the answer key")
        
        # 3. Process rubric if provided
        rubric_prompt = ""
        if rubric_path:
            if not os.path.exists(rubric_path):
                print(f"Warning: Rubric file not found: {rubric_path}")
            else:
                print("\nProcessing rubric...")
                rubric_text = extract_text(rubric_path)
                rubric_prompt = parse_rubric(rubric_text)
        
        # 4. Grade the answers
        print("\nGrading answers...")
        results = grade_with_gemini(qa_pairs, answer_key, rubric_prompt)
        
        # 5. Print results
        print("\n=== Grading Report ===")
        for result in results['individual_results']:
            print(f"\nQuestion {result['question']}:")
            print(f"  Student Answer: {result['student_answer']}")
            print(f"  Correct Answer: {result['correct_answer']}")
            print(f"  Score: {result['score']:.2f}")
            print(f"  Explanation: {result['explanation']}")
        
        print(f"\nFinal Score: {results['average_score'] * 100:.2f}%")
        
        # 6. Save results if output path provided
        if output_path:
            save_results(results, output_path)
        
        return results

    except Exception as e:
        print(f"\nError: {str(e)}")
        return None

if __name__ == "__main__":
    parser = setup_argparser()
    args = parser.parse_args()
    
    results = main(args.student, args.answers, args.rubric, args.output)
    if results is None:
        sys.exit(1)
