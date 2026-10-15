/**
 * BookNGo — Store & State Management
 * Handles LocalStorage persistence, reactive events, and business logic
 * for multi-role authentication (Customer, Provider, Admin), appointments,
 * reviews, providers, staff schedules, and waitlist queues.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    PROVIDERS: 'bng_providers_v1',
    BOOKINGS: 'bng_bookings_v1',
    WAITLIST: 'bng_waitlist_v1',
    CUSTOMERS: 'bng_customers_v1',
    REVIEWS: 'bng_reviews_v1',
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
      // Initialize reviews
      if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
        localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(window.INITIAL_REVIEWS || []));
      }
      // Initialize session: start unauthenticated so user sees role selection first
      if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        const guestSession = {
          isLoggedIn: false,
          role: null,
          id: null,
          email: null,
          name: null
        };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(guestSession));
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

    // ========================================================
    // SESSION & AUTHENTICATION (Customer, Provider, Admin)
    // ========================================================
    getCurrentSession() {
      try {
        const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
        return session || { isLoggedIn: false, role: null };
      } catch (e) {
        return { isLoggedIn: false, role: null };
      }
    }

    loginUser({ email, password, role, name }) {
      const cleanEmail = (email || '').trim().toLowerCase();
      let session = {
        isLoggedIn: true,
        role: role || 'customer',
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0]
      };

      if (role === 'customer') {
        const customers = this.getCustomers();
        let matched = customers.find(c => (c.email || '').toLowerCase() === cleanEmail);
        if (!matched) {
          matched = {
            id: 'cust-' + Date.now().toString(36),
            name: name || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            email: cleanEmail,
            phone: '+1 (555) 777-0000',
            role: 'customer',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            joinedDate: new Date().toISOString().split('T')[0],
            totalVisits: 0
          };
          customers.push(matched);
          localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
        }
        session.id = matched.id;
        session.name = matched.name;
        session.phone = matched.phone;
        session.avatar = matched.avatar;
      } else if (role === 'provider') {
        const providers = this.getProviders();
        let matched = providers.find(p => (p.email || '').toLowerCase() === cleanEmail);
        if (matched) {
          session.id = matched.id;
          session.providerId = matched.id;
          session.name = matched.name;
          session.hasBusiness = true;
          localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, matched.id);
        } else {
          session.id = 'prov-user-' + Date.now().toString(36);
          session.providerId = null;
          session.hasBusiness = false;
        }
      } else if (role === 'admin') {
        session.id = 'admin-1';
        session.name = 'System Administrator';
      }

      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
      this.emit('session_changed', session);
      return session;
    }

    logout() {
      const guestSession = {
        isLoggedIn: false,
        role: null,
        id: null,
        email: null,
        name: null
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(guestSession));
      this.emit('session_changed', guestSession);
      return guestSession;
    }

    // ========================================================
    // PROVIDERS
    // ========================================================
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
      const session = this.getCurrentSession();
      // If logged in as a provider who has their own business, prioritize that
      if (session && session.role === 'provider' && session.providerId) {
        const found = providers.find(p => p.id === session.providerId);
        if (found) return found;
      }
      const curId = this.getCurrentProviderId();
      return providers.find(p => p.id === curId) || providers[0] || null;
    }

    setCurrentProvider(providerId) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, providerId);
      this.emit('provider_changed', this.getCurrentProvider());
    }

    registerProviderBusiness(businessData) {
      const providers = this.getProviders();
      const session = this.getCurrentSession();
      const newId = 'prov-' + Date.now().toString(36);

      const newProvider = {
        id: newId,
        name: businessData.name || 'My Professional Business',
        category: businessData.category || 'Salons & Spas',
        categoryId: 'cat-custom',
        tagline: businessData.tagline || 'Quality booking & services',
        description: businessData.description || 'Welcome to our booking service. Reserve your slots online.',
        location: businessData.location || 'Central City',
        address: businessData.address || '101 Commercial Plaza',
        phone: businessData.phone || '+1 (555) 000-1122',
        email: businessData.email || (session ? session.email : 'contact@mybusiness.com'),
        image: businessData.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
        reviewCount: 0,
        status: 'active',
        workingDays: businessData.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        openTime: businessData.openTime || '09:00',
        closeTime: businessData.closeTime || '18:00',
        breaks: businessData.breaks || [{ start: '13:00', end: '13:30', label: 'Lunch Break' }],
        services: businessData.services && businessData.services.length > 0 ? businessData.services : [
          { id: 'srv-' + newId + '-1', name: 'Standard Consultation', category: 'General', price: 45, duration: 45, description: 'Comprehensive consultation session.', enabled: true },
          { id: 'srv-' + newId + '-2', name: 'Comprehensive Service Session', category: 'Full', price: 85, duration: 60, description: 'Full personalized service treatment.', enabled: true }
        ],
        workers: businessData.workers && businessData.workers.length > 0 ? businessData.workers : [
          { id: 'wrk-' + newId + '-1', name: businessData.name.split(' ')[0] + ' Specialist', title: 'Lead Specialist', services: ['srv-' + newId + '-1', 'srv-' + newId + '-2'], workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isUnavailable: false }
        ]
      };

      providers.push(newProvider);
      localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));

      // Update current session
      if (session && session.role === 'provider') {
        session.providerId = newId;
        session.hasBusiness = true;
        session.name = newProvider.name;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
      }
      localStorage.setItem(STORAGE_KEYS.SELECTED_PROVIDER, newId);

      this.emit('provider_changed', newProvider);
      this.emit('session_changed', session);
      return newProvider;
    }

    // ========================================================
    // DATE & VIEW & THEME
    // ========================================================
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

    // ========================================================
    // CUSTOMERS
    // ========================================================
    getCustomers() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) || window.INITIAL_CUSTOMERS;
      } catch (e) {
        return window.INITIAL_CUSTOMERS || [];
      }
    }

    // ========================================================
    // BOOKINGS
    // ========================================================
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

    getBookingsForCustomer(customerId) {
      const all = this.getBookings();
      return all.filter(b => b.customerId === customerId);
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

    // ========================================================
    // REVIEWS
    // ========================================================
    getReviews() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.REVIEWS)) || window.INITIAL_REVIEWS || [];
      } catch (e) {
        return window.INITIAL_REVIEWS || [];
      }
    }

    getReviewsForProvider(providerId) {
      return this.getReviews().filter(r => r.providerId === providerId);
    }

    getReviewsForCustomer(customerId) {
      return this.getReviews().filter(r => r.customerId === customerId);
    }

    addReview({ bookingId, providerId, customerId, customerName, rating, comment }) {
      const reviews = this.getReviews();
      const newReview = {
        id: 'rev-' + Date.now().toString(36),
        bookingId: bookingId || null,
        providerId: providerId,
        customerId: customerId,
        customerName: customerName || 'Verified Client',
        rating: Number(rating) || 5,
        comment: comment || 'Excellent service!',
        date: new Date().toISOString().split('T')[0]
      };
      reviews.unshift(newReview);
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));

      // Recalculate provider average rating
      const providers = this.getProviders();
      const provider = providers.find(p => p.id === providerId);
      if (provider) {
        const provReviews = reviews.filter(r => r.providerId === providerId);
        const avg = provReviews.reduce((sum, r) => sum + r.rating, 0) / provReviews.length;
        provider.rating = Math.round(avg * 10) / 10;
        provider.reviewCount = provReviews.length;
        localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
        this.emit('provider_changed', provider);
      }

      this.emit('reviews_updated', newReview);
      return newReview;
    }

    // ========================================================
    // WAITLIST
    // ========================================================
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

    assignWaitlistToSlot(waitlistId, workerId, date, time) {
      const waitlist = this.getWaitlist();
      const entry = waitlist.find(w => w.id === waitlistId);
      if (!entry) return null;

      const provider = this.getCurrentProvider();
      const worker = provider.workers.find(w => w.id === workerId) || provider.workers[0];
      const service = provider.services.find(s => s.id === entry.serviceId) || provider.services[0];

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

      this.updateWaitlistEntry(waitlistId, {
        status: 'booked',
        bookedAt: new Date().toISOString(),
        bookedBookingId: newBooking.bookingId,
        history: [...(entry.history || []), `Assigned & Confirmed for ${date} at ${time} with ${worker.name}`]
      });

      this.emit('waitlist_converted', { waitlist: entry, booking: newBooking });
      return newBooking;
    }

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

    findSmartMatches(waitlistId) {
      const waitlist = this.getWaitlist();
      const entry = waitlist.find(w => w.id === waitlistId);
      if (!entry) return [];

      const provider = this.getCurrentProvider();
      const date = entry.preferredDate || this.getSelectedDate();
      const bookings = this.getBookingsForDateAndProvider(date, provider.id);
      const serviceDuration = entry.duration || 45;

      let targetWorkers = provider.workers.filter(w => {
        if (entry.workerId && entry.workerId !== 'any' && w.id !== entry.workerId) return false;
        return w.services.includes(entry.serviceId);
      });
      if (targetWorkers.length === 0) {
        targetWorkers = provider.workers;
      }

      const [startHour, startMin] = provider.openTime.split(':').map(Number);
      const [endHour, endMin] = provider.closeTime.split(':').map(Number);
      const totalStartMinutes = startHour * 60 + startMin;
      const totalEndMinutes = endHour * 60 + endMin;

      const matches = [];

      targetWorkers.forEach(worker => {
        const workerBookings = bookings
          .filter(b => b.workerId === worker.id)
          .map(b => {
            const [h, m] = b.time.split(':').map(Number);
            const start = h * 60 + m;
            return { start, end: start + (b.duration || 45) };
          });

        const breaks = (provider.breaks || []).map(brk => {
          const [sh, sm] = brk.start.split(':').map(Number);
          const [eh, em] = brk.end.split(':').map(Number);
          return { start: sh * 60 + sm, end: eh * 60 + em };
        });

        for (let timeMin = totalStartMinutes; timeMin + serviceDuration <= totalEndMinutes; timeMin += 30) {
          const slotEnd = timeMin + serviceDuration;
          const collidesBooking = workerBookings.some(b => timeMin < b.end && slotEnd > b.start);
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
  }

  // Global instance
  window.store = new Store();
})();
