// trendchart.js - IIFE Regular Script Version
// Diubah dari module menjadi IIFE regular untuk diimport secara regular

(function() {
    console.log('=== TRENDCHART.JS LOADING (Regular Script) ===');
    
    // Global variables khusus trendchart
    let currentStartDate = null;
    let currentEndDate = null;
    let availableTagsList = [];
    
    // Class TrendChart
    class TrendChart {
        constructor() {
            console.log('📋 TrendChart instance created');
            this.initialized = false;
            this.isLoading = false;
            this.hasLoadedOnce = false;
            this._listenersSetup = false;
            this.loadDebounceTimer = null;
            
            // Tambahkan properti untuk menyimpan state template
            this.currentTemplateData = null;
            this.currentTags = [];
            
            // Setup event listeners segera
            this.setupEventListeners();
        }

        init() {
            if (this.initialized) {
                console.log('⚠️ TrendChart already initialized');
                return;
            }

            console.log('📋 TrendChart initializing...');
            
            // Reset flag
            this.hasLoadedOnce = false;
            
            // Setup date pickers
            this.setupDatePickers();
            
            // Langsung cek template data TAPI dengan delay
            setTimeout(() => {
                this.checkAndLoadTemplate();
            }, 500); // Delay untuk pastikan listeners sudah setup
            
            this.initialized = true;
            console.log('✅ TrendChart initialized successfully');
        }
        
        setupEventListeners() {
            console.log('🎯 Setting up event listeners for TrendChart...');
            
            // 1. SINGLETON PATTERN: Cek jika sudah setup
            if (this._listenersSetup) {
                console.warn('⚠️ Listeners already setup, skipping');
                return;
            }
            this._listenersSetup = true;
            
            // 2. DEBOUNCE FUNCTION untuk semua event
            const debouncedLoad = (eventName, event) => {
                console.log(`📥 ${eventName} event received`);
                
                if (this.isLoading) {
                    console.log('⏸️ Already loading, skipping event');
                    return;
                }
                
                // Ambil template data dari berbagai sumber
                let templateData = null;
                
                if (event && event.detail && event.detail.templateData) {
                    templateData = event.detail.templateData;
                } else if (window.currentTemplateData) {
                    templateData = window.currentTemplateData;
                }
                
                if (!templateData) {
                    console.log('ℹ️ No template data found');
                    return;
                }
                
                // Clear timeout sebelumnya
                if (this.loadDebounceTimer) {
                    clearTimeout(this.loadDebounceTimer);
                }
                
                // Debounce 300ms untuk prevent multiple rapid triggers
                this.loadDebounceTimer = setTimeout(() => {
                    console.log(`🎯 Processing ${eventName} after debounce`);
                    this.loadTemplateFromData(templateData);
                }, 300);
            };
            
            // 3. SETUP LISTENERS DENGAN DEBOUNCE
            // templateLoaded - standard event
            window.addEventListener('templateLoaded', (event) => {
                debouncedLoad('templateLoaded', event);
            });
            
            // loadTemplateNow - manual trigger
            window.addEventListener('loadTemplateNow', (event) => {
                debouncedLoad('loadTemplateNow', event);
            });
            
            // DataSelector ready
            window.addEventListener('dataSelectorReady', (event) => {
                console.log('🎯 DataSelector ready event received');
                // HANYA jika belum pernah load
                if (window.currentTemplateData && this.initialized && !this.hasLoadedOnce) {
                    debouncedLoad('dataSelectorReady', event);
                }
            });
            
            // 🔥 PERBAIKAN PENTING: chartRendererReady - HANYA UNTUK FIRST TIME
            window.addEventListener('chartRendererReady', (event) => {
                console.log('🎉 ChartRenderer ready event received');
                
                // HANYA load jika:
                // 1. Ada template data
                // 2. Sudah initialized
                // 3. BELUM pernah load sebelumnya
                if (window.currentTemplateData && this.initialized && !this.hasLoadedOnce) {
                    console.log('🔄 First-time loading after ChartRenderer ready');
                    setTimeout(() => {
                        this.loadTemplateFromData(window.currentTemplateData);
                        this.hasLoadedOnce = true; // TANDAI SUDAH LOAD
                    }, 800); // Delay lebih lama untuk pastikan ChartRenderer benar-benar siap
                } else if (this.hasLoadedOnce) {
                    console.log('⏸️ Already loaded once, skipping chartRendererReady trigger');
                }
            });
            
            // 4. Global function untuk manual call
            window.loadTemplateToChart = (templateData) => {
                console.log('🌐 Global function called to load template');
                if (templateData) {
                    window.currentTemplateData = templateData;
                }
                debouncedLoad('globalFunction', { detail: { templateData: templateData || window.currentTemplateData } });
            };
            
            console.log('✅ TrendChart event listeners setup complete');
        }
        
        checkAndLoadTemplate() {
            console.log('🔍 Checking for template data on init...');
    
            // JANGAN auto-load jika sudah pernah load
            if (this.hasLoadedOnce) {
                console.log('⏸️ Already loaded once, skipping auto-check');
                return;
            }
            
            // Cek window object terlebih dahulu
            if (window.currentTemplateData) {
                console.log('📋 Template data found in window.currentTemplateData');
                
                // Delay sedikit untuk pastikan ChartRenderer siap
                setTimeout(() => {
                    this.loadTemplateFromData(window.currentTemplateData);
                }, 1000);
                
                // Clear setelah digunakan
                setTimeout(() => {
                    delete window.currentTemplateData;
                }, 2000);
                return;
            }
            
            // Cek localStorage
            const storedTemplateData = localStorage.getItem('currentTemplateData');
            if (storedTemplateData) {
                try {
                    const templateData = JSON.parse(storedTemplateData);
                    console.log('📋 Found stored template data in localStorage');
                    this.loadTemplateFromData(templateData);
                    
                    // Clear setelah digunakan
                    localStorage.removeItem('currentTemplateData');
                } catch (error) {
                    console.error('❌ Error parsing stored template data:', error);
                }
            } else {
                console.log('ℹ️ No template data found on init');
            }
        }

        handleTabSwitched(event) {
            console.log('🔄 Tab switched to trendchart event received in TrendChart:', event.detail);
            
            if (event.detail && event.detail.templateData) {
                console.log('📋 Template data from tab switch:', event.detail.templateData);
                this.loadTemplateFromData(event.detail.templateData);
            }
        }

        handleLoadTemplateNow(event) {
            console.log('🚨 Load template now event received:', event.detail);
            
            if (event.detail && event.detail.templateData) {
                console.log('📋 Template data from manual trigger:', event.detail.templateData);
                this.loadTemplateFromData(event.detail.templateData);
            }
        }

        // Tambahkan method untuk cek jika sedang loading
        shouldLoadTemplate(templateData) {
            if (this.isLoading) {
                console.log('⏸️ Already loading, skipping');
                return false;
            }
            
            // Cek jika template sama dengan yang terakhir diload
            const currentTime = Date.now();
            const timeSinceLastLoad = currentTime - this.lastLoadTime;
            const isSameTemplate = JSON.stringify(window.currentTemplateData) === JSON.stringify(templateData);
            
            if (isSameTemplate && timeSinceLastLoad < 2000) {
                console.log('⏸️ Same template loaded recently, skipping');
                return false;
            }
            
            return true;
        }

        loadTemplateFromStorageOrUrl() {
            console.log('🔍 Checking for template data...');
            
            // PERBAIKAN: Cek window.currentTemplateData terlebih dahulu
            if (window.currentTemplateData) {
                console.log('📋 Template data found in window.currentTemplateData:', window.currentTemplateData);
                this.loadTemplateFromData(window.currentTemplateData);
                delete window.currentTemplateData;
                return;
            }
            
            // Cek localStorage
            const storedTemplateData = localStorage.getItem('currentTemplateData');
            if (storedTemplateData) {
                try {
                    const templateData = JSON.parse(storedTemplateData);
                    console.log('📋 Found stored template data:', templateData);
                    
                    // Load template
                    this.loadTemplateFromData(templateData);
                    
                    // Clear template data dari localStorage setelah diambil
                    localStorage.removeItem('currentTemplateData');
                } catch (error) {
                    console.error('❌ Error parsing stored template data:', error);
                }
            } else {
                console.log('ℹ️ No template data found');
            }
        }

        // ========== EVENT HANDLER UNTUK TEMPLATE LOADED ==========
            handleTemplateLoaded(event) {
                console.log('📥 Template loaded event received:', event.detail);
                if (event.detail) {
                    this.loadTemplateFromData(event.detail);
                }
            }

        // ========== LOAD TEMPLATE FROM DATA (BARU) ==========

            // Ganti awal loadTemplateFromData()
            async loadTemplateFromData(templateData) {
                console.log('🔍 Loading template from data...');
        
                // Simpan template data untuk reload
                this.currentTemplateData = templateData;
                
                // DEBUG: Lihat struktur data
                debugTemplateData(templateData);
                
                // PERBAIKAN: Validasi templateData yang lebih ketat
                if (!templateData || typeof templateData !== 'object') {
                    console.error('❌ Template data is invalid:', templateData);
                    this.showChartError('Data template tidak valid');
                    this.showChartEmptyState();
                    return;
                }
                
                // Cek tags dalam berbagai format dengan fallback
                let tags = [];
                let tagsSource = '';
                
                // Priority 1: Direct tags array
                if (Array.isArray(templateData.tags)) {
                    tags = templateData.tags;
                    tagsSource = 'templateData.tags (array)';
                } 
                // Priority 2: String tags
                else if (templateData.tags && typeof templateData.tags === 'string') {
                    tags = templateData.tags.split(',').map(t => t.trim()).filter(t => t);
                    tagsSource = 'templateData.tags (string)';
                }
                // Priority 3: Data dalam nested object
                else if (templateData.data && Array.isArray(templateData.data.tags)) {
                    tags = templateData.data.tags;
                    tagsSource = 'templateData.data.tags';
                }
                else if (templateData.data && typeof templateData.data.tags === 'string') {
                    tags = templateData.data.tags.split(',').map(t => t.trim()).filter(t => t);
                    tagsSource = 'templateData.data.tags (string)';
                }
                // Priority 4: Template object dalam data
                else if (templateData.data && templateData.data.template && Array.isArray(templateData.data.template.tags)) {
                    tags = templateData.data.template.tags;
                    tagsSource = 'templateData.data.template.tags';
                }
                // Priority 5: Nested dalam success response
                else if (templateData.success && templateData.data && Array.isArray(templateData.data.tags)) {
                    tags = templateData.data.tags;
                    tagsSource = 'templateData.data.tags (in success)';
                }
                // Priority 6: Coba dari template property
                else if (templateData.template && Array.isArray(templateData.template.tags)) {
                    tags = templateData.template.tags;
                    tagsSource = 'templateData.template.tags';
                }
                
                console.log(`🏷️ Tags extracted from ${tagsSource}:`, tags);
                
                if (tags.length === 0) {
                    console.error('❌ No valid tags found after extraction');
                    console.log('Available data structure:', JSON.stringify(templateData, null, 2));
                    this.showChartError('Tidak ada tags yang valid dalam template');
                    this.showChartEmptyState();
                    return;
                }
                
                // PERBAIKAN: Cek jika sedang loading
                if (this.isLoading) {
                    console.log('⏸️ Already loading template, skipping');
                    return;
                }
                
                console.log('🔄 Loading template with', tags.length, 'tags');
                
                this.isLoading = true;
                this.hasLoadedOnce = true;
                this.currentTags = tags;

                try {
                    // Update template info di header
                    const templateName = templateData.template_name || 
                                       templateData.name || 
                                       templateData.data?.template_name || 
                                       templateData.data?.name || 
                                       'Unnamed Template';
                    
                    const startDate = templateData.start_date || 
                                     templateData.data?.start_date || 
                                     templateData.data?.template?.start_date;
                    
                    const endDate = templateData.end_date || 
                                   templateData.data?.end_date || 
                                   templateData.data?.template?.end_date;
                    
                    this.updateTemplateInfo(
                        templateName,
                        startDate,
                        endDate,
                        tags.length
                    );

                    // Parse dates dengan fallback
                    let start = new Date();
                    let end = new Date();
                    start.setDate(start.getDate() - 7); // Default: 7 hari terakhir
                    
                    if (startDate) {
                        const parsedStart = new Date(startDate);
                        if (!isNaN(parsedStart.getTime())) {
                            start = parsedStart;
                        }
                    }
                    
                    if (endDate) {
                        const parsedEnd = new Date(endDate);
                        if (!isNaN(parsedEnd.getTime())) {
                            end = parsedEnd;
                        }
                    }
                    
                    // Setup date pickers setelah extract tags
                    this.setupDatePickers();
                    
                    // Update date pickers dengan tanggal dari template
                    this.updateTemplateInfo(
                        templateName,
                        start,
                        end,
                        tags.length
                    );
                    
                    // Load dan render charts dengan tags yang sudah divalidasi
                    await this.loadTemplateCharts(tags, start, end);
                } catch (error) {
                    console.error('❌ Error loading template:', error);
                    this.showChartError('Error loading template: ' + error.message);
                    this.showChartEmptyState();
                } finally {
                    this.isLoading = false;
                    console.log('✅ Template loading completed');
                }

                // Tambahkan function untuk debug
                function debugTemplateData(templateData) {
                    console.group('🔍 Debug Template Data Structure');
                    console.log('Full templateData:', templateData);
                    console.log('Type of templateData:', typeof templateData);
                    console.log('templateData.keys:', templateData ? Object.keys(templateData) : 'null');
                    
                    // Cek struktur tags
                    console.log('templateData.tags:', templateData?.tags);
                    console.log('Type of tags:', typeof templateData?.tags);
                    console.log('Is array?', Array.isArray(templateData?.tags));
                    
                    // Cek data dari berbagai kemungkinan property
                    const possibleTagProperties = ['tags', 'tag_list', 'tagNames', 'data.tags', 'template.tags'];
                    possibleTagProperties.forEach(prop => {
                        const keys = prop.split('.');
                        let value = templateData;
                        for (let key of keys) {
                            value = value?.[key];
                        }
                        console.log(`${prop}:`, value, 'Type:', typeof value);
                    });
                    console.groupEnd();
                }
            }

        // ========== DATE MANAGEMENT ==========
        initializeDatesFromUrl() {
            const params = this.getUrlParams();
            
            // Set default dates (7 hari terakhir)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);

            // Gunakan dates dari URL jika tersedia
            if (params.startDate) {
                currentStartDate = new Date(params.startDate);
            } else {
                currentStartDate = startDate;
            }
            
            if (params.endDate) {
                currentEndDate = new Date(params.endDate);
            } else {
                currentEndDate = endDate;
            }
            
            console.log('📅 Dates initialized:', {
                startDate: currentStartDate,
                endDate: currentEndDate
            });
        }

        // ========== URL PARAMETER HANDLING ==========
        getUrlParams() {
            const params = new URLSearchParams(window.location.search);
            return {
                templateId: params.get('template_id'),
                templateName: params.get('template_name') ? decodeURIComponent(params.get('template_name')) : null,
                tags: params.get('tags') ? params.get('tags').split(',') : [],
                startDate: params.get('start_date'),
                endDate: params.get('end_date')
            };
        }

        isTemplateView() {
            const params = this.getUrlParams();
            return params.templateId !== null || params.tags.length > 0;
        }

        // ========== TEMPLATE LOADING ==========
        async loadTemplateFromUrl() {
            const params = this.getUrlParams();
            
            if (!params.tags || params.tags.length === 0) {
                console.error('❌ No tags found in URL parameters');
                this.showChartError('Tidak ada tags dalam template');
                this.showChartEmptyState();
                return;
            }

            console.log('🔄 Loading template from URL:', params);

            // Update template info di header
            this.updateTemplateInfo(
                params.templateName || 'Unnamed Template',
                params.startDate,
                params.endDate,
                params.tags.length
            );

            // Load dan render charts
            await this.loadTemplateCharts(params.tags, currentStartDate, currentEndDate);
        }

        // ========== CHART LOADING ==========
        async loadTemplateCharts(tags, startDate, endDate) {
            if (!tags || tags.length === 0) {
                this.showChartError('Tidak ada tags dalam template');
                this.showChartEmptyState();
                this.hideChartLoading();
                return;
            }
            
            try {
                console.log('🔄 Loading template charts:', {
                    tags: tags,
                    startDate: startDate,
                    endDate: endDate
                });
                
                // PERBAIKAN 1: TUNGGU DataSelector SIAP
                console.log('⏳ Waiting for DataSelector to be ready...');
                
                // Tunggu maksimal 5 detik untuk DataSelector
                const maxWaitTime = 5000;
                const startTime = Date.now();
                
                while (!window.DataSelectorApp && !window.DataSelector && Date.now() - startTime < maxWaitTime) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                if (!window.DataSelectorApp && !window.DataSelector) {
                    console.error('❌ DataSelector tidak tersedia setelah timeout');
                    this.showChartError('DataSelector tidak tersedia untuk memuat data');
                    this.showChartEmptyState();
                    this.hideChartLoading();
                    return;
                }
                
                // PERBAIKAN 2: Gunakan DataSelector yang benar
                let dataSelector = window.DataSelectorApp || window.DataSelector;
                
                // Jika masih berupa object dengan method initialize, panggil dulu
                if (dataSelector && dataSelector.initialize && typeof dataSelector.initialize === 'function') {
                    console.log('🔧 Initializing DataSelector...');
                    dataSelector = dataSelector.initialize();
                }
                
                console.log('✅ DataSelector ready:', {
                    hasApp: !!window.DataSelectorApp,
                    hasGlobal: !!window.DataSelector,
                    instance: dataSelector
                });
                
                // Validasi tanggal
                let start = startDate ? new Date(startDate) : new Date();
                let end = endDate ? new Date(endDate) : new Date();
                
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    console.warn('⚠️ Invalid dates, using current dates');
                    start = new Date();
                    end = new Date();
                    start.setDate(start.getDate() - 7);
                }
                
                if (start > end) {
                    console.warn('⚠️ Start date after end date, swapping dates');
                    [start, end] = [end, start];
                }
                
                console.log('📅 Final dates for chart loading:', {
                    start: start,
                    end: end
                });
                
                // Update template info dengan tanggal yang sebenarnya digunakan
                this.updateTemplateInfo(
                    document.getElementById('template-name-display').textContent,
                    start,
                    end,
                    tags.length
                );
                
                // PERBAIKAN 3: Gunakan DataSelector yang sudah diinisialisasi
                console.log('📋 Fetching tag limits data...');
                
                let tagsResult;
                if (dataSelector && dataSelector.fetchTags) {
                    tagsResult = await dataSelector.fetchTags();
                    
                    if (tagsResult.success) {
                        availableTagsList = tagsResult.data; // Simpan untuk digunakan nanti
                        console.log('✅ Tag limits loaded:', availableTagsList.length, 'tags');
                    } else {
                        console.warn('⚠️ Failed to load tag limits, proceeding without limits');
                        availableTagsList = [];
                    }
                } else {
                    // Coba akses via window object
                    if (window.DataSelector && window.DataSelector.fetchTags) {
                        tagsResult = await window.DataSelector.fetchTags();
                        if (tagsResult.success) {
                            availableTagsList = tagsResult.data;
                            console.log('✅ Tag limits loaded via window.DataSelector');
                        } else {
                            availableTagsList = [];
                        }
                    } else {
                        console.warn('⚠️ DataSelector not available, proceeding without tag limits');
                        availableTagsList = [];
                    }
                }
                
                // PERBAIKAN 5: Pastikan format parameter benar untuk API
                let result;

                // Build parameter yang benar untuk API
                const params = {
                    tagnames: tags.join(','),
                    start_date: start.toISOString().split('T')[0], // YYYY-MM-DD
                    end_date: end.toISOString().split('T')[0],
                    plant: 'ALL' // atau plant yang sesuai
                };

                console.log('📋 Parameters for fetchMultipleTagValues:', params);

                // PERBAIKAN 4: Coba semua kemungkinan akses ke DataSelector
                if (dataSelector && dataSelector.fetchMultipleTagValues) {
                    // Gunakan parameter yang benar
                    result = await dataSelector.fetchMultipleTagValues(tags, start, end);
                } else if (window.DataSelector && window.DataSelector.fetchMultipleTagValues) {
                    result = await window.DataSelector.fetchMultipleTagValues(tags, start, end);
                } else if (window.DataSelectorApp && window.DataSelectorApp.getDataSelector && window.DataSelectorApp.getDataSelector().fetchMultipleTagValues) {
                    result = await window.DataSelectorApp.getDataSelector().fetchMultipleTagValues(tags, start, end);
                } else if (window.pluginAPI && window.pluginAPI.getMultipleTagValues) {
                    // Coba langsung ke pluginAPI jika ada
                    console.log('🔄 Using pluginAPI.getMultipleTagValues directly');
                    result = await window.pluginAPI.getMultipleTagValues({
                        tagnames: tags.join(','),
                        start_date: start.toISOString().split('T')[0],
                        end_date: end.toISOString().split('T')[0]
                    });
                } else {
                    console.error('❌ Tidak ada metode fetchMultipleTagValues yang tersedia');
                    this.showChartError('DataSelector tidak tersedia untuk memuat data');
                    this.showChartEmptyState();
                    this.hideChartLoading();
                    return;
                }
                
                console.log('📦 Template charts response:', result);
                
                if (result.success) {
                    const tagsData = result.data || {};
                    
                    // Clear previous content
                    const tagSectionsContainer = document.getElementById('tag-sections');
                    tagSectionsContainer.innerHTML = '';
                    
                    // Render chart untuk setiap tag sesuai urutan dalam template
                    let renderedCount = 0;
                    tags.forEach(tagName => {
                        const tagData = tagsData[tagName];
                        if (tagData) {
                            // 🔥 PERBAIKAN: KIRIM availableTagsList KE createTagSectionFromTemplate
                            const section = this.createTagSectionFromTemplate(tagName, tagData, availableTagsList);
                            tagSectionsContainer.appendChild(section);
                            renderedCount++;
                        } else {
                            console.warn(`⚠️ No data found for tag: ${tagName}`);
                            const emptySection = this.createEmptyTagSection(tagName);
                            tagSectionsContainer.appendChild(emptySection);
                        }
                    });
                    
                    this.hideChartLoading();
                    this.hideChartEmptyState();
                    this.hideChartError();
                    
                    if (renderedCount > 0) {
                        console.log(`✅ Successfully rendered ${renderedCount} charts`);
                        console.log('📊 Available limits data:', availableTagsList.length, 'tags with limits');
                    } else {
                        this.showChartEmptyState();
                    }
                } else {
                    this.showChartError('Gagal memuat data template: ' + (result.message || 'Unknown error'));
                    this.showChartEmptyState();
                    this.hideChartLoading();
                }
            } catch (error) {
                console.error('❌ Error loading template charts:', error);
                this.showChartError('Error loading template charts: ' + error.message);
                this.showChartEmptyState();
                this.hideChartLoading();
            }
        }

        // ========== UI MANAGEMENT ==========
        showChartLoading() {
            const loadingEl = document.getElementById('chart-loading');
            if (loadingEl) {
                loadingEl.style.display = 'block';
            }
            
            const emptyStateEl = document.getElementById('chart-empty-state');
            if (emptyStateEl) {
                emptyStateEl.style.display = 'none';
            }
            
            const tagSectionsEl = document.getElementById('tag-sections');
            if (tagSectionsEl) {
                tagSectionsEl.style.display = 'none';
            }
        }

        hideChartLoading() {
            const loadingEl = document.getElementById('chart-loading');
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
        }

        showChartEmptyState() {
            const emptyStateEl = document.getElementById('chart-empty-state');
            if (emptyStateEl) {
                emptyStateEl.style.display = 'block';
            }
            
            const tagSectionsEl = document.getElementById('tag-sections');
            if (tagSectionsEl) {
                tagSectionsEl.style.display = 'none';
            }
        }

        hideChartEmptyState() {
            const emptyStateEl = document.getElementById('chart-empty-state');
            if (emptyStateEl) {
                emptyStateEl.style.display = 'none';
            }
            
            const tagSectionsEl = document.getElementById('tag-sections');
            if (tagSectionsEl) {
                tagSectionsEl.style.display = 'block';
            }
        }

        showChartError(message) {
            const errorDiv = document.getElementById('chart-error-message');
            if (!errorDiv) return;
            
            errorDiv.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            `;
            errorDiv.style.display = 'flex';
            
            setTimeout(() => {
                this.hideChartError();
            }, 5000);
        }

        hideChartError() {
            const errorDiv = document.getElementById('chart-error-message');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }

        // Tambahkan method untuk setup date picker
        setupDatePickers() {
            console.log('📅 Setting up date pickers for trendchart...');
            
            const startDateInput = document.getElementById('trend-start-date');
            const endDateInput = document.getElementById('trend-end-date');
            const reloadBtn = document.getElementById('reload-chart-btn');
            
            if (!startDateInput || !endDateInput || !reloadBtn) {
                console.warn('⚠️ Date picker elements not found');
                return;
            }
            
            // Set default values (7 hari terakhir)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            
            startDateInput.valueAsDate = startDate;
            endDateInput.valueAsDate = endDate;
            
            // Setup event listener untuk reload button
            reloadBtn.addEventListener('click', () => {
                this.reloadChartsWithNewDates();
            });
            
            // Juga reload saat Enter ditekan di input date
            [startDateInput, endDateInput].forEach(input => {
                input.addEventListener('change', () => {
                    // Auto-validate dates
                    this.validateChartDates();
                });
                
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.reloadChartsWithNewDates();
                    }
                });
            });
            
            console.log('✅ Date pickers setup complete');
        }
        
        // Method untuk validasi tanggal
        validateChartDates() {
            const startDateInput = document.getElementById('trend-start-date');
            const endDateInput = document.getElementById('trend-end-date');
            
            if (!startDateInput || !endDateInput) return;
            
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                this.showChartError('Format tanggal tidak valid');
                return false;
            }
            
            if (startDate > endDate) {
                this.showChartError('Tanggal mulai tidak boleh setelah tanggal akhir');
                
                // Auto-swap dates jika start > end
                [startDateInput.value, endDateInput.value] = [endDateInput.value, startDateInput.value];
                
                return true;
            }
            
            return true;
        }
        
        // Method untuk reload chart dengan tanggal baru
        async reloadChartsWithNewDates() {
            console.log('🔄 Reloading charts with new dates...');
            
            if (!this.validateChartDates()) {
                return;
            }
            
            const startDateInput = document.getElementById('trend-start-date');
            const endDateInput = document.getElementById('trend-end-date');
            
            const newStartDate = new Date(startDateInput.value);
            const newEndDate = new Date(endDateInput.value);
            
            if (!this.currentTags || this.currentTags.length === 0) {
                this.showChartError('Tidak ada tag yang bisa direload');
                return;
            }
            
            try {
                // Tampilkan loading
                this.showChartLoading();
                
                // Update display date range
                this.updateDateDisplay(newStartDate, newEndDate);
                
                // Load ulang charts dengan tanggal baru
                await this.loadTemplateCharts(this.currentTags, newStartDate, newEndDate);
                
                console.log('✅ Charts reloaded successfully');
            } catch (error) {
                console.error('❌ Error reloading charts:', error);
                this.showChartError('Gagal reload chart: ' + error.message);
            }
        }

        updateTemplateInfo(templateName, startDate, endDate, tagCount) {
            // Update template name
            const nameDisplay = document.getElementById('template-name-display');
            if (nameDisplay) {
                nameDisplay.innerHTML = `
                    <i class="fas fa-chart-line"></i>
                    <span>${templateName || 'Unnamed Template'}</span>
                `;
            }
            
            // Update tag count (TETAP ADA)
            const countDisplay = document.getElementById('tag-count-display');
            if (countDisplay) {
                countDisplay.innerHTML = `
                    <i class="fas fa-tags"></i>
                    <span>${tagCount} Tags</span>
                `;
            }
            
            // Update date pickers dengan tanggal dari template
            const startDateInput = document.getElementById('trend-start-date');
            const endDateInput = document.getElementById('trend-end-date');
            
            if (startDateInput && startDate) {
                const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
                startDateInput.value = formattedStartDate;
            }
            
            if (endDateInput && endDate) {
                const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
                endDateInput.value = formattedEndDate;
            }
            
            // Tidak perlu update date-range-display lagi karena kita hapus element tersebut
            console.log(`📊 Template "${templateName}" dengan ${tagCount} tags`);
        }

        // Method baru untuk update date display
        updateDateDisplay(startDate, endDate) {
            const dateDisplay = document.getElementById('date-range-display');
            if (dateDisplay) {
                const startStr = startDate ? new Date(startDate).toLocaleDateString('id-ID') : 'N/A';
                const endStr = endDate ? new Date(endDate).toLocaleDateString('id-ID') : 'N/A';
                dateDisplay.innerHTML = `
                    <i class="fas fa-calendar-alt"></i>
                    <span>${startStr} - ${endStr}</span>
                `;
            }
        }

        // ========== NAVIGATION ==========
        goBackToTrendList() {
            window.location.href = 'trendlist.html';
        }

        // ========== HELPER METHODS ==========
        // Di trendchart.js - ganti method createTagSectionFromTemplate
        createTagSectionFromTemplate(tagName, tagData, availableTagsList) {
            console.log('🎨 Creating tag section for:', tagName, 'with ChartRenderer');
            
            // PERBAIKAN: Gunakan ChartRenderer jika tersedia
            if (window.ChartRenderer && window.ChartRenderer.createTagSectionFromTemplate) {
                console.log('✅ Using ChartRenderer.createTagSectionFromTemplate');
                return window.ChartRenderer.createTagSectionFromTemplate(tagName, tagData, availableTagsList);
            }
            
            // Fallback: buat placeholder
            console.warn('⚠️ ChartRenderer not available, creating placeholder');
            const section = document.createElement('div');
            section.className = 'tag-section';
            section.innerHTML = `
                <div class="tag-header">
                    <h3>${tagName}</h3>
                </div>
                <div class="tag-chart">
                    <p>Chart for ${tagName} would be rendered here</p>
                    <p>Data points: ${Array.isArray(tagData.values) ? tagData.values.length : 
                                      Array.isArray(tagData) ? tagData.length : 
                                      Object.keys(tagData).length}</p>
                </div>
            `;
            return section;
        }

        createEmptyTagSection(tagName) {
            const section = document.createElement('div');
            section.className = 'tag-section empty';
            section.innerHTML = `
                <div class="tag-header">
                    <h3>${tagName}</h3>
                </div>
                <div class="tag-chart empty">
                    <i class="fas fa-chart-line"></i>
                    <p>No data available for this tag</p>
                </div>
            `;
            return section;
        }

        // ========== CLEANUP METHOD ==========
        cleanup() {
            console.log('🧹 Cleaning up TrendChart...');
            
            // Hapus event listener
            window.removeEventListener('templateLoaded', this.handleTemplateLoaded);
            
            // Reset semua state
            currentStartDate = null;
            currentEndDate = null;
            availableTagsList = [];
            this.initialized = false;
            
            // Reset template state
            this.currentTemplateData = null;
            this.currentTags = [];
            
            console.log('✅ TrendChart cleaned up');
        }

        reset() {
            console.log('🔄 Resetting TrendChart...');
            
            this.initialized = false;
            this.isLoading = false;
            this.hasLoadedOnce = false;
            
            // Clear all chart instances
            const tagSectionsContainer = document.getElementById('tag-sections');
            if (tagSectionsContainer) {
                tagSectionsContainer.innerHTML = '';
            }
            
            // Reset template info
            this.updateTemplateInfo('No Template Loaded', null, null, 0);
            
            // Show empty state
            this.showChartEmptyState();
            
            console.log('✅ TrendChart reset complete');
        }
    }

    // Global instance
    let trendChartInstance = null;

    // Fungsi untuk inisialisasi TrendChart
    function initTrendChart() {
        if (!trendChartInstance) {
            trendChartInstance = new TrendChart();
        }
        
        // Delay initialization untuk memastikan DOM siap
        setTimeout(() => {
            trendChartInstance.init();
        }, 200);
        
        return trendChartInstance;
    }

    

    // Export ke window object
    window.TrendChartApp = {
        // Class constructor
        TrendChart: TrendChart,
        
        // Initialization function
        initTrendChart: initTrendChart,
        
        // Cleanup function untuk module management
        cleanup: function() {
            console.log('🧹 Cleaning up TrendChart...');
            
            // Hapus event listener
            window.removeEventListener('templateLoaded', this.handleTemplateLoaded);
            
            // Cleanup ChartRenderer
            if (window.ChartRenderer && window.ChartRenderer.cleanup) {
                window.ChartRenderer.cleanup();
            }
            
            // Reset semua state
            currentStartDate = null;
            currentEndDate = null;
            availableTagsList = [];
            this.initialized = false;
            
            console.log('✅ TrendChart cleaned up');
        },
        
        // Utility function untuk backward compatibility
        initialize: function() {
            // Fungsi ini menyediakan backward compatibility
            const trendChart = initTrendChart();
            
            // Simpan ke window untuk akses global
            window.trendChart = trendChart;
            
            return trendChart;
        },
        
        // Helper functions untuk diakses dari luar
        goBackToTrendList: function() {
            if (trendChartInstance) {
                trendChartInstance.goBackToTrendList();
            }
        }, // 🔥 TAMBAHKAN KOMA DI SINI
        
        reset: function() {
            if (trendChartInstance) {
                trendChartInstance.reset();
            }
        } // 🔥 JANGAN TAMBAH KOMA DI YANG TERAKHIR
    };

    console.log('=== TRENDCHART.JS LOADED (Regular Script) ===');

    console.log('📋 TrendChartApp auto-initializing...');

    // Tunggu sebentar untuk memastikan semua komponen siap
    setTimeout(() => {
        if (window.TrendChartApp && window.TrendChartApp.initialize) {
            console.log('🚀 Auto-initializing TrendChartApp...');
            window.TrendChartApp.initialize();
            
            // Cek jika ada template data yang menunggu
            if (window.currentTemplateData) {
                console.log('📋 Found pending template data, loading...');
                setTimeout(() => {
                    if (window.TrendChartApp.loadTemplateFromData) {
                        window.TrendChartApp.loadTemplateFromData(window.currentTemplateData);
                    }
                }, 500);
            }
        }
    }, 500);

    // Hapus auto-initialize, biarkan mainhandler.js yang mengontrol
})();