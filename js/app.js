/**
 * BookNGo — Main Application Coordinator (Multi-Portal Edition)
 * Manages Role Selection, Authentication, Customer Service Search & Slot Booking,
 * Review & Feedback System, Provider Schedulo Calendar, and Admin Oversight.
 */

(function () {
  'use strict';

  class App {
    constructor() {
      this.currentAuthRole = 'customer';
      this.currentAuthMode = 'signin';
      this.selectedCustomerCategory = 'all';
      this.selectedBookingSlotTime = null;
      this.currentBookingProviderId = null;
      this.init();
    }

    init() {
      const start = () => {
        this.applyTheme(window.store.getTheme());
        this.bindEvents();
        this.checkSessionAndRoute();
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
      } else {
        start();
      }
    }

    bindEvents() {
      // Global ESC key to close any active modal
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          this.openCommandPalette();
        }
        if (e.key === 'Escape') {
          this.closeAllModals();
        }
      });

      // Provider Date Navigation & Popover Calendar
      const btnOpenDatePicker = document.getElementById('btnOpenDatePicker');
      const providerCalendarPopover = document.getElementById('providerCalendarPopover');
      const btnClosePopover = document.getElementById('btnClosePopover');
      const btnPopoverToday = document.getElementById('btnPopoverToday');

      if (btnOpenDatePicker && providerCalendarPopover) {
        btnOpenDatePicker.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = providerCalendarPopover.style.display === 'none' || !providerCalendarPopover.style.display;
          if (isHidden) {
            providerCalendarPopover.style.display = 'block';
            this.renderProviderMiniCalendar();
          } else {
            providerCalendarPopover.style.display = 'none';
          }
        });

        if (btnClosePopover) {
          btnClosePopover.addEventListener('click', (e) => {
            e.stopPropagation();
            providerCalendarPopover.style.display = 'none';
          });
        }

        if (btnPopoverToday) {
          btnPopoverToday.addEventListener('click', (e) => {
            e.stopPropagation();
            const today = window.getDateOffset(0);
            window.store.setSelectedDate(today);
            this.updateDateDisplay();
            providerCalendarPopover.style.display = 'none';
          });
        }

        document.addEventListener('click', (e) => {
          if (!e || !e.target) return;
          if (providerCalendarPopover.style.display !== 'none') {
            const clickedInside = providerCalendarPopover.contains(e.target);
            const clickedTrigger = btnOpenDatePicker && btnOpenDatePicker.contains(e.target);
            if (!clickedInside && !clickedTrigger) {
              providerCalendarPopover.style.display = 'none';
            }
          }
        });
      }

      const btnToday = document.getElementById('btnToday');
      if (btnToday) {
        btnToday.addEventListener('click', () => {
          const today = window.getDateOffset(0);
          window.store.setSelectedDate(today);
          this.updateDateDisplay();
          if (providerCalendarPopover) providerCalendarPopover.style.display = 'none';
        });
      }

      const btnPrevDate = document.getElementById('btnPrevDate');
      if (btnPrevDate) btnPrevDate.addEventListener('click', () => this.shiftDate(-1));

      const btnNextDate = document.getElementById('btnNextDate');
      if (btnNextDate) btnNextDate.addEventListener('click', () => this.shiftDate(1));

      // Provider View Switcher Buttons
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

      // Provider Waitlist Filter Tabs
      document.querySelectorAll('.waitlist-tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.waitlist-tab-btn').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const filter = tab.getAttribute('data-filter');
          if (window.waitlistController) window.waitlistController.setFilter(filter);
        });
      });

      // Provider Waitlist Search
      const wlSearchInput = document.getElementById('waitlistSearchInput');
      if (wlSearchInput) {
        wlSearchInput.addEventListener('input', (e) => {
          if (window.waitlistController) window.waitlistController.setSearchQuery(e.target.value);
        });
      }

      // Sidebar Collapse
      const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
      const sidebar = document.getElementById('sidebar');
      if (sidebarCollapseBtn && sidebar) {
        sidebarCollapseBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
      }

      // Reactive store listeners
      window.store.subscribe('session_changed', () => this.checkSessionAndRoute());
      window.store.subscribe('provider_changed', () => {
        this.renderCustomerMarketplace();
        this.updateProviderKpiBar();
      });
      window.store.subscribe('bookings_updated', () => {
        this.updateProviderKpiBar();
        this.renderCustomerBookings();
      });
      window.store.subscribe('waitlist_updated', () => {
        this.updateProviderKpiBar();
        this.renderCustomerBookings();
      });
      window.store.subscribe('review_added', () => {
        this.renderCustomerMarketplace();
        this.renderCustomerBookings();
      });
      window.store.subscribe('date_changed', () => {
        this.updateDateDisplay();
        this.updateProviderKpiBar();
      });
      window.store.subscribe('view_changed', (view) => this.updateViewSwitcherActive(view));
    }

    // ========================================================
    // 1. ROUTING & PORTAL SWITCHING
    // ========================================================
    checkSessionAndRoute() {
      if (window.location.hash === '#login' || window.location.search.includes('login')) {
        window.store.logout();
      }

      const session = window.store.getCurrentSession();
      const authPortal = document.getElementById('authPortal');
      const customerPortal = document.getElementById('customerPortal');
      const providerPortal = document.getElementById('providerPortal');
      const adminPortal = document.getElementById('adminPortal');

      // Hide all portals first
      [authPortal, customerPortal, providerPortal, adminPortal].forEach(el => {
        if (el) el.classList.remove('active');
      });

      if (!session || !session.isLoggedIn) {
        if (authPortal) authPortal.classList.add('active');
        return;
      }

      if (session.role === 'customer') {
        if (customerPortal) customerPortal.classList.add('active');
        this.setupCustomerPortal(session);
        return;
      }

      if (session.role === 'provider') {
        if (providerPortal) providerPortal.classList.add('active');
        this.setupProviderPortal(session);
        return;
      }

      if (session.role === 'admin') {
        if (adminPortal) adminPortal.classList.add('active');
        this.setupAdminPortal(session);
        return;
      }

      if (authPortal) authPortal.classList.add('active');
    }

    logout() {
      window.store.logout();
      this.checkSessionAndRoute();
      this.showToast('Signed out of BookNGo.', 'info');
    }

    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }

    toggleTheme() {
      const current = window.store.getTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      window.store.setTheme(next);
      this.applyTheme(next);
      this.showToast(`Switched to ${next} mode`, 'info');
    }

    // ========================================================
    // 2. AUTHENTICATION & ROLE SELECTION LOGIC
    // ========================================================
    selectAuthRole(role) {
      this.currentAuthRole = role;
      document.querySelectorAll('.simple-role-btn').forEach(b => b.classList.remove('active'));

      const tabsRow = document.getElementById('authTabsRow');
      if (role === 'customer') {
        document.getElementById('btnRoleCustomer')?.classList.add('active');
        if (tabsRow) tabsRow.style.display = 'flex';
      } else if (role === 'provider') {
        document.getElementById('btnRoleProvider')?.classList.add('active');
        if (tabsRow) tabsRow.style.display = 'flex';
      } else if (role === 'admin') {
        document.getElementById('btnRoleAdmin')?.classList.add('active');
        if (tabsRow) tabsRow.style.display = 'none';
        this.currentAuthMode = 'signin';
      }

      this.updateAuthFormFields();
    }

    switchAuthMode(mode) {
      this.currentAuthMode = mode;
      document.getElementById('authModeSignIn')?.classList.toggle('active', mode === 'signin');
      document.getElementById('authModeSignUp')?.classList.toggle('active', mode === 'signup');

      this.updateAuthFormFields();
    }

    updateAuthFormFields() {
      const isSignup = this.currentAuthMode === 'signup';
      const role = this.currentAuthRole;

      const nameField = document.getElementById('authNameField');
      const bizField = document.getElementById('authBizField');
      const catField = document.getElementById('authBizCatField');
      const emailLabel = document.getElementById('authEmailLabel');
      const emailInput = document.getElementById('authEmailInput');
      const nameLabel = document.getElementById('authNameLabel');
      const submitBtn = document.getElementById('authSubmitBtn');

      if (nameField) nameField.style.display = isSignup ? 'flex' : 'none';
      if (bizField) bizField.style.display = (isSignup && role === 'provider') ? 'flex' : 'none';
      if (catField) catField.style.display = (isSignup && role === 'provider') ? 'flex' : 'none';

      if (role === 'customer') {
        if (emailLabel) emailLabel.textContent = 'Customer Email (Gmail) *';
        if (emailInput) emailInput.placeholder = 'e.g. yourname@gmail.com';
        if (nameLabel) nameLabel.textContent = 'Your Full Name *';
        if (submitBtn) {
          submitBtn.textContent = isSignup ? 'Create Customer Account →' : 'Sign In as Customer →';
        }
      } else if (role === 'provider') {
        if (emailLabel) emailLabel.textContent = isSignup ? 'Business Email Address *' : 'Business / Provider Email *';
        if (emailInput) emailInput.placeholder = 'e.g. salon@gmail.com';
        if (nameLabel) nameLabel.textContent = 'Owner / Manager Name *';
        if (submitBtn) {
          submitBtn.textContent = isSignup ? 'Register My Business →' : 'Sign In to Business Portal →';
        }
      } else if (role === 'admin') {
        if (emailLabel) emailLabel.textContent = 'Administrator Email *';
        if (emailInput) emailInput.placeholder = 'admin@bookngo.com';
        if (submitBtn) {
          submitBtn.textContent = 'Sign In as Platform Admin →';
        }
      }
    }

    async handleAuthSubmit(e) {
      e.preventDefault();
      const emailInput = document.getElementById('authEmailInput');
      const passwordInput = document.getElementById('authPasswordInput');
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const nameInput = document.getElementById('authNameInput');
      const name = nameInput?.value?.trim() || email.split('@')[0];

      if (!email || !password) {
        this.showToast('Please enter both email and password.', 'error');
        return;
      }

      const submitBtn = document.getElementById('authSubmitBtn');
      const origText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
      }

      try {
        if (this.currentAuthRole === 'admin') {
          const res = await window.store.login('admin', email, password);
          if (res && res.success) {
            this.showToast('Logged in to Admin Management Portal', 'success');
          } else {
            this.showToast(res?.message || 'Admin login failed', 'error');
          }
          return;
        }

        if (this.currentAuthMode === 'signup') {
          if (this.currentAuthRole === 'customer') {
            const res = await window.store.registerCustomer({ name, email, password });
            if (!res.success) {
              this.showToast(res.message, 'error');
              if (res.error === 'EXISTS') this.switchAuthMode('signin');
              return;
            }
            this.showToast(`Account created for ${name}! Saved permanently in database.`, 'success');
          } else if (this.currentAuthRole === 'provider') {
            const bizNameInput = document.getElementById('authBizNameInput');
            const bizCatInput = document.getElementById('authBizCatInput');
            const bizName = bizNameInput?.value?.trim() || `${name}'s Studio`;
            const category = bizCatInput?.value || 'Salons & Spas';
            const res = await window.store.registerProviderBusiness({
              name: bizName,
              category,
              ownerName: name,
              email,
              password
            });
            if (!res.success) {
              this.showToast(res.message, 'error');
              if (res.error === 'EXISTS') this.switchAuthMode('signin');
              return;
            }
            this.showToast(`Business "${bizName}" registered! Saved permanently in database.`, 'success');
          }
        } else {
          // Sign In
          const res = await window.store.login(this.currentAuthRole, email, password);
          if (!res.success) {
            this.showToast(res.message, 'error');
            if (res.error === 'NO_ACCOUNT') {
              this.switchAuthMode('signup');
            }
            return;
          }
          this.showToast(`Welcome back, ${res.session.name || email}!`, 'success');
        }
      } catch (err) {
        this.showToast('Authentication error: ' + (err.message || 'Server error'), 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText || (this.currentAuthMode === 'signup' ? 'Create Account' : 'Sign In');
        }
      }
    }

    // ========================================================
    // 3. CUSTOMER PORTAL WORKFLOW
    // ========================================================
    setupCustomerPortal(session) {
      const nameEl = document.getElementById('custUserName');
      if (nameEl) nameEl.textContent = session.name || 'Customer';

      const avatarEl = document.getElementById('custUserAvatar');
      if (avatarEl && session.avatar) avatarEl.src = session.avatar;

      this.renderCustomerCategoryPills();
      this.renderCustomerMarketplace();
      this.renderCustomerBookings();
    }

    switchCustomerTab(tab) {
      const tabExplore = document.getElementById('customerTabExplore');
      const tabBookings = document.getElementById('customerTabBookings');
      const navExplore = document.getElementById('custNavExplore');
      const navBookings = document.getElementById('custNavBookings');

      if (tab === 'explore') {
        if (tabExplore) tabExplore.style.display = 'block';
        if (tabBookings) tabBookings.style.display = 'none';
        navExplore?.classList.add('active');
        navBookings?.classList.remove('active');
      } else {
        if (tabExplore) tabExplore.style.display = 'none';
        if (tabBookings) tabBookings.style.display = 'block';
        navExplore?.classList.remove('active');
        navBookings?.classList.add('active');
        this.renderCustomerBookings();
      }
    }

    renderCustomerCategoryPills() {
      const container = document.getElementById('custCategoryPills');
      if (!container) return;

      const categories = [
        { id: 'all', name: 'All Services', icon: '🌟' },
        ...(window.INITIAL_CATEGORIES || [])
      ];

      container.innerHTML = categories.map(cat => `
        <button class="category-pill-btn ${cat.id === this.selectedCustomerCategory ? 'active' : ''}" 
                onclick="window.app.selectCustomerCategory('${cat.id}')">
          <span>${cat.icon}</span> <span>${cat.name}</span>
        </button>
      `).join('');
    }

    selectCustomerCategory(catId) {
      this.selectedCustomerCategory = catId;
      this.renderCustomerCategoryPills();
      this.renderCustomerMarketplace();
    }

    filterCustomerServices() {
      this.renderCustomerMarketplace();
    }

    renderCustomerMarketplace() {
      const container = document.getElementById('providersMarketplaceMount');
      if (!container) return;

      const searchInput = document.getElementById('custSearchInput');
      const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

      const providers = window.store.getProviders().filter(p => p.status === 'active');

      const filtered = providers.filter(p => {
        // Category check
        if (this.selectedCustomerCategory !== 'all') {
          const catObj = (window.INITIAL_CATEGORIES || []).find(c => c.id === this.selectedCustomerCategory);
          if (catObj && p.category !== catObj.name) return false;
        }

        // Search text check
        if (query) {
          const matchBiz = p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) || p.location.toLowerCase().includes(query);
          const matchServices = (p.services || []).some(s => s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query));
          if (!matchBiz && !matchServices) return false;
        }

        return true;
      });

      const countLabel = document.getElementById('marketplaceCountLabel');
      if (countLabel) countLabel.textContent = `Showing ${filtered.length} verified businesses`;

      if (filtered.length === 0) {
        if (providers.length === 0) {
          container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: var(--bg-surface); border: 1px dashed var(--border-light); border-radius: var(--radius-xl);">
              <div style="font-size: 40px; margin-bottom: 8px;">🌸</div>
              <h4 style="font-size: 18px; font-weight: 800; color: var(--text-main);">No Businesses Registered Yet</h4>
              <p style="font-size: 13px; color: var(--text-muted); margin-top: 6px; max-width: 420px; margin-left: auto; margin-right: auto;">
                Businesses are added dynamically by registered providers. Create your own business or load a sample boutique salon to test booking slots!
              </p>
              <div style="display: flex; gap: 10px; justify-content: center; margin-top: 18px; flex-wrap: wrap;">
                <button class="btn-primary" onclick="window.app.logout(); window.app.selectAuthRole('provider')">
                  🏢 Register a Business
                </button>
                <button class="btn-secondary" onclick="window.store.loadSampleBusiness(); window.app.renderCustomerMarketplace();">
                  🌸 Load Sample Salon for Testing
                </button>
              </div>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 48px; text-align: center; background: var(--bg-surface); border: 1px dashed var(--border-light); border-radius: var(--radius-xl);">
              <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
              <h4 style="font-size: 16px; font-weight: 700;">No services found matching "${query}"</h4>
              <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Try searching for another service name or clear the filter.</p>
            </div>
          `;
        }
        return;
      }

      container.innerHTML = filtered.map(p => {
        const primaryServices = (p.services || []).slice(0, 3);
        return `
          <div class="provider-card">
            <div class="provider-card-img-wrap">
              <img src="${p.image}" class="provider-card-img" alt="${p.name}">
              <span class="provider-card-cat-badge">${p.category}</span>
            </div>

            <div class="provider-card-content">
              <div class="provider-card-header">
                <h4 class="provider-card-title">${p.name}</h4>
                <div class="provider-rating-pill">
                  <span>★</span> <span>${p.rating || 5.0}</span>
                  <span style="font-weight: 500; font-size: 10px; color: var(--text-muted);">(${p.reviewCount || 0})</span>
                </div>
              </div>

              <div class="provider-card-loc">
                <span>📍</span> <span>${p.address}</span>
              </div>

              <p style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">
                ${p.tagline || p.description}
              </p>

              <!-- Services Highlights -->
              <div class="provider-services-summary">
                <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Top Services</div>
                ${primaryServices.map(s => `
                  <div class="provider-service-item-row">
                    <span>${s.name} (${s.duration}m)</span>
                    <strong style="color: var(--primary-600);">$${s.price}</strong>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="provider-card-footer">
              <span style="font-size: 11px; font-weight: 600; color: var(--success-solid);">Open Today • ${p.openTime} - ${p.closeTime}</span>
              <button class="btn-primary" onclick="window.app.openCustomerSlotBooking('${p.id}')">
                📅 Book a Slot
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Customer Slot Booking Modal Dialog
    openCustomerSlotBooking(providerId) {
      this.currentBookingProviderId = providerId;
      const providers = window.store.getProviders();
      const p = providers.find(item => item.id === providerId) || providers[0];
      if (!p) {
        this.showToast('Provider not found', 'error');
        return;
      }

      document.getElementById('slotModalProviderName').textContent = p.name;
      document.getElementById('slotModalProviderLocation').textContent = `${p.location || 'Central'} • ${p.address || ''}`;

      // Populate services
      const srvSelect = document.getElementById('custSlotServiceSelect');
      const services = Array.isArray(p.services) && p.services.length > 0 ? p.services : [
        { id: `srv-${p.id}-1`, name: 'Consultation', price: 50, duration: 45 }
      ];
      srvSelect.innerHTML = services.map(s => `
        <option value="${s.id}" data-duration="${s.duration}" data-price="${s.price}">
          ${s.name} — $${s.price} (${s.duration} mins)
        </option>
      `).join('');

      // Populate specialists
      const wrkSelect = document.getElementById('custSlotWorkerSelect');
      const workers = Array.isArray(p.workers) && p.workers.length > 0 ? p.workers : [{ id: null, name: 'Specialist' }];
      wrkSelect.innerHTML = `
        <option value="any">Any Available Specialist</option>
        ${workers.map(w => `<option value="${w.id || ''}">${w.name} (${w.title || 'Staff'})</option>`).join('')}
      `;

      // Clear previous notes
      const notesInput = document.getElementById('custSlotNotesInput');
      if (notesInput) notesInput.value = '';

      // Set target date with Month Calendar Widget
      const defaultDate = window.getDateOffset(0);
      const dateInput = document.getElementById('custSlotDateInput');
      if (dateInput) dateInput.value = defaultDate;

      const dateLabel = document.getElementById('custSelectedDateLabel');
      if (dateLabel) {
        dateLabel.textContent = window.formatReadableDate ? window.formatReadableDate(defaultDate) : defaultDate;
      }

      // Initialize the visual month calendar
      const calMount = document.getElementById('custBookingCalendarMount');
      if (calMount && window.MonthCalendarWidget) {
        this.custBookingCalendar = new window.MonthCalendarWidget({
          container: calMount,
          selectedDate: defaultDate,
          minDate: defaultDate,
          getDayMeta: (dateStr) => {
            const dayBookings = window.store.getBookingsForDateAndProvider(dateStr, p.id);
            return {
              hasBookings: dayBookings.length > 0,
              isAvailable: true
            };
          },
          onSelect: (dateStr) => {
            if (dateInput) dateInput.value = dateStr;
            if (dateLabel) {
              dateLabel.textContent = window.formatReadableDate ? window.formatReadableDate(dateStr) : dateStr;
            }
            this.onSlotServiceOrDateChange();
          }
        });
      }

      this.onSlotServiceOrDateChange();
      this.openModal('customerSlotModal');
    }

    onSlotServiceOrDateChange() {
      const providerId = this.currentBookingProviderId;
      const p = window.store.getProviders().find(item => item.id === providerId);
      if (!p) return;

      const date = document.getElementById('custSlotDateInput')?.value || window.getDateOffset(0);
      const srvSelect = document.getElementById('custSlotServiceSelect');
      const selectedOption = srvSelect?.options?.[srvSelect.selectedIndex] || srvSelect?.options?.[0];
      const duration = Number(selectedOption?.getAttribute('data-duration')) || 45;

      const wrkSelect = document.getElementById('custSlotWorkerSelect');
      const workerId = wrkSelect ? wrkSelect.value : 'any';
      const bookings = window.store.getBookingsForDateAndProvider(date, p.id);

      // Generate intervals between openTime and closeTime
      const [startHour, startMin] = (p.openTime || '09:00').split(':').map(Number);
      const [endHour, endMin] = (p.closeTime || '18:00').split(':').map(Number);
      const startTotal = (isNaN(startHour) ? 9 : startHour) * 60 + (isNaN(startMin) ? 0 : startMin);
      const endTotal = (isNaN(endHour) ? 18 : endHour) * 60 + (isNaN(endMin) ? 0 : endMin);

      const breaks = (p.breaks || []).map(b => {
        const [sh, sm] = (b.start || '13:00').split(':').map(Number);
        const [eh, em] = (b.end || '14:00').split(':').map(Number);
        return { start: (isNaN(sh) ? 13 : sh) * 60 + (isNaN(sm) ? 0 : sm), end: (isNaN(eh) ? 14 : eh) * 60 + (isNaN(em) ? 0 : em) };
      });

      const slotsMount = document.getElementById('custAvailableSlotsMount');
      const countHint = document.getElementById('custSlotCountHint');
      const confirmBtn = document.getElementById('custConfirmBookingBtn');
      const timeInput = document.getElementById('custSelectedTimeInput');
      const slots = [];

      const workers = Array.isArray(p.workers) && p.workers.length > 0 ? p.workers : [{ id: null, name: 'Specialist' }];

      for (let min = startTotal; min + duration <= endTotal; min += 30) {
        const hh = String(Math.floor(min / 60)).padStart(2, '0');
        const mm = String(min % 60).padStart(2, '0');
        const timeStr = `${hh}:${mm}`;

        // Check conflicts
        const slotEnd = min + duration;
        const collidesBreak = breaks.some(b => min < b.end && slotEnd > b.start);

        // Worker conflicts
        let isBooked = false;
        if (workerId && workerId !== 'any') {
          isBooked = bookings.some(b => b.workerId === workerId && b.time === timeStr && b.status !== 'cancelled');
        } else {
          // If any worker, check if all workers are occupied
          const occupiedCount = bookings.filter(b => b.time === timeStr && b.status !== 'cancelled').length;
          isBooked = occupiedCount >= workers.length;
        }

        if (!collidesBreak && !isBooked) {
          slots.push(timeStr);
        }
      }

      if (slots.length === 0) {
        this.selectedBookingSlotTime = null;
        if (timeInput) timeInput.value = '';
        if (countHint) countHint.textContent = '0 slots available';
        if (confirmBtn) {
          confirmBtn.disabled = true;
          confirmBtn.textContent = 'All Slots Booked Today';
        }
        if (slotsMount) {
          slotsMount.innerHTML = `
            <div style="background: var(--warning-bg); border: 1px solid var(--warning-border); padding: 12px; border-radius: var(--radius-sm); font-size: 12px; color: var(--warning-text); text-align: center;">
              ⚠️ All standard slots are booked on ${date}! Please select another date on the calendar.
            </div>
          `;
        }
        return;
      }

      // Automatically select first available slot
      this.selectedBookingSlotTime = slots[0];
      if (timeInput) timeInput.value = slots[0];
      if (countHint) countHint.textContent = `${slots.length} available slots (tap to change)`;
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = `Confirm Booking (${slots[0]})`;
      }

      if (slotsMount) {
        slotsMount.innerHTML = `
          <div class="slot-badges-grid">
            ${slots.map((t, idx) => `
              <button type="button" class="slot-badge-btn ${idx === 0 ? 'selected' : ''}" onclick="window.app.selectBookingSlotBadge('${t}', this)">
                ${t}
              </button>
            `).join('')}
          </div>
        `;
      }
    }

    selectBookingSlotBadge(timeStr, btnElement) {
      document.querySelectorAll('#custAvailableSlotsMount .slot-badge-btn').forEach(b => b.classList.remove('selected'));
      if (btnElement) btnElement.classList.add('selected');
      this.selectedBookingSlotTime = timeStr;
      const timeInput = document.getElementById('custSelectedTimeInput');
      if (timeInput) timeInput.value = timeStr;
      const confirmBtn = document.getElementById('custConfirmBookingBtn');
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = `Confirm Booking (${timeStr})`;
      }
    }

    async submitCustomerSlotBooking(e) {
      if (e) {
        e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      }

      const session = window.store.getCurrentSession();
      if (!session || !session.isLoggedIn) {
        this.showToast('Please sign in as a customer to book an appointment.', 'error');
        this.openAuthModal('signin', 'customer');
        return;
      }

      const providerId = this.currentBookingProviderId;
      const provider = window.store.getProviders().find(p => p.id === providerId);
      if (!provider) {
        this.showToast('Selected provider was not found.', 'error');
        return;
      }

      const srvSelect = document.getElementById('custSlotServiceSelect');
      const serviceId = srvSelect ? srvSelect.value : (provider.services?.[0]?.id || null);
      const srvOption = srvSelect ? srvSelect.options[srvSelect.selectedIndex] : null;
      const selectedService = (provider.services || []).find(s => s.id === serviceId) || provider.services?.[0];
      const serviceName = selectedService?.name || (srvOption?.text ? srvOption.text.split('—')[0].trim() : 'Consultation');
      const price = selectedService ? Number(selectedService.price) : (Number(srvOption?.getAttribute('data-price')) || 50);
      const duration = selectedService ? Number(selectedService.duration) : (Number(srvOption?.getAttribute('data-duration')) || 45);

      const wrkSelect = document.getElementById('custSlotWorkerSelect');
      const workers = Array.isArray(provider.workers) && provider.workers.length > 0 ? provider.workers : [{ id: null, name: 'Specialist' }];
      const workerId = (wrkSelect && wrkSelect.value !== 'any') ? wrkSelect.value : (workers[0]?.id || null);
      const worker = workers.find(w => w.id === workerId) || workers[0] || { id: null, name: 'Specialist' };

      const date = document.getElementById('custSlotDateInput')?.value || window.getDateOffset(0);
      const time = this.selectedBookingSlotTime || document.getElementById('custSelectedTimeInput')?.value;
      const notes = document.getElementById('custSlotNotesInput')?.value || '';

      if (!time) {
        this.showToast('Please tap on an available time slot badge above.', 'warning');
        return;
      }

      const confirmBtn = document.getElementById('custConfirmBookingBtn');
      const origBtnText = confirmBtn ? confirmBtn.textContent : 'Confirm Booking';
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = '⏳ Confirming Booking...';
      }

      try {
        const customerId = session.id || session.customerId;
        const customerName = session.name || 'Customer';
        const customerEmail = session.email;
        const customerPhone = session.phone || '';

        const newBooking = await window.store.addBooking({
          customerId,
          customerName,
          customerEmail,
          customerPhone,
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

        this.closeModal('customerSlotModal');
        this.showToast(`🎉 Appointment confirmed with ${worker.name} on ${date} at ${time}!`, 'success');
        this.switchCustomerTab('bookings');
      } catch (err) {
        console.error('[Booking Error]', err);
        this.showToast(err.message || 'Booking failed. Slot may already be reserved.', 'error');
      } finally {
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = origBtnText;
        }
      }
    }

    // Customer Join Waitlist
    openCustomerStandbyWaitlistModal() {
      this.closeModal('customerSlotModal');
      const providerId = this.currentBookingProviderId;
      const p = window.store.getProviders().find(item => item.id === providerId);
      if (!p) return;

      const srvSelect = document.getElementById('cwServiceSelect');
      const services = Array.isArray(p.services) && p.services.length > 0 ? p.services : [
        { id: `srv-${p.id}-1`, name: 'Consultation', price: 50, duration: 45 }
      ];
      if (srvSelect) {
        srvSelect.innerHTML = services.map(s => `
          <option value="${s.id}" data-duration="${s.duration}" data-price="${s.price}">${s.name} — $${s.price}</option>
        `).join('');
      }

      const wrkSelect = document.getElementById('cwWorkerSelect');
      const workers = Array.isArray(p.workers) && p.workers.length > 0 ? p.workers : [{ id: null, name: 'Specialist' }];
      if (wrkSelect) {
        wrkSelect.innerHTML = `
          <option value="">Any Available Specialist</option>
          ${workers.map(w => `<option value="${w.id || ''}">${w.name}</option>`).join('')}
        `;
      }

      const defaultDate = window.getDateOffset(0);
      const cwDateInput = document.getElementById('cwDateInput');
      if (cwDateInput) cwDateInput.value = defaultDate;

      const cwDateLabel = document.getElementById('cwSelectedDateLabel');
      if (cwDateLabel) {
        cwDateLabel.textContent = window.formatReadableDate ? window.formatReadableDate(defaultDate) : defaultDate;
      }

      const cwCalMount = document.getElementById('cwCalendarMount');
      if (cwCalMount && window.MonthCalendarWidget) {
        new window.MonthCalendarWidget({
          container: cwCalMount,
          selectedDate: defaultDate,
          minDate: defaultDate,
          onSelect: (dateStr) => {
            if (cwDateInput) cwDateInput.value = dateStr;
            if (cwDateLabel) {
              cwDateLabel.textContent = window.formatReadableDate ? window.formatReadableDate(dateStr) : dateStr;
            }
          }
        });
      }

      this.openModal('customerWaitlistModal');
    }

    async submitCustomerWaitlist(e) {
      if (e) {
        e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      }

      const session = window.store.getCurrentSession();
      if (!session || !session.isLoggedIn) {
        this.showToast('Please sign in as a customer to join the waitlist.', 'error');
        this.openAuthModal('signin', 'customer');
        return;
      }

      const provider = window.store.getProviders().find(p => p.id === this.currentBookingProviderId);
      if (!provider) {
        this.showToast('Provider not found.', 'error');
        return;
      }

      const srvSelect = document.getElementById('cwServiceSelect');
      const serviceId = srvSelect ? srvSelect.value : (provider.services?.[0]?.id || null);
      const srvOption = srvSelect ? srvSelect.options[srvSelect.selectedIndex] : null;
      const selectedService = (provider.services || []).find(s => s.id === serviceId) || provider.services?.[0];
      const serviceName = selectedService?.name || (srvOption?.text ? srvOption.text.split('—')[0].trim() : 'Service');
      const duration = selectedService ? Number(selectedService.duration) : (Number(srvOption?.getAttribute('data-duration')) || 45);
      const price = selectedService ? Number(selectedService.price) : (Number(srvOption?.getAttribute('data-price')) || 50);

      const wrkSelect = document.getElementById('cwWorkerSelect');
      const workerId = (wrkSelect && wrkSelect.value) ? wrkSelect.value : null;
      const workerName = workerId && wrkSelect?.options[wrkSelect.selectedIndex] ? wrkSelect.options[wrkSelect.selectedIndex].text : 'Any Specialist';

      const preferredDate = document.getElementById('cwDateInput')?.value || window.getDateOffset(0);
      const preferredTimeRange = document.getElementById('cwTimeWindowSelect')?.value || 'Any Time Today';
      const priority = document.getElementById('cwPrioritySelect')?.value || 'regular';
      const notes = document.getElementById('cwNotesInput')?.value || '';

      try {
        const entry = await window.store.addWaitlistEntry({
          providerId: provider.id,
          providerName: provider.name,
          customerId: session.id || session.customerId,
          customerName: session.name || 'Customer',
          customerEmail: session.email,
          customerPhone: session.phone || '+1 (555) 777-8899',
          customerAvatar: session.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          serviceId,
          serviceName,
          duration,
          price,
          workerId,
          workerName,
          preferredDate,
          preferredTimeRange,
          priority,
          notes
        });

        this.closeModal('customerWaitlistModal');
        this.showToast(`⏳ Added to standby queue as position #${entry.position || 1}! You'll be alerted when a slot opens.`, 'success');
        this.switchCustomerTab('bookings');
      } catch (err) {
        this.showToast(err.message || 'Failed to join waitlist.', 'error');
      }
    }

    renderCustomerBookings() {
      const session = window.store.getCurrentSession();
      if (!session) return;

      const custId = session.id || session.customerId;
      const allBookings = window.store.getBookings().filter(b => b.customerId === custId || b.customerEmail === session.email);
      const allWaitlist = window.store.getWaitlist().filter(w => w.customerId === custId || w.customerEmail === session.email);

      const todayStr = window.getDateOffset(0);

      const upcoming = allBookings.filter(b => b.date >= todayStr && b.status !== 'cancelled');
      const completed = allBookings.filter(b => b.status === 'completed' || b.date < todayStr);

      // Render upcoming
      const mountUpcoming = document.getElementById('custUpcomingBookingsMount');
      if (mountUpcoming) {
        mountUpcoming.innerHTML = upcoming.length === 0 ? `
          <div style="grid-column: 1 / -1; padding: 24px; background: var(--bg-surface); border: 1px dashed var(--border-light); border-radius: var(--radius-lg); text-align: center; color: var(--text-muted);">
            No upcoming bookings. Click "Explore Services" above to reserve an open slot!
          </div>
        ` : upcoming.map(b => `
          <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-left: 4px solid var(--primary-500); padding: 18px; border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span class="app-status-pill ${b.status || 'confirmed'}">${b.status || 'confirmed'}</span>
                <h4 style="font-size: 15px; font-weight: 700; margin-top: 4px;">${b.serviceName}</h4>
                <div style="font-size: 12px; color: var(--text-muted);">${b.providerName}</div>
              </div>
              <span style="font-size: 16px; font-weight: 800; color: var(--primary-600);">$${b.price}</span>
            </div>
            <div style="font-size: 13px; color: var(--text-main); margin-top: 4px;">
              📅 <strong>${b.date}</strong> at <strong>${b.time}</strong> • 👤 ${b.workerName}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; border-top: 1px solid var(--border-light); padding-top: 10px;">
              <span style="font-size: 11px; color: var(--text-muted);">Ref: ${b.bookingId}</span>
              <button class="btn-secondary" style="font-size: 11px; padding: 4px 10px; color: var(--urgent-solid);" onclick="window.app.customerCancelBooking('${b.bookingId}')">
                Cancel Slot
              </button>
            </div>
          </div>
        `).join('');
      }


      // Render completed (with review button)
      const mountCompleted = document.getElementById('custCompletedBookingsMount');
      if (mountCompleted) {
        mountCompleted.innerHTML = completed.length === 0 ? `
          <div style="grid-column: 1 / -1; padding: 24px; background: var(--bg-surface); border: 1px dashed var(--border-light); border-radius: var(--radius-lg); text-align: center; color: var(--text-muted);">
            No completed appointments yet.
          </div>
        ` : completed.map(b => `
          <div style="background: var(--bg-surface); border: 1px solid var(--border-light); padding: 16px; border-radius: var(--radius-lg); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; font-size: 14px;">${b.serviceName}</div>
              <div style="font-size: 12px; color: var(--text-muted);">${b.providerName} • ${b.date} with ${b.workerName}</div>
            </div>
            <button class="btn-secondary" style="font-weight: 700; border-color: var(--warning-border); background: var(--warning-bg); color: var(--warning-text);" onclick="window.app.openReviewModal('${b.bookingId}', '${b.providerId}', '${b.serviceName}', '${b.providerName}')">
              ⭐ Write Review
            </button>
          </div>
        `).join('');
      }
    }

    async customerCancelBooking(bookingId) {
      if (confirm('Cancel this appointment slot? It will be freed for other clients.')) {
        await window.store.deleteBooking(bookingId);
        this.renderCustomerBookings();
        this.showToast('Appointment cancelled successfully.', 'info');
      }
    }

    // Review & Rating Modal
    openReviewModal(bookingId, providerId, serviceName, providerName) {
      document.getElementById('revBookingId').value = bookingId;
      document.getElementById('revProviderId').value = providerId;
      document.getElementById('revProviderTitle').textContent = providerName;
      document.getElementById('revServiceTitle').textContent = serviceName;
      document.getElementById('revCommentInput').value = '';
      this.setReviewRating(5);
      this.openModal('leaveReviewModal');
    }

    setReviewRating(stars) {
      document.getElementById('revRatingInput').value = stars;
      document.querySelectorAll('#starRatingRow .star-rating-item').forEach(el => {
        const r = Number(el.getAttribute('data-rating'));
        el.classList.toggle('active', r <= stars);
      });
    }

    async submitCustomerReview(e) {
      e.preventDefault();
      const session = window.store.getCurrentSession();
      const bookingId = document.getElementById('revBookingId').value;
      const providerId = document.getElementById('revProviderId').value;
      const rating = Number(document.getElementById('revRatingInput').value) || 5;
      const comment = document.getElementById('revCommentInput').value;

      try {
        await window.store.addReview({
          bookingId,
          providerId,
          customerId: session.id || session.customerId,
          customerName: session.name,
          rating,
          comment
        });

        this.closeModal('leaveReviewModal');
        this.showToast(`⭐ Review posted! Thank you for rating this service.`, 'success');
      } catch (err) {
        this.showToast('Failed to post review.', 'error');
      }
    }

    // ========================================================
    // 4. PROVIDER WORKSPACE (SCHEDULO TIMELINE & WAITLIST)
    // ========================================================
    setupProviderPortal(session) {
      const nameEl = document.getElementById('sidebarUserName');
      if (nameEl) nameEl.textContent = session.name || 'Business Owner';

      // Mount calendar and waitlist controllers
      const calendarContainer = document.getElementById('calendarMount');
      if (calendarContainer && window.calendarController) {
        window.calendarController.setContainer(calendarContainer);
      }

      const waitlistContainer = document.getElementById('waitlistCardsMount');
      if (waitlistContainer && window.waitlistController) {
        window.waitlistController.setContainer(waitlistContainer);
      }

      this.updateDateDisplay();
      this.updateProviderKpiBar();
    }

    updateDateDisplay() {
      const dateStr = window.store.getSelectedDate();
      const parts = dateStr.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dateText = document.getElementById('currentDateText');
      const dateSub = document.getElementById('currentDateSub');
      const todayStr = window.getDateOffset(0);

      if (dateText) dateText.textContent = `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      if (dateSub) dateSub.textContent = dateStr === todayStr ? 'Today' : (dateStr > todayStr ? 'Upcoming' : 'Past');
    }

    updateViewSwitcherActive(view) {
      document.querySelectorAll('.view-btn').forEach(btn => {
        if (btn.getAttribute('data-view') === view) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    renderProviderMiniCalendar() {
      const mount = document.getElementById('providerMiniCalMount');
      if (!mount || !window.MonthCalendarWidget) return;
      const curDate = window.store.getSelectedDate();
      const provider = window.store.getCurrentProvider();
      const provId = provider ? provider.id : null;

      this.providerMiniCal = new window.MonthCalendarWidget({
        container: mount,
        selectedDate: curDate,
        getDayMeta: (dateStr) => {
          if (!provId) return null;
          const bookings = window.store.getBookings().filter(b => b.date === dateStr && b.providerId === provId);
          return {
            hasBookings: bookings.length > 0,
            bookingsCount: bookings.length
          };
        },
        onSelect: (dateStr) => {
          window.store.setSelectedDate(dateStr);
          this.updateDateDisplay();
          const popover = document.getElementById('providerCalendarPopover');
          if (popover) popover.style.display = 'none';
        }
      });
    }

    shiftDate(deltaDays) {
      const curStr = window.store.getSelectedDate();
      const curDate = new Date(curStr);
      curDate.setDate(curDate.getDate() + deltaDays);
      window.store.setSelectedDate(curDate.toISOString().split('T')[0]);
    }

    updateProviderKpiBar() {
      const provider = window.store.getCurrentProvider();
      const date = window.store.getSelectedDate();
      const bookings = window.store.getBookingsForDateAndProvider(date, provider.id);
      const waitlist = window.store.getWaitlistForProvider(provider.id);

      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
      const activeWaitlist = waitlist.filter(w => w.status !== 'booked').length;

      const workersCount = (provider.workers || []).length || 1;
      const estCapacity = workersCount * 7;
      const capacityPct = Math.min(100, Math.round((totalBookings / estCapacity) * 100));

      const elBookings = document.getElementById('kpiBookingsCount');
      if (elBookings) elBookings.textContent = `${totalBookings} Slots`;

      const elWaitlist = document.getElementById('kpiWaitlistCount');
      if (elWaitlist) elWaitlist.textContent = `${activeWaitlist} Waiting`;

      const elCapacity = document.getElementById('kpiCapacityPercent');
      if (elCapacity) elCapacity.textContent = `${capacityPct}% Full`;

      const elRevenue = document.getElementById('kpiRevenueTotal');
      if (elRevenue) elRevenue.textContent = `$${totalRevenue.toLocaleString()}`;
    }

    // Provider Modals
    openNewBookingModal(workerId, timeStr) {
      const provider = window.store.getCurrentProvider();
      const services = provider?.services || [];
      const workers = provider?.workers || [];
      const customers = window.store.getCustomers();

      const selectWorker = document.getElementById('nbWorkerSelect');
      if (selectWorker) {
        selectWorker.innerHTML = workers.map(w => `
          <option value="${w.id}" ${w.id === workerId ? 'selected' : ''}>${w.name} (${w.title})</option>
        `).join('');
      }

      const selectService = document.getElementById('nbServiceSelect');
      if (selectService) {
        selectService.innerHTML = services.map(s => `
          <option value="${s.id}" data-price="${s.price}" data-duration="${s.duration}">${s.name} — $${s.price} (${s.duration} min)</option>
        `).join('');
      }

      const selectCustomer = document.getElementById('nbCustomerSelect');
      if (selectCustomer) {
        let custHtml = customers.map(c => `
          <option value="${c.id}" data-name="${c.name}" data-phone="${c.phone || ''}" data-email="${c.email || ''}">${c.name} (${c.phone || c.email || 'Client'})</option>
        `).join('');
        if (customers.length === 0) {
          custHtml = `<option value="walkin" data-name="Walk-in Client" data-phone="" data-email="">Walk-in Client</option>`;
        }
        selectCustomer.innerHTML = custHtml;
      }

      const dateInput = document.getElementById('nbDateInput');
      if (dateInput) dateInput.value = window.store.getSelectedDate();

      const timeInput = document.getElementById('nbTimeInput');
      if (timeInput) timeInput.value = timeStr || '10:00';

      const notesInput = document.getElementById('nbNotesInput');
      if (notesInput) notesInput.value = '';

      this.openModal('newBookingModal');
    }

    async submitNewBooking(e) {
      e.preventDefault();
      const provider = window.store.getCurrentProvider();
      if (!provider) {
        this.showToast('Provider profile not found.', 'error');
        return;
      }

      const custSelect = document.getElementById('nbCustomerSelect');
      const opt = custSelect ? custSelect.options[custSelect.selectedIndex] : null;
      const customerName = opt ? (opt.getAttribute('data-name') || opt.text) : 'Client';
      const customerPhone = opt ? (opt.getAttribute('data-phone') || '') : '';
      const customerEmail = opt ? (opt.getAttribute('data-email') || '') : '';
      const customerId = custSelect ? custSelect.value : 'walkin';

      const srvSelect = document.getElementById('nbServiceSelect');
      const srvOpt = srvSelect ? srvSelect.options[srvSelect.selectedIndex] : null;
      const serviceId = srvSelect ? srvSelect.value : (provider.services[0]?.id || null);
      const serviceName = srvOpt ? srvOpt.text.split('—')[0].trim() : 'Service';
      const price = Number(srvOpt?.getAttribute('data-price')) || 50;
      const duration = Number(srvOpt?.getAttribute('data-duration')) || 45;

      const workerSelect = document.getElementById('nbWorkerSelect');
      const workerOpt = workerSelect ? workerSelect.options[workerSelect.selectedIndex] : null;
      const workerId = workerSelect ? workerSelect.value : (provider.workers[0]?.id || null);
      const workerName = workerOpt ? workerOpt.text.split('(')[0].trim() : 'Specialist';

      const date = document.getElementById('nbDateInput')?.value || window.store.getSelectedDate();
      const time = document.getElementById('nbTimeInput')?.value || '10:00';
      const notes = document.getElementById('nbNotesInput')?.value || '';

      const submitBtn = e.target.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : 'Confirm Slot';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Confirming...';
      }

      try {
        const booking = await window.store.addBooking({
          customerId,
          customerName,
          customerPhone,
          customerEmail,
          providerId: provider.id,
          providerName: provider.name,
          serviceId,
          serviceName,
          workerId,
          workerName,
          date,
          time,
          duration,
          price,
          notes
        });

        this.closeModal('newBookingModal');
        this.showToast(`✅ Booked ${booking.customerName} on ${booking.date} at ${booking.time}!`, 'success');
      } catch (err) {
        this.showToast(err.message || 'Failed to book slot. Slot may already be reserved.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    }

    openAddWaitlistModal() {
      const provider = window.store.getCurrentProvider();
      const services = provider.services || [];
      const workers = provider.workers || [];

      document.getElementById('wlServiceSelect').innerHTML = services.map(s => `
        <option value="${s.id}" data-price="${s.price}" data-duration="${s.duration}">${s.name} — $${s.price}</option>
      `).join('');

      document.getElementById('wlWorkerSelect').innerHTML = `
        <option value="">Any Specialist</option>
        ${workers.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
      `;

      document.getElementById('wlDateInput').value = window.store.getSelectedDate();
      this.openModal('addWaitlistModal');
    }

    async submitAddWaitlist(e) {
      e.preventDefault();
      const provider = window.store.getCurrentProvider();

      const customerName = document.getElementById('wlNameInput').value;
      const customerPhone = document.getElementById('wlPhoneInput').value;
      const customerEmail = document.getElementById('wlEmailInput').value;

      const srvSelect = document.getElementById('wlServiceSelect');
      const srvOpt = srvSelect.options[srvSelect.selectedIndex];
      const serviceId = srvSelect.value;
      const serviceName = srvOpt.text.split('—')[0].trim();
      const price = Number(srvOpt.getAttribute('data-price')) || 50;
      const duration = Number(srvOpt.getAttribute('data-duration')) || 45;

      const workerSelect = document.getElementById('wlWorkerSelect');
      const workerId = workerSelect.value || null;
      const workerName = workerId ? workerSelect.options[workerSelect.selectedIndex].text : 'Any Specialist';

      const preferredDate = document.getElementById('wlDateInput').value;
      const preferredTimeRange = document.getElementById('wlTimeWindowSelect').value;
      const priority = document.getElementById('wlPrioritySelect').value;
      const notes = document.getElementById('wlNotesInput')?.value || '';

      const submitBtn = e.target.querySelector('button[type="submit"]');
      const origText = submitBtn ? submitBtn.textContent : 'Add to Standby Queue';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding...';
      }

      try {
        const newEntry = await window.store.addWaitlistEntry({
          providerId: provider.id,
          providerName: provider.name,
          customerName,
          customerPhone,
          customerEmail,
          customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
          serviceId,
          serviceName,
          duration,
          price,
          workerId,
          workerName,
          preferredDate,
          preferredTimeRange,
          priority,
          notes
        });

        this.closeModal('addWaitlistModal');
        this.showToast(`⏳ ${customerName} added to waitlist queue as #${newEntry.position}!`, 'success');
      } catch (err) {
        this.showToast(err.message || 'Failed to add to waitlist.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      }
    }

    openAppointmentDrawer(bookingId) {
      const bookings = window.store.getBookings();
      const b = bookings.find(item => item.bookingId === bookingId);
      if (!b) return;

      const content = document.getElementById('appointmentDrawerContent');
      if (content) {
        content.innerHTML = `
          <div style="border-bottom: 1px solid var(--border-light); padding-bottom: 14px;">
            <span class="app-status-pill ${b.status || 'confirmed'}">${b.status || 'confirmed'}</span>
            <h3 style="font-size: 18px; font-weight: 700; margin-top: 6px;">${b.customerName}</h3>
            <p style="font-size: 12px; color: var(--text-muted);">${b.bookingId}</p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 14px;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Service</div>
              <div style="font-weight: 600;">${b.serviceName} ($${b.price})</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Specialist & Time</div>
              <div>${b.date} at ${b.time} with ${b.workerName}</div>
            </div>
            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Client Contact</div>
              <div>📞 ${b.customerPhone} • ✉️ ${b.customerEmail}</div>
            </div>
            <div style="margin-top: 8px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; margin-bottom: 6px;">Change Status</div>
              <div style="display: flex; gap: 6px;">
                <button class="btn-secondary" onclick="window.app.updateStatus('${b.bookingId}', 'confirmed')">Confirmed</button>
                <button class="btn-secondary" onclick="window.app.updateStatus('${b.bookingId}', 'in-progress')">In Progress</button>
                <button class="btn-secondary" onclick="window.app.updateStatus('${b.bookingId}', 'completed')">Completed</button>
              </div>
            </div>
          </div>
        `;
      }
      this.openModal('appointmentDrawerModal');
    }

    updateStatus(bookingId, status) {
      window.store.updateBooking(bookingId, { status });
      this.closeModal('appointmentDrawerModal');
      this.showToast(`Updated booking status to ${status}`, 'info');
    }

    // Phone Notification Simulator
    simulateNotification(waitlistId) {
      const waitlist = window.store.getWaitlist();
      const entry = waitlist.find(w => w.id === waitlistId);
      if (!entry) return;

      const provider = window.store.getCurrentProvider();
      const phoneContent = document.getElementById('phoneSimulatorContent');
      if (phoneContent) {
        phoneContent.innerHTML = `
          <div style="font-weight: 700; font-size: 12px; color: var(--text-muted); text-align: center; margin-bottom: 6px;">
            Messages with ${entry.customerName}
          </div>
          <div class="sms-bubble">
            <strong>BookNGo Notification for ${entry.customerName}:</strong><br>
            A cancellation slot just opened up at <strong>${provider.name}</strong> for <em>${entry.serviceName}</em> (${entry.preferredDate})!<br><br>
            ⏳ Reply <strong>YES</strong> within 15 minutes to secure this slot.
          </div>
          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px;">
            <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="window.app.dispatchSms('${entry.id}')">
              📲 Send SMS Alert
            </button>
            <button class="btn-secondary" style="width: 100%; justify-content: center; background: #ECFDF5; border-color: #A7F3D0; color: #065F46;" onclick="window.app.simulateCustomerYes('${entry.id}')">
              ⚡ Simulate Customer Replying "YES"
            </button>
          </div>
        `;
      }
      this.openModal('phoneSimulatorModal');
    }

    dispatchSms(waitlistId) {
      window.store.notifyWaitlistClient(waitlistId);
      this.closeModal('phoneSimulatorModal');
      this.showToast('SMS dispatched to client! Live 15-minute response window active.', 'info');
    }

    simulateCustomerYes(waitlistId) {
      const waitlist = window.store.getWaitlist();
      const entry = waitlist.find(w => w.id === waitlistId);
      if (!entry) return;

      const matches = window.store.findSmartMatches(waitlistId);
      const match = matches[0] || { workerId: entry.workerId || 'wrk-101', date: entry.preferredDate, time: '14:00' };

      const b = window.store.assignWaitlistToSlot(waitlistId, match.workerId, match.date, match.time);
      this.closeModal('phoneSimulatorModal');
      this.showToast(`🎉 Customer confirmed! Booked appointment on ${b.date} at ${b.time}!`, 'success');
    }

    // ========================================================
    // 5. ADMIN PORTAL WORKFLOW
    // ========================================================
    setupAdminPortal(session) {
      const providers = window.store.getProviders();
      const customers = window.store.getCustomers();
      const bookings = window.store.getBookings();
      const waitlist = window.store.getWaitlist();

      const provEl0 = document.getElementById('adminTotalProviders');
      if (provEl0) provEl0.textContent = providers.length;
      const custEl0 = document.getElementById('adminTotalCustomers');
      if (custEl0) custEl0.textContent = customers.length;
      const bkgEl0 = document.getElementById('adminTotalBookings');
      if (bkgEl0) bkgEl0.textContent = bookings.length;
      const wlEl0 = document.getElementById('adminTotalWaitlist');
      if (wlEl0) wlEl0.textContent = waitlist.filter(w => w.status !== 'booked').length;

      if (window.api) {
        window.api.getAdminMetrics().then(res => {
          if (res && res.success && res.metrics) {
            const m = res.metrics;
            const provEl = document.getElementById('adminTotalProviders');
            if (provEl) provEl.textContent = m.total_providers;
            const custEl = document.getElementById('adminTotalCustomers');
            if (custEl) custEl.textContent = m.total_users;
            const bkgEl = document.getElementById('adminTotalBookings');
            if (bkgEl) bkgEl.textContent = m.total_bookings;
            const wlEl = document.getElementById('adminTotalWaitlist');
            if (wlEl) wlEl.textContent = m.active_waitlist;
          }
        }).catch(() => {});
      }

      // Render Providers Table
      const provTable = document.getElementById('adminProvidersTableBody');
      if (provTable) {
        provTable.innerHTML = providers.map(p => `
          <tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td>${p.location}</td>
            <td>${p.email}</td>
            <td><span class="app-status-pill ${p.status === 'active' ? 'confirmed' : 'in-progress'}">${p.status}</span></td>
            <td>
              ${p.status === 'pending' ? `
                <button class="btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="window.app.adminApproveBiz('${p.id}')">Approve</button>
              ` : `
                <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; color: var(--urgent-solid);" onclick="window.app.adminRejectBiz('${p.id}')">Deactivate</button>
              `}
            </td>
          </tr>
        `).join('');
      }

      // Render Reports Table
      const repTable = document.getElementById('adminReportsTableBody');
      if (repTable) {
        const reports = window.store.getReports();
        repTable.innerHTML = reports.map(r => `
          <tr>
            <td><code>${r.bookingId}</code></td>
            <td>${r.providerName}</td>
            <td>${r.customerName}</td>
            <td>${r.details}</td>
            <td><span class="app-status-pill ${r.status === 'Resolved' ? 'completed' : 'in-progress'}">${r.status}</span></td>
            <td>
              ${r.status !== 'Resolved' ? `
                <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="window.app.adminResolveReport('${r.id}')">Mark Resolved</button>
              ` : '<span style="color: var(--success-solid); font-weight: 600; font-size: 11px;">✓ Resolved</span>'}
            </td>
          </tr>
        `).join('');
      }
    }

    adminApproveBiz(providerId) {
      window.store.approveProvider(providerId);
      this.setupAdminPortal(window.store.getCurrentSession());
      this.showToast('Business approved and live on marketplace!', 'success');
    }

    adminRejectBiz(providerId) {
      window.store.rejectProvider(providerId);
      this.setupAdminPortal(window.store.getCurrentSession());
      this.showToast('Business deactivated.', 'warning');
    }

    adminResolveReport(reportId) {
      window.store.resolveReport(reportId, 'Reviewed and settled by Admin');
      this.setupAdminPortal(window.store.getCurrentSession());
      this.showToast('Report marked resolved.', 'success');
    }

    // Modal helpers
    openModal(modalId) {
      document.getElementById(modalId)?.classList.add('open');
    }

    closeModal(modalId) {
      document.getElementById(modalId)?.classList.remove('open');
    }

    closeAllModals() {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    }

    // Command Palette
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
      const container = document.getElementById('commandResultsList');
      if (!container) return;

      const providers = window.store.getProviders();
      const bookings = window.store.getBookings();
      const matchedProviders = providers.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
      const matchedBookings = bookings.filter(b => b.customerName.toLowerCase().includes(q) || b.serviceName.toLowerCase().includes(q));

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Businesses (${matchedProviders.length})</div>
          ${matchedProviders.slice(0, 3).map(p => `
            <div style="padding: 8px 12px; border-radius: var(--radius-sm); background: var(--bg-surface-alt); cursor: pointer; display: flex; justify-content: space-between;" onclick="window.app.closeModal('commandPaletteModal'); window.app.openCustomerSlotBooking('${p.id}');">
              <div><strong>${p.name}</strong> • ${p.category}</div>
              <div style="color: var(--primary-600); font-size: 11px; font-weight: 600;">Book a Slot →</div>
            </div>
          `).join('')}

          <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; margin-top: 8px;">Bookings (${matchedBookings.length})</div>
          ${matchedBookings.slice(0, 3).map(b => `
            <div style="padding: 8px 12px; border-radius: var(--radius-sm); background: var(--bg-surface-alt); display: flex; justify-content: space-between;">
              <div><strong>${b.customerName}</strong> • ${b.serviceName}</div>
              <div style="color: var(--text-muted); font-size: 11px;">${b.date} at ${b.time}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Toast alert
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
