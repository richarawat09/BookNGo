"""
BookNGo — Relational SQL Database Layer (SQLite + Foreign Keys)
Provides relational schema, foreign key enforcement, zero dummy data,
and comprehensive query operations for Users, Providers, Services,
Staff Workers, Bookings, Standby Waitlist, and Customer Reviews.
"""

import sqlite3
import os
import json
import uuid
import secrets
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bookngo.db')

DEFAULT_CATEGORIES = [
    {"id": "cat-beauty", "name": "Beauty & Wellness", "icon": "🌸", "description": "Skincare, makeup, and aesthetic wellness"},
    {"id": "cat-salon", "name": "Salons & Spas", "icon": "💇", "description": "Hair styling, coloring, manicures, and massages"},
    {"id": "cat-health", "name": "Healthcare & Clinics", "icon": "🩺", "description": "Medical clinics, dentists, physiotherapists, and specialists"},
    {"id": "cat-fitness", "name": "Fitness & Sports", "icon": "🏋️", "description": "Personal trainers, yoga studios, and athletic coaches"},
    {"id": "cat-education", "name": "Education & Tutoring", "icon": "📚", "description": "Academic tutors, language instructors, and test prep"},
    {"id": "cat-consulting", "name": "Professional Consultations", "icon": "💼", "description": "Legal advisers, tax consultants, and career coaches"},
    {"id": "cat-home", "name": "Home Services & Repairs", "icon": "🔧", "description": "Plumbing, electrical repairs, HVAC, and cleaning"},
    {"id": "cat-auto", "name": "Automotive Services", "icon": "🚗", "description": "Car detailing, mechanics, oil changes, and inspections"},
    {"id": "cat-photo", "name": "Photography & Events", "icon": "📸", "description": "Portrait studios, event photographers, and videography"},
    {"id": "cat-pet", "name": "Pet Care", "icon": "🐾", "description": "Veterinary clinics, dog grooming, and pet training"},
    {"id": "cat-other", "name": "Other Services", "icon": "⚡", "description": "Specialized and custom booked services"}
]

