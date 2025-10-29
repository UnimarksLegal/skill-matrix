"""
Unimarks Skills & Training Matrix - Flask Backend
================================================
Flask API server with MySQL database integration.

Endpoints:
- GET    /api/departments          - Fetch all departments with skills and employees
- POST   /api/departments          - Create new department
- PUT    /api/departments/<id>     - Update department details
- DELETE /api/departments/<id>     - Delete department and its employees

- POST   /api/employees            - Add employee to department
- PUT    /api/employees/<id>       - Update employee name/role
- DELETE /api/employees/<id>       - Remove employee

- PUT    /api/skills/level         - Update skill level for an employee
- POST   /api/skills               - Add new skill to department
- DELETE /api/skills               - Remove skill from department
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
from functools import wraps
from datetime import datetime, timedelta ,timezone
import uuid
import jwt
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# ===================== CONFIGURATION =====================

# JWT Secret Key - MUST be set in environment variables
JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'change-this-to-a-random-secret-key-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXP_DELTA_HOURS = 24  # Token expires after 24 hours

# Admin users from environment variable
# Format: ADMIN_USERS=admin1:pass1,admin2:pass2,manager:super123
ADMIN_USERS = {}
admin_users_str = os.getenv('ADMIN_USERS', 'admin:admin123')
for user_pair in admin_users_str.split(','):
    if ':' in user_pair:
        username, password = user_pair.strip().split(':', 1)
        ADMIN_USERS[username] = password
# ===================== DATABASE CONNECTION =====================

def get_db_connection():
    """Create and return MySQL database connection"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '3306'),
            database=os.getenv('DB_NAME', 'unimarks_skills'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', '')
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# ===================== HELPER FUNCTIONS =====================

def generate_uuid():
    """Generate unique ID for records"""
    return str(uuid.uuid4())

# ===================== AUTHENTICATION =====================

def create_jwt_token(username):
    """Generate JWT token for authenticated user"""
    payload = {
        'username': username,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_DELTA_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['username']
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token

def require_auth(f):
    """Decorator to require authentication for API endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        # Extract token from "Bearer <token>" format
        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        username = verify_jwt_token(token)
        if not username:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Attach username to request for use in endpoint
        request.username = username
        return f(*args, **kwargs)
    
    return decorated_function

def format_department_response(dept_id, connection):
    """
    Fetch complete department data with skills and employees
    Returns department object matching frontend structure
    """
    cursor = connection.cursor(dictionary=True)
    
    # Get department info
    cursor.execute("""
        SELECT id, name, target_level, created_at, updated_at
        FROM departments WHERE id = %s
    """, (dept_id,))
    dept = cursor.fetchone()
    
    if not dept:
        return None
    
    # Get skills for this department
    cursor.execute("""
        SELECT id, name, display_order
        FROM skills
        WHERE department_id = %s
        ORDER BY display_order ASC
    """, (dept_id,))
    skills = [skill['name'] for skill in cursor.fetchall()]
    
    # Get employees with their skill levels
    cursor.execute("""
        SELECT id, name, role
        FROM employees
        WHERE department_id = %s
    """, (dept_id,))
    employees_raw = cursor.fetchall()
    
    employees = []
    for emp in employees_raw:
        # Get skill levels for this employee
        cursor.execute("""
            SELECT s.name as skill_name, sl.level_value
            FROM skill_levels sl
            JOIN skills s ON sl.skill_id = s.id
            WHERE sl.employee_id = %s
        """, (emp['id'],))
        
        levels = {}
        for sl in cursor.fetchall():
            # Convert numeric level to frontend format (X, 1, 2, 3, 4)
            level_val = sl['level_value']
            if level_val == 0:
                levels[sl['skill_name']] = 'X'
            else:
                levels[sl['skill_name']] = level_val
        
        employees.append({
            'id': emp['id'],
            'name': emp['name'],
            'role': emp['role'],
            'levels': levels
        })
    
    cursor.close()
    
    return {
        'id': dept['id'],
        'name': dept['name'],
        'targetLevel': dept['target_level'],
        'skills': skills,
        'employees': employees
    }
@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate user and return JWT token"""
    data = request.json
    
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Missing username or password'}), 400
    
    username = data['username']
    password = data['password']
    
    # Check credentials against environment variable
    if username in ADMIN_USERS and ADMIN_USERS[username] == password:
        token = create_jwt_token(username)
        return jsonify({
            'token': token,
            'username': username,
            'message': 'Login successful'
        }), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout endpoint (client handles token removal)"""
    return jsonify({'message': 'Logout successful'}), 200

# ===================== DEPARTMENT ENDPOINTS =====================

@app.route('/api/departments', methods=['GET'])
@require_auth
def get_departments():
    """Fetch all departments with complete data"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT id FROM departments ORDER BY created_at ASC")
        dept_ids = cursor.fetchall()
        cursor.close()
        
        departments = []
        for dept in dept_ids:
            dept_data = format_department_response(dept['id'], connection)
            if dept_data:
                departments.append(dept_data)
        
        connection.close()
        return jsonify({
            'departments': departments,
            'version': 1
        }), 200
        
    except Error as e:
        connection.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/departments', methods=['POST'])
@require_auth
def create_department():
    """Create new department"""
    data = request.json
    name = data.get('name', '').strip()
    target_level = data.get('targetLevel', 3)
    
    if not name:
        return jsonify({'error': 'Department name is required'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        dept_id = generate_uuid()
        
        cursor.execute("""
            INSERT INTO departments (id, name, target_level)
            VALUES (%s, %s, %s)
        """, (dept_id, name, target_level))
        
        connection.commit()
        cursor.close()

        # Return complete department object
        dept_data = format_department_response(dept_id, connection)
        connection.close()
        
        return jsonify(dept_data), 201
        
    except Error as e:
        connection.rollback()
        connection.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/departments/<dept_id>', methods=['PUT'])
@require_auth
def update_department(dept_id):
    """Update department name or target level"""
    data = request.json
    name = data.get('name')
    target_level = data.get('targetLevel')
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        
        # Build dynamic update query
        updates = []
        params = []
        
        if name is not None:
            updates.append("name = %s")
            params.append(name.strip())
        
        if target_level is not None:
            updates.append("target_level = %s")
            params.append(target_level)
        
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400
        
        updates.append("updated_at = NOW()")
        params.append(dept_id)
        
        query = f"UPDATE departments SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(query, params)
        connection.commit()
        cursor.close()

        # Return updated department
        dept_data = format_department_response(dept_id, connection)
        connection.close()
        
        return jsonify(dept_data), 200
        
    except Error as e:
        connection.rollback()
        connection.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/departments/<dept_id>', methods=['DELETE'])
@require_auth
def delete_department(dept_id):
    """Delete department (cascades to employees, skills, skill_levels)"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        
        # Check if department exists
        cursor.execute("SELECT id FROM departments WHERE id = %s", (dept_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Department not found'}), 404
        
        # Delete department (CASCADE will handle related records)
        cursor.execute("DELETE FROM departments WHERE id = %s", (dept_id,))
        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({'message': 'Department deleted successfully'}), 200
        
    except Error as e:
        connection.rollback()
        connection.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/employees/<emp_id>', methods=['PUT'])
@require_auth
def update_employee(emp_id):
    """Update employee name or role"""
    data = request.json
    name = data.get('name')
    role = data.get('role')
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get department_id for response
        cursor.execute("SELECT department_id FROM employees WHERE id = %s", (emp_id,))
        result = cursor.fetchone()
        if not result:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Employee not found'}), 404
        
        dept_id = result['department_id']
        
        # Build update query
        updates = []
        params = []
        
        if name is not None:
            updates.append("name = %s")
            params.append(name.strip())
        
        if role is not None:
            updates.append("role = %s")
            params.append(role.strip())
        
        if not updates:
            return jsonify({'error': 'No fields to update'}), 400
        
        updates.append("updated_at = NOW()")
        params.append(emp_id)
        
        query = f"UPDATE employees SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(query, params)
        connection.commit()
        cursor.close()

        # Return updated department
        dept_data = format_department_response(dept_id, connection)
        connection.close()
        
        return jsonify(dept_data), 200
        
    except Error as e:
        connection.rollback()
        connection.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/employees/<emp_id>', methods=['DELETE'])
@require_auth
def delete_employee(emp_id):
    """Delete employee (cascades to skill_levels)"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get department_id before deletion
        cursor.execute("SELECT department_id FROM employees WHERE id = %s", (emp_id,))
        result = cursor.fetchone()
        if not result:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Employee not found'}), 404
        
        dept_id = result['department_id']
        
        # Delete employee
        cursor.execute("DELETE FROM employees WHERE id = %s", (emp_id,))
        connection.commit()
        cursor.close()

        # Return updated department
        dept_data = format_department_response(dept_id, connection)
        connection.close()
        
        return jsonify(dept_data), 200
        
    except Error as e:
        connection.rollback()
        connection.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/departments/<string:dept_id>/employees', methods=['POST'])
@require_auth
def add_employee(dept_id):
    """Add a new employee to a department"""
    data = request.get_json()
    name = data.get("name")
    role = data.get("role")

    if not name:
        return jsonify({"error": "Employee name required"}), 400

    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = connection.cursor(dictionary=True)
        emp_id = str(uuid.uuid4())

        cursor.execute("""
            INSERT INTO employees (id, name, role, department_id)
            VALUES (%s, %s, %s, %s)
        """, (emp_id, name, role, dept_id))

        # Initialize all skills at level 1 for new employee
        cursor.execute("SELECT id FROM skills WHERE department_id = %s", (dept_id,))
        for skill in cursor.fetchall():
            cursor.execute("""
                INSERT INTO skill_levels (employee_id, skill_id, level_value)
                VALUES (%s, %s, 1)
            """, (emp_id, skill['id']))

        connection.commit()

        # Fetch updated department data
        dept_data = format_department_response(dept_id, connection)

        cursor.close()
        connection.close()
        return jsonify(dept_data), 201

    except Error as e:
        connection.rollback()
        connection.close()
        print(f"❌ Database error: {e}")
        return jsonify({"error": str(e)}), 500


# ===================== SKILL ENDPOINTS =====================

@app.route('/api/skills', methods=['POST'])
@require_auth
def add_skill():
    """Add new skill to department"""
    data = request.json
    dept_id = data.get('departmentId')
    skill_name = data.get('name', '').strip()
    
    if not dept_id or not skill_name:
        return jsonify({'error': 'Department ID and skill name are required'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get max display order
        cursor.execute("""
            SELECT COALESCE(MAX(display_order), 0) as max_order
            FROM skills WHERE department_id = %s
        """, (dept_id,))
        max_order = cursor.fetchone()['max_order']
        
        skill_id = generate_uuid()
        
        # Insert skill
        cursor.execute("""
            INSERT INTO skills (id, department_id, name, display_order)
            VALUES (%s, %s, %s, %s)
        """, (skill_id, dept_id, skill_name, max_order + 1))
        
        # Get all employees in this department
        cursor.execute("""
            SELECT id FROM employees WHERE department_id = %s
        """, (dept_id,))
        employees = cursor.fetchall()
        
        # Initialize skill level to 1 for all employees
        for emp in employees:
            cursor.execute("""
                INSERT INTO skill_levels (employee_id, skill_id, level_value)
                VALUES (%s, %s, 1)
            """, (emp['id'], skill_id))
        
        connection.commit()
        cursor.close()

        # Return updated department
        dept_data = format_department_response(dept_id, connection)
        connection.close()
        
        return jsonify(dept_data), 201
        
    except Error as e:
        connection.rollback()
        connection.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/skills', methods=['DELETE'])
@require_auth
def remove_skill():
    """Remove skill from department"""
    data = request.json
    dept_id = data.get('departmentId')
    skill_name = data.get('name')
    
    if not dept_id or not skill_name:
        return jsonify({'error': 'Department ID and skill name are required'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        
        # Delete skill (CASCADE will handle skill_levels)
        cursor.execute("""
            DELETE FROM skills
            WHERE department_id = %s AND name = %s
        """, (dept_id, skill_name))
        
        connection.commit()
        cursor.close()

        # Return updated department
        dept_data = format_department_response(dept_id, connection)
        connection.close()
        
        return jsonify(dept_data), 200
        
    except Error as e:
        connection.rollback()
        connection.close()
        return jsonify({'error': str(e)}), 500


@app.route('/api/skills/level', methods=['PUT'])
@require_auth
def update_skill_level():
    """Update skill level for an employee"""
    data = request.json
    emp_id = data.get('employeeId')
    skill_name = data.get('skillName')
    level_value = data.get('level')
    
    if not emp_id or not skill_name or level_value is None:
        return jsonify({'error': 'Employee ID, skill name, and level are required'}), 400
    
    # Convert frontend level format to database format
    if level_value == 'X':
        db_level = 0
    else:
        db_level = int(level_value)
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get department_id
        cursor.execute("SELECT department_id FROM employees WHERE id = %s", (emp_id,))
        result = cursor.fetchone()
        if not result:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Employee not found'}), 404
        
        dept_id = result['department_id']
        
        # Get skill_id
        cursor.execute("""
            SELECT id FROM skills
            WHERE department_id = %s AND name = %s
        """, (dept_id, skill_name))
        skill_result = cursor.fetchone()
        
        if not skill_result:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Skill not found'}), 404
        
        skill_id = skill_result['id']
        
        # Update or insert skill level
        cursor.execute("""
            INSERT INTO skill_levels (employee_id, skill_id, level_value)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE
                level_value = %s,
                updated_at = NOW()
        """, (emp_id, skill_id, db_level, db_level))
        
        connection.commit()
        cursor.close()

        # Return updated department
        dept_data = format_department_response(dept_id, connection)
        connection.close()
        
        return jsonify(dept_data), 200
        
    except Error as e:
        connection.rollback()
        connection.close()
        return jsonify({'error': str(e)}), 500

# ===================== LOG RETRIEVER =====================
@app.route('/api/activity', methods=['GET'])
@require_auth
def get_activity_logs():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100")
    logs = cursor.fetchall()
    cursor.close()
    connection.close()
    return jsonify(logs)

# ===================== HEALTH CHECK =====================

@app.route('/api/health', methods=['GET'])
@require_auth
def health_check():
    """Health check endpoint"""
    connection = get_db_connection()
    if connection:
        connection.close()
        return jsonify({
            'status': 'healthy',
            'database': 'connected'
        }), 200
    else:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected'
        }), 503

# ===================== ERROR HANDLERS =====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ===================== MAIN =====================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
