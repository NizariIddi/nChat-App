(function() {
    const me = JSON.parse(localStorage.getItem('me') || 'null');
    const token = localStorage.getItem('token');
    if (!me || !token) { 
        location.href = '/'; 
        return; 
    }

    // UI refs
    const meName = document.getElementById('me-name');
    const meEmail = document.getElementById('me-email');
    const meAvatar = document.getElementById('me-avatar');
    const sideAvatar = document.getElementById('side-img');
    const peerAvatar = document.getElementById('peer-avatar');
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const contactsEl = document.getElementById('contacts');
    const contactSearch = document.getElementById('contact-search');
    const messagesEl = document.getElementById('messages');
    const peerName = document.getElementById('peer-name');
    const peerStatus = document.getElementById('peer-status');
    const typingEl = document.getElementById('typing');
    const sendForm = document.getElementById('send-form');
    const input = document.getElementById('message-input');
    const logoutBtn = document.getElementById('logout');
    const themeToggle = document.getElementById('theme-toggle');

    // Dropdown refs
    const profileDropdown = document.getElementById('profile-dropdown');
    const settingsDropdown = document.getElementById('settings-dropdown');

    // Emoji refs
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');
    const messageInput = input;

    // File and audio refs
    const fileInput = document.getElementById('file-input');
    const fileBtn = document.getElementById('file-btn');
    const recordButton = document.getElementById('record-button');  
    const stopButton = document.getElementById('stop-button');
    const audioPreview = document.getElementById('audio-preview');

    // State
    let contacts = [];
    let filteredContacts = [];
    let active = null;
    let typingTimer = null;
    let onlineUsers = new Set();
    let messageSounds = true;
    let notifications = true;
    let unreadCounts = {};

    // Message selection state
    let selectedMessages = new Set();
    let selectionMode = false;
    let contextMenuVisible = false;

    // Media recording state
    let mediaRecorder;
    let audioChunks = [];

    // Create message action menu
    function createMessageActionMenu() {
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

    // Create selection toolbar
    function createSelectionToolbar() {
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

    // Initialize action menu and toolbar
    const messageActionMenu = createMessageActionMenu();
    const selectionToolbar = createSelectionToolbar();

    // Handle message actions
    async function handleMessageAction(action) {
        const selectedMessageElements = Array.from(selectedMessages).map(id => 
            document.querySelector(`[data-message-id="${id}"]`)
        ).filter(Boolean);

        switch (action) {
            case 'copy':
                const textToCopy = selectedMessageElements
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
                break;

            case 'share':
                if (navigator.share) {
                    const textToShare = selectedMessageElements
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
                    handleMessageAction('copy');
                    showNotification('Share not supported, messages copied instead', 'info');
                }
                break;

            case 'reply':
                if (selectedMessages.size === 1) {
                    const messageId = Array.from(selectedMessages)[0];
                    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
                    const clonedEl = messageEl.cloneNode(true);
                    const timeEl = clonedEl.querySelector('time');
                    const statusEl = clonedEl.querySelector('.msg-status');
                    if (timeEl) timeEl.remove();
                    if (statusEl) statusEl.remove();
                    const messageText = clonedEl.textContent.trim();
                    
                    input.value = `@reply: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}" `;
                    input.focus();
                    showNotification('Reply template added to message input', 'info');
                }
                break;

            case 'forward':
                showNotification('Forward feature coming soon', 'info');
                break;

            case 'delete':
                await handleEnhancedDelete();
                break;
        }

        hideActionMenu();
        exitSelectionMode();
    }

    // Enhanced delete function with options
    async function handleEnhancedDelete() {
        if (selectedMessages.size === 0) return;

        const selectedMessageElements = Array.from(selectedMessages).map(id => 
            document.querySelector(`[data-message-id="${id}"]`)
        ).filter(Boolean);

        const ownMessages = selectedMessageElements.filter(el => el.classList.contains('me'));
        const otherMessages = selectedMessageElements.filter(el => el.classList.contains('them'));

        let deleteOption = 'soft';
        let confirmMessage = '';

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
        } else if (otherMessages.length > 0 && ownMessages.length === 0) {
            confirmMessage = otherMessages.length === 1 
                ? 'Remove this message from your chat? (It will still be visible to the sender)'
                : `Remove ${otherMessages.length} messages from your chat? (They will still be visible to the sender)`;
        } else {
            confirmMessage = `Remove ${selectedMessages.size} messages from your chat?`;
        }

        if (confirm(confirmMessage)) {
            try {
                const messageIds = Array.from(selectedMessages).map(id => parseInt(id));
                
                if (selectedMessages.size === 1) {
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

    // Modal for delete options
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

    // Show/hide action menu
    function showActionMenu(x, y) {
        const menuWidth = 220;
        const menuHeight = 250;
        
        const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
        const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);
        
        messageActionMenu.style.display = 'block';
        messageActionMenu.style.left = Math.max(10, adjustedX) + 'px';
        messageActionMenu.style.top = Math.max(10, adjustedY) + 'px';
        contextMenuVisible = true;
    }

    function hideActionMenu() {
        messageActionMenu.style.display = 'none';
        contextMenuVisible = false;
    }

    // Selection mode functions
    function enterSelectionMode() {
        selectionMode = true;
        document.body.classList.add('selection-mode');
        selectionToolbar.style.display = 'flex';
        selectionToolbar.style.transform = 'translateX(-50%) translateY(0)';
        
        document.querySelectorAll('.msg').forEach(msg => {
            msg.style.position = 'relative';
            msg.style.cursor = 'pointer';
        });
    }

    function exitSelectionMode() {
        selectionMode = false;
        selectedMessages.clear();
        document.body.classList.remove('selection-mode');
        selectionToolbar.style.display = 'none';
        selectionToolbar.style.transform = 'translateX(-50%) translateY(100px)';
        
        document.querySelectorAll('.msg').forEach(msg => {
            msg.classList.remove('selected');
            msg.style.cursor = '';
        });
        
        updateSelectionCount();
        hideActionMenu();
    }

    function toggleMessageSelection(messageId, messageElement) {
        if (selectedMessages.has(messageId)) {
            selectedMessages.delete(messageId);
            messageElement.classList.remove('selected');
        } else {
            selectedMessages.add(messageId);
            messageElement.classList.add('selected');
        }

        updateSelectionCount();

        if (selectedMessages.size === 0) {
            exitSelectionMode();
        }
    }

    function updateSelectionCount() {
        const countElement = document.getElementById('selected-count');
        if (countElement) {
            countElement.textContent = `${selectedMessages.size} selected`;
        }
    }

    // Add selection styles
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

    // Initialize avatars
    function initializeUserAvatar(element, user) {
        if (element && user?.username) {
            element.textContent = user.username.substring(0, 2).toUpperCase();
        }
    }
    
    // Initialize user data
    if (meName) meName.textContent = me.username || 'Me';
    if (meEmail) meEmail.textContent = me.email || '';
    if (profileUsername) profileUsername.value = me.username || '';
    if (profileEmail) profileEmail.value = me.email || '';
    initializeUserAvatar(meAvatar, me);
    initializeUserAvatar(sideAvatar, me);

    // Theme management
    function saveTheme(isDark) {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    function initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        let isDark;

        if (savedTheme) {
            isDark = savedTheme === 'dark';
        } else {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            saveTheme(isDark);
        }

        document.body.classList.toggle('dark', isDark);
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.toggle('dark', isDark);

        if (themeToggle) themeToggle.checked = isDark;
    }

    initializeTheme();

    themeToggle?.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        document.body.classList.toggle('dark', isDark);
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.toggle('dark', isDark);
        saveTheme(isDark);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.body.classList.toggle('dark', e.matches);
            if (themeToggle) themeToggle.checked = e.matches;
        }
    });

    // Dropdown functionality
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
        if (contextMenuVisible && !messageActionMenu.contains(e.target)) {
            hideActionMenu();
        }
    });

    profileDropdown?.querySelector('.dropdown-toggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(profileDropdown);
    });

    settingsDropdown?.querySelector('.dropdown-toggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(settingsDropdown);
    });

    logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            if (socket && socket.connected) socket.disconnect();

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

    // API helper
    const api = async (path, opts = {}) => {
        try {
            const response = await fetch(path, {
                ...opts,
                headers: { 
                    'Content-Type': 'application/json', 
                    Authorization: 'Bearer ' + token, 
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

    // Contact filtering
    function filterContacts(searchTerm = '') {
        const term = searchTerm.toLowerCase().trim();
        filteredContacts = contacts.filter(user => 
            user.username.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term)
        );
        renderContacts();
    }

    contactSearch?.addEventListener('input', (e) => filterContacts(e.target.value));

    function getUnreadCount(userId) { 
        return unreadCounts[userId] || 0; 
    }

    function contactItem(u) {
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

        li.addEventListener('click', async () => await selectContact(u, li));

        return li;
    }

    // File handling
    fileBtn?.addEventListener('click', () => {
        fileInput?.click();
    });

    fileInput?.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                await sendImageFile(file);
            } else if (file.type.startsWith('audio/')) {
                await sendAudioFile(file);
            }
            fileInput.value = '';
        }
    });

    async function sendImageFile(file) {
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
                    Authorization: `Bearer ${token}`,
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

    async function sendAudioFile(file) {
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
                    Authorization: `Bearer ${token}`,
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

    async function selectContact(user, element) {
        try {
            element.classList.add('loading');
            document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'));
            element.classList.add('active');
            
            active = user.id;
            peerName.textContent = user.username;
            peerStatus.textContent = getStatusText(user.status);
            initializeUserAvatar(peerAvatar, user);
            messagesEl.innerHTML = '';
            
            const res = await api('/api/messages/' + active);
            const msgs = await res.json();
            msgs.forEach(renderMsg);
            scrollBottom();
            
            if (typeof window.toggleSidebar === 'function') {
                window.toggleSidebar(true);
            }

            if (socket && socket.connected) {
                socket.emit('message-read', { partnerId: active });
            }

            unreadCounts[user.id] = 0;

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

    function getStatusText(status) {
        const statusMap = { 
            'online':'🟢 Online',
            'away':'🟡 Away',
            'busy':'🔴 Busy',
            'offline':'⚫ Offline' 
        };
        return statusMap[status] || status;
    }

    function renderMsg(m) {
        const mine = m.sender_id === me.id;
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

        li.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (selectionMode) {
                toggleMessageSelection(m.id.toString(), li);
            } else {
                showActionMenu(e.clientX, e.clientY);
                selectedMessages.clear();
                selectedMessages.add(m.id.toString());
            }
        });

        li.addEventListener('click', (e) => {
            if (selectionMode) {
                e.preventDefault();
                toggleMessageSelection(m.id.toString(), li);
            }
        });

        li.addEventListener('dblclick', (e) => {
            if (!selectionMode) {
                enterSelectionMode();
                toggleMessageSelection(m.id.toString(), li);
            }
        });

        let longPressTimer;
        li.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                if (!selectionMode) {
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

        messagesEl.appendChild(li);
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

    function formatTime(date) {
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

    function linkify(text) { 
        return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'); 
    }

    function scrollBottom(smooth = true) { 
        if (smooth) {
            messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' }); 
        } else {
            messagesEl.scrollTop = messagesEl.scrollHeight; 
        }
    }

    function renderContacts() { 
        contactsEl.innerHTML = ''; 
        filteredContacts.forEach(u => contactsEl.appendChild(contactItem(u))); 
    }

    function escapeHtml(s) { 
        return s.replace(/[&<>"']/g, c => ({ 
            '&':'&amp;',
            '<':'&lt;',
            '>':'&gt;',
            '"':'&quot;',
            "'":'&#39;'
        }[c])); 
    }

    function showNotification(message, type = 'info', duration = 3000) {
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

    async function loadContacts() {
        try { 
            const res = await api('/api/users'); 
            contacts = await res.json(); 
            filteredContacts = [...contacts]; 
            renderContacts(); 
        } catch (error) { 
            console.error('Error loading contacts:', error); 
            showNotification('Failed to load contacts', 'error'); 
        }
    }

    function playMessageSound(style = "default") {
        if (!messageSounds) return;

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

    loadContacts();

    const socket = io('/', { 
        auth: { token }, 
        transports: ['websocket', 'polling'] 
    });

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
            onlineUsers.add(userId);
        } else {
            onlineUsers.delete(userId);
        }
        
        const item = contactsEl.querySelector(`.contact[data-id="${userId}"]`);
        if (item) {
            const statusEl = item.querySelector('.status'); 
            if (statusEl) {
                statusEl.textContent = getStatusText(status);
            }
        }
        
        if (active === userId) {
            peerStatus.textContent = getStatusText(status);
        }
    });

    socket.on('contacts-update', (updatedContacts) => {
        contacts = updatedContacts;
        filteredContacts = [...contacts];
        renderContacts();
    });

    socket.on('chat-message', (m) => {
        renderMsg(m);
        scrollBottom();
        
        if (m.sender_id !== me.id && m.sender_id !== active) {
            unreadCounts[m.sender_id] = (unreadCounts[m.sender_id] || 0) + 1;
            const contact = contactsEl.querySelector(`.contact[data-id="${m.sender_id}"]`);
            if (contact) {
                const badge = contact.querySelector('.badge');
                if (badge) {
                    badge.textContent = unreadCounts[m.sender_id];
                    badge.style.display = 'block';
                }
            }
        }
        
        if (typeof window.SoundControl !== 'undefined' && window.SoundControl.isEnabled()) {
            playMessageSound();
        } else if (messageSounds) {
            playMessageSound();
        }
        if (m.sender_id !== me.id) {
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
            } else if (messageSounds) {
                playMessageSound();
            }
        }
    });

    socket.on('typing', ({ from, isTyping }) => { 
        if (from === active) {
            typingEl.classList.toggle('hidden', !isTyping); 
            if (isTyping) {
                scrollBottom();
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
            
            if (senderId !== me.id) {
                if (deletionType === 'hard') {
                    showNotification('A message was deleted by sender', 'info');
                }
            } else {
                const deleteTypeText = deletionType === 'hard' ? 'deleted for everyone' : 'removed from your chat';
                showNotification(`Message ${deleteTypeText}`, 'success');
            }
        }
        
        if (selectedMessages.has(messageId.toString())) {
            selectedMessages.delete(messageId.toString());
            updateSelectionCount();
            
            if (selectedMessages.size === 0) {
                exitSelectionMode();
            }
        }
    });

async function sendMessage(text, retryCount = 0) {
    if (!active) {
        showNotification('Please select a contact first', 'error');
        return false;
    }

    // ✅ TEMP ID for instant UI
    const tempId = 'temp-' + Date.now();

    // 🔥 INSTANT render (✓)
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

        // 🔁 Replace temp message with real one
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


    sendForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || !active) return;

        const submitBtn = sendForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        input.value = '';

        try {
            await sendMessage(text);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            input.focus();
        }
    });

    let typingTimeout = null;
    input?.addEventListener('input', () => { 
        if (!active) return; 
        socket.emit('typing', { to: active, isTyping: true }); 
        clearTimeout(typingTimeout); 
        typingTimeout = setTimeout(() => {
            socket.emit('typing', { to: active, isTyping: false });
        }, 1000); 
    });

    input?.addEventListener('blur', () => { 
        if (active && typingTimeout) {
            clearTimeout(typingTimeout); 
            socket.emit('typing', { to: active, isTyping: false });
        } 
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (selectionMode) {
                exitSelectionMode();
            } else if (active) {
                active = null; 
                document.querySelectorAll('.contact').forEach(c => c.classList.remove('active')); 
                peerName.textContent = 'Select a contact'; 
                peerStatus.textContent = '--'; 
                messagesEl.innerHTML = '';
            }
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && input.value.trim()) {
            sendForm.dispatchEvent(new Event('submit'));
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'a' && selectionMode) {
            e.preventDefault();
            document.querySelectorAll('.msg').forEach(msg => {
                const messageId = msg.dataset.messageId;
                if (messageId) {
                    selectedMessages.add(messageId);
                    msg.classList.add('selected');
                }
            });
            updateSelectionCount();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectionMode && selectedMessages.size > 0) {
            e.preventDefault();
            handleMessageAction('copy');
        }
        
        if (e.key === 'Delete' && selectionMode && selectedMessages.size > 0) {
            e.preventDefault();
            handleMessageAction('delete');
        }
    });

    document.addEventListener('visibilitychange', () => { 
        if (document.hidden) {
            socket.emit('user-status', 'away');
        } else {
            socket.emit('user-status', 'online'); 
            if (active) {
                unreadCounts[active] = 0;
                const badge = contactsEl.querySelector(`.contact[data-id="${active}"] .badge`); 
                if (badge) {
                    badge.textContent = '0'; 
                    badge.style.display = 'none';
                }
            }
        } 
    });

    // Emoji picker
    const emojis = [
        '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🥳','🥺','🤠','🤡','🥱','😈','👿','👹','👺','💀','☠️','👻','👽','👾','🤖','💩',
        '👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🙏',
        '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🪲','🪳','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🐘','🦏','🦛','🐪','🐫','🦙','🦒','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐓','🦃','🕊️','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿️','🦔',
        '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🥙','🫔','🥚','🍳','🥘','🍲','🫕','🥗','🍿','🧂','🥫','🍱','🍣','🍛','🍜','🍝','🍠','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🥛','🍼','☕','🫖','🍵','🥤','🧃','🧉','🧊','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧋',
        '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🥅','🏒','🏑','🏏','🥍','🏹','🎣','🤿','🥊','🥋','🎽','🛷','⛷️','🏂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🛹','🎿','⛸️','🥌','🪂','🏄','🏊','🤽','🚣','🧗','🚵','🚴',
        '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟'
    ];

    emojis.forEach(e => {
        const span = document.createElement('span');
        span.textContent = e;
        span.style.cssText = 'cursor: pointer; padding: 4px; font-size: 20px; display: inline-block;';
        span.addEventListener('click', () => { 
            messageInput.value += e; 
            messageInput.focus(); 
        });
        emojiPicker.appendChild(span);
    });

    emojiBtn?.addEventListener('click', (e) => { 
        e.stopPropagation();
        emojiPicker.classList.toggle('hidden'); 
    });

    document.addEventListener('click', (e) => { 
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
            emojiPicker.classList.add('hidden');
        } 
    });

    // Audio recording
    recordButton?.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            recordButton.style.display = 'none';
            stopButton.style.display = 'inline';

            audioChunks = [];
            mediaRecorder.start();

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            
            mediaRecorder.addEventListener("stop", async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);

                if (audioPreview) {
                    audioPreview.src = audioUrl;
                    audioPreview.hidden = false;
                }

                try {
                    const response = await sendAudioFile(audioBlob);
                    renderMsg({ ...response, sender_id: me.id, status: 'sent' });
                    scrollBottom();
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
            recordButton.style.display = 'inline';
            stopButton.style.display = 'none';
        }
    });

    stopButton?.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        stopButton.style.display = 'none';
        recordButton.style.display = 'inline';
    });

    // Expose for external use
    window.chatApp = {
        sendMessage,
        playMessageSound,
        showNotification
    };

})();