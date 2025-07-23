# Employetica - Backend

Employetica is a robust employee management system that streamlines organizational workflows, role-based access, and salary management through a secure and scalable backend built with Node.js, Express, MongoDB, Firebase Auth, and Stripe.

🔐 Role-based Access Control (Admin, HR, Employee)  
💰 Real-time Salary Adjustment and Payment System  
📅 Employee Worksheet Logging and Reporting  
📨 Contact Message Submission & Admin Review  

**Frontend Repo**: [Employetica Client](https://github.com/your-username/employetica-client)  
**Live Website**: [Live Link](https://employetica.web.app)  


## 🛠️ Technologies

- **Node.js** & **Express.js** — Server Framework
- **MongoDB** — NoSQL Database
- **Firebase Authentication** — Secure User Login and Token Verification
- **Stripe** — Payment Integration for Salary Disbursement
- **dotenv** — Environment Variable Management
- **CORS** — Security Middleware
- **SweetAlert2** (on client) — Elegant Alerts (for frontend)

## ✨ Features

### 🧑‍💼 Role-Based Access (RBAC)
- Admins can promote/demote HRs and remove any user.
- HRs can assign tasks, manage employee salaries, and mark payments.
- Employees can submit worksheets and view salary info.

### 📆 Worksheet Management
- Employees log daily tasks.
- HR can approve, reject, or comment.
- Admin can see all employee work reports.

### 💸 Salary and Payment
- HR sets base salary and adjusts bonuses.
- Integrated with Stripe to process payments.
- All payment history recorded with timestamps and HR info.

### 📨 Contact System
- Users can send messages via Contact Us form.
- Admin can view all messages from dashboard.

## 🚀 Setup and Run Locally

### 🔧 Prerequisites
- Node.js ≥ 16
- MongoDB Atlas or Local Mongo
- Firebase Admin SDK credentials
- Stripe secret key

### 📁 Clone & Install
```bash
git clone https://github.com/your-username/employetica-server.git
cd employetica-server
npm install




