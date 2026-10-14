/**
 * BookNGo — Waitlist Controller
 * Manages the Schedulo-inspired Waitlist Panel, real-time filtering,
 * card actions, drag-and-drop handles, and instant notification simulations.
 */

(function () {
  'use strict';

  class WaitlistController {
    constructor() {
      this.container = null;
      this.currentFilter = 'all';
      this.searchQuery = '';
      this.initEvents();
    }

    initEvents() {
      if (!window.store) return;
      window.store.subscribe('waitlist_updated', () => this.render());
      window.store.subscribe('waitlist_converted', () => this.render());
      window.store.subscribe('provider_changed', () => this.render());
      window.store.subscribe('date_changed', () => this.render());
    }

    setContainer(element) {
      this.container = element;
      this.render();
    }

    setFilter(filterName) {
      this.currentFilter = filterName;
      this.render();
    }

    setSearchQuery(query) {
      this.searchQuery = (query || '').toLowerCase().trim();
      this.render();
    }

    render() {
      if (!this.container || !window.store) return;

      const providerId = window.store.getCurrentProviderId();
      const allWaitlist = window.store.getWaitlistForProvider(providerId);
      const selectedDate = window.store.getSelectedDate();

      // Filter entries
      let filtered = allWaitlist.filter(w => {
        // Search query
        if (this.searchQuery) {
          const matchName = (w.customerName || '').toLowerCase().includes(this.searchQuery);
          const matchService = (w.serviceName || '').toLowerCase().includes(this.searchQuery);
          const matchPhone = (w.customerPhone || '').toLowerCase().includes(this.searchQuery);
          if (!matchName && !matchService && !matchPhone) return false;
        }

        // Tab Filter
        if (this.currentFilter === 'urgent') return w.priority === 'urgent' && w.status !== 'booked';
        if (this.currentFilter === 'vip') return w.priority === 'vip' && w.status !== 'booked';
        if (this.currentFilter === 'flexible') return (w.priority === 'flexible' || w.priority === 'normal') && w.status !== 'booked';
        if (this.currentFilter === 'today') return w.preferredDate === selectedDate && w.status !== 'booked';
        if (this.currentFilter === 'notified') return w.status === 'notified';

        return w.status !== 'booked'; // 'all'
      });

      // Update badge counts
      const badgeCountEl = document.getElementById('waitlistHeaderCount');
      if (badgeCountEl) {
        badgeCountEl.textContent = `${allWaitlist.filter(w => w.status !== 'booked').length} In Queue`;
      }

      const kpiWaitlistEl = document.getElementById('kpiWaitlistCount');
      if (kpiWaitlistEl) {
        kpiWaitlistEl.textContent = `${allWaitlist.filter(w => w.status !== 'booked').length} Waiting`;
      }

      // Render cards
      if (filtered.length === 0) {
        this.container.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 20px; text-align: center; color: var(--text-subtle);">
            <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
            <div style="font-weight: 700; font-size: 14px; color: var(--text-main); margin-bottom: 4px;">Queue Clear</div>
            <div style="font-size: 12px; max-width: 240px;">No clients currently waiting for this filter or criteria.</div>
            <button class="btn-primary" style="margin-top: 16px;" onclick="window.app.openAddWaitlistModal()">+ Add Client to Waitlist</button>
          </div>
        `;
        return;
      }

      this.container.innerHTML = filtered.map(w => this.renderCard(w)).join('');
      this.attachCardDragEvents();
    }

    renderCard(w) {
      const avatarUrl = w.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
      const isNotified = w.status === 'notified';

      return `
        <div class="waitlist-card" 
             data-waitlist-id="${w.id}" 
             draggable="true">
          <!-- Position & Priority Pill -->
          <div class="wl-card-header">
            <span class="wl-pos-badge">#${w.position} in Queue</span>
            <span class="wl-priority-badge ${w.priority}">${w.priorityLabel || w.priority}</span>
          </div>

          <!-- Client Info -->
          <div class="wl-client-row">
            <img src="${avatarUrl}" class="wl-client-avatar" alt="${w.customerName}">
            <div class="wl-client-details">
              <div class="wl-client-name">${w.customerName}</div>
              <div class="wl-client-contact">
                <span>📞 ${w.customerPhone}</span>
              </div>
            </div>
          </div>

          <!-- Service & Time Requested -->
          <div class="wl-service-box">
            <div class="wl-service-main">
              <span class="wl-service-title">${w.serviceName}</span>
              <span class="wl-service-price">$${w.price}</span>
            </div>
            <div class="wl-timing-row">
              <span>📅 ${w.preferredDate}</span>
              <span>•</span>
              <span>⏳ ${w.preferredTimeRange}</span>
            </div>
            <div class="wl-pref-worker">
              <span>👤</span>
              <span>Prefers: <strong>${w.workerName || 'Any Specialist'}</strong></span>
            </div>
          </div>

          <!-- Client Notes -->
          ${w.notes ? `<div class="wl-note-snippet">"${w.notes}"</div>` : ''}

          <!-- Notification Active Banner -->
          ${isNotified ? `
            <div style="background: var(--urgent-bg); border: 1px solid var(--urgent-border); border-radius: var(--radius-sm); padding: 6px 10px; font-size: 11px; color: var(--urgent-text); display: flex; align-items: center; justify-content: space-between;">
              <span>📲 SMS Sent (${w.expiresInMinutes || 15}m claim window)</span>
              <span style="font-weight: 700;">Awaiting Reply</span>
            </div>
          ` : ''}

          <!-- Action Buttons -->
          <div class="wl-card-actions">
            <button class="btn-wl-match" onclick="window.calendarController.handleSmartMatch('${w.id}')" title="Find and highlight matching calendar slots">
              <span>⚡</span> <span>Smart Match</span>
            </button>
            <button class="btn-wl-notify" onclick="window.app.simulateNotification('${w.id}')" title="Send SMS alert that a slot opened">
              <span>📲</span> <span>${isNotified ? 'Resend' : 'Notify'}</span>
            </button>
            <button class="btn-wl-more" onclick="window.app.openWaitlistDetailsModal('${w.id}')" title="More options">
              ⋯
            </button>
          </div>
        </div>
      `;
    }

    attachCardDragEvents() {
      const cards = this.container.querySelectorAll('.waitlist-card');
      cards.forEach(card => {
        const id = card.getAttribute('data-waitlist-id');

        card.addEventListener('dragstart', (e) => {
          card.classList.add('dragging');
          e.dataTransfer.setData('text/plain', id);
          e.dataTransfer.effectAllowed = 'move';

          // Pulse matching slots
          if (window.calendarController) {
            window.calendarController.handleSmartMatch(id);
          }
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
        });
      });
    }
  }

  window.waitlistController = new WaitlistController();
})();
