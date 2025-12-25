// messages.js - Message Rendering with Media Optimization
import { AppState, DOM } from './config.js';
import { formatTime, linkify, escapeHtml } from './utils.js';
import { enterSelectionMode, toggleMessageSelection, showActionMenu } from './selection.js';

// Cache for preloaded images
const imageCache = new Map();

// Preload image and return a promise
function preloadImage(url) {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

// Create image content with preloading
async function createImageContent(fileUrl) {
  try {
    await preloadImage(fileUrl);
    return `<img src="${fileUrl}" alt="Image message" class="image-thumbnail" loading="eager" />`;
  } catch (error) {
    console.error('Error loading image:', error);
    return `<a href="${fileUrl}" target="_blank">View image</a>`;
  }
}

// Create audio content (audio loads progressively with playback controls)
function createAudioContent(fileUrl) {
  return `<audio controls preload="auto" src="${fileUrl}" controlsList="nodownload">Your browser does not support audio playback.</audio>`;
}

// Create file download link
function createFileContent(fileUrl) {
  const fileName = fileUrl.split('/').pop() || 'file';
  return `<a href="${fileUrl}" target="_blank" class="file-download"><i class="fas fa-download"></i> ${fileName}</a>`;
}

// Main render function
export async function renderMsg(m) {
  const mine = m.sender_id === AppState.me.id;
  const li = document.createElement('li');
  li.className = 'msg ' + (mine ? 'me' : 'them');
  li.dataset.messageId = m.id;
  
  const timestamp = new Date(m.timestamp || Date.now());
  const timeStr = formatTime(timestamp);
  
  let content;
  
  if (m.file_url) {
    if (m.file_url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
      // For images, preload first
      content = await createImageContent(m.file_url);
    } else if (m.file_url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      // Audio loads progressively
      content = createAudioContent(m.file_url);
    } else {
      // Other files
      content = createFileContent(m.file_url);
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
  
  // Add click handler for image thumbnails to open in modal
  const imgElement = li.querySelector('.image-thumbnail');
  if (imgElement) {
    imgElement.addEventListener('click', () => {
      openImageModal(m.file_url);
    });
  }
  
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

// Synchronous version for batch rendering (loads content in background)
export function renderMsgSync(m) {
  const mine = m.sender_id === AppState.me.id;
  const li = document.createElement('li');
  li.className = 'msg ' + (mine ? 'me' : 'them');
  li.dataset.messageId = m.id;
  
  const timestamp = new Date(m.timestamp || Date.now());
  const timeStr = formatTime(timestamp);
  
  let content;
  
  if (m.file_url) {
    if (m.file_url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
      // Show placeholder initially, load in background
      content = `<div class="image-placeholder"><img src="${m.file_url}" alt="Image message" class="image-thumbnail" loading="lazy" /></div>`;
      // Preload in background
      preloadImage(m.file_url).catch(console.error);
    } else if (m.file_url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      content = createAudioContent(m.file_url);
    } else {
      content = createFileContent(m.file_url);
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
  
  // All event listeners (same as async version)
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
  
  li.addEventListener('click', (e) => {
    if (AppState.selectionMode) {
      e.preventDefault();
      toggleMessageSelection(m.id.toString(), li);
    }
  });
  
  li.addEventListener('dblclick', (e) => {
    if (!AppState.selectionMode) {
      enterSelectionMode();
      toggleMessageSelection(m.id.toString(), li);
    }
  });
  
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
  
  const imgElement = li.querySelector('.image-thumbnail');
  if (imgElement) {
    imgElement.addEventListener('click', () => {
      openImageModal(m.file_url);
    });
  }
  
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

// Image modal for full-screen viewing
function openImageModal(imageUrl) {
  // Remove existing modal if any
  const existingModal = document.getElementById('image-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'image-modal';
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="image-modal-overlay"></div>
    <div class="image-modal-content">
      <button class="image-modal-close">&times;</button>
      <img src="${imageUrl}" alt="Full size image" />
      <a href="${imageUrl}" download class="image-modal-download">
        <i class="fas fa-download"></i> Download
      </a>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close handlers
  const closeModal = () => modal.remove();
  modal.querySelector('.image-modal-close').addEventListener('click', closeModal);
  modal.querySelector('.image-modal-overlay').addEventListener('click', closeModal);
  
  // ESC key to close
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// Clear image cache (useful for memory management)
export function clearImageCache() {
  imageCache.clear();
}

// Preload multiple images (useful for batch loading)
export async function preloadImages(urls) {
  const promises = urls.map(url => preloadImage(url).catch(err => console.error('Failed to preload:', url)));
  return Promise.allSettled(promises);
}