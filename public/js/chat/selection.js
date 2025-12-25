// selection.js - Message Selection & Actions
import { AppState } from './config.js';
import { showNotification } from './utils.js';
import { api } from './api.js';

export function createMessageActionMenu() {
    const actionMenu = document.createElement('div');
    actionMenu.id = 'message-action-menu';
    actionMenu.style.cssText = `
        position: fixed;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: none;
        padding: 8px;
        min-width: 200px;
    `;

    const actions = [
        { icon: '📋', text: 'Copy', action: 'copy' },
        { icon: '🔗', text: 'Share', action: 'share' },
        { icon: '↪️', text: 'Reply', action: 'reply' },
        { icon: '📤', text: 'Forward', action: 'forward' },
        { icon: '🗑️', text: 'Delete', action: 'delete', danger: true }
    ];

    actions.forEach((actionItem) => {
        const button = document.createElement('button');
        button.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 12px 16px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            color: ${actionItem.danger ? '#ef4444' : '#374151'};
        `;

        button.innerHTML = `<span>${actionItem.icon}</span><span>${actionItem.text}</span>`;
        
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = actionItem.danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
        });

        button.addEventListener('click', () => handleMessageAction(actionItem.action));
        actionMenu.appendChild(button);
    });

    document.body.appendChild(actionMenu);
    return actionMenu;
}

export function createSelectionToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'selection-toolbar';
    toolbar.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: rgba(139, 92, 246, 0.9);
        backdrop-filter: blur(15px);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 999;
        font-weight: 500;
        display: none;
        gap: 12px;
        align-items: center;
    `;

    const selectedCount = document.createElement('span');
    selectedCount.id = 'selected-count';
    selectedCount.textContent = '0 selected';

    const actions = [
        { icon: '📋', action: 'copy', title: 'Copy' },
        { icon: '🔗', action: 'share', title: 'Share' },
        { icon: '📤', action: 'forward', title: 'Forward' },
        { icon: '🗑️', action: 'delete', title: 'Delete', danger: true }
    ];

    toolbar.appendChild(selectedCount);

    const separator = document.createElement('div');
    separator.style.cssText = 'width: 1px; height: 20px; background: rgba(255, 255, 255, 0.3); margin: 0 8px;';
    toolbar.appendChild(separator);

    actions.forEach(actionItem => {
        const button = document.createElement('button');
        button.style.cssText = `
            background: ${actionItem.danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
            border: none;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: all 0.2s ease;
        `;
        
        button.title = actionItem.title;
        button.textContent = actionItem.icon;
        
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
            button.style.background = actionItem.danger ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.3)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.background = actionItem.danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.2)';
        });

        button.addEventListener('click', () => handleMessageAction(actionItem.action));
        toolbar.appendChild(button);
    });

    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        transition: all 0.2s ease;
        margin-left: 10px;
    `;
    
    closeButton.innerHTML = '×';
    closeButton.title = 'Cancel selection';
    closeButton.addEventListener('click', exitSelectionMode);
    toolbar.appendChild(closeButton);

    document.body.appendChild(toolbar);
    return toolbar;
}

export function enterSelectionMode() {
    AppState.selectionMode = true;
    document.body.classList.add('selection-mode');
    const toolbar = document.getElementById('selection-toolbar');
    if (toolbar) {
        toolbar.style.display = 'flex';
        toolbar.style.transform = 'translateX(-50%) translateY(0)';
    }
    
    document.querySelectorAll('.msg').forEach(msg => {
        msg.style.position = 'relative';
        msg.style.cursor = 'pointer';
    });
}

export function exitSelectionMode() {
    AppState.selectionMode = false;
    AppState.selectedMessages.clear();
    document.body.classList.remove('selection-mode');
    const toolbar = document.getElementById('selection-toolbar');
    if (toolbar) {
        toolbar.style.display = 'none';
        toolbar.style.transform = 'translateX(-50%) translateY(100px)';
    }
    
    document.querySelectorAll('.msg').forEach(msg => {
        msg.classList.remove('selected');
        msg.style.cursor = '';
    });
    
    updateSelectionCount();
    hideActionMenu();
}

export function toggleMessageSelection(messageId, messageElement) {
    if (AppState.selectedMessages.has(messageId)) {
        AppState.selectedMessages.delete(messageId);
        messageElement.classList.remove('selected');
    } else {
        AppState.selectedMessages.add(messageId);
        messageElement.classList.add('selected');
    }

    updateSelectionCount();

    if (AppState.selectedMessages.size === 0) {
        exitSelectionMode();
    }
}

export function updateSelectionCount() {
    const countElement = document.getElementById('selected-count');
    if (countElement) {
        countElement.textContent = `${AppState.selectedMessages.size} selected`;
    }
}

export function showActionMenu(x, y) {
    const menu = document.getElementById('message-action-menu');
    if (!menu) return;
    
    const menuWidth = 220;
    const menuHeight = 250;
    
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);
    
    menu.style.display = 'block';
    menu.style.left = Math.max(10, adjustedX) + 'px';
    menu.style.top = Math.max(10, adjustedY) + 'px';
    AppState.contextMenuVisible = true;
}

export function hideActionMenu() {
    const menu = document.getElementById('message-action-menu');
    if (menu) {
        menu.style.display = 'none';
    }
    AppState.contextMenuVisible = false;
}

export async function handleMessageAction(action) {
    const selectedMessageElements = Array.from(AppState.selectedMessages).map(id => 
        document.querySelector(`[data-message-id="${id}"]`)
    ).filter(Boolean);

    switch (action) {
        case 'copy':
            await handleCopy(selectedMessageElements);
            break;
        case 'share':
            await handleShare(selectedMessageElements);
            break;
        case 'reply':
            handleReply(selectedMessageElements);
            break;
        case 'forward':
            showNotification('Forward feature coming soon', 'info');
            break;
        case 'delete':
            await handleEnhancedDelete(selectedMessageElements);
            break;
    }

    hideActionMenu();
    exitSelectionMode();
}

async function handleCopy(elements) {
    const textToCopy = elements
        .map(el => {
            const clonedEl = el.cloneNode(true);
            const timeEl = clonedEl.querySelector('time');
            const statusEl = clonedEl.querySelector('.msg-status');
            if (timeEl) timeEl.remove();
            if (statusEl) statusEl.remove();
            return clonedEl.textContent.trim();
        })
        .filter(text => text.length > 0)
        .join('\n');
    
    if (textToCopy) {
        try {
            await navigator.clipboard.writeText(textToCopy);
            showNotification('Messages copied to clipboard', 'success');
        } catch (err) {
            showNotification('Failed to copy messages', 'error');
        }
    } else {
        showNotification('No text to copy', 'info');
    }
}

async function handleShare(elements) {
    if (navigator.share) {
        const textToShare = elements
            .map(el => {
                const clonedEl = el.cloneNode(true);
                const timeEl = clonedEl.querySelector('time');
                const statusEl = clonedEl.querySelector('.msg-status');
                if (timeEl) timeEl.remove();
                if (statusEl) statusEl.remove();
                return clonedEl.textContent.trim();
            })
            .filter(text => text.length > 0)
            .join('\n');
        
        if (textToShare) {
            try {
                await navigator.share({
                    title: 'nChat Messages',
                    text: textToShare
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            showNotification('No text to share', 'info');
        }
    } else {
        await handleCopy(elements);
        showNotification('Share not supported, messages copied instead', 'info');
    }
}

function handleReply(elements) {
    if (AppState.selectedMessages.size === 1) {
        const messageId = Array.from(AppState.selectedMessages)[0];
        const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
        const clonedEl = messageEl.cloneNode(true);
        const timeEl = clonedEl.querySelector('time');
        const statusEl = clonedEl.querySelector('.msg-status');
        if (timeEl) timeEl.remove();
        if (statusEl) statusEl.remove();
        const messageText = clonedEl.textContent.trim();
        
        const input = document.getElementById('message-input');
        if (input) {
            input.value = `@reply: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}" `;
            input.focus();
            showNotification('Reply template added to message input', 'info');
        }
    }
}

