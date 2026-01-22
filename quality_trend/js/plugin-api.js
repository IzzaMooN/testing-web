// moduls/quality_trend/plugin-api.js - UPDATED WITH PLUGIN REWRITE
// Plugin API khusus untuk Quality Trend Management dengan rewrite capability

(function() {
    'use strict';
    
    // ============================================
    // KONFIGURASI PLUGIN QUALITY TREND
    // ============================================
    const PLUGIN_CONFIG = {
        name: 'quality_trend',
        author: 'Quality Management Team',
        description: 'API untuk manajemen data quality trend dan monitoring',
        version: '2.0.0-rewrite',
        requires: ['PLUGIN_API'],
        standard: true  // Menandakan bahwa ini adalah plugin standard
    };
    
    console.log(`📈 Initializing ${PLUGIN_CONFIG.name} v${PLUGIN_CONFIG.version} (Rewrite Mode)`);
    
    // ============================================
    // PATH RESOLVER (untuk menentukan path plugin)
    // ============================================
    class QualityTrendPathResolver {
        constructor() {
            this.scriptPath = document.currentScript?.src || '';
            this.basePath = this.calculateBasePath();
            console.log(`📍 ${PLUGIN_CONFIG.name} Base Path: ${this.basePath}`);
        }
        
        calculateBasePath() {
            if (this.scriptPath) {
                try {
                    const scriptUrl = new URL(this.scriptPath);
                    const pathParts = scriptUrl.pathname.split('/');
                    pathParts.pop(); // Hapus nama file
                    
                    // Jika ada folder 'js', hapus juga
                    if (pathParts[pathParts.length - 1] === 'js') {
                        pathParts.pop();
                    }
                    
                    const basePath = pathParts.join('/');
                    return basePath;
                } catch (e) {
                    console.warn('⚠️ Error parsing script URL:', e);
                }
            }
            
            // Fallback: cari dari URL atau path default
            const currentPath = window.location.pathname;
            const pathParts = currentPath.split('/');
            
            const modulsIndex = pathParts.indexOf('moduls');
            if (modulsIndex !== -1 && pathParts.length > modulsIndex + 1) {
                const pluginPath = pathParts.slice(0, modulsIndex + 2).join('/');
                return pluginPath;
            }
            
            // Default untuk quality_trend
            return '/QI/moduls/quality_trend/';
        }
        
        resolve(relativePath) {
            const cleanPath = relativePath.replace(/^\//, '');
            
            if (cleanPath.startsWith('http') || cleanPath.startsWith('//')) {
                return cleanPath;
            }
            
            const fullPath = `${this.basePath}/${cleanPath}`.replace(/\/+/g, '/');
            return fullPath;
        }
        
        getApiPath() {
            return this.basePath + '/php/';
        }
        
        getBaseUrl() {
            return window.location.origin + this.basePath;
        }
    }
    
    // ============================================
    // PLUGIN REWRITE UTILITY
    // ============================================
    const PluginRewriteManager = {
        /**
         * Cek apakah plugin ini yang seharusnya aktif sekarang
         * @returns {boolean} True jika plugin ini yang aktif
         */
        shouldTakeOver() {
            // Cek URL untuk menentukan plugin mana yang aktif
            const currentUrl = window.location.href;
            const pluginParam = this.getPluginParameter();
            
            if (pluginParam && pluginParam.includes('quality_trend')) {
                console.log(`🎯 Quality Trend plugin detected in URL, taking over PLUGIN_API`);
                return true;
            }
            
            // Cek juga berdasarkan path atau lainnya
            const currentPath = window.location.pathname;
            if (currentPath.includes('quality_trend')) {
                console.log(`🎯 Quality Trend path detected, taking over PLUGIN_API`);
                return true;
            }
            
            return false;
        },
        
        /**
         * Dapatkan parameter plugin dari URL
         * @returns {string|null} Parameter plugin
         */
        getPluginParameter() {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('plugin');
        },
        
        /**
         * Rewrite/update global PLUGIN_API dengan API quality_trend
         * @param {QualityTrendAPI} apiInstance Instance API quality_trend
         */
        rewriteGlobalAPI(apiInstance) {
            console.log(`🔄 Rewriting global PLUGIN_API for ${PLUGIN_CONFIG.name}`);
            
            // Backup API lama jika ada
            const oldAPI = window.PLUGIN_API;
            if (oldAPI && oldAPI !== apiInstance) {
                console.log(`📦 Backed up previous PLUGIN_API`);
                window._PREVIOUS_PLUGIN_API = oldAPI;
            }
            
            // Rewrite global objects
            window.PLUGIN_API = apiInstance;
            
            // Export juga sebagai QualityTrendAPI untuk compatibility
            if (!window.QualityTrendAPI) {
                window.QualityTrendAPI = apiInstance;
            }
            
            // Export sebagai pluginAPI (standard)
            window.pluginAPI = {
                initialized: true,
                api: apiInstance,
                
                // Standard methods
                get: async function(endpoint, params = {}) {
                    return await apiInstance.get(endpoint, params);
                },
                
                post: async function(endpoint, data = {}) {
                    return await apiInstance.post(endpoint, data);
                },
                
                call: async function(endpoint, method = 'GET', data = null) {
                    return await apiInstance.call(endpoint, method, data);
                },
                
                postFormData: async function(endpoint, formData) {
                    return await apiInstance.postFormData(endpoint, formData);
                },
                
                // Quality Trend specific methods
                authenticate: async function(credentials) {
                    return await apiInstance.authenticate(credentials);
                },
                
                getTagValues: async function(params) {
                    return await apiInstance.getTagValues(params);
                },
                
                getMultipleTagValues: async function(params) {
                    return await apiInstance.getMultipleTagValues(params);
                },
                
                getTagNames: async function(params) {
                    return await apiInstance.getTagNames(params);
                },
                
                getPanelData: async function(params) {
                    return await apiInstance.getPanelData(params);
                },
                
                getPlants: async function() {
                    return await apiInstance.getPlants();
                },
                
                manageTemplate: async function(action, data) {
                    return await apiInstance.manageTemplate(action, data);
                },
                
                // Utility methods
                clearCache: function(pattern = null) {
                    return apiInstance.clearCache(pattern);
                },
                
                // Debug info
                debug: function() {
                    return apiInstance.debug();
                },
                
                status: function() {
                    return apiInstance.status();
                }
            };
            
            console.log(`✅ Global PLUGIN_API rewritten for ${PLUGIN_CONFIG.name}`);
        },
        
        /**
         * Restore API sebelumnya (jika perlu)
         */
        restorePreviousAPI() {
            if (window._PREVIOUS_PLUGIN_API) {
                console.log(`↩️ Restoring previous PLUGIN_API`);
                window.PLUGIN_API = window._PREVIOUS_PLUGIN_API;
                delete window._PREVIOUS_PLUGIN_API;
            }
        }
    };
    
    // ============================================
    // INISIALISASI PLUGIN API
    // ============================================
    function initializePlugin() {
        console.log(`✅ ${PLUGIN_CONFIG.name}: Initializing with rewrite capability...`);
        
        /**
         * Class untuk API Quality Trend dengan rewrite support
         * @class QualityTrendAPI
         */
        class QualityTrendAPI {
            constructor() {
                // Metadata plugin
                this.pluginName = PLUGIN_CONFIG.name;
                this.author = PLUGIN_CONFIG.author;
                this.version = PLUGIN_CONFIG.version;
                
                // Path resolver
                this.pathResolver = new QualityTrendPathResolver();
                
                // Konfigurasi API
                this.config = {
                    apiPath: this.pathResolver.getApiPath(),
                    baseUrl: this.pathResolver.getBaseUrl(),
                    timeout: 30000,
                    retryAttempts: 2,
                    endpoints: {
                        auth: 'php/auth-for-trend.php',
                        get_tag_values: 'php/get_tag_values.php',
                        get_multiple_tag_values: 'php/get_multiple_tag_values.php',
                        get_tagnames: 'php/get_tagnames.php',
                        get_panel_data: 'php/get_panel_data.php',
                        get_plants: 'php/get_plants.php',
                        template_manager: 'php/template_manager.php'
                    }
                };
                
                // ============================================
                // BACKWARD COMPATIBILITY SECTION
                // ============================================
                // Untuk compatibility dengan kode lama yang mengakses window.QualityTrendAPI.api.baseUrl
                this.api = {
                    baseUrl: this.pathResolver.getBaseUrl(),
                    pluginPath: 'moduls/quality_trend/',
                    getBaseUrl: () => this.pathResolver.getBaseUrl(),
                    getApiPath: () => this.pathResolver.getApiPath(),
                    resolve: (path) => this.pathResolver.resolve(path)
                };
                
                // Juga tambahkan baseUrl langsung di root untuk kemudahan akses
                this.baseUrl = this.pathResolver.getBaseUrl();
                // ============================================
                
                // Status
                this.initialized = true;
                this.requestCount = 0;
                this.cache = new Map();
                this.cacheDuration = 30000;
                this.authToken = localStorage.getItem('quality_trend_token');
                
                console.log(`✅ ${this.pluginName} v${this.version} ready`);
                console.log(`📍 API Path: ${this.config.apiPath}`);
                console.log(`📍 Base URL: ${this.baseUrl}`);
            }
            
            // ============================================
            // CORE API METHODS
            // ============================================
            
            /**
             * Generic GET method dengan cache dan error handling
             * @param {string} endpoint - Endpoint URL
             * @param {Object} params - Query parameters
             * @param {boolean} useCache - Gunakan cache
             * @returns {Promise<Object>} Response object
             */
            async get(endpoint, params = {}, useCache = true) {
                const startTime = Date.now();
                this.requestCount++;
                const requestId = `QT_GET_${this.requestCount}_${Date.now()}`;
                
                console.log(`📡 [${requestId}] Fetching: ${endpoint}`);
                
                // Check cache
                const cacheKey = this.generateCacheKey(endpoint, params);
                if (useCache && this.cache.has(cacheKey)) {
                    const cached = this.cache.get(cacheKey);
                    if (Date.now() - cached.timestamp < this.cacheDuration) {
                        console.log(`⚡ [${requestId}] Cache hit for: ${endpoint}`);
                        return { ...cached.data, fromCache: true };
                    } else {
                        console.log(`🧹 [${requestId}] Cache expired for: ${endpoint}`);
                        this.cache.delete(cacheKey);
                    }
                }
                
                try {
                    // Build URL
                    let url;
                    
                    if (endpoint.startsWith('http')) {
                        url = endpoint;
                    } else if (endpoint.startsWith('php/')) {
                        url = this.pathResolver.resolve(endpoint);
                    } else if (endpoint.includes('.php')) {
                        url = this.pathResolver.resolve('php/' + endpoint);
                    } else {
                        url = this.pathResolver.resolve('php/' + endpoint);
                    }
                    
                    // Build query string
                    const queryString = this.buildQueryString(params);
                    if (queryString) {
                        url += (url.includes('?') ? '&' : '?') + queryString;
                    }
                    
                    // Tambahkan cache buster
                    url += (url.includes('?') ? '&' : '?') + `_cb=${Date.now()}`;
                    
                    console.log(`📤 [${requestId}] Request URL: ${url}`);
                    
                    // Prepare headers
                    const headers = {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    };
                    
                    // Tambahkan auth token jika ada
                    if (this.authToken) {
                        headers['Authorization'] = `Bearer ${this.authToken}`;
                    }
                    
                    // Fetch dengan timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: headers,
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    const data = await response.json();
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    console.log(`✅ [${requestId}] Success in ${duration}ms`);
                    
                    // Cache the response
                    if (useCache) {
                        this.cache.set(cacheKey, {
                            data: { success: true, data: data, duration },
                            timestamp: Date.now()
                        });
                    }
                    
                    return {
                        success: true,
                        data: data,
                        duration: duration,
                        fromCache: false
                    };
                    
                } catch (error) {
                    console.error(`❌ [${requestId}] Error:`, error);
                    
                    return {
                        success: false,
                        error: error.message,
                        duration: Date.now() - startTime
                    };
                }
            }
            
            /**
             * Generic POST method
             * @param {string} endpoint - Endpoint URL
             * @param {Object} data - Data to send
             * @returns {Promise<Object>} Response object
             */
            async post(endpoint, data = {}) {
                const startTime = Date.now();
                this.requestCount++;
                const requestId = `QT_POST_${this.requestCount}_${Date.now()}`;
                
                console.log(`📡 [${requestId}] POST to: ${endpoint}`);
                
                try {
                    // Build URL
                    let url;
                    
                    if (endpoint.startsWith('http')) {
                        url = endpoint;
                    } else if (endpoint.startsWith('php/')) {
                        url = this.pathResolver.resolve(endpoint);
                    } else if (endpoint.includes('.php')) {
                        url = this.pathResolver.resolve('php/' + endpoint);
                    } else {
                        url = this.pathResolver.resolve('php/' + endpoint);
                    }
                    
                    // Tambahkan cache buster
                    url += (url.includes('?') ? '&' : '?') + `_cb=${Date.now()}`;
                    
                    console.log(`📤 [${requestId}] Request URL: ${url}`);
                    
                    // Prepare headers
                    const headers = {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    };
                    
                    // Tambahkan auth token jika ada
                    if (this.authToken) {
                        headers['Authorization'] = `Bearer ${this.authToken}`;
                    }
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(data)
                    });
                    
                    const result = await response.json();
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    console.log(`✅ [${requestId}] POST success in ${duration}ms`);
                    
                    return {
                        success: true,
                        data: result,
                        duration: duration
                    };
                    
                } catch (error) {
                    console.error(`❌ [${requestId}] POST Error:`, error);
                    
                    return {
                        success: false,
                        error: error.message,
                        duration: Date.now() - startTime
                    };
                }
            }
            
            /**
             * POST FormData (untuk upload file)
             * @param {string} endpoint - Endpoint URL
             * @param {FormData} formData - Form data
             * @returns {Promise<Object>} Response object
             */
            async postFormData(endpoint, formData) {
                const startTime = Date.now();
                this.requestCount++;
                const requestId = `QT_FORM_${this.requestCount}_${Date.now()}`;
                
                console.log(`📡 [${requestId}] POST FormData to: ${endpoint}`);
                
                try {
                    // Build URL
                    let url;
                    
                    if (endpoint.startsWith('http')) {
                        url = endpoint;
                    } else if (endpoint.startsWith('php/')) {
                        url = this.pathResolver.resolve(endpoint);
                    } else if (endpoint.includes('.php')) {
                        url = this.pathResolver.resolve('php/' + endpoint);
                    } else {
                        url = this.pathResolver.resolve('php/' + endpoint);
                    }
                    
                    // Tambahkan cache buster
                    url += (url.includes('?') ? '&' : '?') + `_cb=${Date.now()}`;
                    
                    console.log(`📤 [${requestId}] Request URL: ${url}`);
                    
                    // Prepare headers
                    const headers = {};
                    
                    // Tambahkan auth token jika ada
                    if (this.authToken) {
                        headers['Authorization'] = `Bearer ${this.authToken}`;
                    }
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: headers,
                        body: formData
                    });
                    
                    const result = await response.json();
                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    
                    console.log(`✅ [${requestId}] FormData POST success in ${duration}ms`);
                    
                    return {
                        success: true,
                        data: result,
                        duration: duration
                    };
                    
                } catch (error) {
                    console.error(`❌ [${requestId}] FormData POST Error:`, error);
                    
                    return {
                        success: false,
                        error: error.message,
                        duration: Date.now() - startTime
                    };
                }
            }
            
            // ============================================
            // AUTHENTICATION METHODS
            // ============================================
            
            /**
             * Authenticate user
             * @param {Object} credentials - User credentials {username, password}
             * @returns {Promise<Object>} Authentication result
             */
            async authenticate(credentials) {
                try {
                    console.log(`🔐 Authenticating user: ${credentials.username}`);
                    
                    const result = await this.post(this.config.endpoints.auth, credentials);
                    
                    if (result.success && result.data && result.data.token) {
                        // Simpan token
                        this.authToken = result.data.token;
                        localStorage.setItem('quality_trend_token', this.authToken);
                        localStorage.setItem('quality_trend_user', JSON.stringify(result.data.user || {}));
                        
                        console.log(`✅ Authentication successful`);
                        
                        // Clear cache karena status user berubah
                        this.clearCache();
                    } else if (result.success === false) {
                        // Clear token jika gagal
                        this.authToken = null;
                        localStorage.removeItem('quality_trend_token');
                        localStorage.removeItem('quality_trend_user');
                    }
                    
                    return result;
                    
                } catch (error) {
                    console.error(`❌ Authentication error:`, error);
                    return {
                        success: false,
                        error: error.message,
                        message: 'Authentication failed'
                    };
                }
            }
            
            /**
             * Logout user
             */
            logout() {
                this.authToken = null;
                localStorage.removeItem('quality_trend_token');
                localStorage.removeItem('quality_trend_user');
                this.clearCache();
                console.log(`👋 User logged out`);
                
                return {
                    success: true,
                    message: 'Logged out successfully'
                };
            }
            
            // Di dalam QualityTrendAPI class (plugin-api.js)
            async checkSessionFromHome() {
                try {
                    console.log('🔍 Checking session from home system...');
                    
                    // Gunakan path absolut ke auth.php home system
                    const response = await fetch('/QI/php/auth.php?action=check_session', {
                        method: 'GET',
                        credentials: 'include'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success && result.user) {
                        // Simpan user ke localStorage untuk dipakai plugin
                        localStorage.setItem('quality_trend_user', JSON.stringify(result.user));
                        this.authToken = 'session_sync_' + Date.now();
                        
                        console.log('✅ User authenticated from home system:', result.user.username);
                        return {
                            success: true,
                            user: result.user
                        };
                    }
                    
                    return result;
                    
                } catch (error) {
                    console.error('Error checking session from home:', error);
                    return {
                        success: false,
                        error: error.message
                    };
                }
            }

            // Update isAuthenticated method
            isAuthenticated() {
                // Cek dari home system atau dari local storage
                const userFromHome = localStorage.getItem('currentUser'); // Dari home system
                const userFromPlugin = localStorage.getItem('quality_trend_user');
                
                return !!(userFromHome || userFromPlugin || this.authToken);
            }

            // Update getCurrentUser method
            getCurrentUser() {
                try {
                    // Prioritaskan dari home system
                    const userFromHome = localStorage.getItem('currentUser');
                    if (userFromHome) {
                        return JSON.parse(userFromHome);
                    }
                    
                    // Fallback ke plugin storage
                    const userFromPlugin = localStorage.getItem('quality_trend_user');
                    return userFromPlugin ? JSON.parse(userFromPlugin) : null;
                    
                } catch (e) {
                    return null;
                }
            }
            
            // ============================================
            // DATA METHODS
            // ============================================
            
            /**
             * Get tag values
             * @param {Object} params - Parameters {tag_name, start_date, end_date, interval, plant}
             * @returns {Promise<Object>} Tag values data
             */
            async getTagValues(params) {
                try {
                    console.log(`📊 Getting tag values for:`, params);
                    
                    const result = await this.get(this.config.endpoints.get_tag_values, params);
                    
                    if (!result || !result.success) {
                        console.warn('⚠️ Failed to get tag values:', result?.error);
                        return {
                            success: false,
                            status: 'error',
                            message: result?.error || 'Failed to get tag values',
                            data: []
                        };
                    }
                    
                    const data = result.data?.data || result.data || [];
                    
                    console.log(`✅ Retrieved ${data.length || 0} tag values`);
                    return {
                        success: true,
                        status: 'success',
                        data: data,
                        count: data.length || 0,
                        message: 'Tag values retrieved successfully'
                    };
                    
                } catch (error) {
                    console.error(`❌ Error getting tag values:`, error);
                    return {
                        success: false,
                        status: 'error',
                        error: error.message,
                        message: error.message,
                        data: []
                    };
                }
            }
            
            /**
             * Get multiple tag values
             * @param {Object} params - Parameters {tags[], start_date, end_date, interval, plant}
             * @returns {Promise<Object>} Multiple tag values data
             */
            // plugin-api.js - dalam getMultipleTagValues() method
            async getMultipleTagValues(params) {
                try {
                    console.log(`📊 Getting multiple tag values for ${params.tags?.length || 0} tags`);
                    console.log('🔍 getMultipleTagValues params:', JSON.stringify(params, null, 2));
                    
                    // PERBAIKAN: Handle berbagai format parameter
                    let apiParams = {};
                    
                    if (params.tagnames) {
                        // Format 1: tagnames sebagai string comma-separated
                        apiParams.tagnames = params.tagnames;
                    } else if (params.tags && Array.isArray(params.tags)) {
                        // Format 2: tags sebagai array
                        apiParams.tagnames = params.tags.join(',');
                    } else if (params.tags && typeof params.tags === 'string') {
                        // Format 3: tags sebagai string comma-separated
                        apiParams.tagnames = params.tags;
                    }
                    
                    // Tambahkan tanggal
                    if (params.start_date) {
                        apiParams.start_date = params.start_date;
                    }
                    if (params.end_date) {
                        apiParams.end_date = params.end_date;
                    }
                    
                    console.log('📋 Final API params:', apiParams);
                    
                    const result = await this.post(this.config.endpoints.get_multiple_tag_values, apiParams);

                    console.log('📦 Raw API response STRUCTURE:', {
                        success: result.success,
                        data_type: typeof result.data,
                        data_keys: Object.keys(result.data || {}),
                        full_response: result
                    });
                    
                    console.log('📦 Raw API response DATA:', result.data);
                    
                    // PERBAIKAN PENTING: JANGAN cek result.success di sini
                    // Biarkan parsing rawData yang menentukan apakah data ditemukan atau tidak
                    // const rawData = result.data;
                    
                    // PERBAIKAN: Ekstrak rawData dengan benar
                    const rawData = result.data || {};
                    console.log('🔍 Parsing rawData:', {
                        rawData_success: rawData.success,
                        rawData_message: rawData.message,
                        rawData_data_type: typeof rawData.data,
                        rawData_keys: Object.keys(rawData || {})
                    });
                    
                    let actualData = {};
                    
                    // PERBAIKAN: Handle berbagai kasus dengan lebih baik
                    
                    // KASUS 1: rawData.data adalah object dengan data (meski rawData.success false)
                    if (rawData.data && typeof rawData.data === 'object') {
                        // PERBAIKAN: RawData mungkin punya success: false, tapi data adalah object
                        // Contoh: {success: false, message: "...", data: {tag1: [], tag2: []}}
                        actualData = rawData.data;
                        console.log('✅ Case 1: Data from rawData.data (regardless of success flag)');
                    }
                    // KASUS 2: rawData sendiri adalah object data (format langsung)
                    else if (rawData && typeof rawData === 'object') {
                        // Filter out metadata properties
                        const metadataKeys = ['success', 'message', 'status', 'error', 'debug', 'timestamp', 'count'];
                        const dataKeys = Object.keys(rawData).filter(key => !metadataKeys.includes(key));
                        
                        if (dataKeys.length > 0) {
                            // PERBAIKAN: Jika ada properti selain metadata, itu adalah data
                            dataKeys.forEach(key => {
                                actualData[key] = rawData[key];
                            });
                            console.log(`✅ Case 2: Data from rawData keys: ${dataKeys.join(', ')}`);
                        } else {
                            // PERBAIKAN: Jika tidak ada data keys, coba cari di struktur nested
                            const possibleDataKeys = ['data', 'values', 'results', 'items'];
                            for (const key of possibleDataKeys) {
                                if (rawData[key] && typeof rawData[key] === 'object') {
                                    actualData = rawData[key];
                                    console.log(`✅ Case 2b: Found data in nested key: ${key}`);
                                    break;
                                }
                            }
                        }
                    }
                    
                    // PERBAIKAN: Jika actualData masih kosong, buat object dengan array kosong untuk setiap tag
                    if (Object.keys(actualData).length === 0) {
                        console.warn('⚠️ No data extracted, creating empty structure for requested tags');
                        
                        // Buat struktur kosong untuk semua tag yang diminta
                        const requestedTags = params.tags || (params.tagnames ? params.tagnames.split(',') : []);
                        requestedTags.forEach(tag => {
                            if (tag && typeof tag === 'string') {
                                actualData[tag] = [];
                            }
                        });
                        
                        console.log('✅ Created empty data structure for tags:', requestedTags);
                    }
                    
                    console.log(`✅ Final actualData keys:`, Object.keys(actualData));
                    
                    // Debug setiap tag
                    if (params.tags && Array.isArray(params.tags)) {
                        params.tags.forEach(tagName => {
                            const tagData = actualData[tagName];
                            console.log(`🔍 Tag "${tagName}":`, {
                                exists: tagData !== undefined,
                                isArray: Array.isArray(tagData),
                                count: tagData?.length || 0,
                                sample: tagData ? tagData.slice(0, 2) : 'none'
                            });
                        });
                    }
                    
                    // PERBAIKAN: Return success: true as long as the API call completed
                    // Data bisa kosong, itu normal
                    return {
                        success: true, // PERBAIKAN PENTING: Selalu true kalau API call selesai
                        status: 'success',
                        data: actualData,
                        count: Object.keys(actualData).length || 0,
                        message: actualData && Object.keys(actualData).length > 0 
                            ? 'Multiple tag values retrieved successfully' 
                            : 'No data found for requested tags',
                        rawResponse: result // Untuk debugging
                    };
                    
                } catch (error) {
                    console.error(`❌ Error getting multiple tag values:`, error);
                    return {
                        success: false,
                        status: 'error',
                        error: error.message,
                        message: error.message,
                        data: {}
                    };
                }
            }
            
            /**
             * Get tag names
             * @param {Object} params - Parameters {plant, search, limit, offset}
             * @returns {Promise<Object>} Tag names data
             */
            async getTagNames(params = {}) {
                try {
                    console.log(`🏷️ Getting tag names`);
                    
                    const result = await this.get(this.config.endpoints.get_tagnames, params);
                    
                    if (!result || !result.success) {
                        console.warn('⚠️ Failed to get tag names:', result?.error);
                        return {
                            success: false,
                            status: 'error',
                            message: result?.error || 'Failed to get tag names',
                            data: []
                        };
                    }
                    
                    const data = result.data?.data || result.data || [];
                    
                    console.log(`✅ Retrieved ${data.length || 0} tag names`);
                    return {
                        success: true,
                        status: 'success',
                        data: data,
                        count: data.length || 0,
                        message: 'Tag names retrieved successfully'
                    };
                    
                } catch (error) {
                    console.error(`❌ Error getting tag names:`, error);
                    return {
                        success: false,
                        status: 'error',
                        error: error.message,
                        message: error.message,
                        data: []
                    };
                }
            }
            
            /**
             * Get panel data
             * @param {Object} params - Parameters {panel_id, date_range, plant}
             * @returns {Promise<Object>} Panel data
             */
            async getPanelData(params) {
                try {
                    console.log(`📋 Getting panel data`);
                    
                    const result = await this.get(this.config.endpoints.get_panel_data, params);
                    
                    if (!result || !result.success) {
                        console.warn('⚠️ Failed to get panel data:', result?.error);
                        return {
                            success: false,
                            status: 'error',
                            message: result?.error || 'Failed to get panel data',
                            data: []
                        };
                    }
                    
                    const data = result.data?.data || result.data || [];
                    
                    console.log(`✅ Retrieved panel data successfully`);
                    return {
                        success: true,
                        status: 'success',
                        data: data,
                        count: data.length || 0,
                        message: 'Panel data retrieved successfully'
                    };
                    
                } catch (error) {
                    console.error(`❌ Error getting panel data:`, error);
                    return {
                        success: false,
                        status: 'error',
                        error: error.message,
                        message: error.message,
                        data: []
                    };
                }
            }
            
            /**
             * Get plants list
             * @returns {Promise<Object>} Plants data
             */
            async getPlants() {
                try {
                    console.log(`🏭 Getting plants list`);
                    
                    const result = await this.get(this.config.endpoints.get_plants);
                    
                    if (!result || !result.success) {
                        console.warn('⚠️ Failed to get plants:', result?.error);
                        return {
                            success: false,
                            status: 'error',
                            message: result?.error || 'Failed to get plants',
                            data: []
                        };
                    }
                    
                    // PERBAIKAN: Handle berbagai format respons
                    const rawData = result.data;
                    console.log('🌱 Raw plants data from API:', rawData);
                    
                    let plantsArray = [];
                    
                    if (Array.isArray(rawData)) {
                        // Format 1: Langsung array
                        plantsArray = rawData;
                    } else if (rawData && Array.isArray(rawData.plants)) {
                        // Format 2: { success: true, plants: [...] }
                        plantsArray = rawData.plants;
                    } else if (rawData && Array.isArray(rawData.data)) {
                        // Format 3: { success: true, data: [...] }
                        plantsArray = rawData.data;
                    } else if (rawData && rawData.success === true && rawData.plants) {
                        // Format 4: Nested dalam result.data
                        plantsArray = rawData.plants;
                    }
                    
                    console.log(`✅ Retrieved ${plantsArray.length} plants:`, plantsArray);
                    return {
                        success: true,
                        status: 'success',
                        data: plantsArray,
                        plants: plantsArray, // Juga export sebagai plants untuk compatibility
                        count: plantsArray.length,
                        message: 'Plants retrieved successfully'
                    };
                    
                } catch (error) {
                    console.error(`❌ Error getting plants:`, error);
                    return {
                        success: false,
                        status: 'error',
                        error: error.message,
                        message: error.message,
                        data: []
                    };
                }
            }

            
            // ============================================
            // TEMPLATE MANAGEMENT METHODS
            // ============================================
            
            /**
             * Manage templates
             * @param {string} action - Action (create, read, update, delete, list)
             * @param {Object} data - Template data
             * @returns {Promise<Object>} Template operation result
             */
            async manageTemplate(action, data = {}) {
                try {
                    console.log(`📝 Managing template (${action})`);
                    
                    const postData = {
                        action: action,
                        ...data
                    };
                    
                    const result = await this.post(this.config.endpoints.template_manager, postData);
                    
                    if (result.success) {
                        console.log(`✅ Template ${action} successful`);
                        // Clear cache untuk templates
                        this.clearCache('template');
                    } else {
                        console.error(`❌ Failed to ${action} template:`, result.error);
                    }
                    
                    return result;
                    
                } catch (error) {
                    console.error(`❌ Error managing template:`, error);
                    return {
                        success: false,
                        error: error.message,
                        message: `Failed to ${action} template`
                    };
                }
            }
            
            /**
             * Get all templates
             * @returns {Promise<Object>} Templates list
             */
            async getTemplates(username = null) {
                try {
                    console.log(`📝 Getting templates for user: ${username || 'current'}`);
                    
                    let params = {};
                    if (username) {
                        params = { username: username };
                    }
                    
                    // KIRIM USERNAME SEBAGAI PARAMETER GET
                    const result = await this.get('php/template_manager.php', { 
                        action: 'list',
                        username: username || this.getCurrentUser()?.username
                    });
                    
                    if (result.success && result.data) {
                        console.log(`✅ Retrieved ${result.data.templates?.length || 0} templates`);
                        return {
                            success: true,
                            templates: result.data.templates || [],
                            message: 'Templates retrieved successfully'
                        };
                    } else {
                        console.error('❌ Failed to get templates:', result.error || result.data?.message);
                        return {
                            success: false,
                            message: result.data?.message || result.error || 'Failed to get templates',
                            templates: []
                        };
                    }
                    
                } catch (error) {
                    console.error(`❌ Error getting templates:`, error);
                    return {
                        success: false,
                        error: error.message,
                        message: error.message,
                        templates: []
                    };
                }
            }
            
            /**
             * Create new template
             * @param {Object} templateData - Template data
             * @returns {Promise<Object>} Creation result
             */
            async createTemplate(templateData) {
                return await this.manageTemplate('create', templateData);
            }
            
            /**
             * Update template
             * @param {string|number} templateId - Template ID
             * @param {Object} templateData - Template data
             * @returns {Promise<Object>} Update result
             */
            async updateTemplate(templateId, templateData) {
                return await this.manageTemplate('update', {
                    id: templateId,
                    ...templateData
                });
            }
            
            /**
             * Delete template
             * @param {string|number} templateId - Template ID
             * @returns {Promise<Object>} Delete result
             */
            async deleteTemplate(templateId) {
                return await this.manageTemplate('delete', { id: templateId });
            }
            
            /**
             * Get template by ID
             * @param {string|number} templateId - Template ID
             * @returns {Promise<Object>} Template data
             */
            async getTemplate(templateId) {
                try {
                    console.log(`📝 Getting template ID: ${templateId}`);
                    
                    // Gunakan GET request ke endpoint yang benar
                    const result = await this.get('php/template_manager.php', { 
                        action: 'detail',
                        template_id: templateId
                    });
                    
                    console.log('📦 Full API response:', result); // DEBUG
                    
                    if (result.success && result.data) {
                        const apiData = result.data;
                        console.log('🔍 API data structure:', {
                            hasSuccess: apiData.success,
                            hasTemplate: !!apiData.template,
                            templateKeys: apiData.template ? Object.keys(apiData.template) : [],
                            hasTags: apiData.template && apiData.template.tags !== undefined,
                            tags: apiData.template ? apiData.template.tags : 'NO TAGS'
                        });
                        
                        // PERBAIKAN: Handle berbagai format respons
                        if (!apiData.success) {
                            throw new Error(apiData.message || 'Template not found');
                        }
                        
                        const template = apiData.template;
                        
                        if (!template) {
                            throw new Error('Template data not found in response');
                        }
                        
                        // Ekstrak tags dengan cara yang lebih aman
                        let tagsArray = [];
                        
                        if (template.tags && Array.isArray(template.tags)) {
                            // Tags sudah dalam bentuk array
                            tagsArray = template.tags;
                            console.log(`✅ Tags as array (${tagsArray.length}):`, tagsArray);
                        } else if (typeof template.tags === 'string') {
                            // Tags sebagai string comma-separated
                            tagsArray = template.tags.split(',')
                                .map(tag => tag.trim())
                                .filter(tag => tag);
                            console.log(`✅ Tags parsed from string (${tagsArray.length}):`, tagsArray);
                        } else {
                            console.warn('⚠️ No tags found in template:', template);
                            tagsArray = [];
                        }
                        
                        console.log(`🏷️ Final extracted tags (${tagsArray.length}):`, tagsArray);
                        
                        return {
                            success: true,
                            template: {
                                ...template,
                                tags: tagsArray
                            },
                            data: {
                                ...template,
                                tags: tagsArray
                            },
                            message: 'Template retrieved successfully'
                        };
                        
                    } else {
                        console.error('❌ API call failed:', result);
                        return {
                            success: false,
                            error: result.data?.message || result.error || 'Template not found',
                            message: result.data?.message || result.error || 'Failed to get template'
                        };
                    }
                } catch (error) {
                    console.error(`❌ Error in getTemplate:`, error);
                    return {
                        success: false,
                        error: error.message,
                        message: `Failed to get template: ${error.message}`
                    };
                }
            }
            
            // ============================================
            // UTILITY METHODS
            // ============================================
            
            /**
             * Build query string from parameters
             * @param {Object} params - Parameters object
             * @returns {string} Query string
             */
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
            
            /**
             * Generate cache key
             * @param {string} endpoint - Endpoint
             * @param {Object} params - Parameters
             * @returns {string} Cache key
             */
            generateCacheKey(endpoint, params) {
                const paramsStr = JSON.stringify(params);
                return `${endpoint}_${paramsStr}`;
            }
            
            /**
             * Clear cache
             * @param {string|null} pattern - Pattern to match (optional)
             */
            clearCache(pattern = null) {
                if (!pattern) {
                    this.cache.clear();
                    console.log(`🧹 Cache cleared completely`);
                } else {
                    let cleared = 0;
                    for (const [key] of this.cache) {
                        if (key.includes(pattern)) {
                            this.cache.delete(key);
                            cleared++;
                        }
                    }
                    console.log(`🧹 Cache cleared for pattern "${pattern}": ${cleared} entries`);
                }
            }
            
            /**
             * Generic call method
             * @param {string} endpoint - Endpoint
             * @param {string} method - HTTP method
             * @param {Object|null} data - Data to send
             * @returns {Promise<Object>} Response
             */
            async call(endpoint, method = 'GET', data = null) {
                if (method === 'GET') {
                    return await this.get(endpoint, data || {});
                } else {
                    return await this.post(endpoint, data || {});
                }
            }
            
            // ============================================
            // DEBUG & STATUS METHODS
            // ============================================
            
            /**
             * Get debug information
             * @returns {Object} Debug info
             */
            debug() {
                return {
                    name: PLUGIN_CONFIG.name,
                    version: PLUGIN_CONFIG.version,
                    description: PLUGIN_CONFIG.description,
                    author: PLUGIN_CONFIG.author,
                    initialized: this.initialized,
                    requestCount: this.requestCount,
                    cacheSize: this.cache.size,
                    authenticated: this.isAuthenticated(),
                    currentUser: this.getCurrentUser(),
                    config: this.config,
                    availableMethods: [
                        'authenticate',
                        'logout',
                        'isAuthenticated',
                        'getCurrentUser',
                        'getTagValues',
                        'getMultipleTagValues',
                        'getTagNames',
                        'getPanelData',
                        'getPlants',
                        'manageTemplate',
                        'getTemplates',
                        'createTemplate',
                        'updateTemplate',
                        'deleteTemplate',
                        'getTemplate'
                    ]
                };
            }
            
            /**
             * Get API status
             * @returns {Object} Status info
             */
            status() {
                return {
                    online: navigator.onLine,
                    authenticated: this.isAuthenticated(),
                    requests: this.requestCount,
                    cacheEntries: this.cache.size,
                    initialized: this.initialized,
                    timestamp: Date.now()
                };
            }
        }
        
        // ============================================
        // CREATE AND EXPORT API INSTANCE
        // ============================================
        
        const apiInstance = new QualityTrendAPI();
        
        // Cek apakah kita perlu mengambil alih PLUGIN_API
        if (PluginRewriteManager.shouldTakeOver()) {
            // Rewrite global PLUGIN_API dengan API kita
            PluginRewriteManager.rewriteGlobalAPI(apiInstance);
        } else {
            // Simpan dengan nama spesifik
            window.QualityTrendAPI = apiInstance;
            
            // Juga export sebagai pluginAPI untuk compatibility
            window.pluginAPI = apiInstance;
        }
        
        // Dispatch event bahwa plugin API ready
        window.dispatchEvent(new CustomEvent('pluginAPIReady', {
            detail: {
                pluginName: PLUGIN_CONFIG.name,
                version: PLUGIN_CONFIG.version,
                api: apiInstance,
                timestamp: Date.now()
            }
        }));
        
        console.log(`🎉 ${PLUGIN_CONFIG.name} API exported with rewrite capability`);
        console.log(`🔄 Plugin can now take over PLUGIN_API when needed`);
        
        // Setup cleanup handler
        window.addEventListener('beforeunload', () => {
            console.log(`🧹 ${PLUGIN_CONFIG.name} cleaning up before unload`);
            // Restore previous API jika perlu
            if (!PluginRewriteManager.shouldTakeOver()) {
                PluginRewriteManager.restorePreviousAPI();
            }
        });
    }
    
    // ============================================
    // MAIN INITIALIZATION LOGIC
    // ============================================
    
    // Tunggu hingga DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Tunggu sedikit untuk memastikan script lain sudah dimuat
            setTimeout(() => {
                initializePlugin();
            }, 100);
        });
    } else {
        // DOM sudah ready, langsung initialize
        setTimeout(() => {
            initializePlugin();
        }, 100);
    }
    
})();