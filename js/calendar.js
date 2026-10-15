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
      } else if (view === 'month') {
        this.renderMonthView();
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
      if (!provider) {
        this.container.innerHTML = `
          <div style="padding: 48px 24px; text-align: center; max-width: 480px; margin: 40px auto; background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm);">
            <div style="font-size: 38px; margin-bottom: 8px;">🌸</div>
            <h3 style="font-size: 18px; font-weight: 800;">No Business Registered Yet</h3>
            <p style="font-size: 13px; color: var(--text-muted); margin: 8px 0 20px;">
              To launch your appointment calendar and start receiving bookings, set up your business details now.
            </p>
            <button class="btn-primary" style="margin: 0 auto; padding: 12px 24px;" onclick="window.app.openModal('providerModal')">
              ＋ Set Up My Business Profile
            </button>
          </div>
        `;
        return;
      }
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

    renderMonthView() {
      const provider = window.store.getCurrentProvider();
      if (!provider) {
        this.renderTimelineView();
        return;
      }

      const selectedDate = window.store.getSelectedDate();
      const [curYear, curMonth] = selectedDate.split('-').map(Number);
      const viewYear = isNaN(curYear) ? new Date().getFullYear() : curYear;
      const viewMonth = isNaN(curMonth) ? new Date().getMonth() : curMonth - 1;

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const todayStr = window.getDateOffset(0);

      const allBookings = window.store.getBookings().filter(b => b.providerId === provider.id);

      const firstDay = new Date(viewYear, viewMonth, 1);
      let startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

      let daysHtml = '';

      // Trailing days from previous month
      for (let i = startDay - 1; i >= 0; i--) {
        const dNum = daysInPrevMonth - i;
        const pM = viewMonth === 0 ? 11 : viewMonth - 1;
        const pY = viewMonth === 0 ? viewYear - 1 : viewYear;
        const dStr = `${pY}-${String(pM + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
        daysHtml += `
          <div class="month-view-cell is-other-month" data-date="${dStr}" onclick="window.calendarController.selectMonthDay('${dStr}')">
            <div class="month-cell-header">
              <span class="month-cell-num">${dNum}</span>
            </div>
          </div>
        `;
      }

      // Days in active month
      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = dStr === todayStr;
        const isSelected = dStr === selectedDate;
        const dayBookings = allBookings.filter(b => b.date === dStr);

        daysHtml += `
          <div class="month-view-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" 
               data-date="${dStr}"
               onclick="window.calendarController.selectMonthDay('${dStr}')">
            <div class="month-cell-header">
              <span class="month-cell-num ${isToday ? 'today-badge' : ''}">${d}</span>
              ${dayBookings.length > 0 ? `<span class="month-cell-count">${dayBookings.length} booked</span>` : ''}
            </div>
            <div class="month-cell-events">
              ${dayBookings.slice(0, 3).map(b => `
                <div class="month-app-chip status-${b.status || 'confirmed'}" 
                     onclick="event.stopPropagation(); window.app.openAppointmentDrawer('${b.bookingId}')"
                     title="${b.time} - ${b.customerName} (${b.serviceName})">
                  <span class="chip-time">${b.time}</span>
                  <span class="chip-name">${b.customerName}</span>
                </div>
              `).join('')}
              ${dayBookings.length > 3 ? `
                <div class="month-more-chip" onclick="event.stopPropagation(); window.calendarController.zoomToDay('${dStr}')">
                  +${dayBookings.length - 3} more
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }

      // Leading days from next month
      const totalCells = startDay + daysInMonth;
      const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
      for (let d = 1; d <= remaining; d++) {
        const nM = viewMonth === 11 ? 0 : viewMonth + 1;
        const nY = viewMonth === 11 ? viewYear + 1 : viewYear;
        const dStr = `${nY}-${String(nM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        daysHtml += `
          <div class="month-view-cell is-other-month" data-date="${dStr}" onclick="window.calendarController.selectMonthDay('${dStr}')">
            <div class="month-cell-header">
              <span class="month-cell-num">${d}</span>
            </div>
          </div>
        `;
      }

      this.container.innerHTML = `
        <div class="provider-month-view-container">
          <div class="month-view-top-toolbar">
            <div class="month-view-nav-title">
              <button class="nav-arrow-btn" onclick="window.calendarController.shiftMonth(-1)" title="Previous Month">◀</button>
              <h2 class="month-title-text">${monthNames[viewMonth]} ${viewYear}</h2>
              <button class="nav-arrow-btn" onclick="window.calendarController.shiftMonth(1)" title="Next Month">▶</button>
              <button class="btn-today" style="margin-left: 8px;" onclick="window.calendarController.goToCurrentMonth()">This Month</button>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn-secondary" onclick="window.store.setView('timeline')">⏱ Switch to Timeline</button>
              <button class="btn-primary" onclick="window.app.openNewBookingModal()">+ New Appointment</button>
            </div>
          </div>

          <div class="month-view-weekdays-row">
            ${weekdays.map(w => `<div class="month-weekday-head">${w}</div>`).join('')}
          </div>

          <div class="month-view-grid">
            ${daysHtml}
          </div>
        </div>
      `;
    }

    selectMonthDay(dateStr) {
      window.store.setSelectedDate(dateStr);
      this.render();
    }

    zoomToDay(dateStr) {
      window.store.setSelectedDate(dateStr);
      window.store.setView('timeline');
    }

    shiftMonth(delta) {
      const curStr = window.store.getSelectedDate();
      const [y, m, d] = curStr.split('-').map(Number);
      const newDate = new Date(y, m - 1 + delta, Math.min(d, 28));
      window.store.setSelectedDate(newDate.toISOString().split('T')[0]);
    }

    goToCurrentMonth() {
      const today = window.getDateOffset(0);
      window.store.setSelectedDate(today);
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

  /**
   * Reusable Month Calendar Widget
   * Generates interactive full-month calendar matrices with:
   * - Month & Year header with prev/next navigation
   * - Weekday labels (Mo Tu We Th Fr Sa Su)
   * - Full 35-42 day grid with proper offset and trailing days
   * - Selected day indicator, today badge, disabled past days
   * - Status dot indicators for bookings or availability
   */
  class MonthCalendarWidget {
    constructor(options = {}) {
      this.container = options.container;
      this.selectedDate = options.selectedDate || (window.getDateOffset ? window.getDateOffset(0) : new Date().toISOString().split('T')[0]);
      this.minDate = options.minDate || null;
      this.maxDate = options.maxDate || null;
      this.onSelect = options.onSelect || (() => {});
      this.getDayMeta = options.getDayMeta || null;

      const [y, m] = this.selectedDate.split('-').map(Number);
      this.viewYear = isNaN(y) ? new Date().getFullYear() : y;
      this.viewMonth = isNaN(m) ? new Date().getMonth() : m - 1;

      this.render();
    }

    setDate(dateStr) {
      if (!dateStr) return;
      this.selectedDate = dateStr;
      const [y, m] = dateStr.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        this.viewYear = y;
        this.viewMonth = m - 1;
      }
      this.render();
    }

    prevMonth() {
      this.viewMonth--;
      if (this.viewMonth < 0) {
        this.viewMonth = 11;
        this.viewYear--;
      }
      this.render();
    }

    nextMonth() {
      this.viewMonth++;
      if (this.viewMonth > 11) {
        this.viewMonth = 0;
        this.viewYear++;
      }
      this.render();
    }

    goToToday() {
      const today = window.getDateOffset ? window.getDateOffset(0) : new Date().toISOString().split('T')[0];
      this.setDate(today);
      this.onSelect(today);
    }

    render() {
      if (!this.container) return;
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const weekdays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
      const todayStr = window.getDateOffset ? window.getDateOffset(0) : new Date().toISOString().split('T')[0];

      const firstDay = new Date(this.viewYear, this.viewMonth, 1);
      let startDay = (firstDay.getDay() + 6) % 7;
      const daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
      const daysInPrevMonth = new Date(this.viewYear, this.viewMonth, 0).getDate();

      let daysHtml = '';

      // Prev month trailing days
      for (let i = startDay - 1; i >= 0; i--) {
        const prevD = daysInPrevMonth - i;
        const prevMonthIdx = this.viewMonth === 0 ? 11 : this.viewMonth - 1;
        const prevYearVal = this.viewMonth === 0 ? this.viewYear - 1 : this.viewYear;
        const dStr = `${prevYearVal}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(prevD).padStart(2, '0')}`;
        const isPast = this.minDate && dStr < this.minDate;
        daysHtml += `
          <button type="button" class="cal-day-cell is-other-month ${isPast ? 'is-disabled' : ''}" data-date="${dStr}" ${isPast ? 'disabled' : ''}>
            <span class="cal-day-num">${prevD}</span>
          </button>
        `;
      }

      // Current month days
      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${this.viewYear}-${String(this.viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = dStr === todayStr;
        const isSelected = dStr === this.selectedDate;
        const isPast = this.minDate && dStr < this.minDate;
        const meta = this.getDayMeta ? this.getDayMeta(dStr) : null;

        let indicatorHtml = '';
        if (meta && meta.hasBookings) {
          indicatorHtml = `<span class="cal-dot-indicator booking-dot" title="${meta.bookingsCount || 1} appointment(s)"></span>`;
        } else if (meta && meta.isAvailable) {
          indicatorHtml = `<span class="cal-dot-indicator available-dot" title="Slots Available"></span>`;
        }

        daysHtml += `
          <button type="button" 
                  class="cal-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${isPast ? 'is-disabled' : ''}" 
                  data-date="${dStr}"
                  ${isPast ? 'disabled' : ''}>
            <span class="cal-day-num">${d}</span>
            ${indicatorHtml}
          </button>
        `;
      }

      // Next month leading days
      const totalCells = startDay + daysInMonth;
      const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
      for (let d = 1; d <= remaining; d++) {
        const nextMonthIdx = this.viewMonth === 11 ? 0 : this.viewMonth + 1;
        const nextYearVal = this.viewMonth === 11 ? this.viewYear + 1 : this.viewYear;
        const dStr = `${nextYearVal}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isPast = this.minDate && dStr < this.minDate;
        daysHtml += `
          <button type="button" class="cal-day-cell is-other-month ${isPast ? 'is-disabled' : ''}" data-date="${dStr}" ${isPast ? 'disabled' : ''}>
            <span class="cal-day-num">${d}</span>
          </button>
        `;
      }

      this.container.innerHTML = `
        <div class="cal-widget">
          <div class="cal-widget-header">
            <div class="cal-header-title">
              <span class="cal-month-name">${monthNames[this.viewMonth]}</span>
              <span class="cal-year-num">${this.viewYear}</span>
            </div>
            <div class="cal-nav-actions">
              <button type="button" class="cal-nav-btn btn-cal-prev" title="Previous Month">◀</button>
              <button type="button" class="cal-nav-today-btn btn-cal-today">Today</button>
              <button type="button" class="cal-nav-btn btn-cal-next" title="Next Month">▶</button>
            </div>
          </div>
          <div class="cal-widget-weekdays">
            ${weekdays.map(w => `<span class="cal-weekday-label">${w}</span>`).join('')}
          </div>
          <div class="cal-widget-grid">
            ${daysHtml}
          </div>
        </div>
      `;

      // Attach listeners
      const prevBtn = this.container.querySelector('.btn-cal-prev');
      if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.prevMonth(); });

      const nextBtn = this.container.querySelector('.btn-cal-next');
      if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.nextMonth(); });

      const todayBtn = this.container.querySelector('.btn-cal-today');
      if (todayBtn) todayBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.goToToday(); });

      this.container.querySelectorAll('.cal-day-cell:not(.is-disabled)').forEach(cell => {
        cell.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const dateStr = cell.getAttribute('data-date');
          if (!dateStr) return;
          this.selectedDate = dateStr;
          this.container.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('is-selected'));
          cell.classList.add('is-selected');
          this.onSelect(dateStr);
        });
      });
    }
  }

  window.calendarController = new CalendarController();
  window.MonthCalendarWidget = MonthCalendarWidget;
})();
