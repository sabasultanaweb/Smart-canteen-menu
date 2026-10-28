# 🍔 Smart Canteen Menu & Live Kitchen Pickup Portal

> A full-stack, real-time college canteen ordering, kitchen display, and digital token management system built with **Vanilla HTML/CSS/JavaScript**, **Node.js/Express.js**, **WebSockets**, and **Supabase PostgreSQL**.

---

## 1. Project Overview & Features

### 🌟 Overview
In busy college campuses, lunch and break hours often create long lines at canteen counters, leading to wasted student time, order confusion, and food delays. 
**Smart Canteen Menu** solves this challenge by providing an end-to-end digital ordering kiosk:
- Students can browse the live canteen menu on their phone or laptop.
- Filter by category, pure vegetarian diet, or budget meals (under ₹50).
- Add dishes to their personal food tray, enter their student ID, and place orders.
- Receive a unique digital token (e.g. `CAN-101`) with an estimated cooking time.
- Watch live token status updates on a smart digital pickup board or track their order step-by-step.
- Canteen staff have a dedicated operations portal to view incoming orders, advance kitchen status, and update menu prices and item availability in real time.

### 🚀 Key Features
1. **Interactive Canteen Menu**:
   - Categorized by Breakfast, Meals & Thalis, Snacks & Quick Bites, Beverages, and Healthy Picks.
   - Dietary tags (Pure Veg 🌱 vs Non-Veg 🍗), pricing, preparation time, and live stock indicators ("In Stock" vs "Sold Out").
   - Instant search and multi-criteria sorting (Price Low to High, High to Low, Fastest Prep).
2. **Food Tray (Cart Drawer) & Checkout**:
   - Slide-out cart tray with quantity adjusters (`+` / `-` / remove).
   - Form validation for student name, roll number, contact phone, and counter selection.
   - Immediate generation of digital token receipt upon order submission.
3. **Smart TV / Kiosk Live Token Board**:
   - Dual-column real-time display: **Now Preparing in Kitchen** vs **Ready for Counter Pickup**.
   - Real-time notification broadcast using WebSockets when a token is marked ready.
4. **Order Status Tracking Stepper**:
   - 4-stage visual progress timeline: *Order Received* ➔ *In Kitchen* ➔ *Ready at Counter* ➔ *Picked Up*.
5. **Canteen Staff / Admin Operations Dashboard**:
   - Live revenue and order metrics (Total Orders, Gross Revenue, Orders in Kitchen, Ready for Pickup).
   - Advance order status with one click (`Pending` ➔ `Preparing` ➔ `Ready` ➔ `Completed`).
   - One-click stock availability toggle ("In Stock" / "Sold Out") when canteen ingredients run low.
   - Full CRUD: Add new dishes, edit existing dishes, and delete menu items.
6. **Resilient Architecture**:
   - Production-ready Supabase PostgreSQL client integration.
   - Automatic built-in demo fallback mode if `.env` keys have not yet been provided, guaranteeing the project works immediately for viva demonstrations.

### 🛠️ Technology Stack
- **Frontend**: HTML5, Modern CSS3 (CSS Variables, Flexbox, CSS Grid, Glassmorphic UI), Vanilla JavaScript (ES6+), Lucide Icons.
- **Backend**: Node.js, Express.js REST API, HTTP Server, WebSockets (`ws`).
- **Database**: Supabase PostgreSQL (Managed Relational Database with Row Level Security & Triggers).
- **Client-Server Communication**: Fetch API (Async/Await) & WebSocket event stream.
- **Version Control**: Git & GitHub.

---