def get_connection():
    """Returns a SQLite connection with foreign key support and Row factory."""
    conn = sqlite3.connect(DB_FILE)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes all relational SQL tables with strict foreign keys."""
    conn = get_connection()
    cur = conn.cursor()

    # 1. Users Table (Customers, Providers, Admins)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('customer', 'provider', 'admin')),
            name TEXT NOT NULL,
            phone TEXT,
            avatar TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 2. Providers Table (Linked to users via foreign key)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS providers (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            category_id TEXT,
            tagline TEXT,
            description TEXT,
            location TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            open_time TEXT DEFAULT '09:00',
            close_time TEXT DEFAULT '18:00',
            slot_interval INTEGER DEFAULT 30,
            breaks_json TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)

    # 3. Services Table (Linked to providers via foreign key)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            provider_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            duration INTEGER NOT NULL DEFAULT 45,
            price REAL NOT NULL DEFAULT 0.0,
            category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
        );
    """)

    # 4. Workers Table (Staff specialists linked to providers via foreign key)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS workers (
            id TEXT PRIMARY KEY,
            provider_id TEXT NOT NULL,
            name TEXT NOT NULL,
            title TEXT,
            services_json TEXT DEFAULT '[]',
            working_days_json TEXT DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat"]',
            is_unavailable INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
        );
    """)

    # 5. Bookings Table (Connects Customers, Providers, Services, and Workers via foreign keys)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            booking_code TEXT UNIQUE NOT NULL,
            customer_id TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            service_id TEXT,
            worker_id TEXT,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT,
            service_name TEXT NOT NULL,
            worker_name TEXT,
            provider_name TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            duration INTEGER NOT NULL DEFAULT 45,
            price REAL NOT NULL DEFAULT 0.0,
            status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'completed', 'cancelled', 'pending')),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
            FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE SET NULL
        );
    """)

    # 6. Waitlist Table (Standby queue connecting Customers and Providers via foreign keys)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS waitlist (
            id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            service_id TEXT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT,
            service_name TEXT NOT NULL,
            preferred_date TEXT NOT NULL,
            preferred_time_range TEXT,
            duration INTEGER NOT NULL DEFAULT 45,
            price REAL NOT NULL DEFAULT 0.0,
            status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting', 'notified', 'booked', 'cancelled')),
            priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('normal', 'flexible', 'urgent', 'vip')),
            priority_label TEXT,
            position INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
        );
    """)

    # 7. Reviews Table (Customer reviews for providers & bookings)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            booking_id TEXT,
            customer_name TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
            comment TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
        );
    """)

    # 8. Sessions Table (Session tokens linked to users)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)

    # 9. Categories Table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            description TEXT
        );
    """)

    # Seed Service Categories (if empty)
    cur.execute("SELECT COUNT(*) AS count FROM categories;")
    if cur.fetchone()['count'] == 0:
        for cat in DEFAULT_CATEGORIES:
            cur.execute("""
                INSERT INTO categories (id, name, icon, description)
                VALUES (?, ?, ?, ?);
            """, (cat['id'], cat['name'], cat['icon'], cat['description']))

    # Seed default platform Admin user (if not exists)
    cur.execute("SELECT * FROM users WHERE email = 'admin@bookngo.com';")
    if not cur.fetchone():
        admin_id = "admin-" + secrets.token_hex(4)
        admin_pass_hash = generate_password_hash("admin123")
        cur.execute("""
            INSERT INTO users (id, email, password_hash, role, name, phone)
            VALUES (?, ?, ?, 'admin', 'Platform Administrator', '+1 (555) 000-0001');
        """, (admin_id, 'admin@bookngo.com', admin_pass_hash))

    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Authentication & User Operations
# ---------------------------------------------------------------------------
def create_user(email, password, role, name, phone=None, avatar=None):
    """Creates a new user record with hashed password."""
    conn = get_connection()
    cur = conn.cursor()
    clean_email = email.strip().lower()

    # Check existence
    cur.execute("SELECT id FROM users WHERE email = ?;", (clean_email,))
    if cur.fetchone():
        conn.close()
        return None, "An account with this email already exists. Please Sign In."

    user_id = f"usr-{secrets.token_hex(6)}"
    pw_hash = generate_password_hash(password)
    default_avatar = avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"

    try:
        cur.execute("""
            INSERT INTO users (id, email, password_hash, role, name, phone, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (user_id, clean_email, pw_hash, role, name, phone, default_avatar))
        conn.commit()
    except Exception as e:
        conn.close()
        return None, str(e)

    cur.execute("SELECT id, email, role, name, phone, avatar, created_at FROM users WHERE id = ?;", (user_id,))
    user = dict(cur.fetchone())
    conn.close()
    return user, None


def authenticate_user(email, password, role=None):
    """Authenticates email and password against SQL users table."""
    conn = get_connection()
    cur = conn.cursor()
    clean_email = email.strip().lower()

    if role:
        cur.execute("SELECT * FROM users WHERE email = ? AND role = ?;", (clean_email, role))
    else:
        cur.execute("SELECT * FROM users WHERE email = ?;", (clean_email,))
    
    user = cur.fetchone()
    if not user:
        conn.close()
        return None, f"No account found with email '{clean_email}'. Please create an account."

    if not check_password_hash(user['password_hash'], password):
        conn.close()
        return None, "Incorrect password. Please try again."

    user_dict = {
        "id": user['id'],
        "email": user['email'],
        "role": user['role'],
        "name": user['name'],
        "phone": user['phone'],
        "avatar": user['avatar'],
        "created_at": user['created_at']
    }

    # If provider, include their business profile id
    if user['role'] == 'provider':
        cur.execute("SELECT id, name FROM providers WHERE user_id = ?;", (user['id'],))
        prov = cur.fetchone()
        if prov:
            user_dict['provider_id'] = prov['id']
            user_dict['provider_name'] = prov['name']

    conn.close()
    return user_dict, None


def create_session(user_id, role):
    """Generates an authentication token and persists to sessions table."""
    conn = get_connection()
    cur = conn.cursor()
    token = "bng_tok_" + secrets.token_hex(18)
    cur.execute("INSERT INTO sessions (token, user_id, role) VALUES (?, ?, ?);", (token, user_id, role))
    conn.commit()
    conn.close()
    return token


