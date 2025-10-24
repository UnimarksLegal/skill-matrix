# Unimarks Skills & Training Matrix - Backend Setup Guide

Complete setup and deployment instructions for the Flask + MySQL backend.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **MySQL 5.7+ or 8.0+** ([Download](https://dev.mysql.com/downloads/))
- **pip** (Python package manager - comes with Python)
- **Git** (optional, for version control)

---

## 🚀 Quick Start (Local Development)

### Step 1: Clone/Download the Project

```bash
# If using Git
git clone <your-repo-url>
cd unimarks-skills-matrix

# Or download and extract the ZIP file
```

### Step 2: Set Up MySQL Database

1. **Start MySQL Server**
   ```bash
   # On macOS (if using Homebrew)
   brew services start mysql
   
   # On Ubuntu/Linux
   sudo systemctl start mysql
   
   # On Windows
   # Start MySQL from Services or MySQL Workbench
   ```

2. **Create Database and Tables**
   ```bash
   # Login to MySQL
   mysql -u root -p
   
   # Then run the schema file
   source docs/mysql_schema.sql
   
   # Or in one command:
   mysql -u root -p < docs/mysql_schema.sql
   ```

3. **Verify Database Setup**
   ```bash
   mysql -u root -p
   ```
   ```sql
   USE unimarks_skills;
   SHOW TABLES;
   -- Should show: departments, employees, skills, skill_levels
   
   SELECT COUNT(*) FROM departments;
   -- Should return 5 (if using seed data)
   ```

### Step 3: Set Up Python Backend

1. **Create Virtual Environment**
   ```bash
   # Navigate to backend directory (if separate)
   # Or stay in project root
   
   python3 -m venv venv
   
   # Activate virtual environment
   # On macOS/Linux:
   source venv/bin/activate
   
   # On Windows:
   venv\Scripts\activate
   ```

2. **Install Python Dependencies**
   ```bash
   pip install flask flask-cors mysql-connector-python python-dotenv
   ```

3. **Create Environment Configuration**
   
   Create a `.env` file in the same directory as `app.py`:
   
   ```bash
   # .env file
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=unimarks_skills
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   
   FLASK_ENV=development
   PORT=5000
   ```
   
   **⚠️ IMPORTANT:** Replace `your_mysql_password_here` with your actual MySQL password.

4. **Run the Flask Server**
   ```bash
   # Make sure you're in the directory containing app.py
   python docs/app.py
   
   # Or if app.py is in project root:
   python app.py
   ```
   
   You should see:
   ```
   * Running on http://0.0.0.0:5000
   * Restarting with stat
   * Debugger is active!
   ```

### Step 4: Test Backend API

**Test Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

**Test Get Departments:**
```bash
curl http://localhost:5000/api/departments
```

---

## 🔌 Connecting Frontend to Backend

### Option 1: Update Frontend API URLs (Development)

In your React frontend, update the API base URL:

**File:** `src/pages/Index.tsx`

```typescript
// Find the apiService object and update BASE_URL
const apiService = {
  BASE_URL: 'http://localhost:5000', // Change from mock to actual backend
  
  async fetchDepartments() {
    const response = await fetch(`${this.BASE_URL}/api/departments`);
    if (!response.ok) throw new Error('Failed to fetch departments');
    return response.json();
  },
  
  // ... rest of the methods remain the same
};
```

### Option 2: Environment Variables (Production Ready)

**Create `.env` in frontend root:**
```bash
VITE_API_BASE_URL=http://localhost:5000
```

**Update apiService:**
```typescript
const apiService = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  // ... rest of methods
};
```

---

## 🧪 API Endpoints Reference

### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | Get all departments with skills & employees |
| POST | `/api/departments` | Create new department |
| PUT | `/api/departments/<id>` | Update department name/target level |
| DELETE | `/api/departments/<id>` | Delete department |

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/employees` | Add employee to department |
| PUT | `/api/employees/<id>` | Update employee name/role |
| DELETE | `/api/employees/<id>` | Remove employee |

### Skills

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/skills` | Add skill to department |
| DELETE | `/api/skills` | Remove skill from department |
| PUT | `/api/skills/level` | Update employee skill level |

### Example Requests

**Create Department:**
```bash
curl -X POST http://localhost:5000/api/departments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering",
    "targetLevel": 3
  }'
```

**Add Employee:**
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "departmentId": "dept_sales_001",
    "name": "John Doe",
    "role": "Sales Manager"
  }'
```

**Update Skill Level:**
```bash
curl -X PUT http://localhost:5000/api/skills/level \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp_sales_001",
    "skillName": "Lead Generation",
    "level": 3
  }'
