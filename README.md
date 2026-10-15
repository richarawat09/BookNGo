# BookNGo — Multi-Role Appointment Booking & Waitlist Platform

> **Live Schedulo-Inspired Appointment Architecture**: High-velocity calendar booking with real-time waitlist queue management, customer service searching, live slot booking, verified review writing, and multi-role authentication.

---

## 🌟 Key Highlights & User Workflows

### 1. 🚪 Role Selection & Auth Gateway (Landing View)
- When opening the application, users are greeted with a clean **Role Selection Screen**:
  - 👤 **Customer**: Search services, book available time slots, track appointments & write reviews.
  - 🏢 **Business Provider**: Access the Schedulo timeline calendar, live waitlist queue & specialist workload.
  - 🛡️ **Administrator**: Platform overview, verify businesses, audit logs & dispute reviews.
- **Gmail / Password Authentication**: Sign in or register as any role with email and password.
- **1-Click Demo Logins**: Fast testing shortcuts for immediate evaluation of each role.
- **Instant Role Switching**: Any user can click `Switch Role / Log Out` at any time to test different roles seamlessly.

### 2. 👤 Customer Portal: Search, Slot Booking & Reviews
- **🔍 Service Discovery**: Search by keyword ("haircut", "facial", "dentist", "trainer") or filter by category pills (*Beauty, Salons, Healthcare, Fitness, Education, Home Repairs*).
- **📅 "Book a Slot" Matrix (Core Feature)**:
  - Select service, specialist, and target date.
  - Generates live available 30/45-minute slot pills (e.g. `09:30 AM`, `11:15 AM`, `02:30 PM`) avoiding conflicts with booked appointments.
  - One-click slot selection with instant confirmation ticket!
  - Integrated **"⏳ Join Standby Waitlist"** if direct slots are filled.
- **📋 My Bookings**:
  - Track upcoming appointments and cancel anytime to free up the slot.
  - Completed bookings feature a prominent **"⭐ Leave a Review"** button.
- **⭐ Verified Reviewing System**:
  - 1 to 5 star rating widget with feedback comments.
  - Submitting a review recalculates the provider's overall score in real time and appears in the customer's "My Reviews" tab.

### 3. 🏢 Provider Portal: Schedulo Calendar & Waitlist Panel
- **Staff Column Lanes**: Specialists listed across the top with real-time capacity and appointment load.
- **30-Min Interval Matrix**: Live red current-time bar, scheduled breaks, and interactive cards.
- **Live Waitlist Drawer**:
  - Standby queue with priority tags (*High Urgency, VIP, Flexible, Standard*).
  - ⚡ **Smart Match**: Pulses open calendar slots matching the client's service duration.
  - 📲 **SMS Simulator**: Previews notifications with a simulated customer reply.
  - **Drag-and-Drop**: Drag waitlist cards directly onto open calendar slots.

### 4. 🛡️ Admin Portal: Platform Oversight
- Platform KPI cards (Registered Businesses, Customers, Total Appointments, Platform Reviews).
- Business directory table with 1-click status toggles (*Active, Suspended, Pending*).

---

## 🏗️ Architecture & File Structure

```
BookNGo/
├── index.html            # Role Gateway, Customer Portal, Provider Schedulo Calendar & Modals
├── css/
│   ├── variables.css     # Design tokens, color scales & theme variables
│   └── style.css         # Modern styling for role gateway, catalog, slot picker, calendar & waitlist
├── js/
│   ├── data.js           # Comprehensive seed dataset for categories, providers & customers
│   ├── store.js          # Multi-role authentication, session management, booking & review storage
│   ├── calendar.js       # Schedulo staff timeline grid & drag-and-drop droppable lanes
│   ├── waitlist.js       # Waitlist panel controller, real-time filtering & card drag handlers
│   └── app.js            # Coordinator for auth routing, customer slot booking, and reviews
└── README.md             # Project documentation
```

---

## 🚀 How to Run Locally

### Option 1: Python HTTP Server (Recommended)
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your web browser.

### Option 2: Direct macOS Browser Launch
```bash
open index.html
```

---

## 📄 License
MIT License. Crafted with excellence for **BookNGo**.