def get_user_by_session(token):
    """Validates session token and returns active user dict."""
    if not token:
        return None
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT u.id, u.email, u.role, u.name, u.phone, u.avatar, u.created_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ?;
    """, (token,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return None
    user_dict = dict(row)
    if user_dict['role'] == 'provider':
        cur.execute("SELECT id, name FROM providers WHERE user_id = ?;", (user_dict['id'],))
        prov = cur.fetchone()
        if prov:
            user_dict['provider_id'] = prov['id']
            user_dict['provider_name'] = prov['name']
    conn.close()
    return user_dict


def delete_session(token):
    """Deletes session token on logout."""
    conn = get_connection()
    conn.execute("DELETE FROM sessions WHERE token = ?;", (token,))
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Provider & Business Profile Operations
# ---------------------------------------------------------------------------
def register_provider_business(user_id, business_name, category, category_id=None,
                               tagline=None, description=None, location=None,
                               address=None, phone=None, email=None,
                               open_time='09:00', close_time='18:00',
                               initial_services=None, lead_specialist_name=None):
    """Registers a new provider business linked directly to the provider user."""
    conn = get_connection()
    cur = conn.cursor()

    # Check if user already has a provider business
    cur.execute("SELECT id FROM providers WHERE user_id = ?;", (user_id,))
    if cur.fetchone():
        conn.close()
        return None, "A business profile is already associated with this user."

    provider_id = f"prov-{secrets.token_hex(6)}"
    cur.execute("""
        INSERT INTO providers (
            id, user_id, name, category, category_id, tagline, description,
            location, address, phone, email, open_time, close_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        provider_id, user_id, business_name, category, category_id or 'cat-other',
        tagline or f"Professional {category}", description or f"Welcome to {business_name}",
        location or "Main District", address or "Downtown Suite",
        phone, email, open_time, close_time
    ))

    # Add default specialist / worker
    worker_name = lead_specialist_name or f"{business_name} Lead Specialist"
    worker_id = f"wrk-{secrets.token_hex(5)}"
    cur.execute("""
        INSERT INTO workers (id, provider_id, name, title)
        VALUES (?, ?, ?, ?);
    """, (worker_id, provider_id, worker_name, "Master Specialist"))

    # Add initial services if provided, else create starter service
    created_service_ids = []
    if initial_services and isinstance(initial_services, list):
        for srv in initial_services:
            srv_id = f"srv-{secrets.token_hex(5)}"
            cur.execute("""
                INSERT INTO services (id, provider_id, name, description, duration, price, category)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (srv_id, provider_id, srv.get('name', 'General Service'),
                  srv.get('description', ''), int(srv.get('duration', 45)),
                  float(srv.get('price', 50.0)), category))
            created_service_ids.append(srv_id)
    else:
        srv_id = f"srv-{secrets.token_hex(5)}"
        cur.execute("""
            INSERT INTO services (id, provider_id, name, description, duration, price, category)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (srv_id, provider_id, f"Standard {category} Consultation", "Standard booked session", 45, 60.0, category))
        created_service_ids.append(srv_id)

    # Link created services to the lead worker
    cur.execute("""
        UPDATE workers SET services_json = ? WHERE id = ?;
    """, (json.dumps(created_service_ids), worker_id))

    conn.commit()
    conn.close()
    return get_provider_by_id(provider_id), None


def _format_provider(d):
    """Formats provider dict with camelCase aliases for the frontend."""
    if not d:
        return None
    d['categoryId'] = d.get('category_id') or ('cat-' + (d.get('category') or 'other').lower().replace(' ', '-'))
    d['openTime'] = d.get('open_time', '09:00')
    d['closeTime'] = d.get('close_time', '18:00')
    d['slotInterval'] = d.get('slot_interval', 30)
    d['userId'] = d.get('user_id')
    d['image'] = d.get('image') or 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80'
    d['status'] = d.get('status', 'active')
    d['workingDays'] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return d


