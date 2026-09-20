import { 
  Department, 
  User, 
  Asset, 
  MaintenanceRequest, 
  Technician, 
  DeviceType, 
  FaultType 
} from '../types';

export function generateSqlDump(data: {
  departments: Department[];
  users: User[];
  assets: Asset[];
  requests: MaintenanceRequest[];
  technicians: Technician[];
  deviceTypes: DeviceType[];
  faultTypes: FaultType[];
}): string {
  const sanitize = (val: any) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  let sql = `-- =========================================================\n`;
  sql += `-- CMMS MAINTENANCE SYSTEM DATABASE DUMP (SQL)\n`;
  sql += `-- Generated on: ${new Date().toISOString()}\n`;
  sql += `-- Compatible with MySQL / PostgreSQL / MariaDB / Cloud SQL\n`;
  sql += `-- =========================================================\n\n`;

  sql += `CREATE DATABASE IF NOT EXISTS cmms_maintenance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
  sql += `USE cmms_maintenance_db;\n\n`;

  // 1. Departments
  sql += `-- 1. Departments Table\n`;
  sql += `CREATE TABLE IF NOT EXISTS departments (\n`;
  sql += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `  name VARCHAR(255) NOT NULL,\n`;
  sql += `  created_date VARCHAR(50)\n`;
  sql += `);\n\n`;

  if (data.departments.length > 0) {
    sql += `INSERT INTO departments (id, name, created_date) VALUES\n`;
    sql += data.departments.map(d => `(${sanitize(d.id)}, ${sanitize(d.name)}, ${sanitize(d.createdDate)})`).join(',\n') + ';\n\n';
  }

  // 2. Users
  sql += `-- 2. Users Table\n`;
  sql += `CREATE TABLE IF NOT EXISTS users (\n`;
  sql += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `  name VARCHAR(255) NOT NULL,\n`;
  sql += `  username VARCHAR(100) UNIQUE NOT NULL,\n`;
  sql += `  role VARCHAR(50) NOT NULL,\n`;
  sql += `  department_id VARCHAR(50),\n`;
  sql += `  department_name VARCHAR(255),\n`;
  sql += `  phone VARCHAR(50),\n`;
  sql += `  email VARCHAR(100),\n`;
  sql += `  created_date VARCHAR(50)\n`;
  sql += `);\n\n`;

  if (data.users.length > 0) {
    sql += `INSERT INTO users (id, name, username, role, department_id, department_name, phone, email, created_date) VALUES\n`;
    sql += data.users.map(u => `(${sanitize(u.id)}, ${sanitize(u.name)}, ${sanitize(u.username)}, ${sanitize(u.role)}, ${sanitize(u.departmentId)}, ${sanitize(u.departmentName)}, ${sanitize(u.phone)}, ${sanitize(u.email)}, ${sanitize(u.createdDate)})`).join(',\n') + ';\n\n';
  }

  // 3. Device Types
  sql += `-- 3. Device Types Table\n`;
  sql += `CREATE TABLE IF NOT EXISTS device_types (\n`;
  sql += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `  name VARCHAR(255) NOT NULL,\n`;
  sql += `  code VARCHAR(50)\n`;
  sql += `);\n\n`;

  if (data.deviceTypes.length > 0) {
    sql += `INSERT INTO device_types (id, name, code) VALUES\n`;
    sql += data.deviceTypes.map(dt => `(${sanitize(dt.id)}, ${sanitize(dt.name)}, ${sanitize(dt.code)})`).join(',\n') + ';\n\n';
  }

  // 4. Fault Types
  sql += `-- 4. Fault Types Table\n`;
  sql += `CREATE TABLE IF NOT EXISTS fault_types (\n`;
  sql += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `  name VARCHAR(255) NOT NULL,\n`;
  sql += `  category VARCHAR(100)\n`;
  sql += `);\n\n`;

  if (data.faultTypes.length > 0) {
    sql += `INSERT INTO fault_types (id, name, category) VALUES\n`;
    sql += data.faultTypes.map(ft => `(${sanitize(ft.id)}, ${sanitize(ft.name)}, ${sanitize(ft.category)})`).join(',\n') + ';\n\n';
  }

  // 5. Assets / Machinery
  sql += `-- 5. Assets Table\n`;
  sql += `CREATE TABLE IF NOT EXISTS assets (\n`;
  sql += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `  code VARCHAR(100) NOT NULL,\n`;
  sql += `  name VARCHAR(255) NOT NULL,\n`;
  sql += `  model VARCHAR(100),\n`;
  sql += `  manufacturer VARCHAR(200),\n`;
  sql += `  type_id VARCHAR(50),\n`;
  sql += `  type_name VARCHAR(255),\n`;
  sql += `  location VARCHAR(255),\n`;
  sql += `  department_id VARCHAR(50),\n`;
  sql += `  department_name VARCHAR(255),\n`;
  sql += `  purchase_date VARCHAR(50),\n`;
  sql += `  status VARCHAR(50)\n`;
  sql += `);\n\n`;

  if (data.assets.length > 0) {
    sql += `INSERT INTO assets (id, code, name, model, manufacturer, type_id, type_name, location, department_id, department_name, purchase_date, status) VALUES\n`;
    sql += data.assets.map(a => `(${sanitize(a.id)}, ${sanitize(a.code)}, ${sanitize(a.name)}, ${sanitize(a.model)}, ${sanitize(a.manufacturer)}, ${sanitize(a.typeId)}, ${sanitize(a.typeName)}, ${sanitize(a.location)}, ${sanitize(a.departmentId)}, ${sanitize(a.departmentName)}, ${sanitize(a.purchaseDate)}, ${sanitize(a.status)})`).join(',\n') + ';\n\n';
  }

  // 6. Technicians
  sql += `-- 6. Technicians Table\n`;
  sql += `CREATE TABLE IF NOT EXISTS technicians (\n`;
  sql += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `  name VARCHAR(255) NOT NULL,\n`;
  sql += `  specialization_id VARCHAR(50),\n`;
  sql += `  specialization_name VARCHAR(255),\n`;
  sql += `  phone VARCHAR(50),\n`;
  sql += `  email VARCHAR(100),\n`;
  sql += `  username VARCHAR(100),\n`;
  sql += `  department_id VARCHAR(50),\n`;
  sql += `  active_requests_count INT DEFAULT 0,\n`;
  sql += `  completed_requests_count INT DEFAULT 0\n`;
  sql += `);\n\n`;

  if (data.technicians.length > 0) {
    sql += `INSERT INTO technicians (id, name, specialization_id, specialization_name, phone, email, username, department_id, active_requests_count, completed_requests_count) VALUES\n`;
    sql += data.technicians.map(t => `(${sanitize(t.id)}, ${sanitize(t.name)}, ${sanitize(t.specializationId)}, ${sanitize(t.specializationName)}, ${sanitize(t.phone)}, ${sanitize(t.email)}, ${sanitize(t.username)}, ${sanitize(t.departmentId)}, ${sanitize(t.activeRequestsCount)}, ${sanitize(t.completedRequestsCount)})`).join(',\n') + ';\n\n';
  }

  // 7. Maintenance Requests
  sql += `-- 7. Maintenance Requests Table\n`;
  sql += `CREATE TABLE IF NOT EXISTS maintenance_requests (\n`;
  sql += `  id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `  code VARCHAR(100) NOT NULL,\n`;
  sql += `  asset_id VARCHAR(50),\n`;
  sql += `  asset_name VARCHAR(255),\n`;
  sql += `  department_id VARCHAR(50),\n`;
  sql += `  department_name VARCHAR(255),\n`;
  sql += `  requester_name VARCHAR(255),\n`;
  sql += `  status VARCHAR(50),\n`;
  sql += `  priority VARCHAR(50),\n`;
  sql += `  creation_date VARCHAR(50),\n`;
  sql += `  execution_date VARCHAR(50),\n`;
  sql += `  execution_time VARCHAR(50),\n`;
  sql += `  description TEXT,\n`;
  sql += `  fault_type_name VARCHAR(255),\n`;
  sql += `  technician_name VARCHAR(255),\n`;
  sql += `  technical_report TEXT,\n`;
  sql += `  used_spare_parts JSON,\n`;
  sql += `  closure_date VARCHAR(50),\n`;
  sql += `  received_date VARCHAR(50),\n`;
  sql += `  rating INT,\n`;
  sql += `  rating_feedback TEXT\n`;
  sql += `);\n\n`;

  if (data.requests.length > 0) {
    sql += `INSERT INTO maintenance_requests (id, code, asset_id, asset_name, department_id, department_name, requester_name, status, priority, creation_date, execution_date, execution_time, description, fault_type_name, technician_name, technical_report, used_spare_parts, closure_date, received_date, rating, rating_feedback) VALUES\n`;
    sql += data.requests.map(r => `(${sanitize(r.id)}, ${sanitize(r.code)}, ${sanitize(r.assetId)}, ${sanitize(r.assetName)}, ${sanitize(r.departmentId)}, ${sanitize(r.departmentName)}, ${sanitize(r.requesterName)}, ${sanitize(r.status)}, ${sanitize(r.priority)}, ${sanitize(r.creationDate)}, ${sanitize(r.executionDate)}, ${sanitize(r.executionTime)}, ${sanitize(r.description)}, ${sanitize(r.faultTypeName)}, ${sanitize(r.technicianName)}, ${sanitize(r.technicalReport)}, ${sanitize(r.usedSpareParts)}, ${sanitize(r.closureDate)}, ${sanitize(r.receivedDate)}, ${sanitize(r.rating)}, ${sanitize(r.ratingFeedback)})`).join(',\n') + ';\n\n';
  }

  sql += `-- END OF SQL DUMP\n`;
  return sql;
}
