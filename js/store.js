/**
 * BookNGo — Store & State Management
 * Handles LocalStorage persistence, reactive events, and business logic
 * for appointments, providers, staff schedules, and waitlist queues.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    PROVIDERS: 'bng_providers_v1',
    BOOKINGS: 'bng_bookings_v1',
    WAITLIST: 'bng_waitlist_v1',
    CUSTOMERS: 'bng_customers_v1',
    CURRENT_USER: 'bng_current_user_session',
    SELECTED_PROVIDER: 'bng_selected_provider_id',
    SELECTED_DATE: 'bng_selected_date',
    VIEW: 'bng_calendar_view',
    THEME: 'bng_theme'
  };

  class Store {
    constructor() {
      this.subscribers = {};
      this.initStorage();
    }

    initStorage() {
      // Initialize providers
      if (!localStorage.getItem(STORAGE_KEYS.PROVIDERS)) {
        localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(window.INITIAL_PROVIDERS || []));
      }
      // Initialize customers
      if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(window.INITIAL_CUSTOMERS || []));
      }
      // Initialize bookings
      if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(window.INITIAL_BOOKINGS || []));
      }
      // Initialize waitlist
      if (!localStorage.getItem(STORAGE_KEYS.WAITLIST)) {
        localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(window.INITIAL_WAITLIST || []));
      }
      // Initialize current logged-in user / provider session: default to null so Role Selection shows first!
      if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify({ isLoggedIn: false }));
      }
      // Initialize reviews
      if (!localStorage.getItem('bng_reviews_v1')) {
        localStorage.setItem('bng_reviews_v1', JSON.stringify(window.INITIAL_REVIEWS || []));
      }
      // Initialize reports
      if (!localStorage.getItem('bng_reports_v1')) {
        localStorage.setItem('bng_reports_v1', JSON.stringify(window.INITIAL_REPORTS || []));
      }
      // Selected Provider
      if (!localStorage.getItem(STORAGE_KEYS.SELECTED_PROVIDER)) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, 'prov-1');
      }
      // Selected Date (defaults to today)
      if (!localStorage.getItem(STORAGE_KEYS.SELECTED_DATE)) {
        const todayStr = (window.getDateOffset ? window.getDateOffset(0) : new Date().toISOString().split('T')[0]);
        localStorage.setItem(STORAGE_KEYS.SELECTED_DATE, todayStr);
      }
      // View mode: 'timeline' | 'week' | 'day' | 'waitlist-board'
      if (!localStorage.getItem(STORAGE_KEYS.VIEW)) {
        localStorage.setItem(STORAGE_KEYS.VIEW, 'timeline');
      }
      // Theme: 'light' | 'dark'
      if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
        localStorage.setItem(STORAGE_KEYS.THEME, 'light');
      }
    }

    // Session & Multi-Role Authentication (Customer, Provider, Admin)
    getCurrentSession() {
      try {
        const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
        return s && s.isLoggedIn ? s : null;
      } catch (e) {
        return null;
      }
    }

    login(role, email, password) {
      const cleanEmail = (email || '').trim().toLowerCase();

      if (role === 'admin') {
        const session = {
          isLoggedIn: true,
          role: 'admin',
          id: 'admin-1',
          name: 'Platform Administrator',
          email: cleanEmail || 'admin@bookngo.com'
        };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
        this.emit('session_changed', session);
        return session;
      }

      if (role === 'customer') {
        const customers = this.getCustomers();
        let matched = customers.find(c => (c.email || '').toLowerCase() === cleanEmail);
        if (!matched) {
          // Register as customer automatically
          matched = {
            id: 'cust-' + Date.now().toString(36),
            name: cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            email: cleanEmail,
            phone: '+1 (555) 789-0011',
            role: 'customer',
            joinedDate: new Date().toISOString().split('T')[0],
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
          };
          this.addCustomer(matched);
        }

        const session = {
          isLoggedIn: true,
          role: 'customer',
          id: matched.id,
          customerId: matched.id,
          name: matched.name,
          email: matched.email,
          phone: matched.phone,
          avatar: matched.avatar
        };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
        this.emit('session_changed', session);
        return session;
      }

      if (role === 'provider') {
        return this.loginAsProvider(cleanEmail, password);
      }

      return null;
    }

    registerCustomer({ name, email, phone, password }) {
      const cleanEmail = (email || '').trim().toLowerCase();
      const customers = this.getCustomers();
      let customer = customers.find(c => c.email.toLowerCase() === cleanEmail);
      if (!customer) {
        customer = {
          id: 'cust-' + Date.now().toString(36),
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: phone || '+1 (555) 000-0000',
          role: 'customer',
          joinedDate: new Date().toISOString().split('T')[0],
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
        };
        this.addCustomer(customer);
      }
      return this.login('customer', cleanEmail, password);
    }

    loginAsProvider(email, password) {
      const providers = this.getProviders();
      const cleanEmail = (email || '').trim().toLowerCase();
      let matched = providers.find(p => (p.email || '').toLowerCase() === cleanEmail);

      // If provider not found by exact email, allow logging into first matching or create new
      if (!matched) {
        matched = providers.find(p => (p.name || '').toLowerCase().includes(cleanEmail.split('@')[0]));
      }

      if (!matched) {
        // Automatically create business account for this provider
        matched = this.registerProviderBusiness({
          name: cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' Studio',
          email: cleanEmail,
          category: 'Salons & Spas',
          location: 'Main Center'
        });
      }

      const session = {
        isLoggedIn: true,
        role: 'provider',
        id: matched.id,
        providerId: matched.id,
        email: matched.email,
        name: matched.name
      };

      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, matched.id);
      this.emit('session_changed', session);
      this.emit('provider_changed', matched);
      return session;
    }

    logout() {
      const session = {
        isLoggedIn: false,
        role: 'guest',
        id: null,
        email: null,
        name: null
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
      this.emit('session_changed', session);
      return session;
    }

    registerProviderBusiness(businessData) {
      const providers = this.getProviders();
      const newId = 'prov-' + Date.now().toString(36);
      const newProvider = {
        id: newId,
        name: businessData.name || 'My Booking Business',
        category: businessData.category || 'Salons & Spas',
        tagline: businessData.tagline || 'Professional appointments & scheduling',
        description: businessData.description || 'Welcome to our booking service.',
        location: businessData.location || 'Downtown',
        address: businessData.address || '101 Commercial Ave',
        phone: businessData.phone || '+1 (555) 000-1122',
        email: businessData.email || 'business@bookngo.com',
        image: businessData.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
        reviewCount: 0,
        status: 'active',
        workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        openTime: '09:00',
        closeTime: '18:00',
        breaks: [{ start: '13:00', end: '13:30', label: 'Lunch Break' }],
        services: businessData.services && businessData.services.length > 0 ? businessData.services : [
          { id: 'srv-' + newId + '-1', name: 'General Consultation', category: 'General', price: 50, duration: 45, description: 'Standard 45-minute consultation', enabled: true },
          { id: 'srv-' + newId + '-2', name: 'Premium Service Session', category: 'Premium', price: 95, duration: 60, description: 'Extended full service treatment', enabled: true }
        ],
        workers: businessData.workers && businessData.workers.length > 0 ? businessData.workers : [
          { id: 'wrk-' + newId + '-1', name: businessData.name.split(' ')[0] + ' (Owner)', title: 'Lead Specialist', services: ['srv-' + newId + '-1', 'srv-' + newId + '-2'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false }
        ]
      };

      providers.push(newProvider);
      localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));

      // Also set as active provider
      this.loginAsProvider(newProvider.email);
      return newProvider;
    }

    // Pub-Sub Event System
    subscribe(event, callback) {
      if (!this.subscribers[event]) {
        this.subscribers[event] = [];
      }
      this.subscribers[event].push(callback);
      return () => {
        this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
      };
    }

    emit(event, data) {
      if (this.subscribers[event]) {
        this.subscribers[event].forEach(cb => {
          try {
            cb(data);
          } catch (e) {
            console.error(`Error in subscriber for ${event}:`, e);
          }
        });
      }
    }

    // Providers
    getProviders() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROVIDERS)) || window.INITIAL_PROVIDERS;
      } catch (e) {
        return window.INITIAL_PROVIDERS || [];
      }
    }

    getCurrentProviderId() {
      return localStorage.getItem(STORAGE_KEYS.SELECTED_PROVIDER) || 'prov-1';
    }

    getCurrentProvider() {
      const providers = this.getProviders();
      const curId = this.getCurrentProviderId();
      return providers.find(p => p.id === curId) || providers[0];
    }

    setCurrentProvider(providerId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, providerId);
      this.emit('provider_changed', this.getCurrentProvider());
    }

    // Date & View
    getSelectedDate() {
      return localStorage.getItem(STORAGE_KEYS.SELECTED_DATE) || (window.getDateOffset ? window.getDateOffset(0) : new Date().toISOString().split('T')[0]);
    }

    setSelectedDate(dateStr) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_DATE, dateStr);
      this.emit('date_changed', dateStr);
    }

    getView() {
      return localStorage.getItem(STORAGE_KEYS.VIEW) || 'timeline';
    }

    setView(viewMode) {
      localStorage.setItem(STORAGE_KEYS.VIEW, viewMode);
      this.emit('view_changed', viewMode);
    }

    getTheme() {
      return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    }

    setTheme(theme) {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      this.emit('theme_changed', theme);
    }

    // Customers
    getCustomers() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) || window.INITIAL_CUSTOMERS;
      } catch (e) {
        return window.INITIAL_CUSTOMERS || [];
      }
    }

    addCustomer(cust) {
      const customers = this.getCustomers();
      customers.push(cust);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      this.emit('customers_updated', customers);
      return cust;
    }

    // Bookings
    getBookings() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS)) || window.INITIAL_BOOKINGS;
      } catch (e) {
        return window.INITIAL_BOOKINGS || [];
      }
    }

    getBookingsForDateAndProvider(date, providerId) {
      const all = this.getBookings();
      return all.filter(b => b.providerId === providerId && b.date === date && b.status !== 'cancelled');
    }

    addBooking(bookingData) {
      const bookings = this.getBookings();
      const newBooking = {
        bookingId: bookingData.bookingId || 'BNG-' + Math.floor(100000 + Math.random() * 900000),
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        ...bookingData
      };
      bookings.push(newBooking);
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      this.emit('bookings_updated', newBooking);
      return newBooking;
    }

    updateBooking(bookingId, updates) {
      const bookings = this.getBookings();
      const idx = bookings.findIndex(b => b.bookingId === bookingId);
      if (idx !== -1) {
        bookings[idx] = { ...bookings[idx], ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
        this.emit('bookings_updated', bookings[idx]);
        return bookings[idx];
      }
      return null;
    }

    deleteBooking(bookingId) {
      let bookings = this.getBookings();
      bookings = bookings.filter(b => b.bookingId !== bookingId);
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
      this.emit('bookings_updated', { bookingId, deleted: true });
    }

    // Waitlist
    getWaitlist() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.WAITLIST)) || window.INITIAL_WAITLIST;
      } catch (e) {
        return window.INITIAL_WAITLIST || [];
      }
    }

    getWaitlistForProvider(providerId) {
      const list = this.getWaitlist();
      return list.filter(w => (!w.providerId || w.providerId === providerId) && w.status !== 'booked' && w.status !== 'expired');
    }

    addWaitlistEntry(entryData) {
      const waitlist = this.getWaitlist();
      const nextPos = waitlist.filter(w => w.status === 'waiting').length + 1;
      const newEntry = {
        id: 'wl-' + Date.now().toString(36),
        status: 'waiting',
        position: nextPos,
        priority: entryData.priority || 'normal',
        priorityLabel: entryData.priority === 'urgent' ? 'High Urgency' : (entryData.priority === 'vip' ? 'VIP Client' : (entryData.priority === 'flexible' ? 'Flexible Window' : 'Standard')),
        createdAt: new Date().toISOString(),
        history: ['Joined waitlist just now'],
        ...entryData
      };
      waitlist.push(newEntry);
      localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(waitlist));
      this.emit('waitlist_updated', newEntry);
      return newEntry;
    }

    updateWaitlistEntry(id, updates) {
      const waitlist = this.getWaitlist();
      const idx = waitlist.findIndex(w => w.id === id);
      if (idx !== -1) {
        waitlist[idx] = { ...waitlist[idx], ...updates };
        localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(waitlist));
        this.emit('waitlist_updated', waitlist[idx]);
        return waitlist[idx];
      }
      return null;
    }

    deleteWaitlistEntry(id) {
      let waitlist = this.getWaitlist();
      waitlist = waitlist.filter(w => w.id !== id);
      localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(waitlist));
      this.emit('waitlist_updated', { id, deleted: true });
    }

    // Assign waitlisted client to slot
    assignWaitlistToSlot(waitlistId, workerId, date, time) {
      const waitlist = this.getWaitlist();
      const entry = waitlist.find(w => w.id === waitlistId);
      if (!entry) return null;

      const provider = this.getCurrentProvider();
      const worker = provider.workers.find(w => w.id === workerId) || provider.workers[0];
      const service = provider.services.find(s => s.id === entry.serviceId) || provider.services[0];

      // Create new booking
      const newBooking = this.addBooking({
        customerId: entry.customerId || 'cust-' + Date.now(),
        customerName: entry.customerName,
        customerEmail: entry.customerEmail,
        customerPhone: entry.customerPhone,
        providerId: provider.id,
        providerName: provider.name,
        serviceId: service.id,
        serviceName: service.name,
        workerId: worker.id,
        workerName: worker.name,
        date: date,
        time: time,
        duration: entry.duration || service.duration || 45,
        price: entry.price || service.price || 50,
        status: 'confirmed',
        notes: `[Booked from Waitlist Queue #${entry.position}] ${entry.notes || ''}`
      });

      // Update waitlist entry to booked
      this.updateWaitlistEntry(waitlistId, {
        status: 'booked',
        bookedAt: new Date().toISOString(),
        bookedBookingId: newBooking.bookingId,
        history: [...(entry.history || []), `Assigned & Confirmed for ${date} at ${time} with ${worker.name}`]
      });

      this.emit('waitlist_converted', { waitlist: entry, booking: newBooking });
      return newBooking;
    }

    // Client notification simulation
    notifyWaitlistClient(waitlistId) {
      const waitlist = this.getWaitlist();
      const entry = waitlist.find(w => w.id === waitlistId);
      if (!entry) return null;

      const updated = this.updateWaitlistEntry(waitlistId, {
        status: 'notified',
        notifiedAt: new Date().toISOString(),
        expiresInMinutes: 15,
        history: [...(entry.history || []), `Notification SMS & Email dispatched at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`]
      });

      this.emit('notification_sent', {
        waitlist: updated,
        message: `Notification SMS sent to ${entry.customerName} (${entry.customerPhone}). 15m claim window started.`
      });

      return updated;
    }

    // Smart Matcher: Find open calendar slots that fit the waitlist service duration
    findSmartMatches(waitlistId) {
      const waitlist = this.getWaitlist();
      const entry = waitlist.find(w => w.id === waitlistId);
      if (!entry) return [];

      const provider = this.getCurrentProvider();
      const date = entry.preferredDate || this.getSelectedDate();
      const bookings = this.getBookingsForDateAndProvider(date, provider.id);
      const serviceDuration = entry.duration || 45;

      // Filter workers by service support and preference
      let targetWorkers = provider.workers.filter(w => {
        if (entry.workerId && entry.workerId !== 'any' && w.id !== entry.workerId) return false;
        return w.services.includes(entry.serviceId);
      });
      if (targetWorkers.length === 0) {
        targetWorkers = provider.workers;
      }

      // Check slot intervals between openTime and closeTime
      const [startHour, startMin] = provider.openTime.split(':').map(Number);
      const [endHour, endMin] = provider.closeTime.split(':').map(Number);
      const totalStartMinutes = startHour * 60 + startMin;
      const totalEndMinutes = endHour * 60 + endMin;

      const matches = [];

      targetWorkers.forEach(worker => {
        // Collect existing worker bookings for this date in minutes
        const workerBookings = bookings
          .filter(b => b.workerId === worker.id)
          .map(b => {
            const [h, m] = b.time.split(':').map(Number);
            const start = h * 60 + m;
            return { start, end: start + (b.duration || 45) };
          });

        // Add break windows
        const breaks = (provider.breaks || []).map(brk => {
          const [sh, sm] = brk.start.split(':').map(Number);
          const [eh, em] = brk.end.split(':').map(Number);
          return { start: sh * 60 + sm, end: eh * 60 + em };
        });

        // Scan 30-min steps
        for (let timeMin = totalStartMinutes; timeMin + serviceDuration <= totalEndMinutes; timeMin += 30) {
          const slotEnd = timeMin + serviceDuration;

          // Check overlap with bookings
          const collidesBooking = workerBookings.some(b => timeMin < b.end && slotEnd > b.start);
          // Check overlap with breaks
          const collidesBreak = breaks.some(b => timeMin < b.end && slotEnd > b.start);

          if (!collidesBooking && !collidesBreak) {
            const hh = String(Math.floor(timeMin / 60)).padStart(2, '0');
            const mm = String(timeMin % 60).padStart(2, '0');
            matches.push({
              workerId: worker.id,
              workerName: worker.name,
              date: date,
              time: `${hh}:${mm}`,
              duration: serviceDuration
            });
          }
        }
      });

      return matches;
    }

    // Customer-specific queries
    getBookingsForCustomer(customerId) {
      const all = this.getBookings();
      return all.filter(b => b.customerId === customerId);
    }

    getWaitlistForCustomer(customerId) {
      const all = this.getWaitlist();
      return all.filter(w => w.customerId === customerId);
    }

    // Reviews & Feedback System
    getReviews(providerId) {
      try {
        const revs = JSON.parse(localStorage.getItem('bng_reviews_v1')) || window.INITIAL_REVIEWS || [];
        return providerId ? revs.filter(r => r.providerId === providerId) : revs;
      } catch (e) {
        return window.INITIAL_REVIEWS || [];
      }
    }

    addReview({ bookingId, providerId, customerId, customerName, rating, comment }) {
      const reviews = this.getReviews();
      const newReview = {
        id: 'rev-' + Date.now().toString(36),
        bookingId: bookingId || 'BNG-CUSTOM',
        providerId,
        customerId,
        customerName: customerName || 'Customer',
        rating: Number(rating) || 5,
        comment: comment || '',
        date: new Date().toISOString().split('T')[0]
      };
      reviews.unshift(newReview);
      localStorage.setItem('bng_reviews_v1', JSON.stringify(reviews));

      // Recalculate provider average rating
      const providers = this.getProviders();
      const prov = providers.find(p => p.id === providerId);
      if (prov) {
        const provRevs = reviews.filter(r => r.providerId === providerId);
        const avg = provRevs.reduce((sum, r) => sum + r.rating, 0) / provRevs.length;
        prov.rating = Number(avg.toFixed(1));
        prov.reviewCount = provRevs.length;
        localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
        this.emit('provider_changed', prov);
      }

      this.emit('review_added', newReview);
      return newReview;
    }

    // Admin Oversight & Reports
    getReports() {
      try {
        return JSON.parse(localStorage.getItem('bng_reports_v1')) || window.INITIAL_REPORTS || [];
      } catch (e) {
        return window.INITIAL_REPORTS || [];
      }
    }

    resolveReport(reportId, resolution) {
      const reports = this.getReports();
      const rep = reports.find(r => r.id === reportId);
      if (rep) {
        rep.status = 'Resolved';
        rep.resolution = resolution || 'Resolved by administrator';
        localStorage.setItem('bng_reports_v1', JSON.stringify(reports));
        this.emit('report_updated', rep);
      }
      return rep;
    }

    approveProvider(providerId) {
      const providers = this.getProviders();
      const prov = providers.find(p => p.id === providerId);
      if (prov) {
        prov.status = 'active';
        localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
        this.emit('provider_changed', prov);
      }
      return prov;
    }

    rejectProvider(providerId) {
      let providers = this.getProviders();
      providers = providers.filter(p => p.id !== providerId);
      localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
      this.emit('provider_changed', this.getCurrentProvider());
    }

    // Reset to initial demo data
    resetDemoData() {
      localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(window.INITIAL_PROVIDERS || []));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(window.INITIAL_CUSTOMERS || []));
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(window.INITIAL_BOOKINGS || []));
      localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(window.INITIAL_WAITLIST || []));
      this.emit('provider_changed', this.getCurrentProvider());
      this.emit('bookings_updated', {});
      this.emit('waitlist_updated', {});
    }
  }

  // Global instance
  window.store = new Store();
})();