def _format_booking(d):
    """Formats booking dict with camelCase aliases for the frontend."""
    if not d:
        return None
    d['bookingId'] = d.get('booking_code') or d.get('id')
    d['customerId'] = d.get('customer_id')
    d['providerId'] = d.get('provider_id')
    d['serviceId'] = d.get('service_id')
    d['workerId'] = d.get('worker_id')
    cust_name = d.get('customer_name')
    if not cust_name or cust_name.startswith('usr-') or cust_name.startswith('cust-'):
        cust_name = 'Client'
    d['customerName'] = cust_name
    d['customerEmail'] = d.get('customer_email') or ''
    d['customerPhone'] = d.get('customer_phone') or ''
    d['serviceName'] = d.get('service_name') or 'Service'
    d['workerName'] = d.get('worker_name') or 'Specialist'
    d['providerName'] = d.get('provider_name') or 'Provider'
    d['createdAt'] = d.get('created_at')
    return d


def _format_waitlist(d):
    """Formats waitlist dict with camelCase aliases for the frontend."""
    if not d:
        return None
    d['customerId'] = d.get('customer_id')
    d['providerId'] = d.get('provider_id')
    d['serviceId'] = d.get('service_id')
    d['customerName'] = d.get('customer_name')
    d['customerPhone'] = d.get('customer_phone')
    d['serviceName'] = d.get('service_name')
    d['preferredDate'] = d.get('preferred_date')
    d['preferredTimeRange'] = d.get('preferred_time_range')
    d['priorityLabel'] = d.get('priority_label')
    d['createdAt'] = d.get('created_at')
    return d


def _format_review(d):
    """Formats review dict with camelCase aliases for the frontend."""
    if not d:
        return None
    d['customerId'] = d.get('customer_id')
    d['providerId'] = d.get('provider_id')
    d['bookingId'] = d.get('booking_id')
    d['customerName'] = d.get('customer_name')
    d['createdAt'] = d.get('created_at')
    return d


def get_all_providers(category=None, search=None):
    """Retrieves all registered providers with attached services, workers, and ratings."""
    conn = get_connection()
    cur = conn.cursor()

    query = "SELECT * FROM providers WHERE 1=1"
    params = []

    if category and category.lower() != 'all':
        query += " AND (category = ? OR category_id = ?)"
        params.extend([category, category])

    if search:
        query += " AND (name LIKE ? OR description LIKE ? OR category LIKE ? OR address LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    query += " ORDER BY created_at DESC;"
    cur.execute(query, params)
    rows = cur.fetchall()

    providers = []
    for r in rows:
        p_dict = dict(r)
        pid = p_dict['id']

        # Fetch services
        cur.execute("SELECT id, name, description, duration, price, category FROM services WHERE provider_id = ?;", (pid,))
        p_dict['services'] = [dict(s) for s in cur.fetchall()]

        # Fetch workers
        cur.execute("SELECT id, name, title, services_json, working_days_json, is_unavailable FROM workers WHERE provider_id = ?;", (pid,))
        workers = []
        for w in cur.fetchall():
            w_dict = dict(w)
            w_dict['services'] = json.loads(w_dict.get('services_json') or '[]')
            w_dict['workingDays'] = json.loads(w_dict.get('working_days_json') or '[]')
            w_dict['isUnavailable'] = bool(w_dict.get('is_unavailable'))
            workers.append(w_dict)
        p_dict['workers'] = workers

        # Fetch rating stats
        cur.execute("SELECT AVG(rating) as avg_rating, COUNT(*) as rev_count FROM reviews WHERE provider_id = ?;", (pid,))
        stats = cur.fetchone()
        p_dict['rating'] = round(stats['avg_rating'] or 5.0, 1)
        p_dict['reviewCount'] = stats['rev_count'] or 0

        # Parse breaks
        p_dict['breaks'] = json.loads(p_dict.get('breaks_json') or '[]')
        providers.append(_format_provider(p_dict))

    conn.close()
    return providers


