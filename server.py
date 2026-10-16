"""
BookNGo — Python Flask Backend & SQL API Service
Serves static frontend assets and RESTful relational endpoints connecting
Users, Providers, Services, Appointment Bookings, and Standby Waitlists.
"""

import os
import mimetypes
from flask import Flask, request, jsonify, send_from_directory
import database

# Initialize application and SQL database
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=BASE_DIR)
database.init_db()

# Enable CORS headers for all responses
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

def get_auth_token():
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header.split(' ', 1)[1].strip()
    return request.args.get('token', '').strip() or None


# ---------------------------------------------------------------------------
# Static Frontend File Serving
# ---------------------------------------------------------------------------
@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    file_path = os.path.join(BASE_DIR, filename)
    if os.path.isfile(file_path):
        mimetype, _ = mimetypes.guess_type(file_path)
        return send_from_directory(BASE_DIR, filename, mimetype=mimetype)
    return send_from_directory(BASE_DIR, 'index.html')


# ---------------------------------------------------------------------------
# Authentication Endpoints
# ---------------------------------------------------------------------------
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    role = data.get('role', 'customer').strip().lower()
    name = data.get('name', '').strip() or email.split('@')[0]
    phone = data.get('phone', '').strip()

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required."}), 400
    if len(password) < 4:
        return jsonify({"success": False, "error": "Password must be at least 4 characters long."}), 400
    if role not in ('customer', 'provider', 'admin'):
        return jsonify({"success": False, "error": "Invalid role specified."}), 400

    # Create User in SQL
    user, err = database.create_user(email=email, password=password, role=role, name=name, phone=phone)
    if err:
        return jsonify({"success": False, "error": err}), 400

    provider_profile = None
    # If Provider, register their business profile
    if role == 'provider':
        biz_name = data.get('businessName', '').strip() or f"{name}'s Services"
        biz_category = data.get('businessCategory', '').strip() or 'Beauty & Wellness'
        biz_cat_id = data.get('businessCategoryId', '').strip() or 'cat-beauty'
        biz_tagline = data.get('tagline', '').strip() or f"Specialized {biz_category}"
        biz_desc = data.get('description', '').strip() or f"Quality {biz_category} provided by {name}."
        biz_loc = data.get('location', '').strip() or 'Central District'
        biz_addr = data.get('address', '').strip() or '100 Main St, Suite 101'
        
        provider_profile, prov_err = database.register_provider_business(
            user_id=user['id'],
            business_name=biz_name,
            category=biz_category,
            category_id=biz_cat_id,
            tagline=biz_tagline,
            description=biz_desc,
            location=biz_loc,
            address=biz_addr,
            phone=phone,
            email=email,
            lead_specialist_name=name
        )

    # Issue Session Token
    token = database.create_session(user['id'], role)

    session_info = {
        "isLoggedIn": True,
        "token": token,
        "role": role,
        "id": user['id'],
        "customerId": user['id'] if role == 'customer' else None,
        "providerId": provider_profile['id'] if provider_profile else None,
        "email": user['email'],
        "name": user['name'],
        "phone": user['phone']
    }

    return jsonify({
        "success": True,
        "session": session_info,
        "user": user,
        "provider": provider_profile
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    role = data.get('role', None)
    if role:
        role = role.strip().lower()

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required."}), 400

    user, err = database.authenticate_user(email=email, password=password, role=role)
    if err:
        return jsonify({"success": False, "error": err}), 401

    token = database.create_session(user['id'], user['role'])

    provider_profile = None
    if user['role'] == 'provider':
        provider_profile = database.get_provider_by_user_id(user['id'])

    session_info = {
        "isLoggedIn": True,
        "token": token,
        "role": user['role'],
        "id": user['id'],
        "customerId": user['id'] if user['role'] == 'customer' else None,
        "providerId": provider_profile['id'] if provider_profile else None,
        "email": user['email'],
        "name": user['name'],
        "phone": user['phone']
    }

    return jsonify({
        "success": True,
        "session": session_info,
        "user": user,
        "provider": provider_profile
    })


@app.route('/api/auth/me', methods=['GET'])
def get_me():
    token = get_auth_token()
    if not token:
        return jsonify({"success": False, "error": "No session token provided"}), 401
    user = database.get_user_by_session(token)
    if not user:
        return jsonify({"success": False, "error": "Invalid or expired session"}), 401
    provider = None
    if user['role'] == 'provider':
        provider = database.get_provider_by_user_id(user['id'])
    return jsonify({
        "success": True,
        "user": user,
        "provider": provider
    })


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    token = get_auth_token()
    if token:
        database.delete_session(token)
    return jsonify({"success": True, "message": "Signed out successfully."})


# ---------------------------------------------------------------------------
# Categories & Marketplace Providers Endpoints
# ---------------------------------------------------------------------------
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, icon, description FROM categories;")
    categories = [dict(c) for c in cur.fetchall()]
    conn.close()
    return jsonify({"success": True, "categories": categories})


@app.route('/api/providers', methods=['GET'])
def list_providers():
    category = request.args.get('category')
    search = request.args.get('search')
    providers = database.get_all_providers(category=category, search=search)
    return jsonify({"success": True, "providers": providers})


@app.route('/api/providers/<provider_id>', methods=['GET'])
def get_provider(provider_id):
    provider = database.get_provider_by_id(provider_id)
    if not provider:
        return jsonify({"success": False, "error": "Provider not found"}), 404
    return jsonify({"success": True, "provider": provider})


@app.route('/api/customers', methods=['GET'])
def get_customers_endpoint():
    customers = database.get_all_customers()
    return jsonify({"success": True, "customers": customers})


# ---------------------------------------------------------------------------
# Bookings Endpoints
# ---------------------------------------------------------------------------
@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    customer_id = request.args.get('customer_id')
    provider_id = request.args.get('provider_id')
    date = request.args.get('date')
    bookings = database.get_bookings(customer_id=customer_id, provider_id=provider_id, date=date)
    return jsonify({"success": True, "bookings": bookings})


@app.route('/api/bookings', methods=['POST'])
def create_booking_endpoint():
    data = request.get_json() or {}
    customer_id = data.get('customerId') or data.get('customer_id')
    provider_id = data.get('providerId') or data.get('provider_id')
    service_id = data.get('serviceId') or data.get('service_id')
    worker_id = data.get('workerId') or data.get('worker_id')
    customer_name = data.get('customerName') or data.get('customer_name') or 'Customer'
    customer_email = data.get('customerEmail') or data.get('customer_email') or 'client@gmail.com'
    customer_phone = data.get('customerPhone') or data.get('customer_phone') or ''
    service_name = data.get('serviceName') or data.get('service_name') or 'Service'
    worker_name = data.get('workerName') or data.get('worker_name') or 'Specialist'
    provider_name = data.get('providerName') or data.get('provider_name') or 'Business'
    date = data.get('date')
    time = data.get('time')
    duration = int(data.get('duration') or 45)
    price = float(data.get('price') or 0.0)
    notes = data.get('notes')

    if not customer_id or not provider_id or not date or not time:
        return jsonify({"success": False, "error": "Missing required booking fields (customerId, providerId, date, time)."}), 400

    booking, err = database.create_booking(
        customer_id=customer_id,
        provider_id=provider_id,
        service_id=service_id,
        worker_id=worker_id,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        service_name=service_name,
        worker_name=worker_name,
        provider_name=provider_name,
        date=date,
        time=time,
        duration=duration,
        price=price,
        notes=notes
    )

    if err:
        return jsonify({"success": False, "error": err}), 400

    return jsonify({"success": True, "booking": booking}), 201


@app.route('/api/bookings/<booking_id>/status', methods=['PUT'])
def update_status(booking_id):
    data = request.get_json() or {}
    new_status = data.get('status')
    if new_status not in ('confirmed', 'completed', 'cancelled', 'pending'):
        return jsonify({"success": False, "error": "Invalid status."}), 400
    booking = database.update_booking_status(booking_id, new_status)
    if not booking:
        return jsonify({"success": False, "error": "Booking not found."}), 404
    return jsonify({"success": True, "booking": booking})


# ---------------------------------------------------------------------------
# Standby Waitlist Endpoints
# ---------------------------------------------------------------------------
@app.route('/api/waitlist', methods=['GET'])
def get_waitlist_endpoint():
    provider_id = request.args.get('provider_id')
    customer_id = request.args.get('customer_id')
    items = database.get_waitlist(provider_id=provider_id, customer_id=customer_id)
    return jsonify({"success": True, "waitlist": items})


@app.route('/api/waitlist', methods=['POST'])
def add_waitlist_endpoint():
    data = request.get_json() or {}
    customer_id = data.get('customerId') or data.get('customer_id')
    provider_id = data.get('providerId') or data.get('provider_id')
    service_id = data.get('serviceId') or data.get('service_id')
    customer_name = data.get('customerName') or data.get('customer_name') or 'Customer'
    customer_phone = data.get('customerPhone') or data.get('customer_phone') or ''
    service_name = data.get('serviceName') or data.get('service_name') or 'Service'
    preferred_date = data.get('preferredDate') or data.get('preferred_date')
    preferred_time_range = data.get('preferredTimeRange') or data.get('preferred_time_range') or 'Any Time'
    duration = int(data.get('duration') or 45)
    price = float(data.get('price') or 0.0)
    priority = data.get('priority') or 'normal'

    if not customer_id or not provider_id or not preferred_date:
        return jsonify({"success": False, "error": "Missing required waitlist fields."}), 400

    item = database.add_waitlist_entry(
        customer_id=customer_id,
        provider_id=provider_id,
        service_id=service_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        service_name=service_name,
        preferred_date=preferred_date,
        preferred_time_range=preferred_time_range,
        duration=duration,
        price=price,
        priority=priority
    )
    return jsonify({"success": True, "waitlist": item}), 201


@app.route('/api/waitlist/<waitlist_id>/assign', methods=['POST'])
def assign_waitlist_endpoint(waitlist_id):
    data = request.get_json() or {}
    worker_id = data.get('workerId') or data.get('worker_id')
    date = data.get('date')
    time = data.get('time')
    if not date or not time:
        return jsonify({"success": False, "error": "Date and time required to assign slot."}), 400

    booking, err = database.assign_waitlist_to_slot(waitlist_id, worker_id, date, time)
    if err:
        return jsonify({"success": False, "error": err}), 400
    return jsonify({"success": True, "booking": booking})


# ---------------------------------------------------------------------------
# Reviews Endpoints
# ---------------------------------------------------------------------------
@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    provider_id = request.args.get('provider_id')
    if not provider_id:
        return jsonify({"success": False, "error": "provider_id parameter required"}), 400
    reviews = database.get_reviews_for_provider(provider_id)
    return jsonify({"success": True, "reviews": reviews})


@app.route('/api/reviews', methods=['POST'])
def add_review_endpoint():
    data = request.get_json() or {}
    customer_id = data.get('customerId') or data.get('customer_id')
    provider_id = data.get('providerId') or data.get('provider_id')
    booking_id = data.get('bookingId') or data.get('booking_id')
    customer_name = data.get('customerName') or data.get('customer_name') or 'Customer'
    rating = int(data.get('rating') or 5)
    comment = data.get('comment', '').strip()

    if not customer_id or not provider_id or not comment:
        return jsonify({"success": False, "error": "Missing required review parameters."}), 400

    rev = database.add_review(
        customer_id=customer_id,
        provider_id=provider_id,
        customer_name=customer_name,
        rating=rating,
        comment=comment,
        booking_id=booking_id
    )
    return jsonify({"success": True, "review": rev}), 201


# ---------------------------------------------------------------------------
# Admin Endpoints
# ---------------------------------------------------------------------------
@app.route('/api/admin/metrics', methods=['GET'])
def admin_metrics():
    metrics = database.get_admin_metrics()
    return jsonify({"success": True, "metrics": metrics})


# ---------------------------------------------------------------------------
# Server Entrypoint
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"🚀 BookNGo Python SQL Backend running at http://localhost:{port}/")
    app.run(host='0.0.0.0', port=port, debug=True)
