// utils.js - Utility Functions
import { AppState } from './config.js';

export function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

export function linkify(text) {
    return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function formatTime(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (now - messageDate < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

export function getStatusText(status) {
    const statusMap = {
        'online': '🟢 Online',
        'away': '🟡 Away',
        'busy': '🔴 Busy',
        'offline': '⚫ Offline'
    };
    return statusMap[status] || status;
}

export function initializeUserAvatar(element, user) {
    if (element && user?.username) {
        element.textContent = user.username.substring(0, 2).toUpperCase();
    }
}

export function scrollBottom(messagesEl, smooth = true) {
    if (smooth) {
        messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
    } else {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
}

export function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 12px 24px; border-radius: 8px;
        color: white; font-weight: 500; z-index: 1000; transform: translateX(100%);
        transition: transform 0.3s ease;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(notification);
    requestAnimationFrame(() => { notification.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 300);
    }, duration);
}

export function playMessageSound(style = "default") {
    if (!AppState.messageSounds) return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        switch (style) {
            case "ping":
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
                break;
            case "buzz":
                oscillator.type = "sawtooth";
                oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
                break;
            case "ding":
                oscillator.type = "triangle";
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                break;
            default:
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        }

        const now = audioCtx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.4);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(now + 0.5);
    } catch (err) {
        console.error("Failed to play sound:", err);
    }
}