def get_provider_by_id(provider_id):
    """Retrieves a single provider with services, staff workers, breaks, and reviews."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM providers WHERE id = ?;", (provider_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return None

    p_dict = dict(row)
    # Services
    cur.execute("SELECT id, name, description, duration, price, category FROM services WHERE provider_id = ?;", (provider_id,))
    p_dict['services'] = [dict(s) for s in cur.fetchall()]

    # Workers
    cur.execute("SELECT id, name, title, services_json, working_days_json, is_unavailable FROM workers WHERE provider_id = ?;", (provider_id,))
    workers = []
    for w in cur.fetchall():
        w_dict = dict(w)
        w_dict['services'] = json.loads(w_dict.get('services_json') or '[]')
        w_dict['workingDays'] = json.loads(w_dict.get('working_days_json') or '[]')
        w_dict['isUnavailable'] = bool(w_dict.get('is_unavailable'))
        workers.append(w_dict)
    p_dict['workers'] = workers

    # Rating stats
    cur.execute("SELECT AVG(rating) as avg_rating, COUNT(*) as rev_count FROM reviews WHERE provider_id = ?;", (provider_id,))
    stats = cur.fetchone()
    p_dict['rating'] = round(stats['avg_rating'] or 5.0, 1)
    p_dict['reviewCount'] = stats['rev_count'] or 0
    p_dict['breaks'] = json.loads(p_dict.get('breaks_json') or '[]')

    conn.close()
    return _format_provider(p_dict)


def get_provider_by_user_id(user_id):
    """Finds provider profile for a specific user ID."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM providers WHERE user_id = ?;", (user_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return get_provider_by_id(row['id'])


def get_all_customers():
    """Returns list of registered customers from SQL users table."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, phone, avatar, created_at FROM users WHERE role = 'customer' ORDER BY name ASC;")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows


# ---------------------------------------------------------------------------
# Booking Operations
# ---------------------------------------------------------------------------
def create_booking(customer_id, provider_id, service_id, worker_id,
                   customer_name, customer_email, customer_phone,
                   service_name, worker_name, provider_name,
                   date, time, duration=45, price=0.0, notes=None):
    """Creates a new appointment booking record with relational foreign keys."""
    conn = get_connection()
    cur = conn.cursor()

    booking_id = f"bkg-{secrets.token_hex(6)}"
    booking_code = f"BNG-{secrets.token_hex(3).upper()}"

    # 1. Resolve or create customer in users table to satisfy foreign key constraint
    cur.execute("SELECT id FROM users WHERE id = ?;", (customer_id,))
    matched_cust = cur.fetchone()
    if not matched_cust and customer_email:
        cur.execute("SELECT id FROM users WHERE email = ?;", (customer_email.lower().strip(),))
        matched_cust = cur.fetchone()
        if matched_cust:
            customer_id = matched_cust['id']

    if not matched_cust:
        # User not found in users table yet; create them so foreign key constraint is satisfied
        new_cust_id = customer_id if (customer_id and customer_id.startswith('usr-')) else f"usr-{secrets.token_hex(6)}"
        clean_email = (customer_email or f"client_{secrets.token_hex(4)}@bookngo.com").lower().strip()
        cur.execute("SELECT id FROM users WHERE email = ?;", (clean_email,))
        existing_email_user = cur.fetchone()
        if existing_email_user:
            customer_id = existing_email_user['id']
        else:
            dummy_hash = generate_password_hash("clientpass123")
            cur.execute("""
                INSERT INTO users (id, email, password_hash, role, name, phone)
                VALUES (?, ?, ?, 'customer', ?, ?);
            """, (new_cust_id, clean_email, dummy_hash, customer_name or 'Client', customer_phone or ''))
            conn.commit()
            customer_id = new_cust_id

    # 2. Check service_id & worker_id validity against database tables
    if service_id:
        cur.execute("SELECT id FROM services WHERE id = ?;", (service_id,))
        if not cur.fetchone():
            service_id = None

    if worker_id:
        cur.execute("SELECT id FROM workers WHERE id = ?;", (worker_id,))
        if not cur.fetchone():
            worker_id = None

    # 3. Check worker collision at same date and time
    if worker_id:
        cur.execute("""
            SELECT id FROM bookings
            WHERE provider_id = ? AND worker_id = ? AND date = ? AND time = ? AND status != 'cancelled';
        """, (provider_id, worker_id, date, time))
        if cur.fetchone():
            conn.close()
            return None, "This time slot is already booked for this specialist. Please pick another slot."

    try:
        cur.execute("""
            INSERT INTO bookings (
                id, booking_code, customer_id, provider_id, service_id, worker_id,
                customer_name, customer_email, customer_phone, service_name,
                worker_name, provider_name, date, time, duration, price, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            booking_id, booking_code, customer_id, provider_id, service_id, worker_id,
            customer_name, customer_email, customer_phone, service_name,
            worker_name or 'Specialist', provider_name, date, time, duration, price, notes
        ))
        conn.commit()
    except Exception as e:
        conn.close()
        return None, str(e)

    cur.execute("SELECT * FROM bookings WHERE id = ?;", (booking_id,))
    bkg = dict(cur.fetchone())
    conn.close()
    return _format_booking(bkg), None