async function handleEnhancedDelete(selectedMessageElements) {
    if (AppState.selectedMessages.size === 0) return;

    const ownMessages = selectedMessageElements.filter(el => el.classList.contains('me'));
    const otherMessages = selectedMessageElements.filter(el => el.classList.contains('them'));

    let deleteOption = 'soft';
    let confirmMessage = '';

    // Only show modal for own messages (hard delete option available)
    if (ownMessages.length > 0 && otherMessages.length === 0) {
        const result = await showDeleteOptionsModal(ownMessages.length);
        if (!result) return;
        deleteOption = result;
        
        if (deleteOption === 'hard') {
            confirmMessage = ownMessages.length === 1 
                ? 'Delete this message for everyone? This cannot be undone.'
                : `Delete ${ownMessages.length} messages for everyone? This cannot be undone.`;
        } else {
            confirmMessage = ownMessages.length === 1 
                ? 'Remove this message from your chat?'
                : `Remove ${ownMessages.length} messages from your chat?`;
        }
    } 
    // For received messages only - soft delete only
    else if (otherMessages.length > 0 && ownMessages.length === 0) {
        deleteOption = 'soft'; // Force soft delete for received messages
        confirmMessage = otherMessages.length === 1 
            ? 'Remove this message from your chat? (It will still be visible to the sender)'
            : `Remove ${otherMessages.length} messages from your chat? (They will still be visible to the sender)`;
    } 
    // Mixed messages - soft delete only
    else {
        deleteOption = 'soft';
        confirmMessage = `Remove ${AppState.selectedMessages.size} messages from your chat? (Your sent messages will still be visible to recipients)`;
    }

    if (confirm(confirmMessage)) {
        try {
            const messageIds = Array.from(AppState.selectedMessages).map(id => parseInt(id));
            
            if (AppState.selectedMessages.size === 1) {
                const messageId = messageIds[0];
                const requestBody = deleteOption === 'hard' ? { deleteForEveryone: true } : {};
                
                await api(`/api/messages/${messageId}`, { 
                    method: 'DELETE',
                    body: JSON.stringify(requestBody)
                });
            } else {
                await api('/api/messages', { 
                    method: 'DELETE',
                    body: JSON.stringify({ 
                        messageIds,
                        deleteForEveryone: deleteOption === 'hard'
                    })
                });
            }
        } catch (error) {
            console.error('Error during delete:', error);
            showNotification('Failed to delete messages', 'error');
        }
    }
}

