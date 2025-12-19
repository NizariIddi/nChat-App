// api.js - API Communication
import { AppState } from './config.js';
import { showNotification } from './utils.js';

export const api = async (path, opts = {}) => {
    try {
        const response = await fetch(path, {
            ...opts,
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + AppState.token,
                ...(opts.headers || {})
            },
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                location.href = '/';
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response;
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Connection error. Please try again.', 'error');
        throw error;
    }
};

export async function sendImageFile(file, active, me, renderMsg, scrollBottom) {
    if (!active) {
        showNotification('Please select a contact first', 'error');
        return;
    }

    const formData = new FormData();
    formData.append("receiver_id", active);
    formData.append("image", file);

    try {
        const res = await fetch("/api/messages/images", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${AppState.token}`,
            },
            body: formData,
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const msg = await res.json();
        renderMsg({ ...msg, sender_id: me.id, status: 'sent' });
        scrollBottom();
        showNotification('Image sent successfully', 'success');
    } catch (error) {
        console.error('Error sending image:', error);
        showNotification('Failed to send image', 'error');
    }
}

export async function sendAudioFile(file, active) {
    if (!active) {
        showNotification('Please select a contact first', 'error');
        return;
    }

    const formData = new FormData();
    formData.append("receiver_id", active);
    formData.append("audio", file);

    try {
        const res = await fetch("/api/messages/audios", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${AppState.token}`,
            },
            body: formData,
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const msg = await res.json();
        return msg;
    } catch (error) {
        console.error('Error sending audio:', error);
        showNotification('Failed to send audio', 'error');
        throw error;
    }
}

export async function sendMessage(text, active, me, renderMsg, scrollBottom) {
    if (!active) {
        showNotification('Please select a contact first', 'error');
        return false;
    }

    const tempId = 'temp-' + Date.now();

    renderMsg({
        id: tempId,
        sender_id: me.id,
        message: text,
        timestamp: Date.now(),
        status: 'sent'
    });
    scrollBottom();

    try {
        const res = await api('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ receiver_id: active, message: text })
        });
        const msg = await res.json();

        const tempEl = document.querySelector(`[data-message-id="${tempId}"]`);
        if (tempEl) tempEl.remove();

        renderMsg({ ...msg, sender_id: me.id, status: 'sent' });
        scrollBottom();

        return true;
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message', 'error');
        return false;
    }
}