def get_bookings(customer_id=None, provider_id=None, date=None):
    """Fetches bookings filtered by customer, provider, or specific date."""
    conn = get_connection()
    cur = conn.cursor()

    query = "SELECT * FROM bookings WHERE 1=1"
    params = []

    if customer_id:
        query += " AND customer_id = ?"
        params.append(customer_id)
    if provider_id:
        query += " AND provider_id = ?"
        params.append(provider_id)
    if date:
        query += " AND date = ?"
        params.append(date)

    query += " ORDER BY date ASC, time ASC;"
    cur.execute(query, params)
    rows = [_format_booking(dict(r)) for r in cur.fetchall()]
    conn.close()
    return rows


def update_booking_status(booking_id, new_status):
    """Updates booking status (confirmed, completed, cancelled)."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE bookings SET status = ? WHERE id = ?;", (new_status, booking_id))
    conn.commit()
    cur.execute("SELECT * FROM bookings WHERE id = ?;", (booking_id,))
    row = cur.fetchone()
    conn.close()
    return _format_booking(dict(row)) if row else None


# ---------------------------------------------------------------------------
# Standby Waitlist Operations
# ---------------------------------------------------------------------------
def add_waitlist_entry(customer_id, provider_id, service_id,
                       customer_name, customer_phone, service_name,
                       preferred_date, preferred_time_range='Any Time',
                       duration=45, price=0.0, priority='normal'):
    """Adds a standby waitlist request with foreign keys."""
    conn = get_connection()
    cur = conn.cursor()

    wl_id = f"wl-{secrets.token_hex(6)}"

    # Resolve or create customer in users table to satisfy foreign key constraint
    cur.execute("SELECT id FROM users WHERE id = ?;", (customer_id,))
    matched_cust = cur.fetchone()
    if not matched_cust:
        new_cust_id = customer_id if (customer_id and str(customer_id).startswith('usr-')) else f"usr-{secrets.token_hex(6)}"
        clean_email = f"client_{secrets.token_hex(4)}@bookngo.com"
        dummy_hash = generate_password_hash("clientpass123")
        cur.execute("""
            INSERT INTO users (id, email, password_hash, role, name, phone)
            VALUES (?, ?, ?, 'customer', ?, ?);
        """, (new_cust_id, clean_email, dummy_hash, customer_name or 'Client', customer_phone or ''))
        conn.commit()
        customer_id = new_cust_id

    if service_id:
        cur.execute("SELECT id FROM services WHERE id = ?;", (service_id,))
        if not cur.fetchone():
            service_id = None

    # Determine position
    cur.execute("""
        SELECT COUNT(*) AS count FROM waitlist
        WHERE provider_id = ? AND preferred_date = ? AND status = 'waiting';
    """, (provider_id, preferred_date))
    position = cur.fetchone()['count'] + 1

    priority_labels = {
        'urgent': '⚡ High Urgency (Immediate)',
        'vip': '💎 VIP Client Priority',
        'flexible': '🕒 Flexible Window',
        'normal': 'Standby'
    }

    cur.execute("""
        INSERT INTO waitlist (
            id, customer_id, provider_id, service_id, customer_name, customer_phone,
            service_name, preferred_date, preferred_time_range, duration, price,
            status, priority, priority_label, position
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting', ?, ?, ?);
    """, (
        wl_id, customer_id, provider_id, service_id, customer_name, customer_phone,
        service_name, preferred_date, preferred_time_range, duration, price,
        priority, priority_labels.get(priority, 'Standby'), position
    ))
    conn.commit()
    cur.execute("SELECT * FROM waitlist WHERE id = ?;", (wl_id,))
    wl = dict(cur.fetchone())
    conn.close()
    return _format_waitlist(wl)


def get_waitlist(provider_id=None, customer_id=None):
    """Retrieves waitlist entries for a provider or customer."""
    conn = get_connection()
    cur = conn.cursor()

    query = "SELECT * FROM waitlist WHERE 1=1"
    params = []
    if provider_id:
        query += " AND provider_id = ?"
        params.append(provider_id)
    if customer_id:
        query += " AND customer_id = ?"
        params.append(customer_id)

    query += " ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'vip' THEN 2 ELSE 3 END, position ASC;"
    cur.execute(query, params)
    rows = [_format_waitlist(dict(r)) for r in cur.fetchall()]
    conn.close()
    return rows


def assign_waitlist_to_slot(waitlist_id, worker_id, date, time):
    """Promotes a waitlist standby entry into a confirmed booking."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM waitlist WHERE id = ?;", (waitlist_id,))
    wl = cur.fetchone()
    if not wl:
        conn.close()
        return None, "Waitlist entry not found."

    wl_dict = dict(wl)
    provider = get_provider_by_id(wl_dict['provider_id'])
    if not provider:
        conn.close()
        return None, "Associated provider not found."

    # Find worker name
    worker_name = "Assigned Specialist"
    for w in provider.get('workers', []):
        if w['id'] == worker_id:
            worker_name = w['name']
            break

    # Get customer email
    cur.execute("SELECT email FROM users WHERE id = ?;", (wl_dict['customer_id'],))
    cust_user = cur.fetchone()
    cust_email = cust_user['email'] if cust_user else "client@bookngo.com"

    # Create confirmed booking
    booking, err = create_booking(
        customer_id=wl_dict['customer_id'],
        provider_id=wl_dict['provider_id'],
        service_id=wl_dict['service_id'],
        worker_id=worker_id,
        customer_name=wl_dict['customer_name'],
        customer_email=cust_email,
        customer_phone=wl_dict['customer_phone'],
        service_name=wl_dict['service_name'],
        worker_name=worker_name,
        provider_name=provider['name'],
        date=date,
        time=time,
        duration=wl_dict['duration'],
        price=wl_dict['price'],
        notes=f"Slotted from standby waitlist (Priority: {wl_dict['priority']})"
    )

    if err:
        conn.close()
        return None, err

    # Mark waitlist item as booked
    cur.execute("UPDATE waitlist SET status = 'booked' WHERE id = ?;", (waitlist_id,))
    conn.commit()
    conn.close()
    return booking, None


