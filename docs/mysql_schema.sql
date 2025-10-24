-- =====================================================
-- Unimarks Skills & Training Matrix - MySQL Schema
-- =====================================================
-- Database schema for Skills Matrix application
-- Compatible with MySQL 5.7+ and MySQL 8.0+
-- =====================================================

-- Drop existing database if needed (CAUTION: Use only for fresh setup)
-- DROP DATABASE IF EXISTS unimarks_skills;

-- Create database
CREATE DATABASE IF NOT EXISTS unimarks_skills
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE unimarks_skills;

-- =====================================================
-- TABLE: departments
-- =====================================================
-- Stores department information (Sales, Marketing, Legal, etc.)

CREATE TABLE departments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    target_level TINYINT NOT NULL DEFAULT 3 CHECK (target_level BETWEEN 1 AND 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_dept_name (name),
    INDEX idx_dept_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: employees
-- =====================================================
-- Stores employee/team member information

CREATE TABLE employees (
    id VARCHAR(36) PRIMARY KEY,
    department_id VARCHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_emp_dept (department_id),
    INDEX idx_emp_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: skills
-- =====================================================
-- Stores skills for each department

CREATE TABLE skills (
    id VARCHAR(36) PRIMARY KEY,
    department_id VARCHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_skill_per_dept (department_id, name),
    INDEX idx_skill_dept (department_id),
    INDEX idx_skill_order (department_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: skill_levels
-- =====================================================
-- Stores skill level ratings for each employee
-- level_value: 0=Exempt(X), 1=Not capable, 2=Some capability, 3=Capable, 4=Expert

CREATE TABLE skill_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    skill_id VARCHAR(36) NOT NULL,
    level_value TINYINT NOT NULL DEFAULT 1 CHECK (level_value BETWEEN 0 AND 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_emp_skill (employee_id, skill_id),
    INDEX idx_level_emp (employee_id),
    INDEX idx_level_skill (skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SEED DATA (Optional - for initial setup/testing)
-- =====================================================
-- Insert sample departments

INSERT INTO departments (id, name, target_level) VALUES
('dept_sales_001', 'Sales', 3),
('dept_marketing_002', 'Marketing', 3),
('dept_legal_003', 'Legal', 3),
('dept_operations_004', 'Operations', 3),
('dept_hr_005', 'HR', 3);

-- Insert sample skills for Sales department
INSERT INTO skills (id, department_id, name, display_order) VALUES
('skill_sales_001', 'dept_sales_001', 'Lead Generation', 1),
('skill_sales_002', 'dept_sales_001', 'Discovery Calls', 2),
('skill_sales_003', 'dept_sales_001', 'Proposal Writing', 3),
('skill_sales_004', 'dept_sales_001', 'Negotiation', 4),
('skill_sales_005', 'dept_sales_001', 'CRM (HubSpot)', 5),
('skill_sales_006', 'dept_sales_001', 'IP Pitch (TM/Patent)', 6),
('skill_sales_007', 'dept_sales_001', 'Follow-ups & Closing', 7);

-- Insert sample skills for Marketing department
INSERT INTO skills (id, department_id, name, display_order) VALUES
('skill_marketing_001', 'dept_marketing_002', 'Content Writing (IP)', 1),
('skill_marketing_002', 'dept_marketing_002', 'SEO Basics', 2),
('skill_marketing_003', 'dept_marketing_002', 'LinkedIn Posting', 3),
('skill_marketing_004', 'dept_marketing_002', 'Email Marketing', 4),
('skill_marketing_005', 'dept_marketing_002', 'Design (Canva)', 5),
('skill_marketing_006', 'dept_marketing_002', 'Ads (Meta/Google)', 6),
('skill_marketing_007', 'dept_marketing_002', 'Analytics & Reporting', 7);

-- Insert sample skills for Legal department
INSERT INTO skills (id, department_id, name, display_order) VALUES
('skill_legal_001', 'dept_legal_003', 'TM Prosecution', 1),
('skill_legal_002', 'dept_legal_003', 'Opposition & Rectification', 2),
('skill_legal_003', 'dept_legal_003', 'Drafting (Notices/Pleadings)', 3),
('skill_legal_004', 'dept_legal_003', 'Legal Research', 4),
('skill_legal_005', 'dept_legal_003', 'Client Advisory', 5),
('skill_legal_006', 'dept_legal_003', 'Court Filings (Madras HC)', 6),
('skill_legal_007', 'dept_legal_003', 'Evidence & Affidavits', 7),
('skill_legal_008', 'dept_legal_003', 'Patent Search (Novelty/FTO)', 8);

-- Insert sample skills for Operations department
INSERT INTO skills (id, department_id, name, display_order) VALUES
('skill_ops_001', 'dept_operations_004', 'Billing & Invoicing', 1),
('skill_ops_002', 'dept_operations_004', 'Process Compliance', 2),
('skill_ops_003', 'dept_operations_004', 'Vendor Management', 3),
('skill_ops_004', 'dept_operations_004', 'Scheduling & Dockets', 4),
('skill_ops_005', 'dept_operations_004', 'Knowledge Management', 5),
('skill_ops_006', 'dept_operations_004', 'IT Tools (ClickUp/Drive)', 6);

-- Insert sample skills for HR department
INSERT INTO skills (id, department_id, name, display_order) VALUES
('skill_hr_001', 'dept_hr_005', 'Hiring & JD Crafting', 1),
('skill_hr_002', 'dept_hr_005', 'Onboarding', 2),
('skill_hr_003', 'dept_hr_005', 'Performance Reviews', 3),
('skill_hr_004', 'dept_hr_005', 'Training & L&D', 4),
('skill_hr_005', 'dept_hr_005', 'Culture & 4R Enforcement', 5),
('skill_hr_006', 'dept_hr_005', 'Payroll & Compliance', 6);

-- Insert sample employees for Sales
INSERT INTO employees (id, department_id, name, role) VALUES
('emp_sales_001', 'dept_sales_001', 'Sribhavani', 'CST Head'),
('emp_sales_002', 'dept_sales_001', 'Akash', 'BD Executive');

-- Insert sample employees for Marketing
INSERT INTO employees (id, department_id, name, role) VALUES
('emp_marketing_001', 'dept_marketing_002', 'Priya', 'Content Lead'),
('emp_marketing_002', 'dept_marketing_002', 'Naveen', 'Designer');

-- Insert sample employees for Legal
INSERT INTO employees (id, department_id, name, role) VALUES
('emp_legal_001', 'dept_legal_003', 'Keerthana', 'Associate'),
('emp_legal_002', 'dept_legal_003', 'Rahul', 'Senior Associate');

-- Insert sample employees for Operations
INSERT INTO employees (id, department_id, name, role) VALUES
('emp_ops_001', 'dept_operations_004', 'Meena', 'Ops Lead');

-- Insert sample employees for HR
INSERT INTO employees (id, department_id, name, role) VALUES
('emp_hr_001', 'dept_hr_005', 'Arjun', 'People Dev.');

-- Insert sample skill levels (default level 1 for all employees across all skills in their dept)
-- Sales department skill levels
INSERT INTO skill_levels (employee_id, skill_id, level_value)
SELECT e.id, s.id, 1
FROM employees e
CROSS JOIN skills s
WHERE e.department_id = 'dept_sales_001' AND s.department_id = 'dept_sales_001';

-- Marketing department skill levels
INSERT INTO skill_levels (employee_id, skill_id, level_value)
SELECT e.id, s.id, 1
FROM employees e
CROSS JOIN skills s
WHERE e.department_id = 'dept_marketing_002' AND s.department_id = 'dept_marketing_002';

-- Legal department skill levels
INSERT INTO skill_levels (employee_id, skill_id, level_value)
SELECT e.id, s.id, 1
FROM employees e
CROSS JOIN skills s
WHERE e.department_id = 'dept_legal_003' AND s.department_id = 'dept_legal_003';

-- Operations department skill levels
INSERT INTO skill_levels (employee_id, skill_id, level_value)
SELECT e.id, s.id, 1
FROM employees e
CROSS JOIN skills s
WHERE e.department_id = 'dept_operations_004' AND s.department_id = 'dept_operations_004';

-- HR department skill levels
INSERT INTO skill_levels (employee_id, skill_id, level_value)
SELECT e.id, s.id, 1
FROM employees e
CROSS JOIN skills s
WHERE e.department_id = 'dept_hr_005' AND s.department_id = 'dept_hr_005';

-- =====================================================
-- VERIFICATION QUERIES (Run these to test your setup)
-- =====================================================

-- Check departments count
-- SELECT COUNT(*) as total_departments FROM departments;

-- Check employees per department
-- SELECT d.name as department, COUNT(e.id) as employee_count
-- FROM departments d
-- LEFT JOIN employees e ON d.id = e.department_id
-- GROUP BY d.id, d.name;

-- Check skills per department
-- SELECT d.name as department, COUNT(s.id) as skill_count
-- FROM departments d
-- LEFT JOIN skills s ON d.id = s.department_id
-- GROUP BY d.id, d.name;

-- Check skill levels count
-- SELECT COUNT(*) as total_skill_levels FROM skill_levels;

-- =====================================================
-- BACKUP REMINDER
-- =====================================================
-- To backup your database:
-- mysqldump -u root -p unimarks_skills > backup_YYYYMMDD.sql
--
-- To restore from backup:
-- mysql -u root -p unimarks_skills < backup_YYYYMMDD.sql
-- =====================================================
