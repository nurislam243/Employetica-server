Employetica - Backend Server
Employetica is a complete Employee Management System backend built with Node.js, Express.js, MongoDB, Firebase Authentication, and Stripe.It supports role-based access for Employees, HR, and Admin users.

🚀 Technologies & Libraries Used

Node.js (Runtime)  
Express.js (Backend Framework)  
MongoDB (Database)  
Firebase Admin SDK (To verify Firebase Authentication tokens)  
Stripe (Payment gateway)  
dotenv (Environment variables)  
cors (Cross-Origin Resource Sharing)  
Official MongoDB driver (mongodb)


🔑 Environment Variables (.env)
MONGODB_URI=your_mongodb_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
PORT=5000

# Firebase Admin SDK credentials loaded via firebase-admin-key.json


📦 Suggested Folder & File Structure
/root
  |-- firebase-admin-key.json        # Firebase service account credentials
  |-- .env                          # Environment variables
  |-- server.js                     # Main server file
  |-- package.json
  |-- /routes                       # (Optional) API routes
  |-- /controllers                  # (Optional) Business logic
  |-- /middlewares                  # (Optional) Auth middlewares


⚙️ Features Overview
Authentication & Authorization

Verify Firebase Auth ID tokens (verifyFBToken middleware)
Role-based access control middlewares: verifyEmployee, verifyHR, verifyAdmin
Block fired users from accessing the system

User Management

User registration (POST /users)
Get user role (GET /users/:email/role)
Admin features:
Promote employee to HR (PATCH /users/make-hr/:id)
Fire user (PATCH /users/fire/:id)
Increase salary (only increments allowed) (PATCH /users/salary/:id)


HR can verify employees (PATCH /users/verify/:id)
Check if a user is fired (GET /is-fired-user/:email)

Employee Features

CRUD operations on worksheets (GET/POST /worksheets, PUT /task/:id, DELETE /task/:id)
Payment history with pagination (GET /payment-history)
Employee dashboard overview (GET /overview/employee)

HR Features

List all employees (GET /users/employee)
View all work records (GET /work-records)
Get user details by email (GET /users/:slug)
View payments by employee email (GET /payments/employee)
HR dashboard overview (GET /overview/hr)
Request payment approval (POST /payments)

Admin Features

List all verified users (GET /users-verified)
View all payments (GET /payments)
Admin dashboard overview (GET /overview/admin)
Role management and employee firing
Salary adjustment

Contact Us Messages

Visitors can send messages (POST /contact-us)
Admin can view contact messages (GET /contact-messages)

Stripe Payment Integration

Create payment intents (POST /create-payment-intent)
Update payment info (PATCH /payments/:id)
Get payment by ID (GET /payments/:id)


🛡 API Route Summary



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



🚀 How to Run Locally

Clone the repo and install dependencies:

npm install


Create a .env file in the root directory with the following variables:

MONGODB_URI=your_mongodb_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
PORT=5000


Add your Firebase Admin SDK credentials JSON as firebase-admin-key.json in the root folder.

Start the server:


node server.js

Or for development with automatic reloads:
npm run dev

Your server will be running at http://localhost:5000.