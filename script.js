/* ===== DATABASE MANAGER (IndexedDB) ===== */
        class DatabaseManager {
            constructor() {
                this.dbName = 'MediaGalleryDB';
                this.dbVersion = 1;
                this.storeName = 'media';
                this.versionStoreName = 'versions';
                this.settingsStoreName = 'settings';
                this.db = null;
            }

            async init() {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open(this.dbName, this.dbVersion);

                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => {
                        this.db = request.result;
                        resolve(this.db);
                    };

                    request.onupgradeneeded = (event) => {
                        const db = event.target.result;

                        // Media store
                        if (!db.objectStoreNames.contains(this.storeName)) {
                            const mediaStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                            mediaStore.createIndex('folderDate', 'folderDate', { unique: false });
                            mediaStore.createIndex('type', 'type', { unique: false });
                            mediaStore.createIndex('isFavorite', 'isFavorite', { unique: false });
                            mediaStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                        }

                        // Versions store
                        if (!db.objectStoreNames.contains(this.versionStoreName)) {
                            const versionStore = db.createObjectStore(this.versionStoreName, { keyPath: 'id' });
                            versionStore.createIndex('originalId', 'originalId', { unique: false });
                        }

                        // Settings store
                        if (!db.objectStoreNames.contains(this.settingsStoreName)) {
                            db.createObjectStore(this.settingsStoreName, { keyPath: 'key' });
                        }
                    };
                });
            }

            async addMedia(mediaData) {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                return new Promise((resolve, reject) => {
                    const request = store.add(mediaData);
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result);
                });
            }

            async updateMedia(mediaData) {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                return new Promise((resolve, reject) => {
                    const request = store.put(mediaData);
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result);
                });
            }

            async getMedia(id) {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                return new Promise((resolve, reject) => {
                    const request = store.get(id);
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result);
                });
            }

            async getAllMedia() {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                return new Promise((resolve, reject) => {
                    const request = store.getAll();
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result);
                });
            }

            async deleteMedia(id) {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                return new Promise((resolve, reject) => {
                    const request = store.delete(id);
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result);
                });
            }

            async getMediaByFilter(filter) {
                const allMedia = await this.getAllMedia();
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                switch (filter) {
                    case 'images':
                        return allMedia.filter(m => m.type.startsWith('image'));
                    case 'videos':
                        return allMedia.filter(m => m.type.startsWith('video'));
                    case 'favorites':
                        return allMedia.filter(m => m.isFavorite === true);
                    default:
                        return allMedia;
                }
            }

            async addVersion(versionData) {
                const transaction = this.db.transaction([this.versionStoreName], 'readwrite');
                const store = transaction.objectStore(this.versionStoreName);
                return new Promise((resolve, reject) => {
                    const request = store.add(versionData);
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result);
                });
            }

            async getVersions(originalId) {
                const transaction = this.db.transaction([this.versionStoreName], 'readonly');
                const store = transaction.objectStore(this.versionStoreName);
                const index = store.index('originalId');
                return new Promise((resolve, reject) => {
                    const request = index.getAll(originalId);
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result);
                });
            }

            async saveSetting(key, value) {
                const transaction = this.db.transaction([this.settingsStoreName], 'readwrite');
                const store = transaction.objectStore(this.settingsStoreName);
                return new Promise((resolve, reject) => {
                    const request = store.put({ key, value });
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result);
                });
            }

            async getSetting(key) {
                const transaction = this.db.transaction([this.settingsStoreName], 'readonly');
                const store = transaction.objectStore(this.settingsStoreName);
                return new Promise((resolve, reject) => {
                    const request = store.get(key);
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result?.value || null);
                });
            }

            async deleteVersion(versionId) {
                const transaction = this.db.transaction([this.versionStoreName], 'readwrite');
                const store = transaction.objectStore(this.versionStoreName);
                return new Promise((resolve, reject) => {
                    const request = store.delete(versionId);
                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result);
                });
            }
        }

        /* ===== MODAL MANAGER ===== */
        class ModalManager {
            constructor() {
                this.overlay = document.getElementById('modalOverlay');
                this.modal = document.getElementById('modal');
                this.titleEl = document.getElementById('modalTitle');
                this.bodyEl = document.getElementById('modalBody');
                this.footerEl = document.getElementById('modalFooter');
                this.closeBtn = document.getElementById('modalClose');
                this.callbacks = {};

                this.closeBtn.addEventListener('click', () => this.close());
                this.overlay.addEventListener('click', (e) => {
                    if (e.target === this.overlay) this.close();
                });
            }

            show(options = {}) {
                const {
                    title = 'Modal',
                    body = '',
                    buttons = [],
                    onClose = null
                } = options;

                this.titleEl.textContent = title;
                this.bodyEl.innerHTML = body;
                this.footerEl.innerHTML = '';

                buttons.forEach((btn, idx) => {
                    const button = document.createElement('button');
                    button.className = `btn ${btn.class || 'btn-secondary'} ${btn.sm ? 'btn-sm' : ''}`;
                    button.textContent = btn.text;
                    button.addEventListener('click', () => {
                        if (btn.onClick) btn.onClick();
                        if (btn.close !== false) this.close();
                    });
                    this.footerEl.appendChild(button);
                });

                this.overlay.classList.add('active');
                this.callbacks.onClose = onClose;
            }

            close() {
                this.overlay.classList.remove('active');
                if (this.callbacks.onClose) this.callbacks.onClose();
            }
        }

        /* ===== UTILITY FUNCTIONS ===== */
        class Utils {
            static generateId() {
                return Date.now() + Math.random().toString(36).substr(2, 9);
            }

            static getFolderDate() {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }

            static getFormattedDate(timestamp) {
                const date = new Date(timestamp);
                return date.toLocaleString();
            }

            static formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
            }

            static async fileToBase64(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }

            static base64ToBlob(base64, type) {
                const byteCharacters = atob(base64.split(',')[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                return new Blob([byteArray], { type });
            }
        }

        /* ===== IMAGE EDITOR ===== */
        class ImageEditor {
            constructor() {
                this.originalImage = null;
                this.editedImage = null;
                this.canvas = null;
                this.ctx = null;
                this.textOverlays = [];
                this.cropData = null;
            }

            async openEditor(mediaData) {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = mediaData.blob;
                    img.onload = () => {
                        this.originalImage = img;
                        this.createEditorUI(mediaData, resolve);
                    };
                });
            }

            createEditorUI(mediaData, resolve) {
                const editorBody = `
                    <div class="editor-canvas-container">
                        <canvas id="editorCanvas"></canvas>
                    </div>
                    <div class="editor-controls">
                        <div class="form-group">
                            <label class="form-label">Text Overlay</label>
                            <input type="text" id="textInput" class="form-input" placeholder="Enter text">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Text Color</label>
                            <input type="color" id="textColorInput" class="form-input" value="#ffffff" style="height: 2.5rem;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Font Size</label>
                            <input type="number" id="fontSizeInput" class="form-input" value="20" min="10" max="100">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Position Y</label>
                            <input type="number" id="posYInput" class="form-input" value="50" min="0" max="100">
                        </div>
                    </div>
                `;

                modalManager.show({
                    title: 'Edit Image',
                    body: editorBody,
                    buttons: [
                        {
                            text: 'Add Text',
                            class: 'btn-primary btn-sm',
                            onClick: () => this.addTextOverlay(),
                            close: false
                        },
                        {
                            text: 'Rotate 90°',
                            class: 'btn-primary btn-sm',
                            onClick: () => this.rotateImage(),
                            close: false
                        },
                        {
                            text: 'Save Version',
                            class: 'btn-success btn-sm',
                            onClick: () => this.saveVersion(mediaData, resolve),
                            close: false
                        },
                        {
                            text: 'Cancel',
                            class: 'btn-secondary btn-sm',
                            close: true
                        }
                    ]
                });

                this.initCanvas();
            }

            initCanvas() {
                setTimeout(() => {
                    this.canvas = document.getElementById('editorCanvas');
                    if (!this.canvas) return;

                    this.ctx = this.canvas.getContext('2d');
                    this.canvas.width = this.originalImage.width;
                    this.canvas.height = this.originalImage.height;
                    this.redraw();
                }, 100);
            }

            redraw() {
                if (!this.canvas || !this.ctx) return;

                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(this.originalImage, 0, 0);

                // Draw text overlays
                this.textOverlays.forEach(overlay => {
                    this.ctx.font = `${overlay.fontSize}px Arial`;
                    this.ctx.fillStyle = overlay.color;
                    this.ctx.textAlign = 'center';
                    const y = (overlay.posY / 100) * this.canvas.height;
                    this.ctx.fillText(overlay.text, this.canvas.width / 2, y);
                });
            }

            addTextOverlay() {
                const text = document.getElementById('textInput')?.value || '';
                if (!text.trim()) return;

                const overlay = {
                    text,
                    color: document.getElementById('textColorInput')?.value || '#ffffff',
                    fontSize: parseInt(document.getElementById('fontSizeInput')?.value) || 20,
                    posY: parseInt(document.getElementById('posYInput')?.value) || 50
                };

                this.textOverlays.push(overlay);
                this.redraw();
                document.getElementById('textInput').value = '';
            }

            rotateImage() {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.originalImage.height;
                tempCanvas.height = this.originalImage.width;

                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
                tempCtx.rotate((90 * Math.PI) / 180);
                tempCtx.drawImage(this.originalImage, -this.originalImage.width / 2, -this.originalImage.height / 2);

                this.originalImage = new Image();
                this.originalImage.src = tempCanvas.toDataURL();
                this.originalImage.onload = () => this.initCanvas();
            }

            async saveVersion(mediaData, resolve) {
                if (!this.canvas) return;

                try {
                    const versionBlob = this.canvas.toDataURL();
                    const versionData = {
                        id: Utils.generateId(),
                        originalId: mediaData.id,
                        blob: versionBlob,
                        createdAt: Date.now(),
                        edits: {
                            textOverlays: [...this.textOverlays]
                        }
                    };

                    await db.addVersion(versionData);
                    
                    modalManager.show({
                        title: 'Success',
                        body: 'Edited version saved successfully!',
                        buttons: [{ text: 'OK', class: 'btn-success' }]
                    });

                    resolve(versionData);
                    modalManager.close();
                } catch (error) {
                    console.error('Error saving version:', error);
                }
            }
        }

        /* ===== VIDEO PLAYER MANAGER ===== */
        class VideoPlayerManager {
            constructor() {
                this.currentVideo = null;
                this.isPlaying = false;
            }

            createCustomPlayer(videoBlob, mediaData) {
                const container = document.createElement('div');
                container.className = 'custom-video-player';

                const video = document.createElement('video');
                video.src = videoBlob;
                video.controls = false;
                video.style.maxWidth = '100%';
                video.style.maxHeight = '100%';
                video.style.display = 'block';

                const controls = document.createElement('div');
                controls.className = 'video-controls';

                // Play button
                const playBtn = document.createElement('button');
                playBtn.className = 'video-btn';
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                playBtn.onclick = () => this.togglePlay(video, playBtn);

                // Progress bar
                const progress = document.createElement('div');
                progress.className = 'video-progress';
                const progressBar = document.createElement('div');
                progressBar.className = 'video-progress-bar';
                progress.appendChild(progressBar);

                video.addEventListener('timeupdate', () => {
                    const percent = (video.currentTime / video.duration) * 100;
                    progressBar.style.width = percent + '%';
                });

                progress.addEventListener('click', (e) => {
                    const rect = progress.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    video.currentTime = percent * video.duration;
                });

                // Mute button
                const muteBtn = document.createElement('button');
                muteBtn.className = 'video-btn';
                muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                muteBtn.onclick = () => this.toggleMute(video, muteBtn);

                // Time display
                const timeDisplay = document.createElement('div');
                timeDisplay.className = 'video-time';
                timeDisplay.textContent = '0:00 / 0:00';

                video.addEventListener('loadedmetadata', () => {
                    timeDisplay.textContent = `0:00 / ${this.formatTime(video.duration)}`;
                });

                video.addEventListener('timeupdate', () => {
                    timeDisplay.textContent = `${this.formatTime(video.currentTime)} / ${this.formatTime(video.duration)}`;
                });

                // Speed selector
                const speedSelector = document.createElement('select');
                speedSelector.className = 'speed-selector';
                [0.5, 0.75, 1, 1.25, 1.5, 2].forEach(speed => {
                    const option = document.createElement('option');
                    option.value = speed;
                    option.textContent = speed === 1 ? 'Normal' : speed + 'x';
                    if (speed === 1) option.selected = true;
                    speedSelector.appendChild(option);
                });

                speedSelector.addEventListener('change', (e) => {
                    video.playbackRate = parseFloat(e.target.value);
                    db.saveSetting(`video-speed-${mediaData.id}`, e.target.value);
                });

                // Restore saved speed
                db.getSetting(`video-speed-${mediaData.id}`).then(speed => {
                    if (speed) {
                        speedSelector.value = speed;
                        video.playbackRate = parseFloat(speed);
                    }
                });

                controls.appendChild(playBtn);
                controls.appendChild(progress);
                controls.appendChild(muteBtn);
                controls.appendChild(timeDisplay);
                controls.appendChild(speedSelector);

                container.appendChild(video);
                container.appendChild(controls);

                video.addEventListener('play', () => {
                    this.isPlaying = true;
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                });

                video.addEventListener('pause', () => {
                    this.isPlaying = false;
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                });

                this.currentVideo = video;
                return container;
            }

            togglePlay(video, btn) {
                if (this.isPlaying) {
                    video.pause();
                } else {
                    video.play();
                }
            }

            toggleMute(video, btn) {
                video.muted = !video.muted;
                btn.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
            }

            formatTime(seconds) {
                if (!seconds || isNaN(seconds)) return '0:00';
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${mins}:${String(secs).padStart(2, '0')}`;
            }
        }

        /* ===== GALLERY MANAGER ===== */
        class GalleryManager {
            constructor() {
                this.currentFilter = 'all';
                this.selectionMode = false;
                this.selectedItems = new Set();
                this.currentLightboxIndex = 0;
                this.currentMediaList = [];
                this.imageEditor = new ImageEditor();
                this.videoPlayer = new VideoPlayerManager();

                this.setupEventListeners();
            }

            setupEventListeners() {
                // Upload
                const uploadInput = document.getElementById('uploadInput');
                uploadInput.addEventListener('change', (e) => this.handleFileUpload(e));

                // Filters
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
                });

                // Selection mode
                document.getElementById('selectionToggleBtn').addEventListener('click', () => {
                    this.toggleSelectionMode();
                });

                // Lightbox controls
                document.getElementById('lightboxClose').addEventListener('click', () => this.closeLightbox());
                document.getElementById('lightboxPrev').addEventListener('click', () => this.previousMedia());
                document.getElementById('lightboxNext').addEventListener('click', () => this.nextMedia());

                // Modal close
                document.getElementById('modalClose').addEventListener('click', () => modalManager.close());

                // Batch operations
                document.getElementById('deleteSelectedBtn').addEventListener('click', () => this.deleteSelected());
                document.getElementById('shareSelectedBtn').addEventListener('click', () => this.shareSelected());

                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    if (document.getElementById('lightboxOverlay').classList.contains('active')) {
                        if (e.key === 'ArrowLeft') this.previousMedia();
                        if (e.key === 'ArrowRight') this.nextMedia();
                        if (e.key === 'Escape') this.closeLightbox();
                    }
                });
            }

            async handleFileUpload(event) {
                const files = Array.from(event.target.files);
                const folderDate = Utils.getFolderDate();

                for (const file of files) {
                    try {
                        const blob = await Utils.fileToBase64(file);
                        const mediaData = {
                            id: Utils.generateId(),
                            name: file.name,
                            blob,
                            type: file.type,
                            size: file.size,
                            uploadDate: Date.now(),
                            folderDate,
                            isFavorite: false,
                            versions: []
                        };

                        await db.addMedia(mediaData);
                    } catch (error) {
                        console.error('Error uploading file:', error);
                    }
                }

                event.target.value = '';
                await this.render();
            }

            async setFilter(filter) {
                this.currentFilter = filter;
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.filter === filter);
                });
                await this.render();
            }

            toggleSelectionMode() {
                this.selectionMode = !this.selectionMode;
                this.selectedItems.clear();
                document.getElementById('selectionToggleBtn').classList.toggle('active', this.selectionMode);
                document.getElementById('fabContainer').style.display = this.selectionMode ? 'flex' : 'none';
                this.render();
            }

            async render() {
                const container = document.getElementById('galleryContainer');
                this.currentMediaList = await db.getMediaByFilter(this.currentFilter);

                if (this.currentMediaList.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-photo-video"></i>
                            <h2>No media found</h2>
                            <p>${this.currentFilter === 'all' ? 'Upload images or videos to get started' : 'No media in this category'}</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = this.currentMediaList.map((media, idx) => `
                    <div class="gallery-item ${this.selectionMode && this.selectedItems.has(media.id) ? 'selected' : ''}" 
                         data-media-id="${media.id}" 
                         data-index="${idx}">
                        ${media.blob.startsWith('data:image') ? `
                            <img src="${media.blob}" alt="${media.name}" class="gallery-item-media">
                        ` : `
                            <video src="${media.blob}" class="gallery-item-media" style="background: #000;"></video>
                        `}
                        
                        <div class="gallery-item-badge">
                            ${media.type.startsWith('image') ? '<i class="fas fa-image"></i> Image' : '<i class="fas fa-video"></i> Video'}
                        </div>

                        ${media.isFavorite ? `
                            <div class="gallery-item-favorite">
                                <i class="fas fa-heart"></i>
                            </div>
                        ` : ''}

                        ${this.selectionMode ? `
                            <div class="gallery-checkmark">
                                <i class="fas fa-check"></i>
                            </div>
                        ` : ''}

                        <div class="gallery-item-overlay">
                            ${this.selectionMode ? `
                                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); gallery.toggleItemSelection('${media.id}')">
                                    ${this.selectedItems.has(media.id) ? 'Deselect' : 'Select'}
                                </button>
                            ` : `
                                <button class="btn btn-primary btn-sm" onclick="gallery.openLightbox(${idx})">
                                    <i class="fas fa-expand"></i> View
                                </button>
                            `}
                        </div>
                    </div>
                `).join('');

                // Add selection listeners
                document.querySelectorAll('.gallery-item').forEach(item => {
                        item.addEventListener('click', (e) => {
                            const mediaId = item.dataset.mediaId;
                            const index = parseInt(item.dataset.index);

                            if (this.selectionMode) {
                                // Clicking ANYWHERE on the card toggles the tick!
                                this.toggleItemSelection(mediaId);
                            } else {
                                this.openLightbox(index);
                            }
                        });
                    });

                // Add click listeners for non-selection mode
                if (!this.selectionMode) {
                    document.querySelectorAll('.gallery-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const index = parseInt(item.dataset.index);
                            this.openLightbox(index);
                        });
                    });
                }
            }

            toggleItemSelection(mediaId) {
                if (this.selectedItems.has(mediaId)) {
                    this.selectedItems.delete(mediaId);
                } else {
                    this.selectedItems.add(mediaId);
                }
                this.render();
            }

            async openLightbox(index) {
                if (index < 0 || index >= this.currentMediaList.length) return;

                this.currentLightboxIndex = index;
                const media = this.currentMediaList[index];

                const overlay = document.getElementById('lightboxOverlay');
                const mediaContainer = document.getElementById('lightboxMedia');
                const titleEl = document.getElementById('lightboxTitle');
                const footer = document.getElementById('lightboxFooter');

                titleEl.textContent = media.name;

                // Clear media container
                mediaContainer.innerHTML = '';

                // Add media
                if (media.type.startsWith('image')) {
                    const img = document.createElement('img');
                    img.src = media.blob;
                    mediaContainer.appendChild(img);
                } else {
                    const player = this.videoPlayer.createCustomPlayer(media.blob, media);
                    mediaContainer.appendChild(player);
                }

                // Add footer buttons
                footer.innerHTML = `
                    <button class="btn btn-primary btn-sm" onclick="gallery.editImage()">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="gallery.toggleFavorite()">
                        <i class="fas fa-heart"></i> ${media.isFavorite ? 'Unfavorite' : 'Favorite'}
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="gallery.showDetails()">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="gallery.shareMedia()">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="gallery.deleteMedia()">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                `;

                overlay.classList.add('active');
            }

            closeLightbox() {
                document.getElementById('lightboxOverlay').classList.remove('active');
            }

            previousMedia() {
                this.currentLightboxIndex = (this.currentLightboxIndex - 1 + this.currentMediaList.length) % this.currentMediaList.length;
                this.openLightbox(this.currentLightboxIndex);
            }

            nextMedia() {
                this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.currentMediaList.length;
                this.openLightbox(this.currentLightboxIndex);
            }

            async editImage() {
                const media = this.currentMediaList[this.currentLightboxIndex];
                if (!media.type.startsWith('image')) {
                    alert('Only images can be edited');
                    return;
                }

                await this.imageEditor.openEditor(media);
            }

            async toggleFavorite() {
                const media = this.currentMediaList[this.currentLightboxIndex];
                media.isFavorite = !media.isFavorite;
                await db.updateMedia(media);
                await this.openLightbox(this.currentLightboxIndex);
            }

            async showDetails() {
                const media = this.currentMediaList[this.currentLightboxIndex];
                const versions = await db.getVersions(media.id);

                let detailsBody = `
                    <div class="mb-2">
                        <strong>File Name:</strong> ${media.name}
                    </div>
                    <div class="mb-2">
                        <strong>File Size:</strong> ${Utils.formatFileSize(media.size)}
                    </div>
                    <div class="mb-2">
                        <strong>Upload Date:</strong> ${Utils.getFormattedDate(media.uploadDate)}
                    </div>
                    <div class="mb-2">
                        <strong>File Type:</strong> ${media.type}
                    </div>
                    <div class="mb-2">
                        <strong>Folder:</strong> Gallery-${media.folderDate}
                    </div>
                `;

                if (versions.length > 0) {
                    detailsBody += `
                        <div class="mb-2">
                            <strong>Edited Versions:</strong>
                            <ul style="margin-top: 0.5rem; margin-left: 1rem;">
                                ${versions.map(v => `
                                    <li style="margin-bottom: 0.5rem;">
                                        ${Utils.getFormattedDate(v.createdAt)}
                                        <button class="btn btn-sm btn-secondary" style="margin-left: 0.5rem;" onclick="gallery.deleteVersion('${v.id}')">
                                            Delete
                                        </button>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `;
                }

                modalManager.show({
                    title: 'Media Details',
                    body: detailsBody,
                    buttons: [{ text: 'Close', class: 'btn-primary' }]
                });
            }

            async shareMedia() {
                const media = this.currentMediaList[this.currentLightboxIndex];
                const blob = Utils.base64ToBlob(media.blob, media.type);
                const file = new File([blob], media.name, { type: media.type });

                if (navigator.share) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: media.name,
                            text: `Check out this media: ${media.name}`
                        });
                    } catch (error) {
                        if (error.name !== 'AbortError') {
                            console.error('Error sharing:', error);
                        }
                    }
                } else {
                    modalManager.show({
                        title: 'Share Not Supported',
                        body: 'Your browser does not support the Web Share API',
                        buttons: [{ text: 'OK', class: 'btn-primary' }]
                    });
                }
            }

            async deleteMedia() {
                const media = this.currentMediaList[this.currentLightboxIndex];

                modalManager.show({
                    title: 'Delete Media',
                    body: `Are you sure you want to delete "${media.name}"? This action cannot be undone.`,
                    buttons: [
                        {
                            text: 'Cancel',
                            class: 'btn-secondary',
                            close: true
                        },
                        {
                            text: 'Delete',
                            class: 'btn-danger',
                            onClick: async () => {
                                await db.deleteMedia(media.id);
                                
                                // Delete all versions
                                const versions = await db.getVersions(media.id);
                                for (const version of versions) {
                                    await db.deleteVersion(version.id);
                                }

                                this.closeLightbox();
                                await this.render();
                            }
                        }
                    ]
                });
            }

            async deleteVersion(versionId) {
                modalManager.show({
                    title: 'Delete Version',
                    body: 'Are you sure you want to delete this version?',
                    buttons: [
                        {
                            text: 'Cancel',
                            class: 'btn-secondary',
                            close: true
                        },
                        {
                            text: 'Delete',
                            class: 'btn-danger',
                            onClick: async () => {
                                await db.deleteVersion(versionId);
                                await this.showDetails();
                            }
                        }
                    ]
                });
            }

            async deleteSelected() {
                if (this.selectedItems.size === 0) return;

                modalManager.show({
                    title: 'Delete Selected',
                    body: `Are you sure you want to delete ${this.selectedItems.size} item(s)? This action cannot be undone.`,
                    buttons: [
                        {
                            text: 'Cancel',
                            class: 'btn-secondary',
                            close: true
                        },
                        {
                            text: 'Delete',
                            class: 'btn-danger',
                            onClick: async () => {
                                for (const mediaId of this.selectedItems) {
                                    await db.deleteMedia(mediaId);
                                    const versions = await db.getVersions(mediaId);
                                    for (const version of versions) {
                                        await db.deleteVersion(version.id);
                                    }
                                }
                                this.selectedItems.clear();
                                await this.render();
                                this.toggleSelectionMode();
                            }
                        }
                    ]
                });
            }

            async shareSelected() {
                if (this.selectedItems.size === 0) return;

                const mediaList = this.currentMediaList.filter(m => this.selectedItems.has(m.id));
                const files = [];

                for (const media of mediaList) {
                    const blob = Utils.base64ToBlob(media.blob, media.type);
                    const file = new File([blob], media.name, { type: media.type });
                    files.push(file);
                }

                if (navigator.share) {
                    try {
                        await navigator.share({
                            files,
                            title: `${this.selectedItems.size} Media Items`,
                            text: 'Check out these media files'
                        });
                    } catch (error) {
                        if (error.name !== 'AbortError') {
                            console.error('Error sharing:', error);
                        }
                    }
                } else {
                    modalManager.show({
                        title: 'Share Not Supported',
                        body: 'Your browser does not support the Web Share API',
                        buttons: [{ text: 'OK', class: 'btn-primary' }]
                    });
                }
            }
        }

        /* ===== INITIALIZATION ===== */
        let db;
        let modalManager;
        let gallery;

        async function init() {
            try {
                db = new DatabaseManager();
                await db.init();

                modalManager = new ModalManager();
                gallery = new GalleryManager();

                await gallery.render();
            } catch (error) {
                console.error('Initialization error:', error);
            }
        }

        // Start app
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }