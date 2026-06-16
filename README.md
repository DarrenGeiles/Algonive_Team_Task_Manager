# Algonive Internship: Task Management System for Small Teams

A robust, enterprise-grade task management web application where small teams or startups can assign, track, and manage their daily work efficiently. This tool simplifies collaborative task tracking, ensures smooth workflow management, and provides full organizational oversight. Built for the Algonive Web Development Internship.

## 🎯 Core Requirements

* **User Authentication:** Secure sign-up and login functionality protected by encrypted JSON Web Tokens (JWT) and bcrypt password hashing.
* **Task Assignment:** Users can create tasks and deploy them directly to specific team members.
* **Task Status Updates:** Interactive pipelines to shift task workflows between *Pending*, *In Progress*, and *Completed* states.
* **Deadline Reminders:** System accepts due dates and calculates approaching deadlines, triggering actionable visual notifications for the user.

## 🚀 Advanced & Enterprise Features Added

* **Strict Role-Based Access Control (RBAC):** 
  * **Admin:** Possesses global visibility, can assign tasks to anyone, and has absolute deletion clearance.
  * **Project Manager:** Can view and assign tasks to themselves or standard members, completely isolating them from Admin-level operations.
  * **Member:** Micro-focused viewport restricted entirely to their own personal assignment tracking.
* **Conditional Subtask Tracking Engine:** Features an inline visual progress bar calculating completion percentages in real time. Subtask checkboxes are securely locked and disabled until the assigned operative explicitly marks the master task as "In Progress."
* **Live System Audit Trail:** A slide-out chronological timeline drawer that permanently logs every system action (task deployment, milestone shifts, item completions, and deletions) to ensure complete organizational transparency and accountability.
* **Role-Protected Deletion Matrix:** Database verification restricts the deletion of tasks based on the user's operational clearance level and ownership of the specific task node.
* **Dynamic Scoped Filtering & Live Search:** A real-time regex search matrix evaluates keystrokes to instantly filter workflows. Admins and Managers utilize dynamic dropdowns to instantly reshape the dashboard around specific team members.
* **Premium Theme Engine & UI/UX:** Built on a Tailwind CSS v4 CSS-First architecture. Includes an instantaneous Dark Mode / Light Mode toggle, custom glassmorphism styling, translucent backing plates, and fluid spring animations powered by Framer Motion.

## 💻 Tech Stack

* **Backend:** Node.js, Express.js REST API
* **Frontend:** React, HTML5, CSS3, Tailwind CSS v4, Framer Motion
* **Database:** MySQL Relational Database
* **Security:** JSON Web Tokens (JWT) Session Middleware, bcryptjs

## 🛠️ How to Run Locally

1. Clone this repository to your local machine: `https://github.com/DarrenGeiles/Algonive_Team_Task_Manager.git`.
2. Open your local MySQL Workbench and create a new schema: `CREATE DATABASE algonive_task_manager;`.
3. Configure an environment profile named `.env` in the root `algonive-backend` directory with your local MySQL credentials and JWT secret:
```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=algonive_task_manager
   JWT_SECRET=your_secure_hash_secret_key
```
4. Open a terminal in the algonive-backend folder, install dependencies via npm install, and run the backend server via npm run dev.

5. Open a second terminal in the algonive-frontend folder, install dependencies via npm install, and run the React frontend via npm run dev.

6. Access the application in your browser at http://localhost:5173.

---
*Developed by Darren Wilfred Geiles for Algonive*