function showDeleteOptionsModal(messageCount) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        `;

        const isDark = document.body.classList.contains('dark');
        if (isDark) {
            modal.style.background = '#1f2937';
            modal.style.color = 'white';
        }

        modal.innerHTML = `
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
                Delete ${messageCount === 1 ? 'Message' : 'Messages'}
            </h3>
            <p style="margin: 0 0 24px 0; color: ${isDark ? '#d1d5db' : '#6b7280'}; line-height: 1.5;">
                Choose how you want to delete ${messageCount === 1 ? 'this message' : 'these messages'}:
            </p>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button id="delete-for-me" style="
                    padding: 12px 16px;
                    border: 2px solid ${isDark ? '#374151' : '#e5e7eb'};
                    background: transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                    color: inherit;
                ">
                    <div style="font-weight: 500;">Delete for me</div>
                    <div style="font-size: 14px; color: ${isDark ? '#9ca3af' : '#6b7280'}; margin-top: 4px;">
                        Remove from your chat only
                    </div>
                </button>
                <button id="delete-for-everyone" style="
                    padding: 12px 16px;
                    border: 2px solid #ef4444;
                    background: transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                    color: #ef4444;
                ">
                    <div style="font-weight: 500;">Delete for everyone</div>
                    <div style="font-size: 14px; opacity: 0.8; margin-top: 4px;">
                        Remove for all participants (cannot be undone)
                    </div>
                </button>
                <button id="cancel-delete" style="
                    padding: 12px 16px;
                    border: 2px solid ${isDark ? '#374151' : '#e5e7eb'};
                    background: transparent;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-top: 8px;
                    color: inherit;
                ">
                    Cancel
                </button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const buttons = modal.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                if (btn.id === 'delete-for-everyone') {
                    btn.style.background = 'rgba(239, 68, 68, 0.1)';
                } else {
                    btn.style.background = isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)';
                }
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'transparent';
            });
        });

        modal.querySelector('#delete-for-me').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve('soft');
        });

        modal.querySelector('#delete-for-everyone').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve('hard');
        });

        modal.querySelector('#cancel-delete').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(null);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(null);
            }
        });
    });
}

export function addSelectionStyles() {
    const selectionStyles = document.createElement('style');
    selectionStyles.textContent = `
        .msg.selected {
            background: rgba(139, 92, 246, 0.2) !important;
            border-left: 3px solid #8B5CF6 !important;
            transform: translateX(5px);
        }
        
        .selection-mode .msg:hover {
            background: rgba(139, 92, 246, 0.1);
            transform: translateX(3px);
        }
        
        .msg {
            transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(selectionStyles);
}