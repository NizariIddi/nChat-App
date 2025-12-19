// messages.js - Message Rendering
import { AppState, DOM } from './config.js';
import { formatTime, linkify, escapeHtml } from './utils.js';
import { enterSelectionMode, toggleMessageSelection, showActionMenu } from './selection.js';

export function renderMsg(m) {
    const mine = m.sender_id === AppState.me.id;
    const li = document.createElement('li');
    li.className = 'msg ' + (mine ? 'me' : 'them');
    li.dataset.messageId = m.id;

    const timestamp = new Date(m.timestamp || Date.now());
    const timeStr = formatTime(timestamp);

    let content;

    if (m.file_url) {
        if (m.file_url.match(/\.(jpg|jpeg|png|gif)$/i)) {
            content = `<img src="${m.file_url}" alt="Image message" class="image-thumbnail" style="max-width: 200px; border-radius: 8px;" />`;
        } else if (m.file_url.match(/\.(mp3|wav|ogg)$/i)) {
            content = `<audio controls src="${m.file_url}" style="max-width: 300px;">Your browser does not support audio playback.</audio>`;
        } else {
            content = `<a href="${m.file_url}" target="_blank">Download file</a>`;
        }
    } else {
        const messageContent = linkify(escapeHtml(m.message));
        content = messageContent;
    }

    li.innerHTML = `
      ${content}
      <time title="${timestamp.toLocaleString()}">${timeStr}</time>
      ${mine ? `<span class="msg-status ${m.status === 'delivered' ? 'status-delivered' : ''}" id="status-${m.id}">${m.status === 'sent' ? '✓' : m.status === 'delivered' ? '✓✓' : '✔✔'}</span>` : ''}
    `;

    // Context menu (right-click)
    li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (AppState.selectionMode) {
            toggleMessageSelection(m.id.toString(), li);
        } else {
            showActionMenu(e.clientX, e.clientY);
            AppState.selectedMessages.clear();
            AppState.selectedMessages.add(m.id.toString());
        }
    });

    // Click in selection mode
    li.addEventListener('click', (e) => {
        if (AppState.selectionMode) {
            e.preventDefault();
            toggleMessageSelection(m.id.toString(), li);
        }
    });

    // Double-click to start selection
    li.addEventListener('dblclick', (e) => {
        if (!AppState.selectionMode) {
            enterSelectionMode();
            toggleMessageSelection(m.id.toString(), li);
        }
    });

    // Long press for mobile
    let longPressTimer;
    li.addEventListener('touchstart', (e) => {
        longPressTimer = setTimeout(() => {
            if (!AppState.selectionMode) {
                enterSelectionMode();
                toggleMessageSelection(m.id.toString(), li);
            } else {
                toggleMessageSelection(m.id.toString(), li);
            }
        }, 500);
    });

    li.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });

    li.addEventListener('touchmove', () => {
        clearTimeout(longPressTimer);
    });

    DOM.messagesEl.appendChild(li);
    
    // Animate message appearance
    requestAnimationFrame(() => {
        li.style.opacity = '0';
        li.style.transform = 'translateY(20px)';
        li.style.transition = 'all 0.3s ease';
        requestAnimationFrame(() => {
            li.style.opacity = '1';
            li.style.transform = 'translateY(0)';
        });
    });
}