import requests
import os

AGENT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json',
}

"""
Moodle API Utility Module
This module provides functions to interact with Moodle's Web Services (REST API).
"""

def get_latest_quiz(moodle_url, token, course_id):
    """
    Fetches the latest quiz for a specific course.

    moodle_url: Base URL of the Moodle instance (e.g., https://yourmoodle.com)
    token: Web service token for authentication
    course_id: ID of the course to fetch quizzes from
    """
    endpoint = f"{moodle_url}/webservice/rest/server.php"
    
    params = {
        'wstoken': token,
        'wsfunction': 'mod_quiz_get_quizzes_by_courses',
        'moodlewsrestformat': 'json',
        'courseids[0]': course_id
    }
    
    try:
        with requests.Session() as session:
            response = session.get(endpoint, params=params, headers=AGENT_HEADERS, timeout=10)
            response.raise_for_status()
            data = response.json()
        
        if 'quizzes' in data and data['quizzes']:
            sorted_quizzes = sorted(data['quizzes'], key=lambda x: x.get('id', 0), reverse=True)
            return sorted_quizzes[0]
        return None
    except Exception as e:
        print(f"Error in get_latest_quiz: {e}")
        return None

def get_enrolled_users(moodle_url, token, course_id, groups = ['mon-grp', 'tue-grp']):
    """
    Retrieves only STUDENTS enrolled in a specific course.
    
    Moodle's core_enrol_get_enrolled_users returns all roles (teachers, managers, etc.).
    We filter the list to include only those with the 'student' role.

    moodle_url: Base URL of the Moodle instance (e.g., https://yourmoodle.com)
    token: Web service token for authentication
    course_id: ID of the course to fetch enrolled users from
    groups: Optional list of group names to filter students by (default: ['mon-grp', 'tue-grp'])
    """
    endpoint = f"{moodle_url}/webservice/rest/server.php"
    params = {
        'wstoken': token,
        'wsfunction': 'core_enrol_get_enrolled_users',
        'moodlewsrestformat': 'json',
        'courseid': course_id
    }
    
    try:
        with requests.Session() as session:
            response = session.get(endpoint, params=params, timeout=10, headers=AGENT_HEADERS)
            response.raise_for_status()
            all_users = response.json()
            
            # Filter for students only
            students = []
            for user in all_users:
                roles = user.get('roles', [])
                if any(role.get('shortname') == 'student' for role in roles):
                    students.append(user)
            
            # segregate students by groups
            grouped_students = {group: [] for group in groups}
            for student in students:
                user_groups = student.get('groups', [])
                for group in user_groups:
                    group_name = group.get('name')
                    if group_name in groups:
                        grouped_students[group_name].append(student)
                        break
            return grouped_students    
    except Exception as e:
        print(f"Error fetching enrolled users: {e}")
        return []

def get_user_quiz_attempts(moodle_url, token, quiz_id, user_id):
    """
    Fetches quiz attempts for a SPECIFIC user.
    """
    endpoint = f"{moodle_url}/webservice/rest/server.php"
    params = {
        'wstoken': token,
        'wsfunction': 'mod_quiz_get_user_attempts',
        'moodlewsrestformat': 'json',
        'quizid': quiz_id,
        'userid': user_id,
        'includefinished': 1
    }
    
    try:
        with requests.Session() as session:
            response = session.get(endpoint, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            return data.get('attempts', [])
    except Exception as e:
        return []

def get_all_quiz_results(moodle_url, token, course_id, quiz_id):
    """
    Aggregates results for ALL STUDENTS in a quiz.
    
    Workflow:
    1. Get all students enrolled in the course.
    2. Loop through students to find their quiz attempts.
    """
    all_results = []
    # get_enrolled_users now returns only students
    students = get_enrolled_users(moodle_url, token, course_id)
    
    for student in students:
        user_id = student.get('id')
        user_fullname = student.get('fullname')
        
        attempts = get_user_quiz_attempts(moodle_url, token, quiz_id, user_id)
        
        for attempt in attempts:
            # Append student info to the attempt data for clarity
            attempt['user_fullname'] = user_fullname
            all_results.append(attempt)
            
    return all_results

if __name__ == "__main__":
    MOODLE_URL = os.getenv('MOODLE_URL')
    MOODLE_TOKEN = os.getenv('MOODLE_TOKEN')
    COURSE_ID = os.getenv('COURSE_ID')
    
    latest_quiz = get_latest_quiz(MOODLE_URL, MOODLE_TOKEN, COURSE_ID)
    students = get_enrolled_users(MOODLE_URL, MOODLE_TOKEN, COURSE_ID)
    print(students)
    # if latest_quiz:
    #     quiz_id = latest_quiz.get('id')
    #     print(f"Fetching all results for: {latest_quiz.get('name')}")
    #     results = get_all_quiz_results(MOODLE_URL, MOODLE_TOKEN, COURSE_ID, quiz_id)
    #     print(f"Total attempts found: {len(results)}")
