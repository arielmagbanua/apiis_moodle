# Welcome to Cloud Functions for Firebase for Python!

from firebase_functions import https_fn
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
import os
import json
from .moodle_api import get_latest_quiz, get_all_quiz_results

# GLOBAL CONFIGURATION
# max_instances=10 limits concurrent execution to prevent unexpected cost spikes.
set_global_options(max_instances=10)

# Initialize the Firebase Admin SDK
initialize_app()

@https_fn.on_request()
def fetch_moodle_quiz_results(req: https_fn.Request) -> https_fn.Response:
    """
    HTTPS Cloud Function to bridge Moodle data into Firebase/Frontend.
    
    Workflow:
    1. Validates environment configuration (Moodle URL/Token).
    2. Parses 'course_id' from the HTTP request query parameters.
    3. Uses get_latest_quiz() to find the most recent quiz in the course.
    4. Aggregates all results for all enrolled users using get_all_quiz_results().
    5. Returns a unified JSON response.
    
    Request:
        GET https://<your-region>-<your-project>.cloudfunctions.net/fetch_moodle_quiz_results?course_id=5
    """
    
    # 1. RETRIEVE SECRETS
    # These should be set via Firebase CLI: firebase functions:secrets:set MOODLE_TOKEN
    # Or in .env.local for local development.
    moodle_url = os.getenv('MOODLE_URL')
    moodle_token = os.getenv('MOODLE_TOKEN')
    
    if not moodle_url or not moodle_token:
        return https_fn.Response(
            "Server Error: Moodle configuration (URL/Token) is missing.", 
            status=500
        )

    # 2. VALIDATE REQUEST PARAMETERS
    course_id = req.args.get('course_id')
    if not course_id:
        return https_fn.Response(
            "Bad Request: Missing 'course_id' query parameter.", 
            status=400
        )

    try:
        # 3. INTERACT WITH MOODLE API
        # Find the latest quiz for the provided course ID
        latest_quiz = get_latest_quiz(moodle_url, moodle_token, course_id)
        
        if not latest_quiz:
            return https_fn.Response(
                json.dumps({"error": f"No quizzes found for Course ID {course_id}."}),
                status=404,
                mimetype="application/json"
            )

        # Retrieve all attempts for ALL enrolled users for that specific quiz
        quiz_id = latest_quiz.get('id')
        results = get_all_quiz_results(moodle_url, moodle_token, course_id, quiz_id)

        # 4. CONSTRUCT SUCCESS RESPONSE
        response_data = {
            "course_id": course_id,
            "quiz_name": latest_quiz.get('name'),
            "quiz_id": quiz_id,
            "attempts_count": len(results),
            "results": results
        }
        
        return https_fn.Response(
            json.dumps(response_data),
            mimetype="application/json",
            status=200
        )

    except Exception as e:
        # Catch-all for unexpected processing errors
        return https_fn.Response(
            f"Internal Server Error: {str(e)}", 
            status=500
        )

@https_fn.on_request()
def on_request_example(req: https_fn.Request) -> https_fn.Response:
    """
    Default placeholder function.
    """
    return https_fn.Response("Hello world!")
