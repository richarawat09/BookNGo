# BookNGo — Multi-Role Appointment Booking & Waitlist Platform

> **Complete Schedulo-Inspired Booking Architecture**: Multi-portal platform featuring a **Role Selection Gateway (Customer / Provider / Admin)**, Gmail/Email authentication, interactive **Service Search & Time Slot Booking**, **Review & Rating System**, **Live Standby Waitlists**, and the **Schedulo Multi-Specialist Calendar Matrix**.

Inspired by [Schedulo — Waitlist View in Calendar Appointment Booking App by Bagus Fikri (Dribbble)](https://dribbble.com/shots/27287944-Schedulo-Waitlist-View-in-Calendar-Appointment-Booking-App).

---

## 🚀 Portals & Roles

### 1. 🚪 Login & Role Selection First
- **Login First**: First visit always launches directly to the clean Login Gateway with zero pre-made dummy businesses.
- **Role Selector**: Switch between 👤 **Customer**, 🏢 **Business / Provider**, and 🛡️ **Admin**.
- **Sign In & Registration Tabs**: Clean forms with no pre-filled fake text; allows sign in with any Gmail / Email & password.
- **Dynamic Business Registration**: Providers register their own business name and category to start receiving bookings.
- **Luxury Rose Pink Theme**: Modern Parisian blush pink color palette (`#F43F7A`, `#D8205E`, soft pearl rose surfaces `#FFF5F7`, and obsidian velvet dark mode).

---

### 2. 👤 Customer Portal: Search Services & Book a Slot
- **Service Discovery & Live Search**: Instant search for services (e.g. *Precision Haircut*, *Dental Scaling*, *Hydra-Facial*, *Personal Training*, *Calculus Tutoring*).
- **Category Filters**: Filter across *Beauty & Wellness*, *Salons & Spas*, *Healthcare & Clinics*, *Fitness & Sports*, *Education & Tutoring*, *Home Services*, and *Pet Care*.
- **Verified Business Cards**: View ratings, star reviews, address, open hours, and service prices.
- **Interactive Slot Booking Modal**:
  1. Select service & duration
  2. Select specialist (or any available specialist)
  3. Pick target date
  4. **Available Time Slots Grid**: Click any open slot badge (e.g. `09:30`, `11:00`, `14:30`) to confirm with 1 click.
  5. **Slot Full? Join Live Waitlist**: Standby button if slots are booked.
- **My Appointments & Standby Queue**:
  - Confirmed upcoming bookings with reference ID and cancellation option.
  - Standby waitlist tickets showing live queue position (e.g. `#1 in Standby Queue`).
  - Completed appointments with **"⭐ Write Review"** button.
- **Review & Feedback System**: Rate specialists with 1–5 stars and submit customer reviews directly attached to the provider's profile.

---

### 3. 🏢 Provider Portal: Schedulo Calendar & Waitlist Matrix
- **Staff Column Lanes**: Real-time specialist columns with workload percentage pills.
- **Micro-Interval Grid**: 30-minute interval slots from 08:00 to 19:00 with responsive duration sizing.
- **Live Time Indicator**: Dynamic glowing red indicator bar with live minute-by-minute position tracking.
- **Drag-and-Drop Slotting**: Pick up any waitlist ticket and drop it onto an open calendar slot to confirm.
- **⚡ Smart Match Engine**: 1-click scanner highlighting open slots in pulsating indigo that match waitlist durations.
- **📲 Simulated SMS Notification**: Realistic smartphone preview with a live 15-minute claim window and "Simulate Customer Replying YES" button.
- **Provider Account Login & Business Setup**: Log in with business email or register a custom shop without arbitrary dummy data.

---

### 4. 🛡️ Admin Portal: Platform Oversight & Approvals
- **Platform Analytics**: Total businesses, active bookings, registered clients, and active waitlist requests.
- **Business Verification Table**: One-click **Approve** or **Decline** actions for pending provider registrations.
- **Customer Dispute & Issue Reports**: Review and resolve customer dispute tickets.

---

## 🏗️ Architecture & File Structure

```
BookNGo/
├── index.html            # Multi-portal application (Auth, Customer, Provider, Admin)
├── css/
│   ├── variables.css     # Design tokens, color scales & theme variables (Light/Dark)
│   └── style.css         # Schedulo layout, marketplace cards, slot booking matrix & admin styles
├── js/
│   ├── data.js           # Seed data for 12 categories, providers, staff, and initial bookings
│   ├── store.js          # Multi-role authentication, reactive event store & LocalStorage persistence
│   ├── calendar.js       # Timeline grid renderer, drag-and-drop slots & live time bar
│   ├── waitlist.js       # Waitlist panel controller, real-time filtering & card drag handlers
│   └── app.js            # Main coordinator, slot booking engine, review system & modal controllers
└── README.md             # Project documentation & reference details
```

---

## 🏃 Running Locally

Run using Python 3:

```bash
python3 -m http.server 8000
```

Then open in your browser:
👉 **`http://localhost:8000`**

Or on macOS directly:
```bash
open index.html
```

---

## 💡 Quick Demo Credentials
- **Customer Role**: Email: `alex@demo.com` | Password: `password123`
- **Provider Role**: Email: `aurora@salon.com` | Password: `password123`
- **Admin Role**: Email: `admin@bookngo.com` | Password: `password123`

---

## 📄 License
MIT License. Crafted for **BookNGo**.
