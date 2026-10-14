/**
 * BookNGo — Calendar Engine & Timeline Matrix
 * Handles multi-provider timeline grid, staff columns, appointment rendering,
 * drag-and-drop slot assignment, and smart match highlighting.
 */

(function () {
  'use strict';

  class CalendarController {
    constructor() {
      this.container = null;
      this.timeStartHour = 8; // 08:00
      this.timeEndHour = 19;  // 19:00
      this.slotHeight = 64;   // 30 min = 64px, 1 hr = 128px
      this.minutePixel = this.slotHeight / 30; // ~2.133px per minute
      this.activeSmartMatchWaitlistId = null;
      this.initEvents();
    }

    initEvents() {
      if (!window.store) return;
      window.store.subscribe('provider_changed', () => this.render());
      window.store.subscribe('date_changed', () => this.render());
      window.store.subscribe('bookings_updated', () => this.render());
      window.store.subscribe('view_changed', () => this.render());
      window.store.subscribe('smart_match_requested', (waitlistId) => this.handleSmartMatch(waitlistId));
    }

    setContainer(element) {
      this.container = element;
      this.render();
      this.setupLiveTimeIndicator();
    }

    render() {
      if (!this.container || !window.store) return;
      const view = window.store.getView();

      if (view === 'timeline') {
        this.renderTimelineView();
      } else if (view === 'week') {
        this.renderWeekView();
      } else if (view === 'day') {
        this.renderDayView();
      } else if (view === 'waitlist-board') {
        this.renderWaitlistBoardView();
      }
    }

    // Convert "HH:MM" to minutes from timeStartHour (08:00)
    timeToMinutesOffset(timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      return (h - this.timeStartHour) * 60 + m;
    }

    // Minutes offset to "HH:MM"
    minutesToTimeStr(minutes) {
      const totalMins = this.timeStartHour * 60 + minutes;
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    renderTimelineView() {
      const provider = window.store.getCurrentProvider();
      const selectedDate = window.store.getSelectedDate();
      const bookings = window.store.getBookingsForDateAndProvider(selectedDate, provider.id);
      const workers = provider.workers || [];

      let html = `
        <div class="timeline-scroll-container" id="timelineScrollArea">
          <!-- Sticky Staff Header -->
          <div class="timeline-staff-header-row">
            <div class="timeline-time-corner">GMT / TIME</div>
            ${workers.map(w => {
              const workerBookings = bookings.filter(b => b.workerId === w.id);
              const count = workerBookings.length;
              return `
                <div class="staff-column-header" data-worker-id="${w.id}">
                  <div class="staff-header-info">
                    <img src="https://images.unsplash.com/photo-${w.id === 'wrk-101' ? '1534528741775-53994a69daeb' : (w.id === 'wrk-102' ? '1517841905240-472988babdf9' : '1507003211169-0a1dd7228f2d')}?auto=format&fit=crop&w=120&q=80" class="staff-header-avatar" alt="${w.name}">
                    <div class="staff-header-text">
                      <span class="staff-header-name">${w.name}</span>
                      <span class="staff-header-role">${w.title}</span>
                    </div>
                  </div>
                  <span class="staff-load-badge">${count} booked</span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Timeline Grid Body -->
          <div class="timeline-grid-body">
            <!-- Left Time Axis -->
            <div class="time-axis-gutter">
              ${this.generateTimeGutterLabels()}
            </div>

            <!-- Staff Lanes -->
            ${workers.map(w => `
              <div class="staff-timeline-lane" data-worker-id="${w.id}" data-worker-name="${w.name}">
                ${this.generateLaneSlots(w)}
                ${this.generateBreakBlocks(provider)}
                ${this.generateAppointmentCards(bookings.filter(b => b.workerId === w.id))}
              </div>
            `).join('')}

            <!-- Live Time Indicator Line -->
            <div class="current-time-indicator" id="liveTimeBar" style="display: none;"></div>
          </div>
        </div>
      `;

      this.container.innerHTML = html;
      this.attachLaneEvents();
      this.updateLiveTimePosition();
    }

    generateTimeGutterLabels() {
      let labelsHtml = '';
      for (let h = this.timeStartHour; h < this.timeEndHour; h++) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        labelsHtml += `
          <div class="time-slot-label">
            ${displayH}:00 ${ampm}
          </div>
        `;
      }
      return labelsHtml;
    }

    generateLaneSlots(worker) {
      let slotsHtml = '';
      const totalIntervals = (this.timeEndHour - this.timeStartHour) * 2; // 30-min intervals
      for (let i = 0; i < totalIntervals; i++) {
        const isHour = i % 2 === 0;
        const minutes = i * 30;
        const timeStr = this.minutesToTimeStr(minutes);
        slotsHtml += `
          <div class="grid-time-slot ${isHour ? 'hour-line' : ''}" 
               data-time="${timeStr}" 
               data-minutes="${minutes}" 
               data-worker-id="${worker.id}">
            <button class="grid-slot-book-btn" onclick="window.app.openNewBookingModal('${worker.id}', '${timeStr}')">
              <span>+</span> <span>Book ${timeStr}</span>
            </button>
          </div>
        `;
      }
      return slotsHtml;
    }

    generateBreakBlocks(provider) {
      if (!provider.breaks || provider.breaks.length === 0) return '';
      return provider.breaks.map(brk => {
        const startOffset = this.timeToMinutesOffset(brk.start);
        const endOffset = this.timeToMinutesOffset(brk.end);
        const topPx = startOffset * this.minutePixel;
        const heightPx = (endOffset - startOffset) * this.minutePixel;
        return `
          <div class="slot-break-block" style="top: ${topPx}px; height: ${heightPx}px;">
            ☕ ${brk.label || 'Break'} (${brk.start} - ${brk.end})
          </div>
        `;
      }).join('');
    }

    generateAppointmentCards(workerBookings) {
      return workerBookings.map(b => {
        const startOffset = this.timeToMinutesOffset(b.time);
        const topPx = startOffset * this.minutePixel;
        const heightPx = (b.duration || 45) * this.minutePixel;
        const statusClass = `status-${b.status || 'confirmed'}`;
        const avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';

        return `
          <div class="appointment-card ${statusClass}" 
               style="top: ${topPx}px; height: ${heightPx}px;"
               data-booking-id="${b.bookingId}"
               onclick="window.app.openAppointmentDrawer('${b.bookingId}')">
            <div class="appointment-card-top">
              <div class="app-client-meta">
                <img src="${avatarUrl}" class="app-client-avatar" alt="${b.customerName}">
                <span class="app-client-name">${b.customerName}</span>
              </div>
              <span class="app-time-badge">${b.time}</span>
            </div>
            <div class="appointment-card-middle">
              <span class="app-service-name">${b.serviceName}</span>
            </div>
            <div class="appointment-card-bottom">
              <span class="app-price-tag">$${b.price}</span>
              <span class="app-status-pill ${b.status || 'confirmed'}">${b.status || 'confirmed'}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    attachLaneEvents() {
      const lanes = this.container.querySelectorAll('.staff-timeline-lane');
      lanes.forEach(lane => {
        const workerId = lane.getAttribute('data-worker-id');

        // Dragover & drop handlers
        lane.addEventListener('dragover', (e) => {
          e.preventDefault();
          lane.classList.add('drag-over');

          // Highlight nearest 30-min slot
          const rect = lane.getBoundingClientRect();
          const offsetY = e.clientY - rect.top;
          const minutes = Math.floor(offsetY / (this.slotHeight)) * 30;
          lane.querySelectorAll('.grid-time-slot').forEach(s => s.classList.remove('drag-target'));
          const targetSlot = lane.querySelector(`.grid-time-slot[data-minutes="${minutes}"]`);
          if (targetSlot) targetSlot.classList.add('drag-target');
        });

        lane.addEventListener('dragleave', () => {
          lane.classList.remove('drag-over');
          lane.querySelectorAll('.grid-time-slot').forEach(s => s.classList.remove('drag-target'));
        });

        lane.addEventListener('drop', (e) => {
          e.preventDefault();
          lane.classList.remove('drag-over');
          lane.querySelectorAll('.grid-time-slot').forEach(s => s.classList.remove('drag-target'));

          const waitlistId = e.dataTransfer.getData('text/plain');
          if (!waitlistId) return;

          const rect = lane.getBoundingClientRect();
          const offsetY = e.clientY - rect.top;
          const nearest30Mins = Math.floor(offsetY / this.slotHeight) * 30;
          const slotTime = this.minutesToTimeStr(nearest30Mins);
          const date = window.store.getSelectedDate();

          // Auto assign & book
          const newBooking = window.store.assignWaitlistToSlot(waitlistId, workerId, date, slotTime);
          if (newBooking) {
            window.app.showToast(`✨ Successfully slotted ${newBooking.customerName} with ${newBooking.workerName} at ${newBooking.time}!`, 'success');
          }
        });
      });
    }

    handleSmartMatch(waitlistId) {
      this.activeSmartMatchWaitlistId = waitlistId;
      // Clear previous highlights
      this.clearSmartMatchHighlights();

      if (!waitlistId) return;

      const matches = window.store.findSmartMatches(waitlistId);
      if (matches.length === 0) {
        window.app.showToast('No direct matching slots available for this service duration today. Consider adding a buffer or checking tomorrow!', 'warning');
        return;
      }

      window.app.showToast(`⚡ Found ${matches.length} matching open slots! Pulsing in indigo. Click any to confirm.`, 'info');

      // Highlight matched slots in timeline
      matches.forEach(m => {
        const lane = this.container.querySelector(`.staff-timeline-lane[data-worker-id="${m.workerId}"]`);
        if (lane) {
          const slot = lane.querySelector(`.grid-time-slot[data-time="${m.time}"]`);
          if (slot) {
            slot.classList.add('smart-match-highlight');
            slot.onclick = (e) => {
              e.stopPropagation();
              const newBooking = window.store.assignWaitlistToSlot(waitlistId, m.workerId, m.date, m.time);
              if (newBooking) {
                window.app.showToast(`🎉 Booked from waitlist: ${newBooking.customerName} on ${newBooking.date} at ${newBooking.time}!`, 'success');
              }
              this.clearSmartMatchHighlights();
            };
          }
        }
      });
    }

    clearSmartMatchHighlights() {
      if (!this.container) return;
      this.container.querySelectorAll('.smart-match-highlight').forEach(el => {
        el.classList.remove('smart-match-highlight');
        el.onclick = null;
      });
    }

    setupLiveTimeIndicator() {
      setInterval(() => this.updateLiveTimePosition(), 60000);
    }

    updateLiveTimePosition() {
      const bar = document.getElementById('liveTimeBar');
      if (!bar) return;

      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      if (currentH >= this.timeStartHour && currentH < this.timeEndHour) {
        const totalMins = (currentH - this.timeStartHour) * 60 + currentM;
        const topPx = totalMins * this.minutePixel;
        bar.style.top = `${topPx}px`;
        bar.style.display = 'flex';
      } else {
        bar.style.display = 'none';
      }
    }

    renderWeekView() {
      const provider = window.store.getCurrentProvider();
      const allBookings = window.store.getBookings().filter(b => b.providerId === provider.id);
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      this.container.innerHTML = `
        <div style="padding: 24px; overflow-y: auto; height: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: 700;">Week Overview — ${provider.name}</h3>
            <button class="btn-primary" onclick="window.store.setView('timeline')">Switch to Timeline View</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 14px;">
            ${days.map((day, idx) => {
              const targetDate = window.getDateOffset(idx - 1);
              const dayBookings = allBookings.filter(b => b.date === targetDate);
              return `
                <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg); padding: 14px; min-height: 480px; display: flex; flex-direction: column;">
                  <div style="font-weight: 700; font-size: 14px; border-bottom: 1px solid var(--border-light); padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between;">
                    <span>${day}</span>
                    <span style="font-size: 11px; color: var(--text-muted);">${dayBookings.length} slots</span>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
                    ${dayBookings.map(b => `
                      <div class="appointment-card status-${b.status || 'confirmed'}" style="position: relative; top: auto; height: auto;" onclick="window.app.openAppointmentDrawer('${b.bookingId}')">
                        <div style="font-weight: 700; font-size: 12px;">${b.customerName}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${b.time} • ${b.serviceName}</div>
                        <div style="font-size: 10px; font-weight: 600; color: var(--primary-600); margin-top: 4px;">${b.workerName}</div>
                      </div>
                    `).join('')}
                    ${dayBookings.length === 0 ? '<div style="font-size: 11px; color: var(--text-subtle); text-align: center; margin-top: 40px;">No bookings scheduled</div>' : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    renderDayView() {
      // Day view renders focused timeline
      this.renderTimelineView();
    }

    renderWaitlistBoardView() {
      const waitlist = window.store.getWaitlistForProvider(window.store.getCurrentProviderId());
      const columns = [
        { id: 'urgent', title: 'High Urgency', filter: w => w.priority === 'urgent' && w.status === 'waiting' },
        { id: 'vip', title: 'VIP Clients', filter: w => w.priority === 'vip' && w.status === 'waiting' },
        { id: 'flexible', title: 'Flexible Windows', filter: w => (w.priority === 'flexible' || w.priority === 'normal') && w.status === 'waiting' },
        { id: 'notified', title: 'Client Notified (Pending Claim)', filter: w => w.status === 'notified' }
      ];

      this.container.innerHTML = `
        <div style="padding: 24px; overflow-y: auto; height: 100%;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h3 style="font-size: 18px; font-weight: 700;">Waitlist Priority Board</h3>
              <p style="font-size: 12px; color: var(--text-muted);">Manage incoming standby requests across urgency and response queues</p>
            </div>
            <button class="btn-primary" onclick="window.app.openAddWaitlistModal()">+ Add Client to Waitlist</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
            ${columns.map(col => {
              const colItems = waitlist.filter(col.filter);
              return `
                <div style="background: var(--bg-surface-alt); border: 1px solid var(--border-light); border-radius: var(--radius-lg); padding: 14px; min-height: 520px; display: flex; flex-direction: column;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                    <span style="font-weight: 700; font-size: 13px;">${col.title}</span>
                    <span style="background: var(--bg-surface); padding: 2px 8px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700;">${colItems.length}</span>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; overflow-y: auto;">
                    ${colItems.map(w => `
                      <div class="waitlist-card" draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '${w.id}')">
                        <div class="wl-card-header">
                          <span class="wl-pos-badge">#${w.position} in Queue</span>
                          <span class="wl-priority-badge ${w.priority}">${w.priorityLabel}</span>
                        </div>
                        <div class="wl-client-row">
                          <img src="${w.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}" class="wl-client-avatar">
                          <div class="wl-client-details">
                            <div class="wl-client-name">${w.customerName}</div>
                            <div class="wl-client-contact">${w.customerPhone}</div>
                          </div>
                        </div>
                        <div class="wl-service-box">
                          <div class="wl-service-main">
                            <span class="wl-service-title">${w.serviceName}</span>
                            <span class="wl-service-price">$${w.price}</span>
                          </div>
                          <div class="wl-timing-row">⏳ ${w.duration} min • ${w.preferredTimeRange}</div>
                        </div>
                        <div class="wl-card-actions">
                          <button class="btn-wl-match" onclick="window.app.quickAssignFromWaitlist('${w.id}')">⚡ Book Slot</button>
                          <button class="btn-wl-notify" onclick="window.app.simulateNotification('${w.id}')">📲 Notify</button>
                        </div>
                      </div>
                    `).join('')}
                    ${colItems.length === 0 ? '<div style="font-size: 11px; color: var(--text-subtle); text-align: center; margin-top: 50px;">No requests in this queue</div>' : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
  }

  window.calendarController = new CalendarController();
})();