# ---------------------------------------------------------------------------
# Reviews Operations
# ---------------------------------------------------------------------------
def add_review(customer_id, provider_id, customer_name, rating, comment, booking_id=None):
    """Inserts a verified customer review."""
    conn = get_connection()
    cur = conn.cursor()
    rev_id = f"rev-{secrets.token_hex(6)}"
    cur.execute("""
        INSERT INTO reviews (id, customer_id, provider_id, booking_id, customer_name, rating, comment)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    """, (rev_id, customer_id, provider_id, booking_id, customer_name, rating, comment))
    conn.commit()
    cur.execute("SELECT * FROM reviews WHERE id = ?;", (rev_id,))
    rev = dict(cur.fetchone())
    conn.close()
    return _format_review(rev)


def get_reviews_for_provider(provider_id):
    """Fetches all customer reviews for a provider."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM reviews WHERE provider_id = ? ORDER BY created_at DESC;", (provider_id,))
    rows = [_format_review(dict(r)) for r in cur.fetchall()]
    conn.close()
    return rows


# ---------------------------------------------------------------------------
# Platform Overview (Admin)
# ---------------------------------------------------------------------------
def get_admin_metrics():
    """Calculates live platform KPIs from SQL tables."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) AS total_users FROM users;")
    total_users = cur.fetchone()['total_users']

    cur.execute("SELECT COUNT(*) AS total_providers FROM providers;")
    total_providers = cur.fetchone()['total_providers']

    cur.execute("SELECT COUNT(*) AS total_bookings, COALESCE(SUM(price), 0) AS total_revenue FROM bookings WHERE status != 'cancelled';")
    bkg_stats = cur.fetchone()

    cur.execute("SELECT COUNT(*) AS total_waitlist FROM waitlist WHERE status = 'waiting';")
    total_waitlist = cur.fetchone()['total_waitlist']

    conn.close()
    return {
        "total_users": total_users,
        "total_providers": total_providers,
        "total_bookings": bkg_stats['total_bookings'],
        "total_revenue": round(bkg_stats['total_revenue'], 2),
        "active_waitlist": total_waitlist
    }
