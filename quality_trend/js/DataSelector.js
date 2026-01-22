// DataSelector.js - Script IIFE Regular tanpa Plugin API
(function() {
    'use strict';
    
    console.log('=== DATASELECTOR.JS LOADING (IIFE Regular - No Plugin API) ===');
    
    // Class DataSelector versi standalone
    class DataSelector {
        constructor() {
            this.baseUrl = '';
            this.initialized = false;
            this._readyPromise = null;
            this.activeRequests = new Map(); // Untuk mencegah request ganda

            // Jalankan inisialisasi
            this.init();
        }
        
        init() {
            console.log('🔍 DataSelector.init() setting up...');
            
            // Cari base URL
            this.determineBaseUrl();
            
            // Setup event listeners jika ada
            this.setupEventListeners();
            
            // Tandai sebagai initialized
            this.initialized = true;
            
            console.log(`📍 DataSelector Base URL: ${this.baseUrl}`);
            
            // Dispatch event bahwa DataSelector ready
            this.dispatchReadyEvent();
            
            // Process any queued requests
            this.processRequestQueue();
        }
        
        determineBaseUrl() {
            // Coba beberapa sumber untuk menentukan base URL
            if (window.pluginBaseUrl) {
                this.baseUrl = window.pluginBaseUrl;
            } else if (window.GasMainHandler && window.GasMainHandler.getPluginBaseUrl) {
                this.baseUrl = window.GasMainHandler.getPluginBaseUrl();
            } else if (window.StorageGasAPI && window.StorageGasAPI.getAssetUrl) {
                const assetUrl = window.StorageGasAPI.getAssetUrl('');
                this.baseUrl = assetUrl.substring(0, assetUrl.lastIndexOf('/') + 1);
            } else {
                // Cari dari current script
                const scripts = document.getElementsByTagName('script');
                const currentScript = scripts[scripts.length - 1];
                
                if (currentScript && currentScript.src) {
                    try {
                        const scriptUrl = new URL(currentScript.src);
                        const pathParts = scriptUrl.pathname.split('/');
                        pathParts.pop(); // Hapus nama file
                        
                        // Jika ada folder 'js', hapus juga
                        if (pathParts[pathParts.length - 1] === 'js') {
                            pathParts.pop();
                        }
                        
                        this.baseUrl = pathParts.join('/') + '/';
                    } catch (e) {
                        // Fallback ke path relatif
                        this.baseUrl = window.location.origin + window.location.pathname;
                        this.baseUrl = this.baseUrl.substring(0, this.baseUrl.lastIndexOf('/') + 1);
                    }
                } else {
                    // Default fallback
                    this.baseUrl = window.location.origin + '/';
                }
            }
            
            // Pastikan baseUrl berakhir dengan slash
            if (this.baseUrl && !this.baseUrl.endsWith('/')) {
                this.baseUrl += '/';
            }
        }
        
        setupEventListeners() {
            // Setup untuk reload data jika diperlukan
            window.addEventListener('dataNeedsRefresh', () => {
                console.log('🔄 Data refresh requested');
            });
        }
        
        dispatchReadyEvent() {
            window.dispatchEvent(new CustomEvent('dataSelectorReady', {
                detail: {
                    baseUrl: this.baseUrl,
                    timestamp: Date.now()
                }
            }));
        }
        
        // ========== CORE FETCH METHOD ==========
        
        async fetchData(endpoint, params = {}, method = 'GET', data = null) {
            const requestId = `DS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.group(`📡 [${requestId}] ${method} ${endpoint}`);
            console.log('Parameters:', params);
            console.log('Data:', data);
            console.groupEnd();
            
            // Jika belum initialized, queue request
            if (!this.initialized) {
                console.log(`⏳ [${requestId}] DataSelector not initialized, queuing request`);
                return new Promise((resolve, reject) => {
                    this.requestQueue.push({
                        endpoint,
                        params,
                        method,
                        data,
                        resolve,
                        reject,
                        requestId
                    });
                });
            }
            
            try {
                // Build URL
                let url;
                
                if (endpoint.startsWith('http')) {
                    url = endpoint;
                } else if (endpoint.startsWith('php/')) {
                    url = this.baseUrl + endpoint;
                } else if (endpoint.includes('.php')) {
                    url = this.baseUrl + 'php/' + endpoint;
                } else {
                    url = this.baseUrl + 'php/' + endpoint + '.php';
                }
                
                // Build options
                const options = {
                    method: method,
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                };
                
                // Handle parameters based on method
                if (method === 'GET' || method === 'HEAD') {
                    if (params && Object.keys(params).length > 0) {
                        const queryString = this.buildQueryString(params);
                        url += (url.includes('?') ? '&' : '?') + queryString;
                    }
                } else if (data || params) {
                    options.headers['Content-Type'] = 'application/json';
                    options.body = JSON.stringify(data || params);
                }
                
                // Add cache buster untuk GET requests
                if (method === 'GET') {
                    url += (url.includes('?') ? '&' : '?') + `_cb=${Date.now()}`;
                }
                
                console.log(`📤 [${requestId}] Request URL: ${url}`);
                
                // Fetch dengan timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout
                options.signal = controller.signal;
                
                const response = await fetch(url, options);
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log(`✅ [${requestId}] Success`);
                
                return {
                    success: true,
                    data: result,
                    requestId: requestId
                };
                
            } catch (error) {
                console.error(`❌ [${requestId}] Error:`, error);
                
                console.group(`📥 [${requestId}] Response`);
                console.log('Response status:', response.status);
                console.log('Response data:', result);
                console.groupEnd();
                
                return {
                    success: true,
                    data: result,
                    requestId: requestId
                };
            }
        }
        
        buildQueryString(params) {
            return Object.keys(params)
                .filter(key => params[key] !== undefined && params[key] !== null)
                .map(key => {
                    const value = params[key];
                    if (Array.isArray(value)) {
                        return value.map(v => `${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`).join('&');
                    }
                    return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
                })
                .join('&');
        }
        
        processRequestQueue() {
            if (this.isProcessingQueue || this.requestQueue.length === 0) {
                return;
            }
            
            this.isProcessingQueue = true;
            console.log(`🔄 Processing ${this.requestQueue.length} queued requests`);
            
            while (this.requestQueue.length > 0) {
                const request = this.requestQueue.shift();
                console.log(`⏳ Processing queued request: ${request.requestId}`);
                
                this.fetchData(request.endpoint, request.params, request.method, request.data)
                    .then(result => {
                        request.resolve(result);
                    })
                    .catch(error => {
                        request.reject(error);
                    });
            }
            
            this.isProcessingQueue = false;
        }
        
        // ========== METODE UTAMA ==========
        
        // Ambil daftar tag dari backend
        async fetchTags(params = {}) {
            try {
                console.log('🏷️ Fetching tags...');
                
                const result = await this.fetchData('get_tagnames.php', params, 'GET');
                
                if (result.success) {
                    const data = result.data;
                    if (data.success) {
                        return { success: true, data: data.data };
                    } else {
                        return { 
                            success: false, 
                            message: data.message || 'Gagal mengambil data tag' 
                        };
                    }
                } else {
                    return { 
                        success: false, 
                        message: result.error || 'Gagal mengambil data tag' 
                    };
                }
                
            } catch (error) {
                console.error('Error fetching tags:', error);
                return { 
                    success: false, 
                    message: 'Database tidak terhubung. Silakan coba lagi nanti.' 
                };
            }
        }
        
        // Ambil data values berdasarkan tagname dan rentang tanggal (default: 7 hari terakhir)
        async fetchTagValues(tagname, startDate = null, endDate = null) {
            try {
                // Default: 7 hari terakhir jika tidak ada tanggal yang ditentukan
                if (!startDate || !endDate) {
                    endDate = new Date();
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 7);
                }
                
                const params = { 
                    tagname: tagname,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0]
                };
                
                console.log(`📊 Fetching tag values for ${tagname}:`, params);
                
                const result = await this.fetchData('get_tag_values.php', params, 'GET');
                
                if (result.success) {
                    const data = result.data;
                    if (data.success) {
                        return { success: true, data: data.data };
                    } else {
                        return { 
                            success: false, 
                            message: data.message || 'Gagal mengambil data value' 
                        };
                    }
                } else {
                    return { 
                        success: false, 
                        message: result.error || 'Gagal mengambil data value' 
                    };
                }
                
            } catch (error) {
                console.error('Error fetching tag values:', error);
                return { 
                    success: false, 
                    message: 'Database tidak terhubung. Silakan coba lagi nanti.' 
                };
            }
        }
        
        // Ambil data panel secara otomatis
        async fetchPanelData(plant, startDate = null, endDate = null) {
            try {
                // Default: 7 hari terakhir jika tidak ada tanggal yang ditentukan
                if (!startDate || !endDate) {
                    endDate = new Date();
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 7);
                }
                
                // FORMAT TANGGAL YANG BENAR untuk PostgreSQL
                const formatDate = (date) => {
                    return date.toISOString().split('T')[0]; // YYYY-MM-DD
                };
                
                const params = { 
                    plant: plant,
                    start_date: formatDate(startDate),
                    end_date: formatDate(endDate)
                };
                
                console.log('📋 Fetching panel data with params:', params);
                
                const result = await this.fetchData('get_panel_data.php', params, 'GET');
                
                if (result.success) {
                    const data = result.data;
                    if (data.success) {
                        return { success: true, data: data.data };
                    } else {
                        return { 
                            success: false, 
                            message: data.message || 'Gagal mengambil data panel' 
                        };
                    }
                } else {
                    return { 
                        success: false, 
                        message: result.error || 'Gagal mengambil data panel' 
                    };
                }
                
            } catch (error) {
                console.error('Error fetching panel data:', error);
                return { 
                    success: false, 
                    message: 'Database tidak terhubung. Silakan coba lagi nanti.' 
                };
            }
        }
        
        // Ambil data untuk multiple tags (default: 7 hari terakhir)
        async fetchMultipleTagValues(tagnames, startDate = null, endDate = null) {
            try {
                // Default: 7 hari terakhir jika tidak ada tanggal yang ditentukan
                if (!startDate || !endDate) {
                    endDate = new Date();
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 7);
                }
                
                // PERBAIKAN: Gunakan format yang sesuai dengan API
                // Coba berbagai format parameter
                const params = { 
                    // Versi 1: Array sebagai JSON
                    tags: JSON.stringify(tagnames),
                    // Versi 2: String comma separated
                    tagnames: tagnames.join(','),
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0]
                };
                
                console.log(`📊 Fetching multiple tag values for ${tagnames.length} tags`);
                console.log('📋 Parameters:', params);
                
                // Coba GET dulu, jika gagal coba POST
                let result = await this.fetchData('get_multiple_tag_values.php', params, 'GET');
                
                // Jika GET gagal, coba POST dengan body
                if (!result.success) {
                    console.log('🔄 GET failed, trying POST...');
                    
                    // Untuk POST, kita perlu mengirim sebagai body
                    const postData = {
                        tags: tagnames,
                        start_date: startDate.toISOString().split('T')[0],
                        end_date: endDate.toISOString().split('T')[0],
                        interval: 'auto'
                    };
                    
                    result = await this.fetchData('get_multiple_tag_values.php', {}, 'POST', postData);
                }
                
                console.log('📦 Multiple tag values response:', result);
                
                if (result.success) {
                    const data = result.data;
                    
                    // Handle berbagai format response
                    if (data.success) {
                        return { 
                            success: true, 
                            data: data.data || data.values || data 
                        };
                    } else if (data.data) {
                        // Response mungkin langsung berisi data
                        return { 
                            success: true, 
                            data: data.data 
                        };
                    } else {
                        return { 
                            success: false, 
                            message: data.message || 'Gagal mengambil data multiple tags' 
                        };
                    }
                } else {
                    return { 
                        success: false, 
                        message: result.error || 'Gagal mengambil data multiple tags' 
                    };
                }
                
            } catch (error) {
                console.error('Error fetching multiple tag values:', error);
                return { 
                    success: false, 
                    message: 'Database tidak terhubung. Silakan coba lagi nanti.' 
                };
            }
        }
        
        // Test koneksi ke backend
        async testConnection() {
            try {
                const result = await this.fetchData('test_connection.php', {}, 'GET');
                
                if (result.success) {
                    const data = result.data;
                    return { success: data.success, message: data.message };
                } else {
                    return { 
                        success: false, 
                        message: result.error || 'Koneksi gagal' 
                    };
                }
                
            } catch (error) {
                console.error('Koneksi backend gagal:', error);
                return { 
                    success: false, 
                    message: 'Database tidak terhubung. Silakan coba lagi nanti.' 
                };
            }
        }
        
        // ========== FUNGSI BARU UNTUK SISTEM OTOMATIS ==========
        
        // Ambil daftar plant
        async fetchPlants() {
            try {
                console.log('🏭 Fetching plants...');
                
                const result = await this.fetchData('get_plants.php', {}, 'GET');
                
                if (result.success) {
                    const data = result.data;
                    
                    if (data.success) {
                        const plants = data.plants || data.data || [];
                        console.log('📦 Plants data:', plants);
                        
                        // Debug: Tampilkan detail plants array
                        console.log('🔍 Plants array details:');
                        plants.forEach((plant, index) => {
                            console.log(`  [${index}] plant: "${plant}"`, 
                                        'type:', typeof plant, 
                                        'value:', plant, 
                                        'isNull:', plant === null,
                                        'isUndefined:', plant === undefined);
                        });
                        
                        return { success: true, plants: plants };
                    } else {
                        return { success: false, message: data.message };
                    }
                } else {
                    return { 
                        success: false, 
                        message: result.error || 'Gagal mengambil daftar plant' 
                    };
                }
                
            } catch (error) {
                console.error('Error fetching plants:', error);
                return { success: false, message: 'Gagal mengambil daftar plant' };
            }
        }
        
        // Ambil data panel secara otomatis (alias untuk fetchPanelData)
        async fetchPanelDataAuto(plant, startDate = null, endDate = null) {
            return await this.fetchPanelData(plant, startDate, endDate);
        }

        // ========== GENERIC API METHOD ==========
        async callAPI(endpoint, params = {}, method = 'GET', body = null) {
            console.log(`📡 DataSelector.callAPI: ${method} ${endpoint}`);
            return await this.fetchData(endpoint, params, method, body);
        }

        // ========== TEMPLATE MANAGEMENT ==========

        getUsernameFromStorage() {
            try {
                // Coba dari berbagai sumber
                if (window.currentUser && window.currentUser.username) {
                    console.log('Username dari window.currentUser:', window.currentUser.username);
                    return window.currentUser.username;
                }
                
                if (window.userData && window.userData.username) {
                    console.log('Username dari window.userData:', window.userData.username);
                    return window.userData.username;
                }
                
                if (window.localStorage) {
                    const storedUser = localStorage.getItem('currentUser');
                    if (storedUser) {
                        const user = JSON.parse(storedUser);
                        console.log('Username dari localStorage:', user.username);
                        return user.username;
                    }
                    
                    // Coba juga dari sessionStorage
                    const sessionUser = sessionStorage.getItem('currentUser');
                    if (sessionUser) {
                        const user = JSON.parse(sessionUser);
                        console.log('Username dari sessionStorage:', user.username);
                        return user.username;
                    }
                }
                
                console.log('Username tidak ditemukan, menggunakan "guest"');
                return 'guest';
            } catch (error) {
                console.error('Error getting username:', error);
                return 'guest';
            }
        }

        async getTemplate(templateId, username = null) {
            try {
                console.log('📋 DataSelector.getTemplate called for ID:', templateId);
                
                // Gunakan username dari parameter atau cari dari storage
                const userToUse = username || this.getUsernameFromStorage() || 'guest';
                
                // Coba berbagai action untuk compatibility
                const actions = ['get', 'read', 'load'];
                let lastResult = null;
                
                for (let action of actions) {
                    try {
                        console.log(`🔄 Trying action: ${action}`);
                        const result = await this.fetchData('template_manager.php', { 
                            action: action, 
                            id: templateId,
                            username: userToUse  // SELALU kirim username
                        }, 'GET');
                        
                        console.log(`📊 Response for action ${action}:`, result);
                        
                        if (result.success) {
                            const data = result.data;
                            
                            // Cek jika response valid
                            if (data.success) {
                                console.log(`✅ Template found with action: ${action}`);
                                
                                // Ekstrak template dari berbagai format
                                let template = null;
                                
                                if (data.template) {
                                    template = data.template;
                                } else if (data.data && data.data.template) {
                                    template = data.data.template;
                                } else if (data.data && data.data.id) {
                                    template = data.data; // Data langsung adalah template
                                } else if (data.data) {
                                    template = data.data;
                                } else if (data) {
                                    template = data;
                                }
                                
                                if (template) {
                                    return {
                                        success: true,
                                        data: template,
                                        actionUsed: action
                                    };
                                }
                            } else {
                                console.log(`❌ Action ${action} response not successful:`, data.message);
                                lastResult = result;
                            }
                        } else {
                            console.log(`❌ Action ${action} fetch failed:`, result.error);
                            lastResult = result;
                        }
                    } catch (error) {
                        console.log(`💥 Action ${action} error:`, error.message);
                        lastResult = { success: false, error: error.message };
                    }
                }
                
                // Jika semua action gagal
                console.error('❌ All actions failed for template ID:', templateId);
                return {
                    success: false,
                    message: `Failed to load template: ${lastResult?.error || 'Unknown error'}`,
                    lastResult: lastResult
                };
                
            } catch (error) {
                console.error('❌ Error in getTemplate:', error);
                return {
                    success: false,
                    message: 'Error loading template: ' + error.message
                };
            }
        }

        // Tambahkan juga method untuk template management lainnya
        async listTemplates(username) {
            try {
                const result = await this.fetchData('template_manager.php', {
                    action: 'list',
                    username: username
                }, 'GET');
                
                if (result.success) {
                    const data = result.data;
                    
                    // Handle berbagai format response
                    if (data.success) {
                        return {
                            success: true,
                            data: data.templates || data.data || []
                        };
                    } else {
                        return {
                            success: false,
                            message: data.message || 'Failed to list templates'
                        };
                    }
                } else {
                    return {
                        success: false,
                        message: result.error || 'Failed to fetch templates'
                    };
                }
            } catch (error) {
                console.error('Error listing templates:', error);
                return {
                    success: false,
                    message: 'Error listing templates: ' + error.message
                };
            }
        }

        async saveTemplate(action, data) {
            try {
                console.log('💾 DataSelector.saveTemplate called:', { action, data });
                
                const body = {
                    action: action,
                    ...data
                };
                
                // Pastikan id/template_id dikirim untuk update
                if (action === 'update' && data.id) {
                    body.id = data.id;
                    body.template_id = data.id;
                    console.log('🔧 Sending template ID for update:', data.id);
                }
                
                console.log('📤 Save template request body:', body);
                
                const result = await this.fetchData('template_manager.php', {}, 'POST', body);
                
                console.log('📥 Save template response:', result);
                
                if (result.success) {
                    const responseData = result.data;
                    
                    if (responseData.success) {
                        console.log('✅ Template saved successfully');
                        return {
                            success: true,
                            data: responseData.data || responseData
                        };
                    } else {
                        console.error('❌ Template save failed:', responseData.message);
                        return {
                            success: false,
                            message: responseData.message || 'Failed to save template'
                        };
                    }
                } else {
                    console.error('❌ Fetch failed for template save:', result.error);
                    return {
                        success: false,
                        message: result.error || 'Failed to save template'
                    };
                }
            } catch (error) {
                console.error('❌ Error saving template:', error);
                return {
                    success: false,
                    message: 'Error saving template: ' + error.message
                };
            }
        }

        async deleteTemplate(templateId, username = null) {
            try {
                // Gunakan username dari parameter atau cari dari storage
                const userToUse = username || this.getUsernameFromStorage();
                
                if (!userToUse || userToUse === 'guest') {
                    return {
                        success: false,
                        message: 'Username tidak ditemukan. Silakan login terlebih dahulu.'
                    };
                }
                
                const result = await this.fetchData('template_manager.php', {
                    action: 'delete',
                    id: templateId,
                    username: userToUse  // KIRIM USERNAME
                }, 'POST');
                
                if (result.success) {
                    const data = result.data;
                    
                    if (data.success) {
                        return {
                            success: true,
                            message: data.message || 'Template deleted'
                        };
                    } else {
                        return {
                            success: false,
                            message: data.message || 'Failed to delete template'
                        };
                    }
                } else {
                    return {
                        success: false,
                        message: result.error || 'Failed to delete template'
                    };
                }
            } catch (error) {
                console.error('Error deleting template:', error);
                return {
                    success: false,
                    message: 'Error deleting template: ' + error.message
                };
            }
        }
        
        // ========== GENERIC METHODS ==========
        
        async get(endpoint, params = {}) {
            return await this.fetchData(endpoint, params, 'GET');
        }
        
        async post(endpoint, data = {}) {
            return await this.fetchData(endpoint, {}, 'POST', data);
        }
        
        // ========== UTILITY METHODS ==========
        
        getBaseUrl() {
            return this.baseUrl;
        }
        
        isInitialized() {
            return this.initialized;
        }
        
        getStatus() {
            return {
                initialized: this.initialized,
                baseUrl: this.baseUrl,
                queueLength: this.requestQueue.length,
                isProcessingQueue: this.isProcessingQueue,
                timestamp: Date.now()
            };
        }
        
        // ========== CLEANUP METHOD ==========
        
        cleanup() {
            console.log('🧹 DataSelector cleaning up...');
            
            // Clear request queue
            this.requestQueue = [];
            this.isProcessingQueue = false;
            
            // Reset status
            this.initialized = false;
            
            // Remove event listeners
            window.removeEventListener('dataNeedsRefresh', () => {});
            
            console.log('✅ DataSelector cleaned up');
        }
    }
    
    // Global instance
    let dataSelectorInstance = null;
    
    // Fungsi untuk inisialisasi DataSelector
    function initDataSelector() {
        if (!dataSelectorInstance) {
            dataSelectorInstance = new DataSelector();
        }
        return dataSelectorInstance;
    }
    
    // Fungsi untuk mendapatkan instance DataSelector
    function getDataSelector() {
        return dataSelectorInstance || initDataSelector();
    }
    
    // Fungsi cleanup untuk diakses oleh script utama
    function cleanup() {
        console.log('Cleaning up DataSelector module...');
        
        if (dataSelectorInstance) {
            dataSelectorInstance.cleanup();
            dataSelectorInstance = null;
        }
        
        console.log('✅ DataSelector module cleaned up');
    }
    
    // Export ke window object
    window.DataSelector = {
        // Class constructor
        Class: DataSelector,
        
        // Instance management
        instance: null,
        
        // Initialization functions
        init: initDataSelector,
        getInstance: getDataSelector,
        
        // Cleanup function
        cleanup: cleanup,
        
        // Direct methods (convenience)
        getBaseUrl: function() {
            const instance = getDataSelector();
            return instance.getBaseUrl();
        },

        getTemplate: function(templateId, username = null) {
            const instance = getDataSelector();
            // Jika username tidak diberikan, coba dapatkan dari instance
            const userToUse = username || instance.getUsernameFromStorage();
            return instance.getTemplate(templateId, userToUse);
        },
        
        listTemplates: function(username) {
            const instance = getDataSelector();
            return instance.listTemplates(username);
        },
        
        saveTemplate: function(action, data) {
            const instance = getDataSelector();
            return instance.saveTemplate(action, data);
        },

        deleteTemplate: function(templateId) {
            const instance = getDataSelector();
            return instance.deleteTemplate(templateId);
        },
        
        fetchTags: function(params) {
            const instance = getDataSelector();
            return instance.fetchTags(params);
        },
        
        fetchTagValues: function(tagname, startDate, endDate) {
            const instance = getDataSelector();
            return instance.fetchTagValues(tagname, startDate, endDate);
        },
        
        fetchMultipleTagValues: function(tagnames, startDate, endDate) {
            const instance = getDataSelector();
            return instance.fetchMultipleTagValues(tagnames, startDate, endDate);
        },
        
        fetchPanelData: function(plant, startDate, endDate) {
            const instance = getDataSelector();
            return instance.fetchPanelData(plant, startDate, endDate);
        },
        
        fetchPlants: function() {
            const instance = getDataSelector();
            return instance.fetchPlants();
        },
        
        // PERBAIKAN: Tambahkan callAPI untuk compatibility
        callAPI: function(endpoint, params, method, body) {
            const instance = getDataSelector();
            return instance.callAPI(endpoint, params, method, body);
        },
        
        // Quick initialization dengan auto-export
        initialize: function() {
            const instance = initDataSelector();
            
            // Auto-export methods ke window untuk backward compatibility
            if (!window.dataSelector) {
                window.dataSelector = instance;
            }
            
            return instance;
        }
    };
    
    console.log('=== DATASELECTOR.JS LOADED (IIFE Regular - No Plugin API) ===');
    
    // Auto-initialize jika diperlukan
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DataSelector: Auto-initializing on DOMContentLoaded...');
            
            // Tunggu sedikit untuk memastikan semua script lain sudah dimuat
            setTimeout(() => {
                if (window.DataSelector && window.DataSelector.initialize) {
                    window.DataSelector.initialize();
                }
            }, 300);
        });
    } else {
        console.log('DataSelector: DOM already loaded, checking for auto-init...');
        
        setTimeout(() => {
            if (window.DataSelector && window.DataSelector.initialize) {
                window.DataSelector.initialize();
            }
        }, 400);
    }
    
})();