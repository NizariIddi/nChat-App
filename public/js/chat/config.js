// config.js - Configuration and State Management
export const AppState = {
    me: JSON.parse(localStorage.getItem('me') || 'null'),
    token: localStorage.getItem('token'),
    contacts: [],
    filteredContacts: [],
    active: null,
    typingTimer: null,
    onlineUsers: new Set(),
    messageSounds: true,
    notifications: true,
    unreadCounts: {},
    selectedMessages: new Set(),
    selectionMode: false,
    contextMenuVisible: false,
    mediaRecorder: null,
    audioChunks: [],
    socket: null
};

export const DOM = {
    meName: document.getElementById('me-name'),
    meEmail: document.getElementById('me-email'),
    meAvatar: document.getElementById('me-avatar'),
    sideAvatar: document.getElementById('side-img'),
    peerAvatar: document.getElementById('peer-avatar'),
    profileUsername: document.getElementById('profile-username'),
    profileEmail: document.getElementById('profile-email'),
    contactsEl: document.getElementById('contacts'),
    contactSearch: document.getElementById('contact-search'),
    messagesEl: document.getElementById('messages'),
    peerName: document.getElementById('peer-name'),
    peerStatus: document.getElementById('peer-status'),
    typingEl: document.getElementById('typing'),
    sendForm: document.getElementById('send-form'),
    input: document.getElementById('message-input'),
    logoutBtn: document.getElementById('logout'),
    themeToggle: document.getElementById('theme-toggle'),
    profileDropdown: document.getElementById('profile-dropdown'),
    settingsDropdown: document.getElementById('settings-dropdown'),
    emojiBtn: document.getElementById('emoji-btn'),
    emojiPicker: document.getElementById('emoji-picker'),
    fileInput: document.getElementById('file-input'),
    fileBtn: document.getElementById('file-btn'),
    recordButton: document.getElementById('record-button'),
    stopButton: document.getElementById('stop-button'),
    audioPreview: document.getElementById('audio-preview')
};

export const EMOJIS = [
    '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🥳','🥺','🤠','🤡','🥱','😈','👿','👹','👺','💀','☠️','👻','👽','👾','🤖','💩',
    '👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🙏',
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🪲','🪳','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🐘','🦏','🦛','🐪','🐫','🦙','🦒','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐓','🦃','🕊️','🐇','🦝','🦨','🦡','🦦','🦥','🐁','🐀','🐿️','🦔',
    '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🥙','🫔','🥚','🍳','🥘','🍲','🫕','🥗','🍿','🧂','🥫','🍱','🍣','🍛','🍜','🍝','🍠','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🥛','🍼','☕','🫖','🍵','🥤','🧃','🧉','🧊','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧋',
    '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🥅','🏒','🏑','🏏','🥍','🏹','🎣','🤿','🥊','🥋','🎽','🛷','⛷️','🏂','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🛹','🎿','⛸️','🥌','🪂','🏄','🏊','🤽','🚣','🧗','🚵','🚴',
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟'
];