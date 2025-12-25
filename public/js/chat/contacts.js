// contacts.js - Contact Management
import { AppState, DOM } from './config.js';
import { getStatusText, initializeUserAvatar } from './utils.js';
import { api } from './api.js';

export function getUnreadCount(userId) {
    return AppState.unreadCounts[userId] || 0;
}

export function contactItem(u, selectContactCallback) {
    const li = document.createElement('li');
    li.className = 'contact';
    li.dataset.id = u.id;

    const avatarEl = document.createElement('div');
    avatarEl.className = 'avatar small';
    const initials = u.username.substring(0, 2).toUpperCase();
    avatarEl.textContent = initials;

    const infoEl = document.createElement('div');
    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = u.username;

    const statusEl = document.createElement('div');
    statusEl.className = 'status';
    statusEl.textContent = getStatusText(u.status);

    infoEl.appendChild(nameEl);
    infoEl.appendChild(statusEl);

    const badgeEl = document.createElement('div');
    badgeEl.className = 'badge';
    const unreadCount = getUnreadCount(u.id);
    badgeEl.textContent = unreadCount;
    badgeEl.style.display = unreadCount > 0 ? 'block' : 'none';

    li.appendChild(avatarEl);
    li.appendChild(infoEl);
    li.appendChild(badgeEl);

    li.addEventListener('click', async () => await selectContactCallback(u, li));

    return li;
}

export function renderContacts(selectContactCallback) {
    DOM.contactsEl.innerHTML = '';
    AppState.filteredContacts.forEach(u => DOM.contactsEl.appendChild(contactItem(u, selectContactCallback)));
}

export function filterContacts(searchTerm = '') {
    const term = searchTerm.toLowerCase().trim();
    AppState.filteredContacts = AppState.contacts.filter(user =>
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
}

// In contacts.js, update the selectContact function:
export async function selectContact(user, element, renderMsg, scrollBottom) {
    try {
        element.classList.add('loading');
        document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'));
        element.classList.add('active');
        
        AppState.active = user.id;
        DOM.peerName.textContent = user.username;
        DOM.peerStatus.textContent = getStatusText(user.status);
        initializeUserAvatar(DOM.peerAvatar, user);
        
        DOM.messagesEl.innerHTML = '';
        
        const res = await api('/api/messages/' + AppState.active);
        const msgs = await res.json();
        
        // Use synchronous rendering for batch loading (faster initial load)
        const { renderMsgSync } = await import('./messages.js');
        msgs.forEach(renderMsgSync); // Use sync version for batch
        
        scrollBottom();
        
        if (typeof window.toggleSidebar === 'function' && window.innerWidth <= 900) {
            window.toggleSidebar(true);
        }
        
        if (AppState.socket && AppState.socket.connected) {
            AppState.socket.emit('message-read', { partnerId: AppState.active });
        }
        
        AppState.unreadCounts[user.id] = 0;
        const badge = element.querySelector('.badge');
        if (badge) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error selecting contact:', error);
    } finally {
        element.classList.remove('loading');
    }
}

export async function loadContacts() {
    try {
        const res = await api('/api/users');
        AppState.contacts = await res.json();
        AppState.filteredContacts = [...AppState.contacts];
        return AppState.contacts;
    } catch (error) {
        console.error('Error loading contacts:', error);
        const { showNotification } = await import('./utils.js');
        showNotification('Failed to load contacts', 'error');
        throw error;
    }
}