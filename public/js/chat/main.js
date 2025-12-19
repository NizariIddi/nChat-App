// main.js - Main Application Entry Point
import { AppState, DOM } from './config.js';
import { initializeUserAvatar, scrollBottom, showNotification, playMessageSound } from './utils.js';
import { initializeTheme, setupThemeListeners } from './theme.js';
import { loadContacts, renderContacts, selectContact } from './contacts.js';
import { renderMsg } from './messages.js';
import { sendMessage } from './api.js';
import { 
    createMessageActionMenu, 
    createSelectionToolbar, 
    addSelectionStyles 
} from './selection.js';
import { setupSocketListeners } from './socket.js';
import {
    setupDropdowns,
    setupLogout,
    setupContactSearch,
    setupFileHandling,
    setupAudioRecording,
    setupMessageForm,
    setupEmojiPicker,
    setupKeyboardShortcuts,
    setupVisibilityChange
} from './ui.js';

(function() {
    // Check authentication
    if (!AppState.me || !AppState.token) {
        location.href = '/';
        return;
    }

    // Initialize user display
    if (DOM.meName) DOM.meName.textContent = AppState.me.username || 'Me';
    if (DOM.meEmail) DOM.meEmail.textContent = AppState.me.email || '';
    if (DOM.profileUsername) DOM.profileUsername.value = AppState.me.username || '';
    if (DOM.profileEmail) DOM.profileEmail.value = AppState.me.email || '';
    initializeUserAvatar(DOM.meAvatar, AppState.me);
    initializeUserAvatar(DOM.sideAvatar, AppState.me);

    // Initialize theme
    initializeTheme();
    setupThemeListeners();

    // Create UI components
    createMessageActionMenu();
    createSelectionToolbar();
    addSelectionStyles();

    // Create bound callbacks for contacts
    const selectContactCallback = (user, element) => 
        selectContact(user, element, renderMsg, () => scrollBottom(DOM.messagesEl));

    // Setup UI event handlers
    setupDropdowns();
    setupLogout();
    setupContactSearch(selectContactCallback);
    setupFileHandling(renderMsg);
    setupAudioRecording(renderMsg);
    setupMessageForm(renderMsg);
    setupEmojiPicker();
    setupKeyboardShortcuts();
    setupVisibilityChange();

    // Load contacts
    loadContacts().then(() => {
        renderContacts(selectContactCallback);
    });

    // Initialize Socket.IO
    const socket = io('/', {
        auth: { token: AppState.token },
        transports: ['websocket', 'polling']
    });

    setupSocketListeners(socket, renderMsg, selectContactCallback);

    // Expose public API
    window.chatApp = {
        sendMessage: (text) => sendMessage(text, AppState.active, AppState.me, renderMsg, () => scrollBottom(DOM.messagesEl)),
        playMessageSound,
        showNotification
    };

})();