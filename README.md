# BookNGo — Calendar Appointment & Waitlist Booking Platform

> **Live Schedulo-Inspired Appointment Architecture**: High-velocity calendar booking with real-time waitlist queue management, drag-and-drop slot assignment, intelligent capacity matching, and instant SMS/Email notification dispatch.

Inspired by [Schedulo — Waitlist View in Calendar Appointment Booking App by Bagus Fikri (Dribbble)](https://dribbble.com/shots/27287944-Schedulo-Waitlist-View-in-Calendar-Appointment-Booking-App), built with enhanced interactivity, provider authentication, and real-time state persistence.

---

## 🌟 Key Highlights & Features

### 1. 📅 Multi-Specialist Calendar Matrix (Timeline View)
- **Staff Column Lanes**: Real-time workload indicators for each specialist showing capacity rate and current appointments.
- **Micro-Interval Grid**: 30-minute and 1-hour gridlines from 08:00 to 19:00 with responsive pixel-perfect duration scaling.
- **Live Time Indicator**: Dynamic glowing red indicator bar with minute-by-minute live position tracking.
- **Interactive Slots**: Hover over any open slot to instantly launch booking or drag a waitlisted client directly into the slot.
- **Breaks & Off-Duty Styling**: Striped visual blocks preserving scheduled staff breaks and lunches.

### 2. ⏳ Schedulo Waitlist Queue & Slide-Over Panel
- **Real-Time Standby Queue**: Track unassigned clients with queue position badges (`#1 in Queue`, `#2 in Queue`).
- **Urgency & Priority Classification**:
  - 🚨 **High Urgency**: Cancellation seekers who can arrive within 15 minutes.
  - 💎 **VIP Clients**: High-frequency clients given priority access.
  - 🕒 **Flexible Windows**: Clients with adaptable morning/afternoon schedules.
  - 📋 **Standard Standby**: Regular date-requested bookings.
- **⚡ Smart Match Engine**: 1-click slot scanner that analyzes staff availability and service durations, highlighting matching open calendar slots with a pulsating glow.
- **📲 Simulated Client Notification**: Dispatches realistic SMS alerts with live 15-minute response windows.
- **Drag-and-Drop Slotting**: Native HTML5 drag-and-drop allows schedulers to pick up any waitlist card and drop it onto an open staff time slot to immediately confirm the booking.

### 3. 🏢 Provider Account & Business Onboarding
- **Multi-Category Architecture**: Built for Salons & Spas, Medical Clinics, Dental Practices, Fitness Studios, Private Tutors, and Professional Consultations.
- **Provider Account Login**: Business owners log in with their business email to manage their personalized calendar, staff, and waitlists.
- **On-the-Fly Business Registration**: Register a custom business account with custom services and staff members without arbitrary boilerplate.

### 4. 🌓 Executive Theme & Refined UX
- **Seamless Light & Dark Modes**: Obsidian dark mode and executive slate light mode with smooth CSS token transitions.
- **Global Command Palette (`⌘K` / `Ctrl+K`)**: Rapid keystroke searching across clients, services, bookings, and waitlist tickets.
- **KPI Metrics Ribbon**: Live updates for Today's Bookings, Available Slots, Active Waitlist, Staff Utilization %, and Est. Revenue.
- **Toast Notifications**: Interactive feedback on every booking, rescheduling, and notification dispatch.

---

## 🏗️ Architecture & File Structure

```
BookNGo/
├── index.html            # Main semantic application dashboard & modals
├── css/
│   ├── variables.css     # Design system tokens, color scales & theme variables
│   └── style.css         # Schedulo-inspired layout, calendar matrix & waitlist drawer styles
├── js/
│   ├── data.js           # Comprehensive seed dataset for categories, providers & customers
│   ├── store.js          # Reactive Pub-Sub store with LocalStorage persistence & Smart Match logic
│   ├── calendar.js       # Timeline grid renderer, drag-and-drop droppable lanes & time indicators
│   ├── waitlist.js       # Waitlist panel controller, real-time filtering & card drag handlers
│   └── app.js            # Main application coordinator, modals, command palette & toast system
└── README.md             # Project documentation & reference details
```

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser or run with a local HTTP server:

```bash
# Using Python 3
python3 -m http.server 8000

# Or using Node npx serve
npx serve .
```

Open `http://localhost:8000` to interact with the platform.

---

## 💡 Keyboard Shortcuts
- **`⌘K` / `Ctrl+K`**: Open global quick search command palette
- **`ESC`**: Close any active modal dialog or drawer

---

## 📄 License
MIT License. Crafted with excellence for **BookNGo**.
