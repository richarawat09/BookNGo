/**
 * BookNGo — Main Application Coordinator
 * Handles:
 * 1. Role Selection Gateway (Customer, Provider, Admin) with Gmail/Password Auth
 * 2. Customer Portal: Service Searching, Live "Book a Slot" Matrix, My Bookings, & Reviewing System
 * 3. Provider Portal: Schedulo Staff Timeline Calendar, Live Waitlist Drawer & Smart Match
 * 4. Admin Portal: Platform Oversight & Provider Management
 */

(function () {
  'use strict';

  class App {
    constructor() {
      this.selectedRole = 'customer';
      this.authMode = 'login';
      this.currentCustomerCategory = 'all';
      this.customerSearchQuery = '';
      this.init();
    }

    init() {
      document.addEventListener('DOMContentLoaded', () => {
        this.applyTheme(window.store.getTheme());
        this.checkSessionAndRoute();
        this.bindGlobalEvents();
      });
    }

    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const themeBtn = document.getElementById('themeToggleBtn');
      if (themeBtn) {
        themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      }
    }

    bindGlobalEvents() {
      // Theme toggle
      const themeBtn = document.getElementById('themeToggleBtn');
      if (themeBtn) {
        themeBtn.addEventListener('click', () => {
          const next = window.store.getTheme() === 'dark' ? 'light' : 'dark';
          window.store.setTheme(next);
          this.applyTheme(next);
        });
      }

      // Keyboard ESC closes modals
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.closeAllModals();
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          this.openCommandPalette();
        }
      });

      // Provider Date Controls
      const btnToday = document.getElementById('btnToday');
      if (btnToday) {
        btnToday.addEventListener('click', () => {
          window.store.setSelectedDate(window.getDateOffset(0));
          this.updateProviderDateDisplay();
        });
      }

      const btnPrevDate = document.getElementById('btnPrevDate');
      if (btnPrevDate) {
        btnPrevDate.addEventListener('click', () => this.shiftProviderDate(-1));
      }

      const btnNextDate = document.getElementById('btnNextDate');
      if (btnNextDate) {
        btnNextDate.addEventListener('click', () => this.shiftProviderDate(1));
      }

      // Provider View Switcher
      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const view = btn.getAttribute('data-view');
          document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          window.store.setView(view);
        });
      });

      // Provider Waitlist Panel Toggle
      const toggleWaitlistBtn = document.getElementById('toggleWaitlistBtn');
      const waitlistPanel = document.getElementById('waitlistPanel');
      if (toggleWaitlistBtn && waitlistPanel) {
        toggleWaitlistBtn.addEventListener('click', () => {
          waitlistPanel.classList.toggle('collapsed');
          toggleWaitlistBtn.classList.toggle('active');
        });
      }

      const closeWaitlistBtn = document.getElementById('closeWaitlistBtn');
      if (closeWaitlistBtn && waitlistPanel) {
        closeWaitlistBtn.addEventListener('click', () => {
          waitlistPanel.classList.add('collapsed');
          if (toggleWaitlistBtn) toggleWaitlistBtn.classList.remove('active');
        });
      }

      // Sidebar Collapse
      const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
      const sidebar = document.getElementById('sidebar');
      if (sidebarCollapseBtn && sidebar) {
        sidebarCollapseBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
      }

      // Waitlist Search & Tabs
      const wlSearch = document.getElementById('waitlistSearchInput');
      if (wlSearch && window.waitlistController) {
        wlSearch.addEventListener('input', (e) => window.waitlistController.setSearchQuery(e.target.value));
      }

      document.querySelectorAll('.waitlist-tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.waitlist-tab-btn').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          if (window.waitlistController) {
            window.waitlistController.setFilter(tab.getAttribute('data-filter'));
          }
        });
      });

      // Reactive store listeners
      window.store.subscribe('session_changed', () => this.checkSessionAndRoute());
      window.store.subscribe('bookings_updated', () => {
        this.updateProviderKpis();
        this.updateCustomerBadges();
      });
      window.store.subscribe('waitlist_updated', () => this.updateProviderKpis());
      window.store.subscribe('reviews_updated', () => {
        this.renderCustomerCatalog();
        this.renderCustomerReviews();
      });
    }

    // ========================================================
    // 1. AUTH GATEWAY & ROLE ROUTING
    // ========================================================
    checkSessionAndRoute() {
      const session = window.store.getCurrentSession();
      const authOverlay = document.getElementById('authGatewayOverlay');
      const customerPortal = document.getElementById('customerPortal');
      const providerPortal = document.getElementById('providerPortal');
      const adminPortal = document.getElementById('adminPortal');

      if (!session || !session.isLoggedIn) {
        // Show role selection auth gateway
        if (authOverlay) authOverlay.style.display = 'flex';
        if (customerPortal) customerPortal.style.display = 'none';
        if (providerPortal) providerPortal.style.display = 'none';
        if (adminPortal) adminPortal.style.display = 'none';
        return;
      }

      // Hide auth gateway
      if (authOverlay) authOverlay.style.display = 'none';

      if (session.role === 'customer') {
        if (customerPortal) customerPortal.style.display = 'flex';
        if (providerPortal) providerPortal.style.display = 'none';
        if (adminPortal) adminPortal.style.display = 'none';
        this.setupCustomerPortal(session);
      } else if (session.role === 'provider') {
        if (customerPortal) customerPortal.style.display = 'none';
        if (providerPortal) providerPortal.style.display = 'flex';
        if (adminPortal) adminPortal.style.display = 'none';
        this.setupProviderPortal(session);
      } else if (session.role === 'admin') {
        if (customerPortal) customerPortal.style.display = 'none';
        if (providerPortal) providerPortal.style.display = 'none';
        if (adminPortal) adminPortal.style.display = 'flex';
        this.setupAdminPortal(session);
      }
    }

    selectAuthRole(role) {
      this.selectedRole = role;
      document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
      const activeCard = document.getElementById('roleCard' + role.charAt(0).toUpperCase() + role.slice(1));
      if (activeCard) activeCard.classList.add('selected');

      const titleEl = document.getElementById('authFormTitle');
      const submitBtn = document.getElementById('authSubmitBtn');
      const emailInput = document.getElementById('authEmailInput');

      if (role === 'customer') {
        if (titleEl) titleEl.textContent = this.authMode === 'login' ? 'Log in as Customer' : 'Create Customer Account';
        if (submitBtn) submitBtn.textContent = 'Continue as Customer';
        if (emailInput && !emailInput.value) emailInput.value = 'alex@demo.com';
      } else if (role === 'provider') {
        if (titleEl) titleEl.textContent = this.authMode === 'login' ? 'Log in to Provider Business' : 'Register New Business';
        if (submitBtn) submitBtn.textContent = 'Enter Provider Dashboard';
        if (emailInput && !emailInput.value) emailInput.value = 'aurora@salon.com';
      } else if (role === 'admin') {
        if (titleEl) titleEl.textContent = 'Log in as Platform Administrator';
        if (submitBtn) submitBtn.textContent = 'Access Admin Dashboard';
        if (emailInput) emailInput.value = 'admin@bookngo.com';
      }
    }

    toggleAuthMode(mode) {
      this.authMode = mode;
      const tabLogin = document.getElementById('authTabLogin');
      const tabRegister = document.getElementById('authTabRegister');
      const nameGroup = document.getElementById('authNameGroup');

      if (mode === 'register') {
        if (tabRegister) { tabRegister.style.background = 'var(--bg-surface)'; tabRegister.style.fontWeight = '700'; }
        if (tabLogin) { tabLogin.style.background = 'transparent'; tabLogin.style.fontWeight = '500'; }
        if (nameGroup) nameGroup.style.display = 'flex';
      } else {
        if (tabLogin) { tabLogin.style.background = 'var(--bg-surface)'; tabLogin.style.fontWeight = '700'; }
        if (tabRegister) { tabRegister.style.background = 'transparent'; tabRegister.style.fontWeight = '500'; }
        if (nameGroup) nameGroup.style.display = 'none';
      }
      this.selectAuthRole(this.selectedRole);
    }

    handleAuthSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('authEmailInput').value;
      const password = document.getElementById('authPasswordInput').value;
      const name = document.getElementById('authNameInput') ? document.getElementById('authNameInput').value : '';

      window.store.loginUser({
        email,
        password,
        role: this.selectedRole,
        name
      });

      this.showToast(`Logged in successfully as ${this.selectedRole.toUpperCase()}!`, 'success');
    }

    quickLoginDemo(role) {
      this.selectAuthRole(role);
      let demoEmail = 'alex@demo.com';
      let demoName = 'Alex Morgan';

      if (role === 'provider') {
        demoEmail = 'aurora@salon.com';
        demoName = 'Aurora Glow Salon';
      } else if (role === 'admin') {
        demoEmail = 'admin@bookngo.com';
        demoName = 'Administrator';
      }

      window.store.loginUser({
        email: demoEmail,
        password: 'password123',
        role: role,
        name: demoName
      });

      this.showToast(`Logged in as demo ${role}!`, 'success');
    }

    logoutUser() {
      window.store.logout();
      this.showToast('Logged out. Please select role to sign in.', 'info');
    }

    // ========================================================
    // 2. CUSTOMER PORTAL LOGIC (SEARCH, BOOK A SLOT, REVIEWS)
    // ========================================================
    setupCustomerPortal(session) {
      const headerName = document.getElementById('custHeaderName');
      if (headerName) headerName.textContent = session.name || session.email;

      this.renderCustomerCategoryPills();
      this.renderCustomerCatalog();
      this.updateCustomerBadges();
      this.switchCustomerTab('explore');
    }

    switchCustomerTab(tab) {
      document.querySelectorAll('.cust-nav-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('custTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
      if (activeBtn) activeBtn.classList.add('active');

      const secExplore = document.getElementById('custSectionExplore');
      const secBookings = document.getElementById('custSectionBookings');
      const secReviews = document.getElementById('custSectionReviews');

      if (secExplore) secExplore.style.display = tab === 'explore' ? 'block' : 'none';
      if (secBookings) secBookings.style.display = tab === 'bookings' ? 'block' : 'none';
      if (secReviews) secReviews.style.display = tab === 'reviews' ? 'block' : 'none';

      if (tab === 'bookings') this.renderCustomerBookings();
      if (tab === 'reviews') this.renderCustomerReviews();
    }

    renderCustomerCategoryPills() {
      const mount = document.getElementById('custCategoryPillsMount');
      if (!mount) return;

      const categories = [
        { id: 'all', name: 'All Services' },
        { id: 'Salons & Spas', name: '💇 Salons & Spas' },
        { id: 'Beauty & Wellness', name: '✨ Beauty & Wellness' },
        { id: 'Healthcare & Clinics', name: '🩺 Healthcare & Clinics' },
        { id: 'Fitness & Sports', name: '🏋️ Fitness & Sports' },
        { id: 'Education & Tutoring', name: '📚 Education & Tutoring' },
        { id: 'Home Services & Repairs', name: '🔧 Home Services' }
      ];

      mount.innerHTML = categories.map(cat => `
        <button class="cat-pill-btn ${cat.id === this.currentCustomerCategory ? 'active' : ''}" 
                onclick="window.app.filterCustomerCategory('${cat.id}')">
          ${cat.name}
        </button>
      `).join('');
    }

    filterCustomerCategory(catId) {
      this.currentCustomerCategory = catId;
      this.renderCustomerCategoryPills();
      this.renderCustomerCatalog();
    }

    handleCustomerSearch(query) {
      this.customerSearchQuery = (query || '').toLowerCase().trim();
      this.renderCustomerCatalog();
    }

    renderCustomerCatalog() {
      const mount = document.getElementById('custProvidersGridMount');
      if (!mount) return;

      const providers = window.store.getProviders();
      let filtered = providers.filter(p => {
        // Category match
        if (this.currentCustomerCategory !== 'all' && p.category !== this.currentCustomerCategory) {
          return false;
        }
        // Search query
        if (this.customerSearchQuery) {
          const matchName = (p.name || '').toLowerCase().includes(this.customerSearchQuery);
          const matchCat = (p.category || '').toLowerCase().includes(this.customerSearchQuery);
          const matchSrv = (p.services || []).some(s => s.name.toLowerCase().includes(this.customerSearchQuery));
          if (!matchName && !matchCat && !matchSrv) return false;
        }
        return true;
      });

      const countEl = document.getElementById('custCatalogResultsCount');
      if (countEl) countEl.textContent = `Showing ${filtered.length} service businesses`;

      if (filtered.length === 0) {
        mount.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-muted);">
            <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
            <div style="font-weight: 700; font-size: 15px; color: var(--text-main);">No matching services found</div>
            <p style="font-size: 12px; margin-top: 4px;">Try searching for "haircut", "facial", "dentist", or select All Services.</p>
          </div>
        `;
        return;
      }

      mount.innerHTML = filtered.map(p => `
        <div class="business-card">
          <img src="${p.image}" class="business-card-img" alt="${p.name}">
          <div class="business-card-content">
            <div class="business-header-row">
              <div>
                <h4 class="business-title">${p.name}</h4>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">📍 ${p.address || p.location}</div>
              </div>
              <div class="business-rating-badge">
                <span>⭐</span> <span>${p.rating || 5.0}</span> <span style="font-size: 10px; color: var(--text-muted);">(${p.reviewCount || 0})</span>
              </div>
            </div>

            <div style="font-size: 12px; color: var(--text-muted); line-height: 1.35;">${p.tagline || p.description}</div>

            <!-- Top Services List -->
            <div class="business-services-list">
              ${(p.services || []).slice(0, 3).map(s => `
                <div class="service-item-row">
                  <span class="service-item-name">• ${s.name} (${s.duration}m)</span>
                  <span class="service-item-price">$${s.price}</span>
                </div>
              `).join('')}
            </div>

            <!-- Main CTA: Book a Slot -->
            <button class="btn-primary" style="width: 100%; justify-content: center; padding: 10px; font-weight: 700;" onclick="window.app.openCustomerBookSlotModal('${p.id}')">
              📅 Book a Slot
            </button>
          </div>
        </div>
      `).join('');
    }

    // Customer "Book a Slot" Modal Flow
    openCustomerBookSlotModal(providerId, defaultServiceId) {
      const providers = window.store.getProviders();
      const p = providers.find(item => item.id === providerId) || providers[0];
      if (!p) return;

      document.getElementById('custBookProviderId').value = p.id;
      document.getElementById('custBookModalProviderName').textContent = `${p.name} • ${p.category} (${p.openTime} - ${p.closeTime})`;

      // Services dropdown
      const srvSelect = document.getElementById('custBookServiceSelect');
      srvSelect.innerHTML = (p.services || []).map(s => `
        <option value="${s.id}" data-price="${s.price}" data-duration="${s.duration}" ${s.id === defaultServiceId ? 'selected' : ''}>
          ${s.name} — $${s.price} (${s.duration} min)
        </option>
      `).join('');

      // Specialists dropdown
      const wrkSelect = document.getElementById('custBookWorkerSelect');
      wrkSelect.innerHTML = `
        <option value="">Any Available Specialist</option>
        ${(p.workers || []).map(w => `<option value="${w.id}">${w.name} (${w.title})</option>`).join('')}
      `;

      // Date input
      const dateInput = document.getElementById('custBookDateInput');
      dateInput.value = window.getDateOffset(0);
      dateInput.min = window.getDateOffset(0);

      this.generateAvailableCustomerSlots();
      this.openModal('customerBookSlotModal');
    }

    handleCustomerServiceChange() {
      this.generateAvailableCustomerSlots();
    }

    generateAvailableCustomerSlots() {
      const providerId = document.getElementById('custBookProviderId').value;
      const providers = window.store.getProviders();
      const provider = providers.find(p => p.id === providerId);
      if (!provider) return;

      const date = document.getElementById('custBookDateInput').value || window.getDateOffset(0);
      const workerId = document.getElementById('custBookWorkerSelect').value;
      const srvSelect = document.getElementById('custBookServiceSelect');
      const selectedSrvOpt = srvSelect.options[srvSelect.selectedIndex];
      const duration = selectedSrvOpt ? Number(selectedSrvOpt.getAttribute('data-duration')) || 45 : 45;

      const slotsGrid = document.getElementById('custAvailableSlotsGrid');
      const hiddenTimeInput = document.getElementById('custSelectedTimeSlot');
      hiddenTimeInput.value = '';

      // Get confirmed bookings for this provider & date
      const existingBookings = window.store.getBookingsForDateAndProvider(date, provider.id);

      // Candidate slot times
      const candidateTimes = ['09:00', '09:45', '10:30', '11:15', '12:00', '13:30', '14:15', '15:00', '15:45', '16:30', '17:15'];

      // Filter slots that are not fully occupied
      const workers = workerId ? provider.workers.filter(w => w.id === workerId) : provider.workers;
      const availableTimes = candidateTimes.filter(t => {
        // If specific worker chosen, check if worker is busy at this time
        if (workerId) {
          return !existingBookings.some(b => b.workerId === workerId && b.time === t);
        }
        // If any worker, check if at least one worker is free
        const occupiedWorkers = existingBookings.filter(b => b.time === t).map(b => b.workerId);
        return occupiedWorkers.length < (workers.length || 1);
      });

      if (availableTimes.length === 0) {
        slotsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 12px; font-size: 12px; color: var(--urgent-solid); background: var(--urgent-bg); border-radius: var(--radius-sm);">
            All direct appointment slots are filled for this date. Click below to join the priority Standby Waitlist!
          </div>
        `;
        return;
      }

      slotsGrid.innerHTML = availableTimes.map((t, idx) => `
        <div class="slot-time-pill ${idx === 0 ? 'selected' : ''}" onclick="window.app.selectTimeSlot('${t}', this)">
          ${t}
        </div>
      `).join('');

      // Auto-select first slot
      if (availableTimes.length > 0) {
        hiddenTimeInput.value = availableTimes[0];
      }
    }

    selectTimeSlot(timeStr, element) {
      document.querySelectorAll('.slot-time-pill').forEach(el => el.classList.remove('selected'));
      element.classList.add('selected');
      document.getElementById('custSelectedTimeSlot').value = timeStr;
    }

    submitCustomerSlotBooking(e) {
      e.preventDefault();
      const session = window.store.getCurrentSession();
      if (!session || !session.isLoggedIn) {
        this.showToast('Please log in as a customer first.', 'warning');
        return;
      }

      const providerId = document.getElementById('custBookProviderId').value;
      const provider = window.store.getProviders().find(p => p.id === providerId);

      const srvSelect = document.getElementById('custBookServiceSelect');
      const selectedSrvOpt = srvSelect.options[srvSelect.selectedIndex];
      const serviceId = srvSelect.value;
      const serviceName = selectedSrvOpt.text.split('—')[0].trim();
      const price = Number(selectedSrvOpt.getAttribute('data-price')) || 50;
      const duration = Number(selectedSrvOpt.getAttribute('data-duration')) || 45;

      const workerSelect = document.getElementById('custBookWorkerSelect');
      const workerId = workerSelect.value || (provider.workers[0] ? provider.workers[0].id : 'wrk-101');
      const worker = provider.workers.find(w => w.id === workerId) || provider.workers[0];

      const date = document.getElementById('custBookDateInput').value;
      const time = document.getElementById('custSelectedTimeSlot').value;
      const notes = document.getElementById('custBookNotesInput').value;

      if (!time) {
        this.showToast('Please select an available time slot pill above.', 'warning');
        return;
      }

      const booking = window.store.addBooking({
        customerId: session.id || 'cust-1',
        customerName: session.name || 'Customer',
        customerEmail: session.email,
        customerPhone: session.phone || '+1 (555) 777-8899',
        providerId: provider.id,
        providerName: provider.name,
        serviceId,
        serviceName,
        workerId: worker.id,
        workerName: worker.name,
        date,
        time,
        duration,
        price,
        notes
      });

      this.closeModal('customerBookSlotModal');
      this.showToast(`🎉 Success! Slot booked with ${worker.name} on ${date} at ${time}! Reference: ${booking.bookingId}`, 'success');
      this.updateCustomerBadges();
      this.switchCustomerTab('bookings');
    }

    convertBookingToWaitlist() {
      const session = window.store.getCurrentSession();
      const providerId = document.getElementById('custBookProviderId').value;
      const provider = window.store.getProviders().find(p => p.id === providerId);

      const srvSelect = document.getElementById('custBookServiceSelect');
      const selectedSrvOpt = srvSelect.options[srvSelect.selectedIndex];
      const serviceId = srvSelect.value;
      const serviceName = selectedSrvOpt.text.split('—')[0].trim();
      const price = Number(selectedSrvOpt.getAttribute('data-price')) || 50;
      const duration = Number(selectedSrvOpt.getAttribute('data-duration')) || 45;

      const date = document.getElementById('custBookDateInput').value;

      const waitlistEntry = window.store.addWaitlistEntry({
        providerId: provider.id,
        providerName: provider.name,
        customerId: session.id || 'cust-1',
        customerName: session.name || 'Customer',
        customerEmail: session.email,
        customerPhone: session.phone || '+1 (555) 777-8899',
        serviceId,
        serviceName,
        duration,
        price,
        workerId: null,
        workerName: 'Any Available Specialist',
        preferredDate: date,
        preferredTimeRange: 'Flexible Today',
        priority: 'urgent',
        notes: 'Customer joined priority standby via customer portal.'
      });

      this.closeModal('customerBookSlotModal');
      this.showToast(`⏳ Added to priority standby queue as #${waitlistEntry.position}! You will be notified the moment a slot opens.`, 'info');
    }

    // Customer "My Bookings"
    renderCustomerBookings() {
      const mount = document.getElementById('custMyBookingsList');
      if (!mount) return;

      const session = window.store.getCurrentSession();
      const allBookings = window.store.getBookings();
      // Match by customerId or customerEmail
      const myBookings = allBookings.filter(b => b.customerId === session.id || (b.customerEmail && b.customerEmail.toLowerCase() === (session.email || '').toLowerCase()));

      if (myBookings.length === 0) {
        mount.innerHTML = `
          <div style="text-align: center; padding: 48px; background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px solid var(--border-light);">
            <div style="font-size: 32px; margin-bottom: 8px;">📅</div>
            <div style="font-weight: 700; font-size: 16px;">No bookings yet</div>
            <p style="font-size: 13px; color: var(--text-muted); margin: 6px 0 16px;">Explore certified services and reserve your appointment slot with instant confirmation.</p>
            <button class="btn-primary" onclick="window.app.switchCustomerTab('explore')">Explore & Book a Slot</button>
          </div>
        `;
        return;
      }

      mount.innerHTML = myBookings.map(b => {
        const isCompleted = b.status === 'completed';
        const isCancelled = b.status === 'cancelled';

        return `
          <div class="my-booking-card">
            <div style="display: flex; gap: 14px; align-items: center;">
              <div style="width: 44px; height: 44px; border-radius: var(--radius-md); background: var(--primary-100); color: var(--primary-600); display: flex; align-items: center; justify-content: center; font-size: 20px;">
                📅
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="app-status-pill ${b.status || 'confirmed'}">${b.status || 'confirmed'}</span>
                  <span style="font-size: 11px; color: var(--text-subtle);">${b.bookingId}</span>
                </div>
                <h4 style="font-size: 16px; font-weight: 700; margin-top: 4px;">${b.serviceName}</h4>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                  🏢 <strong>${b.providerName}</strong> • Specialist: <strong>${b.workerName}</strong>
                </div>
                <div style="font-size: 12px; color: var(--primary-600); font-weight: 600; margin-top: 2px;">
                  🕒 ${b.date} at ${b.time} (${b.duration} mins) • $${b.price}
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              ${isCompleted ? `
                <button class="btn-primary" style="background: linear-gradient(135deg, #F59E0B, #D97706); box-shadow: none;" onclick="window.app.openCustomerReviewModal('${b.bookingId}', '${b.providerId}', '${b.providerName}', '${b.serviceName}')">
                  ⭐ Leave a Review
                </button>
              ` : ''}

              {!isCompleted && !isCancelled ? `
                <button class="btn-secondary" style="color: var(--urgent-solid); border-color: var(--urgent-border);" onclick="window.app.cancelCustomerBooking('${b.bookingId}')">
                  Cancel
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    cancelCustomerBooking(bookingId) {
      if (confirm('Are you sure you want to cancel this booking? This will reopen the slot for others.')) {
        window.store.updateBooking(bookingId, { status: 'cancelled' });
        this.showToast('Appointment cancelled.', 'warning');
        this.renderCustomerBookings();
        this.updateCustomerBadges();
      }
    }

    // Customer "Reviewing Option"
    openCustomerReviewModal(bookingId, providerId, providerName, serviceName) {
      document.getElementById('revBookingId').value = bookingId || '';
      document.getElementById('revProviderId').value = providerId || '';
      document.getElementById('revProviderName').textContent = providerName || 'Service Provider';
      document.getElementById('revServiceName').textContent = serviceName || 'Appointment Service';
      document.getElementById('revRatingValue').value = 5;
      document.getElementById('revCommentInput').value = '';
      this.selectReviewRating(5);
      this.openModal('customerReviewModal');
    }

    selectReviewRating(ratingVal) {
      document.getElementById('revRatingValue').value = ratingVal;
      const stars = document.querySelectorAll('#starRatingWidget span');
      stars.forEach((star, idx) => {
        star.style.opacity = idx < ratingVal ? '1' : '0.25';
      });
    }

    submitCustomerReview(e) {
      e.preventDefault();
      const session = window.store.getCurrentSession();
      const bookingId = document.getElementById('revBookingId').value;
      const providerId = document.getElementById('revProviderId').value;
      const rating = document.getElementById('revRatingValue').value;
      const comment = document.getElementById('revCommentInput').value;

      window.store.addReview({
        bookingId,
        providerId,
        customerId: session.id || 'cust-1',
        customerName: session.name || 'Verified Client',
        rating,
        comment
      });

      this.closeModal('customerReviewModal');
      this.showToast('⭐ Thank you! Your review and star rating has been published.', 'success');
      this.switchCustomerTab('reviews');
    }

    renderCustomerReviews() {
      const mount = document.getElementById('custMyReviewsList');
      if (!mount) return;

      const session = window.store.getCurrentSession();
      const allReviews = window.store.getReviews();
      const myReviews = allReviews.filter(r => r.customerId === session.id);

      if (myReviews.length === 0) {
        mount.innerHTML = `
          <div style="text-align: center; padding: 48px; background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px solid var(--border-light);">
            <div style="font-size: 32px; margin-bottom: 8px;">⭐</div>
            <div style="font-weight: 700; font-size: 16px;">No reviews submitted yet</div>
            <p style="font-size: 13px; color: var(--text-muted); margin: 6px 0 16px;">Complete any appointment to write verified ratings and feedback for specialists.</p>
          </div>
        `;
        return;
      }

      mount.innerHTML = myReviews.map(r => `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg); padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 4px; font-size: 16px; color: #D97706;">
              ${'⭐'.repeat(r.rating)} <strong style="font-size: 13px; color: var(--text-main); margin-left: 6px;">${r.rating}.0 Rating</strong>
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">${r.date}</div>
          </div>
          <p style="margin-top: 10px; font-size: 13px; line-height: 1.4; color: var(--text-main);">"${r.comment}"</p>
        </div>
      `).join('');
    }

    updateCustomerBadges() {
      const session = window.store.getCurrentSession();
      if (!session) return;
      const countEl = document.getElementById('custBadgeBookingsCount');
      if (countEl) {
        const bookings = window.store.getBookings().filter(b => (b.customerId === session.id || b.customerEmail === session.email) && b.status !== 'cancelled');
        countEl.textContent = bookings.length;
      }
    }

    // ========================================================
    // 3. PROVIDER PORTAL LOGIC (SCHEDULO CALENDAR & WAITLIST)
    // ========================================================
    setupProviderPortal(session) {
      const provider = window.store.getCurrentProvider();
      if (!provider) return;

      const pName = document.getElementById('activeProviderName');
      const pCat = document.getElementById('activeProviderCategory');
      const pImg = document.getElementById('activeProviderImg');
      const sName = document.getElementById('sidebarUserName');

      if (pName) pName.textContent = provider.name;
      if (pCat) pCat.textContent = provider.category;
      if (pImg) pImg.src = provider.image;
      if (sName) sName.textContent = session.name || provider.name;

      this.updateProviderDateDisplay();
      this.updateProviderKpis();

      // Mount calendar and waitlist controllers
      const calMount = document.getElementById('calendarMount');
      if (calMount && window.calendarController) {
        window.calendarController.setContainer(calMount);
      }

      const wlMount = document.getElementById('waitlistCardsMount');
      if (wlMount && window.waitlistController) {
        window.waitlistController.setContainer(wlMount);
      }
    }

    shiftProviderDate(delta) {
      const cur = new Date(window.store.getSelectedDate());
      cur.setDate(cur.getDate() + delta);
      window.store.setSelectedDate(cur.toISOString().split('T')[0]);
      this.updateProviderDateDisplay();
    }

    updateProviderDateDisplay() {
      const dateStr = window.store.getSelectedDate();
      const parts = dateStr.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dateText = document.getElementById('currentDateText');
      const dateSub = document.getElementById('currentDateSub');
      const isToday = dateStr === window.getDateOffset(0);

      if (dateText) dateText.textContent = `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      if (dateSub) dateSub.textContent = isToday ? 'Today' : (dateStr > window.getDateOffset(0) ? 'Upcoming' : 'Past');
    }

    updateProviderKpis() {
      const provider = window.store.getCurrentProvider();
      if (!provider) return;

      const date = window.store.getSelectedDate();
      const bookings = window.store.getBookingsForDateAndProvider(date, provider.id);
      const waitlist = window.store.getWaitlistForProvider(provider.id);

      const totalBookings = bookings.length;
      const totalRev = bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
      const activeWl = waitlist.filter(w => w.status !== 'booked').length;
      const capacity = Math.min(100, Math.round((totalBookings / ((provider.workers || []).length * 7 || 7)) * 100));

      const elBook = document.getElementById('kpiBookingsCount');
      const elWl = document.getElementById('kpiWaitlistCount');
      const elCap = document.getElementById('kpiCapacityPercent');
      const elRev = document.getElementById('kpiRevenueTotal');
      const wlBadge = document.getElementById('sidebarWaitlistBadge');

      if (elBook) elBook.textContent = `${totalBookings} Slots`;
      if (elWl) elWl.textContent = `${activeWl} Waiting`;
      if (elCap) elCap.textContent = `${capacity}% Full`;
      if (elRev) elRev.textContent = `$${totalRev.toLocaleString()}`;
      if (wlBadge) wlBadge.textContent = `${activeWl} Live`;
    }

    // Provider Modals (New Booking, Add Waitlist, Drawer, Simulator)
    openNewBookingModal(workerId, timeStr) {
      const provider = window.store.getCurrentProvider();
      const services = provider.services || [];
      const workers = provider.workers || [];
      const customers = window.store.getCustomers();

      const custSelect = document.getElementById('nbCustomerSelect');
      if (custSelect) {
        custSelect.innerHTML = customers.map(c => `
          <option value="${c.id}" data-name="${c.name}" data-phone="${c.phone}" data-email="${c.email}">${c.name} (${c.phone})</option>
        `).join('');
      }

      const srvSelect = document.getElementById('nbServiceSelect');
      if (srvSelect) {
        srvSelect.innerHTML = services.map(s => `
          <option value="${s.id}" data-price="${s.price}" data-duration="${s.duration}">${s.name} — $${s.price} (${s.duration}m)</option>
        `).join('');
      }

      const wrkSelect = document.getElementById('nbWorkerSelect');
      if (wrkSelect) {
        wrkSelect.innerHTML = workers.map(w => `
          <option value="${w.id}" ${w.id === workerId ? 'selected' : ''}>${w.name} (${w.title})</option>
        `).join('');
      }

      const dateInput = document.getElementById('nbDateInput');
      if (dateInput) dateInput.value = window.store.getSelectedDate();

      const timeInput = document.getElementById('nbTimeInput');
      if (timeInput) timeInput.value = timeStr || '10:00';

      this.openModal('newBookingModal');
    }

    submitNewBooking(e) {
      e.preventDefault();
      const provider = window.store.getCurrentProvider();
      const custSelect = document.getElementById('nbCustomerSelect');
      const optCust = custSelect.options[custSelect.selectedIndex];

      const srvSelect = document.getElementById('nbServiceSelect');
      const optSrv = srvSelect.options[srvSelect.selectedIndex];

      const wrkSelect = document.getElementById('nbWorkerSelect');
      const optWrk = wrkSelect.options[wrkSelect.selectedIndex];

      const booking = window.store.addBooking({
        customerId: custSelect.value,
        customerName: optCust.getAttribute('data-name'),
        customerEmail: optCust.getAttribute('data-email'),
        customerPhone: optCust.getAttribute('data-phone'),
        providerId: provider.id,
        providerName: provider.name,
        serviceId: srvSelect.value,
        serviceName: optSrv.text.split('—')[0].trim(),
        price: Number(optSrv.getAttribute('data-price')) || 50,
        duration: Number(optSrv.getAttribute('data-duration')) || 45,
        workerId: wrkSelect.value,
        workerName: optWrk.text.split('(')[0].trim(),
        date: document.getElementById('nbDateInput').value,
        time: document.getElementById('nbTimeInput').value,
        notes: document.getElementById('nbNotesInput').value
      });

      this.closeModal('newBookingModal');
      this.showToast(`Confirmed slot for ${booking.customerName} on ${booking.date} at ${booking.time}!`, 'success');
    }

    openAddWaitlistModal() {
      const provider = window.store.getCurrentProvider();
      const srvSelect = document.getElementById('wlServiceSelect');
      if (srvSelect) {
        srvSelect.innerHTML = (provider.services || []).map(s => `
          <option value="${s.id}" data-price="${s.price}" data-duration="${s.duration}">${s.name} — $${s.price} (${s.duration}m)</option>
        `).join('');
      }

      const wrkSelect = document.getElementById('wlWorkerSelect');
      if (wrkSelect) {
        wrkSelect.innerHTML = `
          <option value="">Any Specialist</option>
          ${(provider.workers || []).map(w => `<option value="${w.id}">${w.name} (${w.title})</option>`).join('')}
        `;
      }

      const dateInput = document.getElementById('wlDateInput');
      if (dateInput) dateInput.value = window.store.getSelectedDate();

      this.openModal('addWaitlistModal');
    }

    submitAddWaitlist(e) {
      e.preventDefault();
      const provider = window.store.getCurrentProvider();
      const srvSelect = document.getElementById('wlServiceSelect');
      const optSrv = srvSelect.options[srvSelect.selectedIndex];

      const wrkSelect = document.getElementById('wlWorkerSelect');
      const workerId = wrkSelect.value || null;
      const workerName = workerId ? wrkSelect.options[wrkSelect.selectedIndex].text.split('(')[0].trim() : 'Any Specialist';

      const entry = window.store.addWaitlistEntry({
        providerId: provider.id,
        providerName: provider.name,
        customerName: document.getElementById('wlNameInput').value,
        customerPhone: document.getElementById('wlPhoneInput').value,
        customerEmail: document.getElementById('wlEmailInput').value,
        serviceId: srvSelect.value,
        serviceName: optSrv.text.split('—')[0].trim(),
        price: Number(optSrv.getAttribute('data-price')) || 50,
        duration: Number(optSrv.getAttribute('data-duration')) || 45,
        workerId,
        workerName,
        preferredDate: document.getElementById('wlDateInput').value,
        preferredTimeRange: document.getElementById('wlTimeWindowSelect').value,
        priority: document.getElementById('wlPrioritySelect').value,
        notes: document.getElementById('wlNotesInput').value
      });

      this.closeModal('addWaitlistModal');
      this.showToast(`Client ${entry.customerName} added to waitlist queue as #${entry.position}!`, 'success');
    }

    openAppointmentDrawer(bookingId) {
      const b = window.store.getBookings().find(item => item.bookingId === bookingId);
      if (!b) return;

      const content = document.getElementById('appointmentDrawerContent');
      if (content) {
        content.innerHTML = `
          <div style="border-bottom: 1px solid var(--border-light); padding-bottom: 14px;">
            <span class="app-status-pill ${b.status || 'confirmed'}">${b.status || 'confirmed'}</span>
            <h3 style="font-size: 18px; font-weight: 700; margin-top: 6px;">${b.customerName}</h3>
            <p style="font-size: 11px; color: var(--text-muted);">${b.bookingId}</p>
          </div>
          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
            <div><strong>Service:</strong> ${b.serviceName} ($${b.price} • ${b.duration}m)</div>
            <div><strong>Specialist:</strong> ${b.workerName}</div>
            <div><strong>Date & Time:</strong> ${b.date} at ${b.time}</div>
            <div><strong>Contact:</strong> ${b.customerPhone} (${b.customerEmail})</div>
            ${b.notes ? `<div><strong>Notes:</strong> <em>"${b.notes}"</em></div>` : ''}
          </div>
          <div style="margin-top: 20px; border-top: 1px solid var(--border-light); padding-top: 14px; display: flex; justify-content: space-between;">
            <button class="btn-secondary" style="color: var(--urgent-solid);" onclick="window.app.cancelProviderBooking('${b.bookingId}')">Cancel Booking</button>
            <button class="btn-primary" onclick="window.app.closeModal('appointmentDrawerModal')">Done</button>
          </div>
        `;
      }
      this.openModal('appointmentDrawerModal');
    }

    cancelProviderBooking(bookingId) {
      if (confirm('Cancel this appointment and reopen the slot?')) {
        window.store.deleteBooking(bookingId);
        this.closeModal('appointmentDrawerModal');
        this.showToast('Appointment cancelled and slot opened!', 'warning');
      }
    }

    simulateNotification(waitlistId) {
      const entry = window.store.getWaitlist().find(w => w.id === waitlistId);
      if (!entry) return;

      const provider = window.store.getCurrentProvider();
      const content = document.getElementById('phoneSimulatorContent');
      if (content) {
        content.innerHTML = `
          <div style="font-weight: 700; font-size: 13px; color: var(--text-muted); text-align: center; margin-bottom: 4px;">
            Messages • ${entry.customerName}
          </div>
          <div class="sms-bubble">
            <strong>BookNGo Notification:</strong><br>
            Hi ${entry.customerName}! A cancellation slot just opened at <strong>${provider.name}</strong> for <em>${entry.serviceName}</em> (${entry.preferredDate})!<br><br>
            ⏳ Reply <strong>YES</strong> within 15 minutes to lock in this slot!
          </div>
          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px;">
            <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="window.app.confirmDispatchSms('${entry.id}')">
              📲 Send Alert SMS
            </button>
            <button class="btn-secondary" style="width: 100%; justify-content: center; background: #ECFDF5; border-color: #A7F3D0; color: #065F46;" onclick="window.app.simulateCustomerYes('${entry.id}')">
              ⚡ Simulate Customer Replying "YES"
            </button>
          </div>
        `;
      }
      this.openModal('phoneSimulatorModal');
    }

    confirmDispatchSms(id) {
      window.store.notifyWaitlistClient(id);
      this.closeModal('phoneSimulatorModal');
      this.showToast('SMS dispatched to customer! 15m claim window started.', 'info');
    }

    simulateCustomerYes(id) {
      const matches = window.store.findSmartMatches(id);
      const match = matches[0] || { workerId: 'wrk-101', date: window.store.getSelectedDate(), time: '14:00' };
      const booking = window.store.assignWaitlistToSlot(id, match.workerId, match.date, match.time);
      this.closeModal('phoneSimulatorModal');
      this.showToast(`🎉 Customer replied YES! Confirmed slot at ${booking.time}!`, 'success');
    }

    // ========================================================
    // 4. ADMIN PORTAL LOGIC
    // ========================================================
    setupAdminPortal(session) {
      const providers = window.store.getProviders();
      const customers = window.store.getCustomers();
      const bookings = window.store.getBookings();
      const reviews = window.store.getReviews();

      const statProv = document.getElementById('adminStatProviders');
      const statCust = document.getElementById('adminStatCustomers');
      const statBook = document.getElementById('adminStatBookings');
      const statRev = document.getElementById('adminStatReviews');

      if (statProv) statProv.textContent = providers.length;
      if (statCust) statCust.textContent = customers.length;
      if (statBook) statBook.textContent = bookings.length;
      if (statRev) statRev.textContent = reviews.length;

      const mount = document.getElementById('adminProvidersTableMount');
      if (mount) {
        mount.innerHTML = providers.map(p => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-surface-alt); border-radius: var(--radius-md); border: 1px solid var(--border-light);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${p.image}" style="width: 38px; height: 38px; border-radius: var(--radius-sm); object-fit: cover;">
              <div>
                <div style="font-weight: 700; font-size: 13px;">${p.name}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${p.category} • ${p.email}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="app-status-pill ${p.status === 'active' ? 'confirmed' : 'in-progress'}">${p.status}</span>
              <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="window.app.toggleProviderStatus('${p.id}')">
                Toggle Status
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    toggleProviderStatus(providerId) {
      const providers = window.store.getProviders();
      const p = providers.find(item => item.id === providerId);
      if (p) {
        p.status = p.status === 'active' ? 'suspended' : 'active';
        localStorage.setItem('bng_providers_v1', JSON.stringify(providers));
        this.setupAdminPortal(window.store.getCurrentSession());
        this.showToast(`Updated status for ${p.name} to ${p.status}`, 'info');
      }
    }

    // Modal Helpers
    openModal(id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('open');
    }

    closeModal(id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('open');
    }

    closeAllModals() {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    }

    openCommandPalette() {
      this.openModal('commandPaletteModal');
      const input = document.getElementById('commandSearchInput');
      if (input) {
        input.value = '';
        input.focus();
        this.renderCommandResults('');
      }
    }

    renderCommandResults(query) {
      const q = (query || '').toLowerCase().trim();
      const mount = document.getElementById('commandResultsList');
      if (!mount) return;

      const services = window.store.getProviders().flatMap(p => p.services || []);
      const matched = services.filter(s => s.name.toLowerCase().includes(q));

      mount.innerHTML = matched.slice(0, 6).map(s => `
        <div style="padding: 8px 12px; border-radius: var(--radius-sm); background: var(--bg-surface-alt); cursor: pointer; display: flex; justify-content: space-between; margin-bottom: 6px;" onclick="window.app.closeModal('commandPaletteModal'); window.app.handleCustomerSearch('${s.name}');">
          <strong>${s.name}</strong>
          <span style="color: var(--primary-600); font-weight: 700;">$${s.price} (${s.duration}m)</span>
        </div>
      `).join('');
    }

    showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `
        <span style="font-size: 16px;">${type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : '⚡')}</span>
        <span style="flex: 1;">${message}</span>
      `;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    }
  }

  window.app = new App();
})();
