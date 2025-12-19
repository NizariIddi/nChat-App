// socket.js - Socket.IO Event Handlers
import { AppState, DOM } from './config.js';
import { showNotification, getStatusText, playMessageSound, scrollBottom } from './utils.js';
import { renderContacts } from './contacts.js';
import { exitSelectionMode, updateSelectionCount } from './selection.js';

export function setupSocketListeners(socket, renderMsg, selectContactCallback) {
    AppState.socket = socket;

    socket.on('connect', () => {
        console.log('Connected');
        showNotification('Connected', 'success', 1000);
    });

    socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
        showNotification('Connection lost. Reconnecting...', 'error');
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        showNotification('Connection error', 'error');
    });

    socket.on('presence', ({ userId, status }) => {
        if (status === 'online') {
            AppState.onlineUsers.add(userId);
        } else {
            AppState.onlineUsers.delete(userId);
        }

        const item = DOM.contactsEl.querySelector(`.contact[data-id="${userId}"]`);
        if (item) {
            const statusEl = item.querySelector('.status');
            if (statusEl) {
                statusEl.textContent = getStatusText(status);
            }
        }

        if (AppState.active === userId) {
            DOM.peerStatus.textContent = getStatusText(status);
        }
    });

    socket.on('contacts-update', (updatedContacts) => {
        AppState.contacts = updatedContacts;
        AppState.filteredContacts = [...AppState.contacts];
        renderContacts(selectContactCallback);
    });

    socket.on('chat-message', (m) => {
        renderMsg(m);
        scrollBottom(DOM.messagesEl);

        if (m.sender_id !== AppState.me.id && m.sender_id !== AppState.active) {
            AppState.unreadCounts[m.sender_id] = (AppState.unreadCounts[m.sender_id] || 0) + 1;
            const contact = DOM.contactsEl.querySelector(`.contact[data-id="${m.sender_id}"]`);
            if (contact) {
                const badge = contact.querySelector('.badge');
                if (badge) {
                    badge.textContent = AppState.unreadCounts[m.sender_id];
                    badge.style.display = 'block';
                }
            }
        }

        if (typeof window.SoundControl !== 'undefined' && window.SoundControl.isEnabled()) {
            playMessageSound();
        } else if (AppState.messageSounds) {
            playMessageSound();
        }

        if (m.sender_id !== AppState.me.id) {
            socket.emit('message-delivered', { messageId: m.id });
        }
    });

    socket.on('message-status', ({ messageId, status }) => {
        const statusEl = document.getElementById('status-' + messageId);
        if (!statusEl) return;

        statusEl.textContent = status === 'sent' ? '✓' :
                               status === 'delivered' ? '✓✓' : '✔✔';

        if (status === 'delivered') {
            if (typeof window.SoundControl !== 'undefined' && window.SoundControl.isEnabled()) {
                playMessageSound();
            } else if (AppState.messageSounds) {
                playMessageSound();
            }
        }
    });

    socket.on('typing', ({ from, isTyping }) => {
        if (from === AppState.active) {
            DOM.typingEl.classList.toggle('hidden', !isTyping);
            if (isTyping) {
                scrollBottom(DOM.messagesEl);
            }
        }
    });

    socket.on('message-deleted', ({ messageId, senderId, deletionType }) => {
        console.log('Message deleted event received:', { messageId, senderId, deletionType });

        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 300);

            if (senderId !== AppState.me.id) {
                if (deletionType === 'hard') {
                    showNotification('A message was deleted by sender', 'info');
                }
            } else {
                const deleteTypeText = deletionType === 'hard' ? 'deleted for everyone' : 'removed from your chat';
                showNotification(`Message ${deleteTypeText}`, 'success');
            }
        }

        if (AppState.selectedMessages.has(messageId.toString())) {
            AppState.selectedMessages.delete(messageId.toString());
            updateSelectionCount();

            if (AppState.selectedMessages.size === 0) {
                exitSelectionMode();
            }
        }
    });
}