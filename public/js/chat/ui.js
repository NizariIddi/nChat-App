// ui.js - UI Event Handlers
import { AppState, DOM, EMOJIS } from './config.js';
import { filterContacts, renderContacts } from './contacts.js';
import { sendImageFile, sendAudioFile, sendMessage } from './api.js';
import { exitSelectionMode, hideActionMenu, handleMessageAction, updateSelectionCount } from './selection.js';
import { scrollBottom, showNotification } from './utils.js';

export function setupDropdowns() {
    function toggleDropdown(dropdown) {
        document.querySelectorAll('.dropdown').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });
        dropdown.classList.toggle('active');
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
        }
        if (AppState.contextMenuVisible && !document.getElementById('message-action-menu').contains(e.target)) {
            hideActionMenu();
        }
    });

    DOM.profileDropdown?.querySelector('.dropdown-toggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(DOM.profileDropdown);
    });

    DOM.settingsDropdown?.querySelector('.dropdown-toggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(DOM.settingsDropdown);
    });
}

export function setupLogout() {
    DOM.logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            if (AppState.socket && AppState.socket.connected) AppState.socket.disconnect();

            const preserved = {
                theme: localStorage.getItem('theme'),
                lang: localStorage.getItem('lang')
            };

            localStorage.clear();

            Object.keys(preserved).forEach(key => {
                if (preserved[key] !== null) localStorage.setItem(key, preserved[key]);
            });

            location.href = '/';
        }
    });
}

export function setupContactSearch(selectContactCallback) {
    DOM.contactSearch?.addEventListener('input', (e) => {
        filterContacts(e.target.value);
        renderContacts(selectContactCallback);
    });
}

export function setupFileHandling(renderMsg) {
    DOM.fileBtn?.addEventListener('click', () => {
        DOM.fileInput?.click();
    });

    DOM.fileInput?.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                await sendImageFile(file, AppState.active, AppState.me, renderMsg, () => scrollBottom(DOM.messagesEl));
            } else if (file.type.startsWith('audio/')) {
                await sendAudioFile(file, AppState.active);
            }
            DOM.fileInput.value = '';
        }
    });
}

export function setupAudioRecording(renderMsg) {
    DOM.recordButton?.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            AppState.mediaRecorder = new MediaRecorder(stream);

            DOM.recordButton.style.display = 'none';
            DOM.stopButton.style.display = 'inline';

            AppState.audioChunks = [];
            AppState.mediaRecorder.start();

            AppState.mediaRecorder.ondataavailable = e => AppState.audioChunks.push(e.data);

            AppState.mediaRecorder.addEventListener("stop", async () => {
                const audioBlob = new Blob(AppState.audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);

                if (DOM.audioPreview) {
                    DOM.audioPreview.src = audioUrl;
                    DOM.audioPreview.hidden = false;
                }

                try {
                    const response = await sendAudioFile(audioBlob, AppState.active);
                    renderMsg({ ...response, sender_id: AppState.me.id, status: 'sent' });
                    scrollBottom(DOM.messagesEl);
                    showNotification('Audio sent successfully', 'success');
                } catch (error) {
                    console.error('Error sending audio:', error);
                    showNotification('Failed to send audio', 'error');
                }

                stream.getTracks().forEach(track => track.stop());
            });
        } catch (error) {
            console.error('Error accessing microphone:', error);
            showNotification('Microphone access denied', 'error');
            DOM.recordButton.style.display = 'inline';
            DOM.stopButton.style.display = 'none';
        }
    });

    DOM.stopButton?.addEventListener('click', () => {
        if (AppState.mediaRecorder && AppState.mediaRecorder.state !== 'inactive') {
            AppState.mediaRecorder.stop();
        }
        DOM.stopButton.style.display = 'none';
        DOM.recordButton.style.display = 'inline';
    });
}

export function setupMessageForm(renderMsg) {
    DOM.sendForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = DOM.input.value.trim();
        if (!text || !AppState.active) return;

        const submitBtn = DOM.sendForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        DOM.input.value = '';

        try {
            await sendMessage(text, AppState.active, AppState.me, renderMsg, () => scrollBottom(DOM.messagesEl));
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            DOM.input.focus();
        }
    });

    // Typing indicator
    let typingTimeout = null;
    DOM.input?.addEventListener('input', () => {
        if (!AppState.active) return;
        AppState.socket.emit('typing', { to: AppState.active, isTyping: true });
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            AppState.socket.emit('typing', { to: AppState.active, isTyping: false });
        }, 1000);
    });

    DOM.input?.addEventListener('blur', () => {
        if (AppState.active && typingTimeout) {
            clearTimeout(typingTimeout);
            AppState.socket.emit('typing', { to: AppState.active, isTyping: false });
        }
    });
}

export function setupEmojiPicker() {
    EMOJIS.forEach(e => {
        const span = document.createElement('span');
        span.textContent = e;
        span.style.cssText = 'cursor: pointer; padding: 4px; font-size: 20px; display: inline-block;';
        span.addEventListener('click', () => {
            DOM.input.value += e;
            DOM.input.focus();
        });
        DOM.emojiPicker.appendChild(span);
    });

    DOM.emojiBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.emojiPicker.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!DOM.emojiPicker.contains(e.target) && e.target !== DOM.emojiBtn) {
            DOM.emojiPicker.classList.add('hidden');
        }
    });
}

export function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Escape key
        if (e.key === 'Escape') {
            if (AppState.selectionMode) {
                exitSelectionMode();
            } else if (AppState.active) {
                AppState.active = null;
                document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'));
                DOM.peerName.textContent = 'Select a contact';
                DOM.peerStatus.textContent = '--';
                DOM.messagesEl.innerHTML = '';
            }
        }

        // Ctrl/Cmd + Enter to send
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && DOM.input.value.trim()) {
            DOM.sendForm.dispatchEvent(new Event('submit'));
        }

        // Ctrl/Cmd + A to select all messages
        if ((e.ctrlKey || e.metaKey) && e.key === 'a' && AppState.selectionMode) {
            e.preventDefault();
            document.querySelectorAll('.msg').forEach(msg => {
                const messageId = msg.dataset.messageId;
                if (messageId) {
                    AppState.selectedMessages.add(messageId);
                    msg.classList.add('selected');
                }
            });
            updateSelectionCount();
        }

        // Ctrl/Cmd + C to copy selected messages
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && AppState.selectionMode && AppState.selectedMessages.size > 0) {
            e.preventDefault();
            handleMessageAction('copy');
        }

        // Delete key to delete selected messages
        if (e.key === 'Delete' && AppState.selectionMode && AppState.selectedMessages.size > 0) {
            e.preventDefault();
            handleMessageAction('delete');
        }
    });
}

export function setupVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            AppState.socket.emit('user-status', 'away');
        } else {
            AppState.socket.emit('user-status', 'online');
            if (AppState.active) {
                AppState.unreadCounts[AppState.active] = 0;
                const badge = DOM.contactsEl.querySelector(`.contact[data-id="${AppState.active}"] .badge`);
                if (badge) {
                    badge.textContent = '0';
                    badge.style.display = 'none';
                }
            }
        }
    });
}