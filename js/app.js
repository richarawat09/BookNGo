/**
 * BookNGo — Main Application Coordinator
 * Bootstraps views, manages modals, theme switching, date controls,
 * KPI metrics, command palette, and interactive toasts.
 */

(function () {
  'use strict';

  class App {
    constructor() {
      this.init();
    }

    init() {
      document.addEventListener('DOMContentLoaded', () => {
        this.applyTheme(window.store.getTheme());
        this.setupDomElements();
        this.renderProviderDropdown();
        this.updateDateDisplay();
        this.updateKpiBar();
        this.bindEvents();

        // Initialize sub-controllers
        const calendarContainer = document.getElementById('calendarMount');
        if (calendarContainer && window.calendarController) {
          window.calendarController.setContainer(calendarContainer);
        }

        const waitlistContainer = document.getElementById('waitlistCardsMount');
        if (waitlistContainer && window.waitlistController) {
          window.waitlistController.setContainer(waitlistContainer);
        }
      });
    }

    setupDomElements() {
      this.sidebar = document.getElementById('sidebar');
      this.waitlistPanel = document.getElementById('waitlistPanel');
      this.dateDisplay = document.getElementById('currentDateText');
      this.dateSub = document.getElementById('currentDateSub');
      this.themeToggleBtn = document.getElementById('themeToggleBtn');
    }

    bindEvents() {
      // Theme Toggle
      if (this.themeToggleBtn) {
        this.themeToggleBtn.addEventListener('click', () => {
          const current = window.store.getTheme();
          const next = current === 'dark' ? 'light' : 'dark';
          window.store.setTheme(next);
          this.applyTheme(next);
        });
      }

      // Date Navigation Buttons
      const btnToday = document.getElementById('btnToday');
      if (btnToday) {
        btnToday.addEventListener('click', () => {
          const today = window.getDateOffset(0);
          window.store.setSelectedDate(today);
          this.updateDateDisplay();
        });
      }

      const btnPrevDate = document.getElementById('btnPrevDate');
      if (btnPrevDate) {
        btnPrevDate.addEventListener('click', () => this.shiftDate(-1));
      }

      const btnNextDate = document.getElementById('btnNextDate');
      if (btnNextDate) {
        btnNextDate.addEventListener('click', () => this.shiftDate(1));
      }

      // View Switcher
      document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const view = btn.getAttribute('data-view');
          document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          window.store.setView(view);
        });
      });

      // Waitlist Panel Toggle
      const toggleWaitlistBtn = document.getElementById('toggleWaitlistBtn');
      if (toggleWaitlistBtn) {
        toggleWaitlistBtn.addEventListener('click', () => {
          if (this.waitlistPanel) {
            this.waitlistPanel.classList.toggle('collapsed');
            toggleWaitlistBtn.classList.toggle('active');
          }
        });
      }

      const closeWaitlistBtn = document.getElementById('closeWaitlistBtn');
      if (closeWaitlistBtn) {
        closeWaitlistBtn.addEventListener('click', () => {
          if (this.waitlistPanel) {
            this.waitlistPanel.classList.add('collapsed');
            if (toggleWaitlistBtn) toggleWaitlistBtn.classList.remove('active');
          }
        });
      }

      // Sidebar Collapse Toggle
      const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
      if (sidebarCollapseBtn) {
        sidebarCollapseBtn.addEventListener('click', () => {
          if (this.sidebar) this.sidebar.classList.toggle('collapsed');
        });
      }

      // Waitlist Filter Tabs
      document.querySelectorAll('.waitlist-tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('.waitlist-tab-btn').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const filter = tab.getAttribute('data-filter');
          if (window.waitlistController) {
            window.waitlistController.setFilter(filter);
          }
        });
      });

      // Waitlist Search
      const wlSearchInput = document.getElementById('waitlistSearchInput');
      if (wlSearchInput) {
        wlSearchInput.addEventListener('input', (e) => {
          if (window.waitlistController) {
            window.waitlistController.setSearchQuery(e.target.value);
          }
        });
      }

      // Global Search / Command Palette Shortcut
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          this.openCommandPalette();
        }
        if (e.key === 'Escape') {
          this.closeAllModals();
        }
      });

      // Reactive store listeners
      window.store.subscribe('provider_changed', () => {
        this.renderProviderDropdown();
        this.updateKpiBar();
      });
      window.store.subscribe('bookings_updated', () => this.updateKpiBar());
      window.store.subscribe('waitlist_updated', () => this.updateKpiBar());
      window.store.subscribe('date_changed', () => {
        this.updateDateDisplay();
        this.updateKpiBar();
      });
    }

    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      if (this.themeToggleBtn) {
        this.themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        this.themeToggleBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`);
      }
    }

    shiftDate(deltaDays) {
      const curStr = window.store.getSelectedDate();
      const curDate = new Date(curStr);
      curDate.setDate(curDate.getDate() + deltaDays);
      const newStr = curDate.toISOString().split('T')[0];
      window.store.setSelectedDate(newStr);
    }

    updateDateDisplay() {
      const dateStr = window.store.getSelectedDate();
      const parts = dateStr.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dayName = days[d.getDay()];
      const monthName = months[d.getMonth()];
      const dayNum = d.getDate();
      const year = d.getFullYear();

      const todayStr = window.getDateOffset(0);
      const isToday = dateStr === todayStr;

      if (this.dateDisplay) {
        this.dateDisplay.textContent = `${dayName}, ${monthName} ${dayNum}, ${year}`;
      }
      if (this.dateSub) {
        this.dateSub.textContent = isToday ? 'Today' : (dateStr > todayStr ? 'Upcoming' : 'Past');
      }
    }

    updateKpiBar() {
      const provider = window.store.getCurrentProvider();
      const date = window.store.getSelectedDate();
      const bookings = window.store.getBookingsForDateAndProvider(date, provider.id);
      const waitlist = window.store.getWaitlistForProvider(provider.id);

      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
      const activeWaitlist = waitlist.filter(w => w.status !== 'booked').length;

      // Capacity calculation: based on provider workers and operational hours
      const workersCount = (provider.workers || []).length || 1;
      const estMaxDailyCapacity = workersCount * 7; // ~7 slots per worker per day
      const capacityPct = Math.min(100, Math.round((totalBookings / estMaxDailyCapacity) * 100));

      const elBookings = document.getElementById('kpiBookingsCount');
      if (elBookings) elBookings.textContent = `${totalBookings} Slots`;

      const elWaitlist = document.getElementById('kpiWaitlistCount');
      if (elWaitlist) elWaitlist.textContent = `${activeWaitlist} Waiting`;

      const elCapacity = document.getElementById('kpiCapacityPercent');
      if (elCapacity) elCapacity.textContent = `${capacityPct}% Full`;

      const elRevenue = document.getElementById('kpiRevenueTotal');
      if (elRevenue) elRevenue.textContent = `$${totalRevenue.toLocaleString()}`;
    }

    renderProviderDropdown() {
      const provider = window.store.getCurrentProvider();
      const allProviders = window.store.getProviders();

      const triggerName = document.getElementById('activeProviderName');
      const triggerCat = document.getElementById('activeProviderCategory');
      const triggerImg = document.getElementById('activeProviderImg');

      if (triggerName) triggerName.textContent = provider.name;
      if (triggerCat) triggerCat.textContent = provider.category;
      if (triggerImg) triggerImg.src = provider.image;

      // Populate selector modal or select dropdown
      const providerListEl = document.getElementById('providerSelectList');
      if (providerListEl) {
        providerListEl.innerHTML = allProviders.map(p => `
          <div class="provider-option-item ${p.id === provider.id ? 'active' : ''}" 
               onclick="window.app.switchProvider('${p.id}')">
            <img src="${p.image}" class="provider-option-img" alt="${p.name}">
            <div style="flex: 1; overflow: hidden;">
              <div style="font-weight: 700; font-size: 13px;">${p.name}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${p.category} • ${p.location}</div>
            </div>
            ${p.id === provider.id ? '<span style="color: var(--primary-600); font-weight: 800;">✓</span>' : ''}
          </div>
        `).join('');
      }
    }

    switchProvider(providerId) {
      window.store.setCurrentProvider(providerId);
      this.closeModal('providerModal');
      this.showToast(`Switched workspace to ${window.store.getCurrentProvider().name}`, 'info');
    }

    // Modal Control Helpers
    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.add('open');
    }

    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('open');
    }

    closeAllModals() {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    }

    // New Booking Modal
    openNewBookingModal(workerId, timeStr) {
      const provider = window.store.getCurrentProvider();
      const services = provider.services || [];
      const workers = provider.workers || [];
      const customers = window.store.getCustomers();
      const date = window.store.getSelectedDate();

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
        selectCustomer.innerHTML = customers.map(c => `
          <option value="${c.id}" data-name="${c.name}" data-phone="${c.phone}" data-email="${c.email}">${c.name} (${c.phone})</option>
        `).join('');
      }

      const inputDate = document.getElementById('nbDateInput');
      if (inputDate) inputDate.value = date;

      const inputTime = document.getElementById('nbTimeInput');
      if (inputTime) inputTime.value = timeStr || '10:00';

      this.openModal('newBookingModal');
    }

    submitNewBooking(e) {
      e.preventDefault();
      const provider = window.store.getCurrentProvider();

      const custSelect = document.getElementById('nbCustomerSelect');
      const selectedCustOption = custSelect.options[custSelect.selectedIndex];
      const customerId = custSelect.value;
      const customerName = selectedCustOption.getAttribute('data-name');
      const customerPhone = selectedCustOption.getAttribute('data-phone');
      const customerEmail = selectedCustOption.getAttribute('data-email');

      const srvSelect = document.getElementById('nbServiceSelect');
      const selectedSrvOption = srvSelect.options[srvSelect.selectedIndex];
      const serviceId = srvSelect.value;
      const serviceName = selectedSrvOption.text.split('—')[0].trim();
      const price = Number(selectedSrvOption.getAttribute('data-price')) || 50;
      const duration = Number(selectedSrvOption.getAttribute('data-duration')) || 45;

      const workerSelect = document.getElementById('nbWorkerSelect');
      const workerId = workerSelect.value;
      const workerName = workerSelect.options[workerSelect.selectedIndex].text.split('(')[0].trim();

      const date = document.getElementById('nbDateInput').value;
      const time = document.getElementById('nbTimeInput').value;
      const notes = document.getElementById('nbNotesInput').value;

      const booking = window.store.addBooking({
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
      this.showToast(`✅ Confirmed appointment for ${booking.customerName} on ${booking.date} at ${booking.time}!`, 'success');
    }

    // Add to Waitlist Modal
    openAddWaitlistModal() {
      const provider = window.store.getCurrentProvider();
      const services = provider.services || [];
      const workers = provider.workers || [];

      const selectService = document.getElementById('wlServiceSelect');
      if (selectService) {
        selectService.innerHTML = services.map(s => `
          <option value="${s.id}" data-price="${s.price}" data-duration="${s.duration}">${s.name} — $${s.price} (${s.duration} min)</option>
        `).join('');
      }

      const selectWorker = document.getElementById('wlWorkerSelect');
      if (selectWorker) {
        selectWorker.innerHTML = `
          <option value="">Any Available Specialist</option>
          ${workers.map(w => `<option value="${w.id}">${w.name} (${w.title})</option>`).join('')}
        `;
      }

      const inputDate = document.getElementById('wlDateInput');
      if (inputDate) inputDate.value = window.store.getSelectedDate();

      this.openModal('addWaitlistModal');
    }

    submitAddWaitlist(e) {
      e.preventDefault();
      const provider = window.store.getCurrentProvider();

      const customerName = document.getElementById('wlNameInput').value;
      const customerPhone = document.getElementById('wlPhoneInput').value;
      const customerEmail = document.getElementById('wlEmailInput').value;

      const srvSelect = document.getElementById('wlServiceSelect');
      const selectedSrvOption = srvSelect.options[srvSelect.selectedIndex];
      const serviceId = srvSelect.value;
      const serviceName = selectedSrvOption.text.split('—')[0].trim();
      const price = Number(selectedSrvOption.getAttribute('data-price')) || 50;
      const duration = Number(selectedSrvOption.getAttribute('data-duration')) || 45;

      const workerSelect = document.getElementById('wlWorkerSelect');
      const workerId = workerSelect.value || null;
      const workerName = workerId ? workerSelect.options[workerSelect.selectedIndex].text.split('(')[0].trim() : 'Any Available Specialist';

      const preferredDate = document.getElementById('wlDateInput').value;
      const preferredTimeRange = document.getElementById('wlTimeWindowSelect').value;
      const priority = document.getElementById('wlPrioritySelect').value;
      const notes = document.getElementById('wlNotesInput').value;

      const newEntry = window.store.addWaitlistEntry({
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
    }

    // Appointment Details Drawer
    openAppointmentDrawer(bookingId) {
      const bookings = window.store.getBookings();
      const b = bookings.find(item => item.bookingId === bookingId);
      if (!b) return;

      const drawerContent = document.getElementById('appointmentDrawerContent');
      if (drawerContent) {
        drawerContent.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-light); padding-bottom: 16px;">
            <div>
              <span class="app-status-pill ${b.status || 'confirmed'}">${b.status || 'confirmed'}</span>
              <h3 style="font-size: 18px; font-weight: 700; margin-top: 6px;">${b.customerName}</h3>
              <p style="font-size: 12px; color: var(--text-muted);">${b.bookingId}</p>
            </div>
            <div style="font-size: 20px; font-weight: 800; color: var(--primary-600);">$${b.price}</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 16px;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Service Details</div>
              <div style="font-weight: 600; font-size: 14px; margin-top: 2px;">${b.serviceName}</div>
              <div style="font-size: 12px; color: var(--text-muted);">Duration: ${b.duration} mins</div>
            </div>

            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Specialist & Time</div>
              <div style="font-weight: 600; font-size: 13px; margin-top: 2px;">👤 ${b.workerName}</div>
              <div style="font-size: 13px; color: var(--text-main); margin-top: 2px;">📅 ${b.date} at ${b.time}</div>
            </div>

            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Contact Info</div>
              <div style="font-size: 12px; margin-top: 2px;">📞 ${b.customerPhone}</div>
              <div style="font-size: 12px;">✉️ ${b.customerEmail}</div>
            </div>

            ${b.notes ? `
              <div>
                <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Appointment Notes</div>
                <div style="font-size: 12px; background: var(--bg-surface-alt); padding: 8px 12px; border-radius: var(--radius-sm); margin-top: 4px;">${b.notes}</div>
              </div>
            ` : ''}

            <div style="margin-top: 10px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; margin-bottom: 8px;">Update Status</div>
              <div style="display: flex; gap: 8px;">
                <button class="btn-secondary" onclick="window.app.updateBookingStatus('${b.bookingId}', 'confirmed')">Confirmed</button>
                <button class="btn-secondary" onclick="window.app.updateBookingStatus('${b.bookingId}', 'in-progress')">In Progress</button>
                <button class="btn-secondary" onclick="window.app.updateBookingStatus('${b.bookingId}', 'completed')">Completed</button>
              </div>
            </div>
          </div>

          <div style="margin-top: 24px; border-top: 1px solid var(--border-light); padding-top: 16px; display: flex; justify-content: space-between;">
            <button class="btn-secondary" style="color: var(--urgent-solid);" onclick="window.app.cancelBooking('${b.bookingId}')">Cancel Appointment</button>
            <button class="btn-primary" onclick="window.app.closeModal('appointmentDrawerModal')">Done</button>
          </div>
        `;
      }
      this.openModal('appointmentDrawerModal');
    }

    updateBookingStatus(bookingId, newStatus) {
      window.store.updateBooking(bookingId, { status: newStatus });
      this.closeModal('appointmentDrawerModal');
      this.showToast(`Updated status to ${newStatus}`, 'info');
    }

    cancelBooking(bookingId) {
      if (confirm('Are you sure you want to cancel this booking? This will free the calendar slot.')) {
        window.store.deleteBooking(bookingId);
        this.closeModal('appointmentDrawerModal');
        this.showToast('Appointment cancelled and slot opened!', 'warning');
      }
    }

    // Notification Simulator
    simulateNotification(waitlistId) {
      const waitlist = window.store.getWaitlist();
      const entry = waitlist.find(w => w.id === waitlistId);
      if (!entry) return;

      const provider = window.store.getCurrentProvider();

      const phoneContent = document.getElementById('phoneSimulatorContent');
      if (phoneContent) {
        phoneContent.innerHTML = `
          <div style="font-weight: 700; font-size: 13px; color: var(--text-muted); text-align: center; margin-bottom: 4px;">
            Messages with ${entry.customerName}
          </div>
          <div class="sms-bubble">
            <strong>BookNGo Alert for ${entry.customerName}:</strong><br>
            A cancellation slot has just opened at <strong>${provider.name}</strong> for <em>${entry.serviceName}</em> (${entry.preferredDate})!<br><br>
            ⏳ Reply <strong>YES</strong> within 15 minutes to claim this slot immediately.
          </div>

          <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 8px;">
            <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="window.app.confirmNotificationDispatch('${entry.id}')">
              📲 Send SMS & Start 15m Window
            </button>
            <button class="btn-secondary" style="width: 100%; justify-content: center; background: #ECFDF5; border-color: #A7F3D0; color: #065F46;" onclick="window.app.simulateCustomerReplyYes('${entry.id}')">
              ⚡ Simulate Customer Replying "YES"
            </button>
          </div>
        `;
      }

      this.openModal('phoneSimulatorModal');
    }

    confirmNotificationDispatch(waitlistId) {
      window.store.notifyWaitlistClient(waitlistId);
      this.closeModal('phoneSimulatorModal');
      this.showToast('SMS dispatched to client! Live claim window countdown initiated.', 'info');
    }

    simulateCustomerReplyYes(waitlistId) {
      const waitlist = window.store.getWaitlist();
      const entry = waitlist.find(w => w.id === waitlistId);
      if (!entry) return;

      // Find first available slot or assign
      const matches = window.store.findSmartMatches(waitlistId);
      const match = matches[0] || { workerId: entry.workerId || 'wrk-101', date: entry.preferredDate, time: '14:00' };

      const booking = window.store.assignWaitlistToSlot(waitlistId, match.workerId, match.date, match.time);
      this.closeModal('phoneSimulatorModal');
      this.showToast(`🎉 Customer replied YES! Successfully confirmed booking at ${booking.time}!`, 'success');
    }

    // Command Palette
    openCommandPalette() {
      const modal = document.getElementById('commandPaletteModal');
      if (!modal) return;
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

      const provider = window.store.getCurrentProvider();
      const bookings = window.store.getBookings().filter(b => b.providerId === provider.id);
      const waitlist = window.store.getWaitlistForProvider(provider.id);

      const matchedBookings = bookings.filter(b => b.customerName.toLowerCase().includes(q) || b.serviceName.toLowerCase().includes(q));
      const matchedWaitlist = waitlist.filter(w => w.customerName.toLowerCase().includes(q) || w.serviceName.toLowerCase().includes(q));

      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase;">Appointments (${matchedBookings.length})</div>
          ${matchedBookings.slice(0, 4).map(b => `
            <div style="padding: 8px 12px; border-radius: var(--radius-sm); background: var(--bg-surface-alt); cursor: pointer; display: flex; justify-content: space-between;" onclick="window.app.closeModal('commandPaletteModal'); window.app.openAppointmentDrawer('${b.bookingId}');">
              <div><strong>${b.customerName}</strong> • ${b.serviceName}</div>
              <div style="color: var(--text-muted); font-size: 11px;">${b.date} at ${b.time}</div>
            </div>
          `).join('')}

          <div style="font-size: 11px; font-weight: 700; color: var(--text-subtle); text-transform: uppercase; margin-top: 8px;">Waitlist Requests (${matchedWaitlist.length})</div>
          ${matchedWaitlist.slice(0, 4).map(w => `
            <div style="padding: 8px 12px; border-radius: var(--radius-sm); background: var(--bg-surface-alt); cursor: pointer; display: flex; justify-content: space-between;" onclick="window.app.closeModal('commandPaletteModal'); window.calendarController.handleSmartMatch('${w.id}');">
              <div><strong>${w.customerName}</strong> • ${w.serviceName}</div>
              <div style="color: var(--primary-600); font-weight: 600; font-size: 11px;">#${w.position} in Queue</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Toast Notification helper
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