## 2. Prerequisites & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 16.x, 18.x, 20.x, or higher)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- A modern web browser (Google Chrome, Microsoft Edge, Firefox, or Safari)
- (Optional for cloud database) A free [Supabase](https://supabase.com/) account

### Installation Steps
Open your terminal (or PowerShell on Windows) and navigate into the `backend` directory of the project:

```bash
cd smart-canteen-menu/backend
```

Run the following command to install all dependencies declared in `package.json`:

```bash
npm install
```

> **Note for Beginners:** All required packages are already pre-configured in `package.json`. If you ever need to manually install them one by one, you can run:
> ```bash
> npm install express cors dotenv @supabase/supabase-js ws
> npm install --save-dev nodemon
> ```

---

## 3. Supabase Project Creation & SQL Schema Setup

Follow these simple steps to set up your free PostgreSQL database in the cloud:

1. Visit [https://supabase.com](https://supabase.com) and sign in or create a free account.
2. Click **"New Project"**.
3. Choose your organization, set the project name (e.g., `smart-canteen-menu`), set a secure database password, and select the region nearest to you.
4. Click **"Create new project"** and wait ~1-2 minutes for Supabase to provision your PostgreSQL database.
5. In your Supabase dashboard, click on **"SQL Editor"** in the left sidebar navigation.
6. Click **"New query"**.
7. Open the file `database/schema.sql` located inside this project folder, copy all of its contents, and paste them into the Supabase SQL editor.
8. Click **"Run"** (or press `Ctrl + Enter`).
9. You should see a success message: `Success. No rows returned`.
10. Navigate to **"Table Editor"** in the left sidebar. You will see three tables created with pre-populated college canteen starter items:
    - `menu_items` (12 campus dishes pre-seeded)
    - `orders`
    - `order_items`

---

## 4. Environment Variable Configuration

1. In the `backend/` directory, locate the template file named `.env.example`.
2. Create a copy of `.env.example` and name the new file `.env`:
   - On Windows PowerShell:
     ```powershell
     copy .env.example .env
     ```
   - On Linux / macOS:
     ```bash
     cp .env.example .env
     ```
3. Open `backend/.env` in your code editor.
4. Retrieve your Supabase API credentials:
   - Go to your Supabase Dashboard: `https://supabase.com/dashboard/project/<your-project-id>/settings/api`
   - Copy **Project URL** (e.g., `https://xyzproject.supabase.co`).
   - Copy the **anon / public** API Key (under "Project API keys").
5. Update your `backend/.env` file:
   ```env
   PORT=5000
   SUPABASE_URL=https://your-actual-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key-here
   NODE_ENV=development
   ```

> 🔒 **Security Notice:** Never commit your `.env` file to GitHub or share your private API keys. The `.gitignore` file included in this project automatically prevents `.env` from being tracked.

---

## 5. Backend & Frontend Startup

### Step 1: Start the Backend Server
In your terminal, navigate to the `backend` folder and run:

```bash
cd smart-canteen-menu/backend
npm start
```
*(Or use `npm run dev` to start with nodemon auto-reloading during development).*

You should see output similar to:
```text
======================================================
🚀 Smart Canteen Menu Server running at http://localhost:5000
📡 WebSocket real-time updates enabled on ws://localhost:5000
📋 API Health: http://localhost:5000/api/health
🍔 Menu API: http://localhost:5000/api/menu
======================================================
```

### Step 2: Open the Frontend Application
You have two simple options:

**Option A (Recommended):**
Open your web browser and navigate directly to:
👉 [http://localhost:5000](http://localhost:5000)

*(The Express backend automatically serves the frontend files!)*

**Option B (Direct File Access or Live Server):**
Open `smart-canteen-menu/frontend/index.html` directly in your browser or with VS Code's "Live Server" extension. The client JavaScript automatically detects and connects to the backend API at `http://localhost:5000`.

---

## 6. API Endpoints & Testing Instructions

The Express backend exposes RESTful endpoints under `/api`. You can test these in your browser, via Postman, or using `curl`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check, Supabase connection status, and active WebSocket client count |
| `GET` | `/api/menu` | List all menu items (Supports query filters: `?category=Snacks&veg=true&search=Dosa`) |
| `GET` | `/api/menu/:id` | Get details of a single dish by UUID |
| `POST` | `/api/menu` | Create a new canteen dish (Admin/Staff) |
| `PUT` | `/api/menu/:id` | Update dish details (name, price, preparation time, description) |
| `PATCH` | `/api/menu/:id/toggle` | Toggle dish stock availability (`is_available`: true/false) |
| `DELETE` | `/api/menu/:id` | Remove a dish from the menu |
| `GET` | `/api/orders` | Fetch all orders with nested `order_items` |
| `GET` | `/api/orders/token/:token` | Lookup order by token number (e.g. `CAN-101`) |
| `POST` | `/api/orders` | Place a new order (generates token, saves order & items, broadcasts live event) |
| `PATCH` | `/api/orders/:id/status` | Update order status (`Pending`, `Preparing`, `Ready`, `Completed`, `Cancelled`) |
| `GET` | `/api/stats` | Analytics summary (total orders, total revenue, kitchen workload) |

### Quick CLI Testing with curl:
```bash
# 1. Health check
curl http://localhost:5000/api/health

# 2. Get all breakfast items
curl "http://localhost:5000/api/menu?category=Breakfast"

# 3. Track order CAN-101
curl http://localhost:5000/api/orders/token/CAN-101
```

---

## 7. Git & GitHub Submission Guide

Follow these commands to push the project to your GitHub repository:

```bash
# 1. Initialize git repository in the project root
cd smart-canteen-menu
git init

# 2. Add all files (the provided .gitignore prevents node_modules and .env from being tracked)
git add .

# 3. Create initial commit
git commit -m "feat: complete smart canteen menu full-stack project"

# 4. Create a new repository on https://github.com/new (e.g. smart-canteen-menu)
# 5. Link local repository to GitHub and push:
git remote add origin https://github.com/your-username/smart-canteen-menu.git
git branch -M main
git push -u origin main
```

---

## 8. Common Errors & Troubleshooting

1. **`Error: Cannot find module 'express'`**:
   - **Cause**: Dependencies have not been installed.
   - **Fix**: Open terminal, change directory to `backend`, and execute `npm install`.

2. **`Port 5000 is already in use (EADDRINUSE)`**:
   - **Cause**: Another service or previous node instance is occupying port 5000.
   - **Fix**: Change `PORT=5001` in your `backend/.env` file, or stop the conflicting process.

3. **`Supabase credentials not found or set to default placeholders`**:
   - **Cause**: You haven't created a `.env` file from `.env.example` with your real Supabase project URL and anon key.
   - **Fix**: Create `backend/.env`, paste your credentials, and restart the backend. *Note: The system gracefully runs in local demo memory mode so your project continues to work even before you set up your database.*

4. **Cart appears empty after closing browser**:
   - The application stores cart tray data in the browser's `localStorage`. Ensure your browser does not have storage disabled in incognito settings.

5. **WebSocket Disconnected / Reconnecting pill**:
   - Ensure the backend server is running on `http://localhost:5000`. The client script automatically attempts automatic reconnection with exponential backoff.

---

## 9. Known Limitations & Educational Notes

1. **Authentication**: In this beginner-friendly 3-day project scope, staff management does not require OAuth or JWT user authentication so that examiners and students can freely inspect both student and staff perspectives without complex login screens.
2. **Payment Gateway**: The system models campus counter payments (UPI QR scan or Cash upon pickup token verification). In a commercial enterprise release, an online payment SDK (such as Razorpay or Stripe) would be integrated.
3. **Multi-Canteen Support**: The current database schema is designed for a single campus dining hall with multiple pickup counters (Counter 1 & Counter 2).

---

## 10. Project Demonstration Script (Viva / Presentation)

When presenting this project to your professor or examiner, follow this 2-minute walkthrough:

1. **Introduction**:
   - *"Good morning! Today I am presenting CampusBite: Smart Canteen Menu & Live Kitchen Pickup Portal, designed to eliminate canteen queues and streamline food preparation for college students."*
2. **Student Experience**:
   - Open `http://localhost:5000`.
   - Point out the modern interface, responsive layout, and live health sync indicator.
   - Click on the **Pure Veg** filter or search for *"Dosa"*.
   - Click **"Add to Tray"** on *Crispy Masala Dosa* and *Iced Cold Coffee*.
   - Open the **Food Tray**, fill in student name (`Rahul Sharma`), roll number (`CS2024-042`), and select *Counter 1*.
   - Click **"Place Order & Get Token"**.
   - Show the generated token receipt (e.g. `CAN-104`).
3. **Real-time Live Token Board**:
   - Navigate to the **"Live Token Board"** tab.
   - Show that token `CAN-104` is instantly listed under **"Now Preparing in Kitchen"**.
4. **Staff Operations & Real-Time Sync**:
   - Open the **"Staff Portal"** tab.
   - Show the analytics cards (Total Orders, Revenue ₹).
   - Find order `CAN-104` in the queue and click **"Ready"**.
   - Point out that the token board and tracking timeline instantly transition to **"Ready for Counter Pickup"** without refreshing the page!
5. **Database Inspection**:
   - Switch to the Supabase dashboard and show the new record in the `orders` and `order_items` tables.

---

## 11. Five Beginner-Friendly Viva Questions & Answers

### Q1: Why did you choose Vanilla JavaScript instead of a frontend framework like React?
**Answer:** Vanilla JavaScript runs natively in any browser without build tools, bundling, or heavy compilation steps. It allows beginner developers to master the core fundamentals of DOM manipulation, asynchronous programming with the Fetch API, and event handling while maintaining maximum rendering performance and zero dependency overhead.

### Q2: How does the client communicate with the backend Express server?
**Answer:** The frontend uses the native JavaScript `fetch()` API with `async/await` to send HTTP requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) to the Express REST API endpoints. Data is transmitted in JSON format with appropriate HTTP status codes (200 OK, 201 Created, 400 Bad Request, 500 Server Error). Additionally, a WebSocket connection (`ws`) is maintained for real-time live events.

### Q3: What is the purpose of Row Level Security (RLS) in Supabase PostgreSQL?
**Answer:** Row Level Security (RLS) is a PostgreSQL security feature that controls which database rows can be viewed, inserted, updated, or deleted based on security policies. It ensures that API callers can only access data according to defined rules, preventing unauthorized database tampering even if client-side code interacts with the database.

### Q4: How is the unique Token Number generated for each canteen order?
**Answer:** When an order payload is submitted to `POST /api/orders`, the Express backend validates the student details and selected items, calculates the total price, and assigns a unique sequential token identifier (such as `CAN-104`). This token is indexed in the PostgreSQL database and serves as the identifier for both kitchen preparation screens and student pickup verification.

### Q5: What role do WebSockets play in this canteen management application?
**Answer:** While standard HTTP REST APIs follow a request-response model where the client must repeatedly ask the server for updates (polling), WebSockets establish a persistent, bidirectional communication channel. When canteen staff advance an order from "Preparing" to "Ready", the server broadcasts an event over WebSockets, instantly notifying the digital token display board and the student's tracker without requiring manual page reloads.

---
*Created for Academic Excellence & Modern Web Development Practice.*
