Employetica - Employee Management System Backend
Employetica is a robust Employee Management System backend built with Node.js, Express.js, MongoDB, Firebase Authentication, and Stripe. It supports role-based access control for Employees, HR, and Admin users, providing a scalable solution for managing employee data, payments, and workflows.

Table of Contents

Technologies & Libraries
Environment Variables
Folder Structure
Features
Authentication & Authorization
User Management
Employee Features
HR Features
Admin Features
Contact Us Messages
Stripe Payment Integration


API Routes
How to Run Locally


Technologies & Libraries

Node.js: Runtime environment for executing JavaScript server-side.
Express.js: Backend framework for building RESTful APIs.
MongoDB: NoSQL database for storing user and application data.
Firebase Admin SDK: Verifies Firebase Authentication tokens.
Stripe: Payment gateway for processing transactions.
dotenv: Manages environment variables.
cors: Enables Cross-Origin Resource Sharing.
MongoDB Driver: Official MongoDB driver for Node.js (mongodb).


Environment Variables
Create a .env file in the root directory with the following variables:
MONGODB_URI=your_mongodb_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
PORT=5000

# Firebase Admin SDK credentials loaded via firebase-admin-key.json

Note: Ensure firebase-admin-key.json is placed in the root folder for Firebase Authentication.

Folder Structure
/root
  |-- firebase-admin-key.json  # Firebase service account credentials
  |-- .env                    # Environment variables
  |-- server.js               # Main server file
  |-- package.json            # Project dependencies and scripts
  |-- /routes                 # (Optional) API route definitions
  |-- /controllers            # (Optional) Business logic handlers
  |-- /middlewares            # (Optional) Authentication middlewares


Features
Authentication & Authorization

Firebase Token Verification: Uses verifyFBToken middleware to validate Firebase Auth ID tokens.
Role-Based Access Control: Middlewares (verifyEmployee, verifyHR, verifyAdmin) enforce access restrictions.
Fired User Restriction: Blocks fired users from accessing the system.

User Management

Registration: Public endpoint to register new users (POST /users).
Role Retrieval: Get user role by email (GET /users/:email/role).
Admin Actions:
Promote employees to HR (PATCH /users/make-hr/:id).
Fire users (PATCH /users/fire/:id).
Increase salary (increments only) (PATCH /users/salary/:id).


HR Actions: Verify employees (PATCH /users/verify/:id).
Fired Status Check: Check if a user is fired (GET /is-fired-user/:email).

Employee Features

Worksheet Management: CRUD operations for worksheets (GET/POST /worksheets, PUT /task/:id, DELETE /task/:id).
Payment History: View paginated payment history (GET /payment-history).
Dashboard: Employee-specific dashboard overview (GET /overview/employee).

HR Features

Employee Listing: Retrieve all employees (GET /users/employee).
Work Records: View all work records (GET /work-records).
Employee Details: Get details by email (GET /users/:slug).
Payment Tracking: View payments by employee email (GET /payments/employee).
Dashboard: HR-specific dashboard overview (GET /overview/hr).
Payment Requests: Request payment approval (POST /payments).

Admin Features

Verified Users: List all verified users (GET /users-verified).
Payment Overview: View all payments (GET /payments).
Dashboard: Admin-specific dashboard overview (GET /overview/admin).
Role & Salary Management: Promote users, fire users, and adjust salaries.

Contact Us Messages

Public Messages: Visitors can send messages (POST /contact-us).
Admin Access: View all contact messages (GET /contact-messages).

Stripe Payment Integration

Payment Intents: Create payment intents for transactions (POST /create-payment-intent).
Payment Updates: Update payment details (PATCH /payments/:id).
Payment Retrieval: Get payment details by ID (GET /payments/:id).


API Routes



Method
Route
Access Role
Description



POST
/users
Public
Register new user


GET
/users/:email/role
Public
Get user role


GET
/is-fired-user/:email
Public
Check if user is fired


GET
/worksheets
Employee
Get employee worksheets


POST
/worksheets
Employee
Add new worksheet


PUT
/task/:id
Employee
Update worksheet task


DELETE
/task/:id
Employee
Delete worksheet task


GET
/payment-history
Employee
Get payment history (paginated)


GET
/overview/employee
Employee
Employee dashboard overview


GET
/users/employee
HR
Get all employees


GET
/work-records
HR
Get all work records


GET
/users/:slug
HR
Get employee details by email


GET
/payments/employee
HR
Get payments by employee email


GET
/overview/hr
HR
HR dashboard overview


POST
/payments
HR
Request payment approval


PATCH
/users/verify/:id
HR
Verify employee


GET
/users-verified
Admin
Get all verified users


GET
/payments
Admin
Get all payments


GET
/overview/admin
Admin
Admin dashboard overview


PATCH
/users/make-hr/:id
Admin
Promote employee to HR


PATCH
/users/fire/:id
Admin
Fire user


PATCH
/users/salary/:id
Admin
Increase salary


GET
/contact-messages
Admin
Get all contact messages


POST
/contact-us
Public
Send contact message


POST
/create-payment-intent
Admin
Create Stripe payment intent


PATCH
/payments/:id
Admin
Update payment details


GET
/payments/:id
Admin
Get payment by ID



How to Run Locally

Clone the Repository:
git clone <repository-url>
cd <repository-folder>


Install Dependencies:
npm install


Set Up Environment Variables:Create a .env file in the root directory with the following:
MONGODB_URI=your_mongodb_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
PORT=5000


Add Firebase Credentials:Place your Firebase Admin SDK credentials JSON as firebase-admin-key.json in the root folder.

Start the Server:
node server.js

For development with automatic reloads:
npm run dev


Access the Server:The server will run at http://localhost:5000.