```

---

## 🌐 Production Deployment

### Option 1: Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Or download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Prepare for Deployment**
   
   Create `requirements.txt`:
   ```bash
   pip freeze > requirements.txt
   ```
   
   Create `Procfile`:
   ```
   web: python app.py
   ```

3. **Deploy to Heroku**
   ```bash
   heroku login
   heroku create unimarks-skills-api
   
   # Add MySQL addon (ClearDB)
   heroku addons:create cleardb:ignite
   
   # Get database URL
   heroku config:get CLEARDB_DATABASE_URL
   
   # Set environment variables
   heroku config:set FLASK_ENV=production
   
   # Deploy
   git push heroku main
   
   # Import database schema
   mysql -h <cleardb-host> -u <user> -p <database> < docs/mysql_schema.sql
   ```

### Option 2: Deploy to DigitalOcean/AWS

1. **Set up Ubuntu VPS**
   ```bash
   # SSH into server
   ssh root@your-server-ip
   
   # Update system
   apt update && apt upgrade -y
   
   # Install Python and MySQL
   apt install python3 python3-pip python3-venv mysql-server -y
   ```

2. **Configure MySQL**
   ```bash
   mysql_secure_installation
   mysql -u root -p < mysql_schema.sql
   ```

3. **Deploy Flask App**
   ```bash
   # Clone your repo
   git clone <your-repo>
   cd unimarks-skills-matrix
   
   # Set up virtual environment
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Create .env file with production settings
   
   # Run with Gunicorn (production WSGI server)
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

4. **Set up Nginx (optional)**
   ```bash
   apt install nginx -y
   
   # Configure reverse proxy
   nano /etc/nginx/sites-available/skills-matrix
   ```
   
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Option 3: Docker Deployment

**Create `Dockerfile`:**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

**Create `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: unimarks_skills
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docs/mysql_schema.sql:/docker-entrypoint-initdb.d/schema.sql

  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: unimarks_skills
      DB_USER: root
      DB_PASSWORD: rootpassword
    depends_on:
      - mysql

volumes:
  mysql_data:
```

**Run with Docker:**
```bash
docker-compose up -d
```

---

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files to Git
   - Add `.env` to `.gitignore`
   - Use environment variables for all sensitive data

2. **Database Security**
   - Use strong passwords
   - Create a dedicated MySQL user (don't use root in production)
   - Grant only necessary privileges:
   
   ```sql
   CREATE USER 'skills_app'@'localhost' IDENTIFIED BY 'strong_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON unimarks_skills.* TO 'skills_app'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **API Security**
   - Implement authentication (JWT tokens)
   - Add rate limiting
   - Enable HTTPS in production
   - Validate all inputs server-side

---

## 🐛 Troubleshooting

### Common Issues

**Issue 1: "Can't connect to MySQL server"**
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Check MySQL credentials
mysql -u root -p
```

**Issue 2: "ModuleNotFoundError: No module named 'flask'"**
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Issue 3: "CORS Error in Browser"**
- Make sure Flask-CORS is installed
- Check that CORS is enabled in app.py: `CORS(app)`
- Verify frontend is making requests to correct URL

**Issue 4: "Foreign key constraint fails"**
- Ensure database schema is properly imported
- Check that UUIDs are being generated correctly
- Verify cascade delete is working

---

## 📊 Database Maintenance

### Backup Database

```bash
# Full backup
mysqldump -u root -p unimarks_skills > backup_$(date +%Y%m%d).sql

# Backup specific tables
mysqldump -u root -p unimarks_skills departments employees > partial_backup.sql
```

### Restore Database

```bash
mysql -u root -p unimarks_skills < backup_20250124.sql
```

### Reset Database (⚠️ Caution: Deletes all data)

```bash
mysql -u root -p
```
```sql
DROP DATABASE unimarks_skills;
CREATE DATABASE unimarks_skills;
USE unimarks_skills;
SOURCE docs/mysql_schema.sql;
```

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review Flask documentation: https://flask.palletsprojects.com/
- Review MySQL documentation: https://dev.mysql.com/doc/

---

## ✅ Verification Checklist

Before going live, ensure:

- [ ] MySQL database is running and accessible
- [ ] All tables are created (departments, employees, skills, skill_levels)
- [ ] Seed data is imported (or your own data is populated)
- [ ] Flask server starts without errors
- [ ] Health check endpoint returns "healthy"
- [ ] All CRUD operations work via API
- [ ] Frontend can connect to backend
- [ ] CORS is properly configured
- [ ] Environment variables are set correctly
- [ ] Database backups are scheduled
- [ ] Production credentials are secure

---

## 🎉 You're Ready!

Your Skills & Training Matrix backend is now set up and ready to use. The frontend should connect seamlessly to these endpoints once you update the API base URL.

Happy coding! 🚀
