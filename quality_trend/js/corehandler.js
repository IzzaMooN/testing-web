// corehandler.js - Regular Script Version with IIFE
// Tanpa plugin-api.js, menggunakan fetch langsung

(function() {
    console.log('=== COREHANDLER.JS LOADING (Regular Script - No Plugin API) ===');
    
    // Global variables
    let currentPlant = null;
    let currentStartDate = null;
    let currentEndDate = null;
    let allTagsData = {};
    let customMode = false;
    let availableTagsList = [];
    let selectedTags = [];
    let customStartDate = null;
    let customEndDate = null;
    let searchTimeout = null;
    let currentUser = null;
    let userPreferences = {};
    let currentTemplates = [];
    let editingTemplateId = null;
    let currentSettingPlant = null;
    
    const DEBUG = true; // Set to false in production
    
    // Base URL untuk API
    let API_BASE_URL = '';
    
    // ========== API CONFIGURATION ==========
    function getApiBaseUrl() {
        if (API_BASE_URL) return API_BASE_URL;
        
        // Coba gunakan DataSelector base URL jika ada
        if (window.DataSelector && window.DataSelector.getBaseUrl) {
            API_BASE_URL = window.DataSelector.getBaseUrl() + 'php/';
            console.log('📍 API Base URL from DataSelector:', API_BASE_URL);
            return API_BASE_URL;
        }
        
        // Fallback: cari dari script path
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            if (script.src && script.src.includes('corehandler.js')) {
                const scriptPath = script.src;
                const url = new URL(scriptPath);
                const pathParts = url.pathname.split('/');
                
                // Cari folder moduls/quality_trend/
                for (let i = 0; i < pathParts.length; i++) {
                    if (pathParts[i] === 'moduls' && i + 1 < pathParts.length && pathParts[i + 1] === 'quality_trend') {
                        const basePath = pathParts.slice(0, i + 2).join('/');
                        API_BASE_URL = url.origin + basePath + '/php/';
                        console.log('📍 API Base URL detected:', API_BASE_URL);
                        return API_BASE_URL;
                    }
                }
            }
        }
        
        // Fallback terakhir
        API_BASE_URL = 'php/';
        console.log('📍 API Base URL fallback:', API_BASE_URL);
        return API_BASE_URL;
    }
    
    // ========== API FUNCTIONS ==========
    // GUNAKAN DataSelector.js yang terpisah
    const DataSelector = {
        // Wrapper untuk DataSelector.js
        async callAPI(endpoint, params = {}, method = 'GET', body = null) {
            console.log(`📡 DataSelector.callAPI wrapper: ${method} ${endpoint}`);
            
            // Pastikan DataSelector.js sudah di-load
            if (!window.DataSelector || !window.DataSelector.callAPI) {
                console.error('❌ DataSelector.js not available');
                
                // Fallback: langsung fetch
                try {
                    let url = endpoint;
                    const baseUrl = getApiBaseUrl();
                    
                    // Jika endpoint bukan URL lengkap, tambahkan base URL
                    if (!endpoint.startsWith('http') && !endpoint.startsWith('/')) {
                        url = baseUrl + endpoint;
                    }
                    
                    // Build query string untuk GET
                    if (method === 'GET' && params && Object.keys(params).length > 0) {
                        const queryString = new URLSearchParams(params).toString();
                        url += (url.includes('?') ? '&' : '?') + queryString;
                    }
                    
                    // Tambahkan cache buster
                    url += (url.includes('?') ? '&' : '?') + '_cb=' + Date.now();
                    
                    console.log(`📡 Fallback fetch: ${method} ${url}`);
                    
                    const options = {
                        method: method,
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    };
                    
                    // Tambahkan body untuk POST/PUT
                    if (method === 'POST' || method === 'PUT') {
                        options.headers['Content-Type'] = 'application/json';
                        if (body) {
                            options.body = JSON.stringify(body);
                        }
                    }
                    
                    const response = await fetch(url, options);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    
                    return {
                        success: true,
                        data: data,
                        status: data.status || 'success'
                    };
                    
                } catch (error) {
                    console.error(`❌ Fallback fetch error for ${endpoint}:`, error);
                    return {
                        success: false,
                        error: error.message,
                        message: `Failed to fetch from ${endpoint}`
                    };
                }
            }
            
            try {
                return await window.DataSelector.callAPI(endpoint, params, method, body);
            } catch (error) {
                console.error('❌ DataSelector.callAPI error:', error);
                return {
                    success: false,
                    error: error.message,
                    message: `Failed to call API via DataSelector`
                };
            }
        },
        
        async fetchPanelDataAuto(plant, startDate, endDate) {
            if (window.DataSelector && window.DataSelector.fetchPanelData) {
                return await window.DataSelector.fetchPanelData(plant, startDate, endDate);
            }
            
            // Fallback
            return await this.callAPI('get_panel_data.php', {
                plant: plant,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                panel_id: 'auto'
            }, 'GET');
        },
        
        async fetchMultipleTagValues(tags, startDate, endDate) {
            if (window.DataSelector && window.DataSelector.fetchMultipleTagValues) {
                return await window.DataSelector.fetchMultipleTagValues(tags, startDate, endDate);
            }
            
            // Fallback
            return await this.callAPI('get_multiple_tag_values.php', null, 'POST', {
                tags: tags,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                interval: 'auto'
            });
        },
        
        async fetchTags() {
            if (window.DataSelector && window.DataSelector.fetchTags) {
                return await window.DataSelector.fetchTags();
            }
            
            return await this.callAPI('get_tagnames.php', {}, 'GET');
        },
        
        async fetchPlants() {
            if (window.DataSelector && window.DataSelector.fetchPlants) {
                return await window.DataSelector.fetchPlants();
            }
            
            return await this.callAPI('get_plants.php', {}, 'GET');
        },
        
        async saveTemplate(action, data) {
            if (window.DataSelector && window.DataSelector.saveTemplate) {
                return await window.DataSelector.saveTemplate(action, data);
            }
            
            const body = {
                action: action,
                ...data
            };
            
            return await this.callAPI('template_manager.php', null, 'POST', body);
        },
        
        async getTemplate(templateId) {
            if (window.DataSelector && window.DataSelector.getTemplate) {
                return await window.DataSelector.getTemplate(templateId);
            }
            
            return await this.callAPI('template_manager.php', { 
                action: 'read', 
                id: templateId 
            }, 'GET');
        },
        
        async deleteTemplate(templateId) {
            if (window.DataSelector && window.DataSelector.deleteTemplate) {
                // TAMBAHKAN USERNAME DI SINI
                const username = currentUser?.username || 
                                 window.currentUser?.username || 
                                 this.getStandardizedUsername?.();
                
                return await window.DataSelector.deleteTemplate(templateId, username);
            }
            
            // Fallback - juga tambahkan username
            const username = currentUser?.username || this.getStandardizedUsername?.();
            return await this.callAPI('template_manager.php', { 
                action: 'delete', 
                id: templateId,
                username: username  // TAMBAHKAN DI SINI JUGA
            }, 'POST');
        },
        
        async listTemplates(username) {
            if (window.DataSelector && window.DataSelector.listTemplates) {
                return await window.DataSelector.listTemplates(username);
            }
            
            return await this.callAPI('template_manager.php', { 
                action: 'list',
                username: username 
            }, 'GET');
        }
    };

    // Debug function untuk melihat response
    function debugResponse(endpoint, result) {
        console.group(`🔍 ${endpoint} Response Structure`);
        console.log('Result:', result);
        console.log('Result.data:', result.data);
        console.log('Type of result.data:', typeof result.data);
        console.log('Is array?', Array.isArray(result.data));
        console.log('Keys in result.data:', result.data ? Object.keys(result.data) : 'null');
        console.groupEnd();
    }
    
    // ========== AUTHENTICATION FUNCTIONS ==========
    async function checkAuthStatus() {
        try {
            const result = await DataSelector.callAPI('auth-for-trend.php', { action: 'check_session' }, 'GET');
            
            console.log('🔍 checkAuthStatus result:', result);
            
            if (result.success && result.data && result.data.user) {
                currentUser = result.data.user;
                console.log('✅ User authenticated:', currentUser.username);
                removeAuthWarning();
                return true;
            } else {
                console.log('❌ Session invalid, showing warning banner');
                showAuthWarningBanner();
                return false;
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            showAuthWarningBanner();
            return false;
        }
    }
    
    // Tampilkan warning banner
    function showAuthWarningBanner() {
        removeAuthWarning();
        
        const warningHTML = `
            <div class="auth-warning-banner" id="auth-warning-banner">
                <div class="warning-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Anda harus login untuk mengakses fitur ini</span>
                </div>
            </div>
        `;
        
        const header = document.querySelector('header');
        if (header) {
            header.insertAdjacentHTML('beforebegin', warningHTML);
        } else {
            document.body.insertAdjacentHTML('afterbegin', warningHTML);
        }
    }
    
    // Hapus warning banner
    function removeAuthWarning() {
        const banner = document.getElementById('auth-warning-banner');
        if (banner) banner.remove();
    }

    function getCurrentUsername() {
        try {
            // Coba dari berbagai sumber
            if (currentUser && currentUser.username) {
                return currentUser.username;
            }
            
            if (window.currentUser && window.currentUser.username) {
                return window.currentUser.username;
            }
            
            if (window.userData && window.userData.username) {
                return window.userData.username;
            }
            
            if (window.localStorage) {
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    return user.username;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error getting username:', error);
            return null;
        }
    }
    
    // ========== MAIN CLASS ==========
    class QualityTrendCoreHandler {
        constructor() {
            this.initialized = false;
            this.draggedItem = null;
            this.lastDragOverElement = null;
            this.lastDragOverY = null; // TAMBAHKAN INI
            this.dragStartTime = null;
            this.init();
        }
        
        init() {
            console.log('🔧 QualityTrendCoreHandler initializing...');
            
            // Tunggu DOM siap
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.initializeWithDelay();
                });
            } else {
                this.initializeWithDelay();
            }
        }
        
        initializeWithDelay() {
            // Delay untuk memastikan DOM siap
            setTimeout(() => {
                this.initializeComponents();
                this.setupEventListeners();
                
                this.initialized = true;
                console.log('✅ QualityTrendCoreHandler initialized');
                
                // 🔥 PERBAIKAN: SELALU LOAD TEMPLATES PADA INIT
                if (this.isUserLoggedIn()) {
                    console.log('📋 Loading user templates on initialization...');
                    this.loadUserTemplates();
                } else {
                    console.log('ℹ️ User not logged in, skipping template load');
                }
                
                // Dispatch event bahwa handler ready
                window.dispatchEvent(new CustomEvent('qualityTrendHandlerReady', {
                    detail: {
                        handler: this,
                        timestamp: Date.now()
                    }
                }));
                
                // Cek auth status
                checkAuthStatus().then((isAuthenticated) => {
                    if (isAuthenticated && currentUser) {
                        console.log('✅ User re-authenticated:', currentUser.username);
                        // Templates sudah di-load di atas
                    } else {
                        console.log('ℹ️ User not authenticated, prompting login');
                        showAuthWarningBanner();
                    }
                });
            }, 300);
        }
        
        initializeComponents() {
            this.initializeDatePicker();
            this.loadAvailableTags();
            
            // Cek auth status
            checkAuthStatus().then((isAuthenticated) => {
                if (isAuthenticated && currentUser) {
                    console.log('✅ User authenticated:', currentUser.username);
                    this.loadUserTemplates();
                }
            });
            
            if (DEBUG) {
                const debugInfo = document.getElementById('debug-info');
                if (debugInfo) {
                    debugInfo.style.display = 'none';
                }
            }
        }
        
        setupEventListeners() {
            console.log('🔗 Setting up event listeners in corehandler...');
    
            // 🔥 PERBAIKAN: Setup event listeners untuk tanggal
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            
            if (startDateInput) {
                console.log('🔗 Setting up start date listener');
                startDateInput.addEventListener('change', () => {
                    console.log('📅 Start date changed (corehandler)');
                    this.autoUpdateDates();
                });
                startDateInput.addEventListener('input', () => {
                    console.log('⌛ Start date input (corehandler)');
                    clearTimeout(this.searchTimeout);
                    this.searchTimeout = setTimeout(() => {
                        console.log('📅 Auto-updating dates (debounced)');
                        this.autoUpdateDates();
                    }, 800);
                });
            }
            
            if (endDateInput) {
                console.log('🔗 Setting up end date listener');
                endDateInput.addEventListener('change', () => {
                    console.log('📅 End date changed (corehandler)');
                    this.autoUpdateDates();
                });
                endDateInput.addEventListener('input', () => {
                    console.log('⌛ End date input (corehandler)');
                    clearTimeout(this.searchTimeout);
                    this.searchTimeout = setTimeout(() => {
                        console.log('📅 Auto-updating dates (debounced)');
                        this.autoUpdateDates();
                    }, 800);
                });
            }
            
            // Tag search (existing)
            const tagSearchInput = document.getElementById('tag-search');
            if (tagSearchInput) {
                tagSearchInput.addEventListener('input', () => {
                    clearTimeout(this.searchTimeout);
                    this.searchTimeout = setTimeout(() => {
                        this.displayAvailableTags();
                    }, 300);
                });
            }
            
            // Close button untuk custom selector
            const closeBtn = document.querySelector('.close-custom-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideCustomSelector();
                });
            }
            
            // Close custom selector ketika klik di luar
            document.addEventListener('click', (event) => {
                const customSelector = document.getElementById('custom-selector');
                const customContent = document.querySelector('.custom-selector.overlay-mode .custom-content');
                
                if (customSelector && customSelector.classList.contains('overlay-mode') && 
                    customContent && 
                    !customContent.contains(event.target) &&
                    event.target !== document.querySelector('.dropdown-item[onclick*="showTagSettings"]')) {
                    this.hideCustomSelector();
                }
            });
            
        }
        
        // ========== DATE MANAGEMENT ==========
        initializeDatePicker() {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            
            if (startDateInput) {
                startDateInput.valueAsDate = startDate;
            }
            
            if (endDateInput) {
                endDateInput.valueAsDate = endDate;
            }

            currentStartDate = startDate;
            currentEndDate = endDate;
        }
        
        autoUpdateDates() {
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            
            if (!startDateInput || !endDateInput) return;
            
            // Tampilkan loading indicator
            [startDateInput, endDateInput].forEach(input => {
                input.style.backgroundImage = 'url("data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%236366f1\" stroke-width=\"2\"><path d=\"M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83\"/></svg>")';
                input.style.backgroundRepeat = 'no-repeat';
                input.style.backgroundPosition = 'right 8px center';
                input.style.backgroundSize = '16px';
            });

            if (!startDateInput.value || !endDateInput.value) {
                [startDateInput, endDateInput].forEach(input => {
                    input.style.backgroundImage = '';
                });
                return;
            }

            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.warn('⚠️ Invalid date format');
                [startDateInput, endDateInput].forEach(input => {
                    input.style.backgroundImage = '';
                });
                return;
            }

            if (startDate > endDate) {
                this.showError('Tanggal mulai tidak boleh setelah tanggal akhir');
                [startDateInput, endDateInput].forEach(input => {
                    input.style.backgroundImage = '';
                });
                return;
            }

            currentStartDate = startDate;
            currentEndDate = endDate;

            console.log('📅 Dates auto-updated:', {
                startDate: currentStartDate,
                endDate: currentEndDate
            });

            setTimeout(() => {
                [startDateInput, endDateInput].forEach(input => {
                    input.style.backgroundImage = '';
                });
            }, 500);
        }
        
        // ========== PLANT MANAGEMENT ==========
        selectPlant(plant) {
            this.showDebug(`Plant selected: ${plant}`);
            
            // Update UI selection
            document.querySelectorAll('.plant-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            if (event && event.currentTarget) {
                event.currentTarget.classList.add('active');
            }
            
            currentPlant = plant;
            
            // Clear previous data
            const tagSections = document.getElementById('tag-sections');
            if (tagSections) {
                tagSections.innerHTML = '';
            }
            this.hideError();
            
            this.showEmptyStateWithSettingsPrompt();
        }
        
        // ========== DATA LOADING ==========
        async loadPlantData() {
            if (!currentPlant) return;

            this.showLoading();
            this.hideEmptyState();
            this.hideError();

            try {
                this.showDebug(`Loading data for plant: ${currentPlant}, from: ${currentStartDate}, to: ${currentEndDate}`);
                
                const result = await DataSelector.fetchPanelDataAuto(
                    currentPlant, 
                    currentStartDate, 
                    currentEndDate
                );

                this.showDebug('Response fetchPanelDataAuto:', result);

                if (result.success) {
                    allTagsData = result.data?.data || result.data || {};
                    this.showDebug('Processed tags data:', allTagsData);
                    this.displayTagSections();
                } else {
                    this.showError('Gagal memuat data plant: ' + (result.message || 'Unknown error'));
                    this.showEmptyState();
                }
            } catch (error) {
                this.showError('Error loading plant data: ' + error.message);
                this.showEmptyState();
            } finally {
                this.hideLoading();
            }
        }
        
        // ========== TAG MANAGEMENT ==========
        async loadAvailableTags(plant = null) {
            try {
                this.showDebug('🚀 Loading available tags...');
                
                const result = await DataSelector.fetchTags();
                this.showDebug('📦 Available tags response:', result);
                
                if (result.success) {
                    let allTags = result.data?.data || result.data || result.tags || result.tagList || [];
                    
                    // Filter tags berdasarkan plant jika plant diberikan
                    if (plant) {
                        allTags = allTags.filter(tag => {
                            const tagPlant = tag.plant || tag.Plant || '';
                            return tagPlant === plant;
                        });
                        this.showDebug(`✅ Filtered tags for plant ${plant}:`, allTags.length);
                    }
                    
                    availableTagsList = allTags;
                    
                    if (availableTagsList.length === 0) {
                        this.showDebug('⚠️ No tags from backend');
                        availableTagsList = this.getFallbackTags();
                    }
                    
                    this.showDebug(`✅ Loaded ${availableTagsList.length} tags`);
                    this.displayAvailableTags();
                } else {
                    this.showError('❌ Gagal memuat daftar tag');
                    availableTagsList = this.getFallbackTags();
                    this.displayAvailableTags();
                }
            } catch (error) {
                this.showError('💥 Error loading tags');
                availableTagsList = this.getFallbackTags();
                this.displayAvailableTags();
            }
        }
        
        getFallbackTags() {
            return [{
                tagname: "Tag Gagal Dimuat",
                description: "Silakan coba lagi atau periksa koneksi",
                plant: "Unknown",
                lsl: null,
                usl: null
            }];
        }
        
        displayAvailableTags() {
            const availableContainer = document.getElementById('available-tags-list');
            if (!availableContainer) return;
            
            const searchTerm = document.getElementById('tag-search')?.value.toLowerCase() || '';
            
            // JIKA BELUM ADA PLANT YANG DIPILIH, TAMPILKAN PESAN
            if (!currentSettingPlant) {
                availableContainer.innerHTML = `
                    <div class="empty-list-message">
                        <i class="fas fa-industry"></i>
                        <div>Pilih plant terlebih dahulu</div>
                        <small>Klik salah satu plant di atas untuk menampilkan tag</small>
                    </div>
                `;
                this.updatePickListCounts();
                return;
            }
            
            // Filter tags berdasarkan pencarian DAN plant yang dipilih
            let filteredTags = availableTagsList.filter(tag => {
                const tagPlant = tag.plant || tag.Plant || 'Unknown';
                return tagPlant === currentSettingPlant;
            });
            
            if (searchTerm) {
                filteredTags = filteredTags.filter(tag => {
                    const tagName = tag.tagname || tag.name || tag.tag_name || '';
                    const description = tag.description || tag.desc || tag.descr || '';
                    
                    return tagName.toLowerCase().includes(searchTerm) ||
                           description.toLowerCase().includes(searchTerm);
                });
            }
            
            // Tampilkan tags yang tersedia (belum dipilih) dengan info plant
            const availableTags = filteredTags.filter(tag => {
                const tagName = tag.tagname || tag.name || tag.tag_name || '';
                return !selectedTags.includes(tagName);
            });
            
            if (availableTags.length === 0) {
                availableContainer.innerHTML = `
                    <div class="empty-list-message">
                        <i class="fas fa-search"></i>
                        <div>Tidak ada tag yang sesuai</div>
                        ${currentSettingPlant ? `<small>Untuk plant ${currentSettingPlant}</small>` : ''}
                    </div>
                `;
            } else {
                availableContainer.innerHTML = availableTags.map(tag => {
                    const tagname = tag.tagname || tag.name || tag.tag_name || 'Unknown Tag';
                    const description = tag.description || tag.desc || tag.descr || 'No description';
                    const plant = tag.plant || tag.Plant || 'Unknown';
                    const lsl = tag.lsl || tag.lower_limit || tag.minLimit || tag.min_limit || null;
                    const usl = tag.usl || tag.upper_limit || tag.maxLimit || tag.max_limit || null;
                    
                    const isSelected = selectedTags.includes(tagname);
                    
                    return `
                        <div class="picklist-item" data-tag="${tagname}" data-plant="${plant}">
                            <div class="picklist-item-info">
                                <div class="picklist-tag-name">${tagname.replace('Root.LAB.', '')}</div>
                                <div class="picklist-tag-desc">( ${description} )</div>
                            </div>
                            <div class="picklist-checkbox">
                                <input type="checkbox" class="tag-checkbox" 
                                       ${isSelected ? 'checked' : ''} 
                                       onchange="window.toggleTagSelection('${tagname}', this.checked)">
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            this.updatePickListCounts();
        }

        
        updateSelectedTagsList() {
            const selectedContainer = document.getElementById('selected-tags-list');
            if (!selectedContainer) return;
            
            if (selectedTags.length === 0) {
                selectedContainer.innerHTML = `
                    <div class="empty-list-message">
                        <i class="fas fa-list"></i>
                        <div>Belum ada tag yang dipilih</div>
                        <small>Pilih tag dari daftar tersedia</small>
                    </div>
                `;
            } else {
                // PERBAIKAN: Simpan cache deskripsi untuk selected tags
                const selectedTagsData = selectedTags.map(tagName => {
                    // Cari tag di availableTagsList untuk mendapatkan deskripsi
                    const tag = availableTagsList.find(t => {
                        const availableTagName = t.tagname || t.name || t.tag_name;
                        return availableTagName === tagName;
                    });
                    
                    return {
                        name: tagName,
                        description: tag ? (tag.description || tag.desc || tag.descr || 'No description') : 'No description',
                        // Simpan juga data lengkap tag jika ada
                        fullTag: tag
                    };
                });
                
                selectedContainer.innerHTML = selectedTagsData.map(tagData => {
                    return `
                        <div class="picklist-item selected" data-tag="${tagData.name}" draggable="true">
                            <div class="picklist-item-info">
                                <div class="picklist-tag-name">${tagData.name.replace('Root.LAB.', '')}</div>
                                <div class="picklist-tag-desc">( ${tagData.description} )</div>
                            </div>
                            <div class="picklist-actions-selected">
                                <div class="drag-handle" title="Drag untuk mengubah urutan">
                                    <i class="fas fa-grip-vertical"></i>
                                </div>
                                <button class="picklist-remove-btn" onclick="window.removeTagFromSelection('${tagData.name}', event)" title="Hapus tag">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            this.setupDragAndDrop();
            this.updatePickListCounts();
        }


        
        updatePickListCounts() {
            const availableCountElem = document.getElementById('available-count');
            const selectedCountElem = document.getElementById('selected-count');
            
            if (!availableCountElem || !selectedCountElem) return;
            
            const availableCount = availableTagsList.filter(tag => {
                const tagName = tag.tagname || tag.name || tag.tag_name;
                return !selectedTags.includes(tagName);
            }).length;
            
            const selectedCount = selectedTags.length;
            
            availableCountElem.textContent = availableCount;
            selectedCountElem.textContent = selectedCount;
        }
        
        toggleTagSelection(tagName, isSelected) {
            if (isSelected) {
                if (!selectedTags.includes(tagName)) {
                    selectedTags.push(tagName);
                }
            } else {
                selectedTags = selectedTags.filter(tag => tag !== tagName);
            }
            
            this.updateSelectedTagsList();
            this.displayAvailableTags();
        }
        
        removeTagFromSelection(tagName, event) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
            
            selectedTags = selectedTags.filter(tag => tag !== tagName);
            this.updateSelectedTagsList();
            this.displayAvailableTags();
        }
        
        selectAllTags() {
            const availableTags = availableTagsList.map(tag => tag.tagname || tag.name || tag.tag_name)
                .filter(tagName => !selectedTags.includes(tagName));
            
            selectedTags = [...selectedTags, ...availableTags];
            this.updateSelectedTagsList();
            this.displayAvailableTags();
        }
        
        clearSelection() {
            selectedTags = [];
            this.updateSelectedTagsList();
            this.displayAvailableTags();
        }
        
        // ========== SETTING TAGS MANAGEMENT ==========
        async showTagSettings() {
            await this.loadPlantsForSettings();
            
            const customSelector = document.getElementById('custom-selector');
            if (customSelector) {
                customSelector.style.display = 'block';
                customSelector.classList.add('overlay-mode');
                customSelector.classList.remove('settings-mode');
                
                if (!editingTemplateId) {
                    this.resetTemplateForm();
                    currentSettingPlant = null;
                    
                    const availableContainer = document.getElementById('available-tags-list');
                    if (availableContainer) {
                        availableContainer.innerHTML = `
                            <div class="empty-list-message">
                                <i class="fas fa-industry"></i>
                                <div>Pilih plant terlebih dahulu</div>
                                <small>Klik salah satu plant di atas untuk menampilkan tag</small>
                            </div>
                        `;
                    }
                } else {
                    currentSettingPlant = null;
                    
                    const availableContainer = document.getElementById('available-tags-list');
                    if (availableContainer) {
                        availableContainer.innerHTML = `
                            <div class="empty-list-message">
                                <i class="fas fa-industry"></i>
                                <div>Pilih plant terlebih dahulu</div>
                                <small>Klik salah satu plant di atas untuk menampilkan tag</small>
                            </div>
                        `;
                    }
                }
                
                this.showDebug('Membuka tag settings sebagai overlay - menunggu pemilihan plant');
                
                setTimeout(() => {
                    this.setupDragAndDrop();
                }, 500);
            }
        }
        
        // Ganti function loadPlantsForSettings() di baris ~770
        async loadPlantsForSettings() {
            try {
                const result = await DataSelector.fetchPlants();
                
                console.log('loadPlantsForSettings response:', result);
                
                if (result.success) {
                    // PERBAIKAN: Handle berbagai format response
                    let plants = [];
                    
                    if (Array.isArray(result.data)) {
                        plants = result.data;
                    } else if (result.data && Array.isArray(result.data.data)) {
                        plants = result.data.data;
                    } else if (result.data && Array.isArray(result.data.plants)) {
                        plants = result.data.plants;
                    } else if (result.data && typeof result.data === 'object') {
                        // Coba ambil plants dari object
                        plants = Object.values(result.data);
                    } else if (Array.isArray(result.plants)) {
                        plants = result.plants;
                    }
                    
                    // Filter plant yang valid
                    plants = plants.filter(plant => {
                        return plant !== null && 
                               plant !== undefined && 
                               plant.toString().trim() !== '';
                    });
                    
                    console.log('Processed plants:', plants);
                    
                    if (plants.length > 0) {
                        this.displayPlantsForSettings(plants);
                    } else {
                        this.showDebug('⚠️ Tidak ada plant di database');
                        this.displayPlantsForSettings([]);
                    }
                } else {
                    this.showDebug('❌ Gagal mengambil plant dari server: ' + result.message);
                    this.displayPlantsForSettings([]);
                }
            } catch (error) {
                console.error('Error loading plants:', error);
                this.showDebug('💥 Error: ' + error.message);
                this.displayPlantsForSettings([]);
            }
        }
        
        displayPlantsForSettings(plants) {
            const container = document.getElementById('plant-buttons-inside');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (!plants || plants.length === 0) {
                container.innerHTML = `
                    <div class="no-plants-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Tidak ada plant yang ditemukan di database</p>
                        <small>Pastikan database memiliki data plant yang valid</small>
                    </div>
                `;
                return;
            }
            
            plants.forEach(plant => {
                if (!plant || plant.toString().trim() === '') {
                    console.warn('⚠️ Skipping invalid plant:', plant);
                    return;
                }
                
                try {
                    const button = document.createElement('button');
                    button.className = 'plant-btn-inside';
                    
                    const plantName = plant.toString().trim().toUpperCase();
                    
                    button.innerHTML = `<span>${plantName}</span>`;
                    button.addEventListener('click', () => this.selectPlantForSettings(plant));
                    container.appendChild(button);
                } catch (error) {
                    console.error('Error creating plant button for:', plant, error);
                }
            });
        }

        // Tambahkan di class QualityTrendCoreHandler
        async loadAllAvailableTags() {
            try {
                this.showDebug('🚀 Loading ALL available tags (for reference)...');
                
                const result = await DataSelector.fetchTags();
                this.showDebug('📦 All available tags response:', result);
                
                if (result.success) {
                    let allTags = result.data?.data || result.data || result.tags || result.tagList || [];
                    availableTagsList = allTags; // Simpan SEMUA tag untuk referensi
                    this.showDebug(`✅ Loaded ${availableTagsList.length} tags for reference`);
                    
                    // Jika sedang edit template, update selected tags list dengan data baru
                    if (editingTemplateId) {
                        this.updateSelectedTagsList();
                    }
                } else {
                    this.showError('❌ Gagal memuat daftar tag referensi');
                }
            } catch (error) {
                this.showError('💥 Error loading reference tags');
            }
        }

        // Modifikasi selectPlantForSettings
        selectPlantForSettings(plant) {
            if (!plant || plant.toString().trim() === '') {
                console.error('Invalid plant selected:', plant);
                return;
            }
            
            // Update UI selection
            document.querySelectorAll('.plant-btn-inside').forEach(btn => {
                btn.classList.remove('active');
            });
            
            if (event && event.currentTarget) {
                event.currentTarget.classList.add('active');
            }
            
            currentSettingPlant = plant;
            
            // Clear search input
            const tagSearchInput = document.getElementById('tag-search');
            if (tagSearchInput) {
                tagSearchInput.value = '';
            }
            
            // HANYA update display available tags untuk plant yang dipilih
            this.displayAvailableTags(); // Tidak perlu load ulang semua tags
            
            // PERBAIKAN: Tidak perlu reset selectedTags, hanya update display
            this.updateSelectedTagsList();
            
            this.showDebug(`Filter available tags untuk: ${plant}`, selectedTags);
        }
        
        // ========== DRAG & DROP FUNCTIONALITY ==========
        setupDragAndDrop() {
            const selectedContainer = document.getElementById('selected-tags-list');
            if (!selectedContainer) return;
            
            // Hapus event listeners sebelumnya
            const dragStartHandler = (e) => this.handleDragStart(e);
            const dragOverHandler = (e) => this.handleDragOver(e);
            const dropHandler = (e) => this.handleDrop(e);
            const dragEndHandler = (e) => this.handleDragEnd(e);
            
            selectedContainer.removeEventListener('dragstart', dragStartHandler);
            selectedContainer.removeEventListener('dragover', dragOverHandler);
            selectedContainer.removeEventListener('drop', dropHandler);
            selectedContainer.removeEventListener('dragend', dragEndHandler);
            
            // Tambahkan event listeners baru
            selectedContainer.addEventListener('dragstart', dragStartHandler);
            selectedContainer.addEventListener('dragover', dragOverHandler);
            selectedContainer.addEventListener('drop', dropHandler);
            selectedContainer.addEventListener('dragend', dragEndHandler);
        }
        
        handleDragStart(e) {
            if (!e.target.classList.contains('picklist-item') && !e.target.closest('.picklist-item')) {
                return;
            }
            
            this.draggedItem = e.target.classList.contains('picklist-item') 
                ? e.target 
                : e.target.closest('.picklist-item');
            
            // Simpan waktu mulai drag untuk menghindari flicker
            this.dragStartTime = Date.now();
            
            // Tambahkan class ke body untuk CSS control
            document.body.classList.add('dragging-active');
            
            // Gunakan dataTransfer dengan minimal data
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.draggedItem.dataset.tag || '');
            
            // Tambahkan class dragging
            this.draggedItem.classList.add('dragging');
            
            // Tambahkan style inline untuk menghindari CSS transition
            this.draggedItem.style.transition = 'none';
            this.draggedItem.style.willChange = 'transform, opacity';
            
            // Reset lastDragOverElement
            this.lastDragOverElement = null;
            
            // Debug
            console.log('🔄 Drag start on:', this.draggedItem?.dataset?.tag);
        }
        
        handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const selectedContainer = document.getElementById('selected-tags-list');
            if (!selectedContainer || !this.draggedItem) return;
            
            // Debounce untuk menghindari update terlalu cepat
            if (this.lastDragOverElement === e.target && 
                this.lastDragOverY === e.clientY) {
                return;
            }
            
            this.lastDragOverElement = e.target;
            this.lastDragOverY = e.clientY;
            
            // Gunakan requestAnimationFrame untuk smooth update
            if (this.dragAnimationFrame) {
                cancelAnimationFrame(this.dragAnimationFrame);
            }
            
            this.dragAnimationFrame = requestAnimationFrame(() => {
                const afterElement = this.getDragAfterElement(selectedContainer, e.clientY);
                
                // Cek apakah posisi berubah
                const currentIndex = Array.from(selectedContainer.children).indexOf(this.draggedItem);
                const targetIndex = afterElement 
                    ? Array.from(selectedContainer.children).indexOf(afterElement)
                    : selectedContainer.children.length;
                
                // Hanya update jika posisi benar-benar berubah
                if (targetIndex !== currentIndex && targetIndex !== currentIndex + 1) {
                    if (afterElement == null) {
                        if (selectedContainer.lastElementChild !== this.draggedItem) {
                            selectedContainer.appendChild(this.draggedItem);
                        }
                    } else {
                        selectedContainer.insertBefore(this.draggedItem, afterElement);
                    }
                }
            });
        }
        
        handleDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Hapus class dari body
            document.body.classList.remove('dragging-active');
            
            // Simpan reference sebelum di-reset
            const draggedItem = this.draggedItem;
            
            // Hapus class dragging dengan smooth
            if (draggedItem) {
                // Hapus class dan reset style
                draggedItem.classList.remove('dragging');
                
                requestAnimationFrame(() => {
                    draggedItem.style.transition = '';
                    draggedItem.style.willChange = '';
                    draggedItem.style.transform = '';
                    draggedItem.style.opacity = '';
                });
            }
            
            // Update urutan hanya jika drag cukup lama (untuk menghindari accidental drag)
            if (this.dragStartTime && (Date.now() - this.dragStartTime) > 100) {
                this.updateSelectedTagsOrder();
            }
            
            // Reset semua state
            this.cleanupDragState();
            
            console.log('✅ Drop completed');
        }

        cleanupDragState() {
            // Reset semua state drag
            this.draggedItem = null;
            this.lastDragOverElement = null;
            this.dragStartTime = null;
            
            // Cancel animation frame jika ada
            if (this.dragAnimationFrame) {
                cancelAnimationFrame(this.dragAnimationFrame);
                this.dragAnimationFrame = null;
            }
        }
        
        handleDragEnd(e) {
            // Hapus class dari body
            document.body.classList.remove('dragging-active');
            
            // Hapus class dragging dari semua item
            document.querySelectorAll('.picklist-item').forEach(item => {
                item.classList.remove('dragging');
                item.style.transition = '';
                item.style.willChange = '';
                item.style.transform = '';
                item.style.opacity = '';
            });
            
            // Panggil cleanup
            this.cleanupDragState();
            
            // Debug
            console.log('🏁 Drag ended');
        }
        
        getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.picklist-item:not(.dragging)')];
            
            if (draggableElements.length === 0) return null;
            
            // Cek semua elemen untuk posisi mouse
            for (let i = 0; i < draggableElements.length; i++) {
                const box = draggableElements[i].getBoundingClientRect();
                const boxTop = box.top;
                const boxBottom = box.bottom;
                const boxMiddle = boxTop + (box.height / 2);
                
                // Jika mouse berada di atas setengah bagian atas elemen
                if (y < boxMiddle) {
                    return draggableElements[i];
                }
                // Jika mouse berada di setengah bagian bawah elemen
                else if (y < boxBottom) {
                    // Jika ini elemen terakhir, return null (append di akhir)
                    if (i === draggableElements.length - 1) {
                        return null;
                    }
                    // Jika bukan elemen terakhir, return elemen berikutnya
                    return draggableElements[i + 1];
                }
            }
            
            // Jika mouse berada di bawah semua elemen, return null (append di akhir)
            return null;
        }
        
        updateSelectedTagsOrder() {
            const selectedContainer = document.getElementById('selected-tags-list');
            if (!selectedContainer) return;
            
            const selectedItems = selectedContainer.querySelectorAll('.picklist-item');
            const newSelectedTags = [];
            
            selectedItems.forEach(item => {
                const tagName = item.getAttribute('data-tag');
                if (tagName) {
                    newSelectedTags.push(tagName);
                }
            });
            
            selectedTags = newSelectedTags;
            this.updatePickListCounts();
        }
        
        // ========== TEMPLATE MANAGEMENT ==========
        async loadUserTemplates() {
            try {
                const username = this.getStandardizedUsername();
                if (!username) {
                    console.error('❌ Username tidak ditemukan');
                    currentTemplates = []; // Reset ke array kosong
                    this.displayTemplatesTable(); // Update UI
                    return;
                }
                
                const result = await DataSelector.listTemplates(username);
                
                console.log('🔄 loadUserTemplates result:', result); // DEBUG
                
                if (result.success) {
                    // PERBAIKAN: Handle berbagai format response dengan lebih baik
                    let templates = [];
                    
                    if (Array.isArray(result.data)) {
                        templates = result.data;
                    } else if (result.data && Array.isArray(result.data.templates)) {
                        templates = result.data.templates;
                    } else if (result.data && Array.isArray(result.data.data)) {
                        templates = result.data.data;
                    } else if (result.data && typeof result.data === 'object') {
                        // Coba ekstrak templates dari object
                        templates = Object.values(result.data);
                    }
                    
                    // Filter hanya yang valid
                    templates = templates.filter(t => t && typeof t === 'object' && t.id);
                    
                    console.log(`✅ Loaded ${templates.length} templates for user ${username}:`, templates);
                    
                    // UPDATE currentTemplates dengan data BARU dari server
                    currentTemplates = templates;
                    
                    // Perbarui UI
                    this.displayTemplatesTable();
                    
                    // Dispatch event untuk memberi tahu komponen lain
                    window.dispatchEvent(new CustomEvent('templatesUpdated', {
                        detail: { templates: currentTemplates }
                    }));
                } else {
                    console.error('❌ Gagal memuat templates:', result.message);
                    currentTemplates = []; // Reset jika gagal
                    this.displayTemplatesTable();
                }
            } catch (error) {
                console.error('❌ Error loading templates:', error);
                currentTemplates = []; // Reset jika error
                this.displayTemplatesTable();
            }
        }
        
        // corehandler.js - perbaiki displayTemplatesTable() (sekitar baris 1145)
        displayTemplatesTable() {
            const tableBody = document.getElementById('template-table-body');
            if (!tableBody) {
                console.warn('⚠️ Template table body not found');
                return;
            }
            
            console.log('📊 DisplayTemplatesTable called, currentTemplates:', currentTemplates);
            console.log('📊 Number of templates:', currentTemplates ? currentTemplates.length : 0);
            
            const templatesToDisplay = currentTemplates || [];
            
            if (templatesToDisplay.length === 0) {
                console.log('ℹ️ No templates to display');
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-table-message">
                            <i class="fas fa-inbox"></i>
                            <p>Belum ada template yang tersimpan</p>
                        </td>
                    </tr>
                `;
                return;
            }
            
            console.log(`📋 Rendering ${templatesToDisplay.length} templates`);
            
            tableBody.innerHTML = templatesToDisplay.map(template => `
                <tr data-template-id="${template.id}">
                    <td>
                        <div class="template-name">${template.template_name || template.name || 'Unnamed'}</div>
                    </td>
                    <td>
                        <div class="template-desc">${template.description || 'Tidak ada deskripsi'}</div>
                    </td>
                    <td>
                        <span class="tag-count-badge">${template.tag_count || template.tags?.length || 0} tags</span>
                    </td>
                    <td>
                        <div class="template-date">
                          <span>${new Date(template.updated_at).toLocaleDateString('id-ID')}</span>
                          <span> - </span>
                          <span>${new Date(template.updated_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </td>
                    <td>
                        <div class="template-actions">
                            <button class="btn-sm btn-primary" onclick="window.loadTemplate(${template.id})" title="Load Template">
                                <i class="fas fa-chart-line"></i> Load
                            </button>
                            <button class="btn-sm btn-outline" onclick="window.editTemplate(${template.id})" title="Edit Template">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-sm btn-danger" onclick="window.deleteTemplate(${template.id})" title="Hapus Template">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
        
        async loadTemplate(templateId) {
            try {
                console.log('📥 Loading template ID:', templateId);
        
                // 🔥 PERBAIKAN: CEK AUTH STATUS DULU
                if (!this.isUserLoggedIn()) {
                    console.log('🔐 User not logged in, checking auth status...');
                    const isAuthenticated = await checkAuthStatus();
                    if (!isAuthenticated) {
                        throw new Error('User not authenticated. Please log in.');
                    }
                }
                
                const username = this.getStandardizedUsername();
                if (!username) {
                    throw new Error('User not authenticated');
                }
                
                // PERBAIKAN: Gunakan action 'detail' dan parameter yang benar
                const result = await DataSelector.callAPI('template_manager.php', { 
                    action: 'detail',
                    template_id: templateId,  // PARAMETER YANG BENAR
                    username: username  
                }, 'GET');
                
                console.log('📊 Template load result:', result);
                
                if (result.success && result.data) {
                    const data = result.data;
                    
                    // Debug struktur response
                    console.group('🔍 Template Load Response Analysis');
                    console.log('Response success:', data.success);
                    console.log('Response template:', data.template);
                    console.log('Full response data:', data);
                    console.groupEnd();
                    
                    // Cek jika response valid
                    if (data.success && data.template) {
                        const template = data.template;
                        console.log('📋 Final template data for chart:', template);
                        
                        // Update dates
                        await this.autoUpdateDates();
                        
                        // Buat parameter untuk chart
                        const params = new URLSearchParams({
                            template_id: templateId,
                            template_name: encodeURIComponent(template.template_name || template.name || ''),
                            tags: (template.tags || []).join(','),
                            start_date: currentStartDate.toISOString().split('T')[0],
                            end_date: currentEndDate.toISOString().split('T')[0]
                        });
                        
                        console.log('🔗 Redirecting to chart with params:', params.toString());
                        
                        // Dispatch event untuk load template (untuk tab switching)
                        const templateData = {
                            template_id: templateId,
                            template_name: template.template_name || template.name,
                            tags: template.tags || [],
                            start_date: currentStartDate.toISOString().split('T')[0],
                            end_date: currentEndDate.toISOString().split('T')[0]
                        };
                        
                        console.log('📤 Dispatching templateLoaded event:', templateData);
                        
                        window.dispatchEvent(new CustomEvent('templateLoaded', {
                            detail: templateData
                        }));
                        
                        // Save untuk digunakan nanti
                        window.currentTemplateData = templateData;
                        
                        // Switch ke trendchart tab
                        const trendchartTab = document.querySelector('.nav-tabs a[data-tab="trendchart"]');
                        if (trendchartTab) {
                            console.log('🔄 Switching to trendchart tab...');
                            trendchartTab.click();
                        } else {
                            console.error('❌ Trendchart tab not found');
                            this.showError('Trendchart tab tidak ditemukan');
                        }
                    } else {
                        this.showError('Gagal memuat template: ' + (data.message || 'Template data not found'));
                    }
                } else {
                    this.showError('Gagal memuat template: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('❌ Error loading template:', error);
                this.showError('Error loading template: ' + error.message);
            }
        }
        
        // Ganti function editTemplate() di baris ~1045
        async editTemplate(templateId) {
            try {
                console.log('✏️ Editing template ID:', templateId);
                
                const username = this.getStandardizedUsername();
                if (!username) {
                    throw new Error('User not authenticated');
                }
                
                // PERBAIKAN: Langsung gunakan action 'detail' yang valid
                const result = await DataSelector.callAPI('template_manager.php', { 
                    action: 'detail',  // GUNAKAN 'detail' bukan 'get'
                    template_id: templateId,  // PARAMETER YANG BENAR
                    username: username  
                }, 'GET');
                
                console.log('📊 Template detail result:', result);
                
                if (result.success && result.data) {
                    const data = result.data;
                    
                    // Debug struktur response
                    console.group('🔍 Template Detail Response Analysis');
                    console.log('Response success:', data.success);
                    console.log('Response template:', data.template);
                    console.log('Full response:', data);
                    console.groupEnd();
                    
                    if (data.success && data.template) {
                        const template = data.template;
                        console.log('📋 Template to edit:', template);
                        
                        const templateNameInput = document.getElementById('template-name');
                        const templateDescInput = document.getElementById('template-desc');
                        
                        // Set template name dan description
                        if (templateNameInput) {
                            templateNameInput.value = template.template_name || template.name || '';
                            console.log('📝 Template name set to:', templateNameInput.value);
                        }
                        
                        if (templateDescInput) {
                            templateDescInput.value = template.description || '';
                            console.log('📝 Template description set to:', templateDescInput.value);
                        }
                        
                        // Ekstrak tags dari template
                        let extractedTags = [];
                        
                        if (template.tags && Array.isArray(template.tags)) {
                            extractedTags = template.tags;
                        } else if (typeof template.tags === 'string') {
                            extractedTags = template.tags.split(',');
                        }
                        
                        // Filter dan clean up tags
                        selectedTags = extractedTags
                            .filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
                            .map(tag => tag.trim());
                        
                        console.log('🏷️ Selected tags extracted:', selectedTags);
                        console.log('🏷️ Tags count:', selectedTags.length);
                        
                        editingTemplateId = templateId;

                        // Load semua tags untuk referensi (sekaligus)
                        await this.loadAllAvailableTags();

                        // Show tag settings
                        this.showTagSettings();

                        // Update UI dengan tags
                        setTimeout(() => {
                            this.updateSelectedTagsList();
                            this.displayAvailableTags();
                            console.log('✅ UI updated with tags');
                        }, 100);
                        
                        this.showCustomSuccess(`Editing template: ${template.template_name || template.name || 'Unnamed'}`);
                    } else {
                        this.showError('Template data not found: ' + (data.message || 'Unknown error'));
                    }
                } else {
                    const errorMsg = result?.message || 'Unknown error';
                    console.error('❌ Failed to load template:', errorMsg);
                    this.showError('Gagal memuat template untuk edit: ' + errorMsg);
                }
            } catch (error) {
                console.error('❌ Error loading template for edit:', error);
                this.showError('Error loading template for edit: ' + error.message);
            }
        }
        
        async deleteTemplate(templateId) {
            if (!this.isUserLoggedIn()) {
                this.showError('Silakan login terlebih dahulu untuk menghapus template');
                return;
            }

            // Cari template di currentTemplates
            let template = currentTemplates.find(t => t.id === templateId);
            
            // Jika tidak ditemukan, coba load dari server
            if (!template) {
                console.log(`🔄 Template ID ${templateId} tidak ditemukan di cache, mencoba load dari server...`);
                
                try {
                    const username = this.getStandardizedUsername();
                    const result = await DataSelector.getTemplate(templateId, username);
                    
                    if (result.success && result.data) {
                        template = result.data.template || result.data;
                    }
                } catch (error) {
                    console.error('Gagal load template dari server:', error);
                }
            }
            
            // Jika masih tidak ditemukan
            if (!template) {
                this.showError('Template tidak ditemukan');
                return;
            }
            
            const templateName = template.template_name || template.name || 'Unnamed Template';
            
            if (!confirm(`Apakah Anda yakin ingin menghapus template "${templateName}"?`)) {
                return;
            }
            
            try {
                const username = this.getStandardizedUsername();
                if (!username) {
                    throw new Error('Username tidak ditemukan. Silakan login ulang.');
                }
                
                const result = await DataSelector.deleteTemplate(templateId, username);
                
                if (result.success) {
                    this.showCustomSuccess(`Template "${templateName}" berhasil dihapus`);
                    
                    // Update currentTemplates - hapus dari array
                    currentTemplates = currentTemplates.filter(t => t.id !== templateId);
                    
                    // Refresh UI
                    this.displayTemplatesTable();
                } else {
                    this.showError('Gagal menghapus template: ' + result.message);
                }
            } catch (error) {
                this.showError('Error deleting template: ' + error.message);
            }
        }
        
        async saveTagSettings() {
            const templateNameInput = document.getElementById('template-name');
            const templateDescInput = document.getElementById('template-desc');
            
            if (!templateNameInput || !templateDescInput) return;
            
            const templateName = templateNameInput.value.trim();
            const description = templateDescInput.value.trim();
            
            if (!templateName) {
                this.showError('Nama template harus diisi');
                return;
            }
            
            if (selectedTags.length === 0) {
                this.showError('Belum Ada Tag yang Dipilih');
                return;
            }
            
            try {
                const username = this.getStandardizedUsername();
                if (!username) {
                    throw new Error('User not authenticated');
                }
                
                console.log('💾 Saving template...', {
                    editingTemplateId,
                    templateName,
                    tagsCount: selectedTags.length,
                    username
                });
                
                let result;
                const templateData = {
                    username: username,
                    template_name: templateName,
                    description: description,
                    tags: selectedTags
                };
                
                if (editingTemplateId) {
                    // PERBAIKAN: Pastikan template_id dikirim dengan benar
                    templateData.template_id = editingTemplateId; // Coba dengan parameter yang berbeda
                    templateData.id = editingTemplateId;           // Kirim kedua-duanya untuk compatibility
                    
                    console.log('🔄 Update template dengan ID:', editingTemplateId);
                    
                    // Coba beberapa cara
                    const actions = ['update', 'save', 'modify'];
                    let lastError = null;
                    
                    for (let action of actions) {
                        try {
                            console.log(`🔄 Mencoba action: ${action}`);
                            
                            // Coba dengan body yang berbeda
                            const body = {
                                action: action,
                                username: username,
                                template_name: templateName,
                                description: description,
                                tags: selectedTags,
                                template_id: editingTemplateId,
                                id: editingTemplateId
                            };
                            
                            result = await DataSelector.saveTemplate(action, body);
                            
                            if (result.success) {
                                console.log(`✅ Update berhasil dengan action: ${action}`);
                                break;
                            } else {
                                console.log(`❌ Action ${action} gagal:`, result.message);
                                lastError = result.message;
                            }
                        } catch (error) {
                            console.log(`💥 Action ${action} error:`, error.message);
                            lastError = error.message;
                        }
                    }
                    
                    // Jika semua action gagal, coba langsung callAPI
                    if (!result || !result.success) {
                        console.log('🔄 Semua action gagal, mencoba langsung callAPI...');
                        
                        const body = {
                            action: 'update',
                            username: username,
                            template_name: templateName,
                            description: description,
                            tags: selectedTags,
                            id: editingTemplateId
                        };
                        
                        result = await DataSelector.callAPI('template_manager.php', {}, 'POST', body);
                    }
                    
                } else {
                    // Create new template
                    console.log('🆕 Create new template');
                    result = await DataSelector.saveTemplate('create', templateData);
                }
                
                console.log('💾 Save result:', result); // DEBUG
                
                if (result.success) {
                    const successMsg = `Template "${templateName}" berhasil ${editingTemplateId ? 'diupdate' : 'disimpan'}!`;
                    console.log('✅ ' + successMsg);
                    this.showCustomSuccess(successMsg);
                    
                    // RESET FORM DULU
                    this.resetTemplateForm();
                    this.hideCustomSelector();
                    
                    // PERBAIKAN: Load ulang templates dari server dengan timeout kecil
                    setTimeout(async () => {
                        try {
                            console.log('🔄 Reloading templates after save...');
                            await this.loadUserTemplates();
                            
                            // PERBAIKAN TAMBAHAN: Update local currentTemplates
                            if (editingTemplateId && result.data && result.data.data) {
                                const updatedTemplate = result.data.data;
                                console.log('📝 Updated template from response:', updatedTemplate);
                                
                                // Update template di local cache
                                const index = currentTemplates.findIndex(t => t.id === editingTemplateId);
                                if (index !== -1) {
                                    currentTemplates[index] = updatedTemplate;
                                    console.log('✅ Updated template in local cache');
                                }
                            }
                        } catch (error) {
                            console.error('Error reloading templates:', error);
                        }
                    }, 500);
                    
                } else {
                    const errorMsg = `Gagal menyimpan template: ${result.message || 'Unknown error'}`;
                    console.error('❌ ' + errorMsg);
                    this.showError(errorMsg);
                }
                
            } catch (error) {
                const errorMsg = 'Error saving template: ' + error.message;
                console.error('❌ ' + errorMsg);
                this.showError(errorMsg);
            }
        }
        
        resetTemplateForm() {
            const templateNameInput = document.getElementById('template-name');
            const templateDescInput = document.getElementById('template-desc');
            
            if (templateNameInput) templateNameInput.value = '';
            if (templateDescInput) templateDescInput.value = '';
            
            selectedTags = [];
            editingTemplateId = null;
            currentSettingPlant = null; // Jangan lupa reset plant selection
            
            this.updateSelectedTagsList();
            this.displayAvailableTags();
            
            // Reset plant buttons
            document.querySelectorAll('.plant-btn-inside').forEach(btn => {
                btn.classList.remove('active');
            });
            
            console.log('🔄 Template form reset');
        }
        
        // ========== UI HELPER FUNCTIONS ==========
        showLoading() {
            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'block';
        }
        
        hideLoading() {
            const loading = document.getElementById('loading');
            if (loading) loading.style.display = 'none';
        }
        
        showEmptyState() {
            const emptyState = document.getElementById('empty-state');
            if (emptyState) emptyState.style.display = 'block';
        }
        
        hideEmptyState() {
            const emptyState = document.getElementById('empty-state');
            if (emptyState) emptyState.style.display = 'none';
        }
        
        showEmptyStateWithSettingsPrompt() {
            const emptyState = document.getElementById('empty-state');
            if (!emptyState) return;
            
            emptyState.innerHTML = `
                <i class="fas fa-cogs"></i>
                <h3>Gunakan Template untuk menampilkan data</h3>
                <p>Pilih template dari daftar atau buat template baru</p>
                <button class="btn-primary" onclick="window.showTagSettings()" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Buat Template Baru
                </button>
            `;
            emptyState.style.display = 'block';
            
            const tagSections = document.getElementById('tag-sections');
            if (tagSections) {
                tagSections.innerHTML = '';
            }
        }
        
        showError(message) {
            const errorDiv = document.getElementById('error-message');
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
                
                setTimeout(() => {
                    this.hideError();
                }, 5000);
            }
        }
        
        hideError() {
            const errorDiv = document.getElementById('error-message');
            if (errorDiv) errorDiv.style.display = 'none';
        }
        
        showCustomSuccess(message) {
            const successDiv = document.createElement('div');
            successDiv.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
            `;
            successDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-check-circle"></i>
                    <span>${message}</span>
                </div>
            `;
            
            document.body.appendChild(successDiv);
            
            setTimeout(() => {
                successDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (successDiv.parentNode) {
                        successDiv.parentNode.removeChild(successDiv);
                    }
                }, 300);
            }, 3000);
        }
        
        showCustomError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
            `;
            errorDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>${message}</span>
                </div>
            `;
            
            document.body.appendChild(errorDiv);
            
            setTimeout(() => {
                errorDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.parentNode.removeChild(errorDiv);
                    }
                }, 300);
            }, 3000);
        }
        
        showDebug(...messages) {
            if (!DEBUG) return;
            
            const debugDiv = document.getElementById('debug-info');
            if (!debugDiv) return;
            
            const timestamp = new Date().toLocaleTimeString();
            const message = messages.map(msg => 
                typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg
            ).join(' ');
            
            debugDiv.innerHTML += `[${timestamp}] ${message}<br>`;
            debugDiv.scrollTop = debugDiv.scrollHeight;
        }
        
        showCustomSelector() {
            this.showTagSettings();
        }
        
        hideCustomSelector() {
            const customSelector = document.getElementById('custom-selector');
            if (customSelector) {
                customSelector.style.display = 'none';
                customSelector.classList.remove('overlay-mode');
                customSelector.classList.remove('settings-mode');
                
                document.querySelectorAll('.plant-btn-inside').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                currentSettingPlant = null;
                selectedTags = [];
                
                this.resetTemplateForm();
                this.loadAvailableTags();
            }
        }
        
        // ========== HELPER FUNCTIONS ==========
        getUsername() {
            if (!currentUser) return null;
            return currentUser.username || 
                   currentUser.Username || 
                   currentUser.userName || 
                   currentUser.USERNAME;
        }
        
        isUserLoggedIn() {
            return !!currentUser;
        }
        
        getStandardizedUsername() {
            return this.getUsername();
        }
        
        // ========== CHART FUNCTIONS (simplified) ==========
        displayTagSections() {
            const tagSectionsContainer = document.getElementById('tag-sections');
            if (!tagSectionsContainer) return;

            tagSectionsContainer.innerHTML = '';

            if (!allTagsData || (Array.isArray(allTagsData) && allTagsData.length === 0) || 
                (!Array.isArray(allTagsData) && Object.keys(allTagsData).length === 0)) {
                this.showDebug('No tags data available');
                this.showEmptyState();
                return;
            }

            this.showDebug(`Displaying ${Array.isArray(allTagsData) ? allTagsData.length : Object.keys(allTagsData).length} tag sections`);
            this.hideEmptyState();
        }
        
        // ========== CLEANUP FUNCTION ==========
        cleanup() {
            console.log('🧹 Cleaning up QualityTrendCoreHandler...');
            
            // Remove event listeners (jangan reset semua state)
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            const tagSearchInput = document.getElementById('tag-search');
            const closeBtn = document.querySelector('.close-custom-btn');
            
            // Clone dan replace untuk remove listeners
            if (startDateInput) {
                const newInput = startDateInput.cloneNode(true);
                startDateInput.parentNode.replaceChild(newInput, startDateInput);
            }
            
            if (endDateInput) {
                const newInput = endDateInput.cloneNode(true);
                endDateInput.parentNode.replaceChild(newInput, endDateInput);
            }
            
            if (tagSearchInput) {
                const newInput = tagSearchInput.cloneNode(true);
                tagSearchInput.parentNode.replaceChild(newInput, tagSearchInput);
            }
            
            if (closeBtn) {
                const newBtn = closeBtn.cloneNode(true);
                closeBtn.parentNode.replaceChild(newBtn, closeBtn);
            }
            
            // Remove drag & drop listeners
            const selectedContainer = document.getElementById('selected-tags-list');
            if (selectedContainer) {
                const dragStartHandler = (e) => this.handleDragStart(e);
                const dragOverHandler = (e) => this.handleDragOver(e);
                const dropHandler = (e) => this.handleDrop(e);
                const dragEndHandler = (e) => this.handleDragEnd(e);
                
                selectedContainer.removeEventListener('dragstart', dragStartHandler);
                selectedContainer.removeEventListener('dragover', dragOverHandler);
                selectedContainer.removeEventListener('drop', dropHandler);
                selectedContainer.removeEventListener('dragend', dragEndHandler);
            }
            
            // JANGAN reset user authentication dan templates data
            // currentUser = null; // <-- KOMENTARI INI
            // currentTemplates = []; // <-- KOMENTARI INI JUGA!
            // userPreferences = {}; // <-- KOMENTARI INI
            
            // Reset state lainnya
            currentStartDate = null;
            currentEndDate = null;
            allTagsData = {};
            availableTagsList = [];
            selectedTags = [];
            editingTemplateId = null;
            currentSettingPlant = null;
            
            // Tapi periksa ulang auth status saat di-init ulang
            console.log('✅ QualityTrendCoreHandler cleaned up (user auth & templates preserved)');
        }
    }

    // Global instance
    let coreHandlerInstance = null;

    // Fungsi untuk inisialisasi
    function initCoreHandler() {
        if (!coreHandlerInstance) {
            coreHandlerInstance = new QualityTrendCoreHandler();
        }
        return coreHandlerInstance;
    }

    // Export ke window object
    window.QualityTrendCoreHandler = {
        // Class constructor
        QualityTrendCoreHandler: QualityTrendCoreHandler,
        
        // Initialization function
        initCoreHandler: initCoreHandler,
        
        // Cleanup function
        cleanup: function() {
            if (coreHandlerInstance) {
                coreHandlerInstance.cleanup();
                coreHandlerInstance = null;
                window.qualityTrendCoreHandlerInstance = null;
                window.QualityTrendCoreHandler.instance = null;
            }
        },
        
        // Utility function untuk backward compatibility
        initialize: function() {
            const handler = initCoreHandler();
            
            // Export method ke window untuk akses global
            if (handler) {
                // Export methods yang sering digunakan
                const methods = [
                    'selectPlant', 'showTagSettings', 'hideCustomSelector',
                    'loadPlantData', 'loadAvailableTags', 'toggleTagSelection',
                    'removeTagFromSelection', 'selectAllTags', 'clearSelection',
                    'saveTagSettings', 'loadTemplate', 'editTemplate', 
                    'deleteTemplate', 'autoUpdateDates'  // TAMBAHKAN DI SINI
                ];
                
                methods.forEach(method => {
                    window[method] = function(...args) {
                        return handler[method](...args);
                    };
                });
                
                // Simpan instance untuk akses cepat dari mainhandler
                window.qualityTrendCoreHandlerInstance = handler;
                window.QualityTrendCoreHandler.instance = handler;
            }
            
            return handler;
        }
    };

    // Export fungsi global untuk akses dari mainhandler
    window.autoUpdateDates = function() {
        if (coreHandlerInstance) {
            return coreHandlerInstance.autoUpdateDates();
        } else if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.instance) {
            return window.QualityTrendCoreHandler.instance.autoUpdateDates();
        } else if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.initialize) {
            const handler = window.QualityTrendCoreHandler.initialize();
            return handler.autoUpdateDates();
        }
        console.warn('⚠️ QualityTrendCoreHandler not ready for autoUpdateDates');
    };

    console.log('=== COREHANDLER.JS LOADED (Regular Script - No Plugin API) ===');

    // Auto-initialize jika diperlukan
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('QualityTrendCoreHandler: Auto-initializing on DOMContentLoaded...');
            setTimeout(() => {
                if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.initialize) {
                    window.QualityTrendCoreHandler.initialize();
                }
            }, 500);
        });
    } else {
        console.log('QualityTrendCoreHandler: DOM already loaded, checking for auto-init...');
        setTimeout(() => {
            if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.initialize) {
                window.QualityTrendCoreHandler.initialize();
            }
        }, 500);
    }
})();