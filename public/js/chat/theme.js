// theme.js - Theme Management
import { DOM } from './config.js';

export function saveTheme(isDark) {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

export function initializeTheme() {
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

    if (DOM.themeToggle) DOM.themeToggle.checked = isDark;
}

export function setupThemeListeners() {
    DOM.themeToggle?.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        document.body.classList.toggle('dark', isDark);
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.toggle('dark', isDark);
        saveTheme(isDark);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.body.classList.toggle('dark', e.matches);
            if (DOM.themeToggle) DOM.themeToggle.checked = e.matches;
        }
    });
}