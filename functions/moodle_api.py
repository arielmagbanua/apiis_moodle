import token

import requests
import os


class MoodleCourse:
    """
    MoodleCourse class to interact with Moodle's Web Services (REST API).
    """
    # headers to mimic browser requests
    AGENT_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json',
    }

    def __init__(self, url: str, token: str, course_id: int):
        """
        Initializes the MoodleCourse object with the provided Moodle URL, token, and course ID.
        """
        self.url = url
        self.token = token
        self.course_id = course_id

    def get_latest_quiz(self):
        """
        Fetches the latest quiz for a specific course.
        """

        endpoint = f"{self.url}/webservice/rest/server.php"

        params = {
            'wstoken': self.token,
            'wsfunction': 'mod_quiz_get_quizzes_by_courses',
            'moodlewsrestformat': 'json',
            'courseids[0]': self.course_id
        }

        try:
            with requests.Session() as session:
                response = session.get(endpoint, params=params, headers=self.AGENT_HEADERS, timeout=10)
                response.raise_for_status()
                data = response.json()
        
            if 'quizzes' in data and data['quizzes']:
                sorted_quizzes = sorted(data['quizzes'], key=lambda x: x.get('id', 0), reverse=True)
                return sorted_quizzes[0]
            
            return None
        except Exception as e:
            print(f"Error in get_latest_quiz: {e}")
            return None
    
    def get_groups(self):
        """
        Retrieves all groups for the course.
        """
        endpoint = f"{self.url}/webservice/rest/server.php"
        params = {
            'wstoken': self.token,
            'wsfunction': 'core_group_get_course_groups',
            'moodlewsrestformat': 'json',
            'courseid': self.course_id
        }

        try:
            with requests.Session() as session:
                response = session.get(endpoint, params=params, timeout=10, headers=self.AGENT_HEADERS)
                response.raise_for_status()
                data = response.json()
                
                # map and get the group names but exclude the test groups
                return [group.get('name') for group in data if not group.get('name', '').startswith('test')]
        except Exception as e:
            print(f"Error fetching groups: {e}")
            return []

    def get_enrolled_users(self, groups):
        """
        Retrieves only STUDENTS enrolled in a specific course.
    
        Moodle's core_enrol_get_enrolled_users returns all roles (teachers, managers, etc.).
        We filter the list to include only those with the 'student' role.
        """

        endpoint = f"{self.url}/webservice/rest/server.php"
        params = {
            'wstoken': self.token,
            'wsfunction': 'core_enrol_get_enrolled_users',
            'moodlewsrestformat': 'json',
            'courseid': self.course_id
        }

        try:
            with requests.Session() as session:
                response = session.get(endpoint, params=params, timeout=10, headers=self.AGENT_HEADERS)
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
    
    def get_user_quiz_attempts(self, quiz_id, user_id):
        """
        Fetches quiz attempts for a SPECIFIC user.
        """
        endpoint = f"{self.url}/webservice/rest/server.php"
        params = {
            'wstoken': self.token,
            'wsfunction': 'mod_quiz_get_user_attempts',
            'moodlewsrestformat': 'json',
            'quizid': quiz_id,
            'userid': user_id,
            'includefinished': 1
        }

        try:
            with requests.Session() as session:
                response = session.get(endpoint, params=params, timeout=10, headers=self.AGENT_HEADERS)
                response.raise_for_status()
                data = response.json()
                return data.get('attempts', [])
        except Exception as e:
            print(f"Error fetching quiz attempts for user {user_id}: {e}")
            return []

    def get_latest_quiz_results(self, quiz_id):
        """
        Aggregates results for ALL STUDENTS in a quiz.
        
        Workflow:
        1. Get the latest quiz for the course.
        2. Get all students enrolled in the course.
        3. Loop through students to find their quiz attempts.
        """
        results = []

        # if quiz_id is not provided, get the latest quiz
        if quiz_id is None:
            latest_quiz = self.get_latest_quiz()
            quiz_id = latest_quiz.get('id')

        # get_enrolled_users now returns only students
        groups = self.get_groups()
        students = self.get_enrolled_users(groups)

        for group, students_in_group in students.items():
            for student in students_in_group:
                user_id = student.get('id')
                user_fullname = student.get('fullname')

                attempts = self.get_user_quiz_attempts(quiz_id, user_id)
                
                for attempt in attempts:
                    # Append student info to the attempt data for clarity
                    attempt['user_fullname'] = user_fullname
                    attempt['group'] = group
                    results.append(attempt)

        return results

if __name__ == "__main__":
    MOODLE_URL = os.getenv('MOODLE_URL')
    MOODLE_TOKEN = os.getenv('MOODLE_TOKEN')
    COURSE_ID = os.getenv('COURSE_ID')

    moodle_course = MoodleCourse(MOODLE_URL, MOODLE_TOKEN, COURSE_ID)

    results = moodle_course.get_latest_quiz_results()
    # if latest_quiz:
    #     quiz_id = latest_quiz.get('id')
    #     print(f"Fetching all results for: {latest_quiz.get('name')}")
    #     results = get_all_quiz_results(MOODLE_URL, MOODLE_TOKEN, COURSE_ID, quiz_id)
    #     print(f"Total attempts found: {len(results)}")
