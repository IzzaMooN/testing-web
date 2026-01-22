// mainhandler.js - Regular Script Version
// File ini akan mengontrol loading/unloading script Quality Trend

(function() {
    console.log('=== MAINHANDLER.JS LOADING ===');
    
    // State management
    let activeModules = {
        trendlist: null,
        trendchart: null,
        DataSelector: null,
        chartrender: null  // Simpan reference ke ChartRenderer
    };

    let currentTab = 'trendlist'; // Default tab
    let pluginBaseUrl = null;
    
    // 🔧 Fungsi: Dapatkan base URL dari lokasi file script ini
    function getPluginBaseUrl() {
        console.log('🔍 Getting plugin base URL...');
        const scripts = document.querySelectorAll('script[src*="mainhandler.js"]');
        
        if (scripts.length > 0) {
            const scriptSrc = scripts[0].src;
            console.log('🔍 Script source:', scriptSrc);
            
            // Cek apakah ada "/js/" di path
            if (scriptSrc.includes('/js/')) {
                const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/js/')) + '/';
                console.log('✅ Base URL found:', baseUrl);
                return baseUrl;
            } else {
                console.log('⚠️ No /js/ found in path, using relative path');
                return './';
            }
        }
        console.warn('⚠️ Script tag not found, using default path');
        return './';
    }
    
    // Fungsi untuk membuat dan menunggu script load
    function loadScript(url, moduleName) {
        return new Promise((resolve, reject) => {
            // Cek apakah script sudah ada
            const existingScript = document.querySelector(`script[src*="${url}"]`);
            if (existingScript) {
                console.log(`ℹ️ Script ${moduleName} already loaded`);
                resolve();
                return;
            }
            
            console.log(`📦 Loading script: ${url}`);
            const script = document.createElement('script');
            script.src = pluginBaseUrl + url;
            script.type = 'text/javascript';
            
            script.onload = () => {
                console.log(`✅ ${moduleName} loaded successfully`);
                resolve();
            };
            
            script.onerror = (error) => {
                console.error(`❌ Failed to load ${moduleName}:`, error);
                reject(new Error(`Failed to load ${moduleName}`));
            };
            
            document.body.appendChild(script);
        });
    }

    function updateHeaderVisibility(tabId) {
        console.log(`🎭 Updating header visibility for tab: ${tabId}`);
        
        const headerContent = document.querySelector('.header-content');
        if (!headerContent) {
            console.warn('⚠️ .header-content element not found');
            return;
        }
        
        // Tampilkan header hanya untuk trendlist
        if (tabId === 'trendlist') {
            headerContent.style.display = 'flex';
            console.log('✅ Header shown (display: flex)');
        } else {
            headerContent.style.display = 'none';
            console.log('✅ Header hidden (display: none)');
        }
    }
        
    // Fungsi untuk memuat module berdasarkan tab
    async function loadTabModule(tabId) {
        console.log(`📦 Loading module for tab: ${tabId}`);
    
        // Unload module yang tidak aktif
        await unloadInactiveModules(tabId);
        
        try {
            // Load script yang diperlukan untuk semua tabs
            if (!window.DataSelector) {
                console.log('Loading DataSelector for all tabs...');
                await loadScript('js/DataSelector.js', 'DataSelector');
                
                // Tunggu DataSelector siap
                await new Promise(resolve => {
                    const checkDataSelector = setInterval(() => {
                        if (window.DataSelector && window.DataSelector.getInstance) {
                            clearInterval(checkDataSelector);
                            resolve();
                        }
                    }, 100);
                    
                    setTimeout(() => {
                        clearInterval(checkDataSelector);
                        console.warn('⚠️ DataSelector loading timeout');
                        resolve();
                    }, 3000);
                });
                
                activeModules.DataSelector = window.DataSelector.getInstance();
            }
            
            switch(tabId) {
                case 'trendlist':
                    if (!activeModules.trendlist) {
                        console.log('Loading trendlist modules...');
                        
                        // Load corehandler.js
                        await loadScript('js/corehandler.js', 'corehandler');
                        
                        // Tunggu lebih lama untuk inisialisasi
                        await new Promise(resolve => {
                            const checkHandler = setInterval(() => {
                                if (window.QualityTrendCoreHandler && typeof window.QualityTrendCoreHandler.initialize === 'function') {
                                    clearInterval(checkHandler);
                                    console.log('🚀 Initializing QualityTrendCoreHandler...');
                                    window.QualityTrendCoreHandler.initialize();
                                    setTimeout(resolve, 300); // Tambah delay ekstra
                                }
                            }, 100);
                            
                            setTimeout(() => {
                                clearInterval(checkHandler);
                                console.warn('⚠️ CoreHandler initialization timeout');
                                resolve();
                            }, 5000);
                        });
                        
                        // Simpan instance untuk akses cepat
                        if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.initCoreHandler) {
                            const handlerInstance = window.QualityTrendCoreHandler.initCoreHandler();
                            window.qualityTrendCoreHandlerInstance = handlerInstance;
                            activeModules.trendlist = handlerInstance;
                        }
                    } else {
                        console.log('ℹ️ Trendlist module already loaded, using existing instance');
                    }
                    
                    // Setup UI dengan delay
                    setTimeout(() => {
                        setupTrendListUI();
                    }, 500);
                    break;
                    
                case 'trendchart':
                    if (!activeModules.trendchart) {
                        console.log('Loading trendchart modules...');
                        
                        // PERBAIKAN: Load chartrender.js DAN trendchart.js secara SEQUENTIAL
                        await loadScript('js/chartrender.js', 'chartrender');
                        
                        // TUNGGU ChartRenderer SIAP
                        await new Promise(resolve => {
                            const checkChartRenderer = setInterval(() => {
                                if (window.ChartRenderer) {
                                    clearInterval(checkChartRenderer);
                                    console.log('✅ ChartRenderer ready');
                                    
                                    // Dispatch event untuk memberi tahu ChartRenderer siap
                                    window.dispatchEvent(new CustomEvent('chartRendererReady', {
                                        detail: { timestamp: Date.now() }
                                    }));
                                    resolve();
                                }
                            }, 100);
                            
                            setTimeout(() => {
                                clearInterval(checkChartRenderer);
                                console.warn('⚠️ ChartRenderer loading timeout, continuing anyway');
                                resolve();
                            }, 3000);
                        });
                        
                        // Load trendchart.js SETELAH ChartRenderer siap
                        await loadScript('js/trendchart.js', 'trendchart');
                        
                        // Setup listeners SEBELUM initialize
                        if (window.TrendChartApp && window.TrendChartApp.initialize) {
                            // Setup event listeners terlebih dahulu
                            if (window.trendChart && typeof window.trendChart.setupEventListeners === 'function') {
                                window.trendChart.setupEventListeners();
                            }
                            
                            activeModules.trendchart = window.TrendChartApp || {};
                        }

                        activeModules.chartrender = window.ChartRenderer;
                        activeModules.trendchart = window.TrendChartApp || {};
                    }
                    
                    // Setup UI untuk trendchart
                    setupTrendChartUI();
                    
                    // Setup event listener
                    setupTemplateEventListener();
                    break;
            }
            
            console.log(`✅ Module for ${tabId} loaded successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load module for ${tabId}:`, error);
            return false;
        }
    }

    // mainhandler.js - tambah fungsi baru
    function setupTemplateEventListener() {
        console.log('🎯 Setting up template event listener...');
        
        // Hapus listener lama jika ada
        window.removeEventListener('templateLoaded', handleTemplateLoadedEvent);
        window.removeEventListener('tabSwitchedToTrendChart', handleTabSwitchedEvent);
        
        // Setup listener baru
        window.addEventListener('templateLoaded', handleTemplateLoadedEvent);
        window.addEventListener('tabSwitchedToTrendChart', handleTabSwitchedEvent);
        
        console.log('✅ Template event listeners set up');
    }

    function handleTemplateLoadedEvent(event) {
        console.log('📥 Template loaded event received in mainhandler:', event.detail);
        
        // Simpan data template ke window object untuk diakses nanti
        if (event.detail && event.detail.templateData) {
            window.currentTemplateData = event.detail.templateData;
            console.log('💾 Template data saved to window:', window.currentTemplateData);
        }
    }

    function handleTabSwitchedEvent(event) {
        console.log('🔄 Tab switched to trendchart event received:', event.detail);
        
        // Jika ada template data, trigger load template
        if (event.detail && event.detail.templateData) {
            window.currentTemplateData = event.detail.templateData;
            setTimeout(() => {
                if (window.TrendChartApp && window.TrendChartApp.initialize) {
                    window.TrendChartApp.initialize();
                }
            }, 100);
        }
    }
    
    async function unloadInactiveModules(activeTabId) {
        console.log(`🔄 Unloading inactive modules, keeping: ${activeTabId}`);
        
        // JANGAN reset DataSelector - tetap aktif untuk semua tab
        cleanupModuleState(activeTabId);
        
        // PERBAIKAN: JANGAN hapus chartrender.js sama sekali - tetap load di background
        if (activeTabId === 'trendchart' && !window.ChartRenderer) {
            console.log('📦 Pre-loading ChartRenderer in background...');
            // Load tapi jangan tunggu
            loadScript('js/chartrender.js', 'chartrender').then(() => {
                console.log('✅ ChartRenderer pre-loaded');
            });
        }
        
        // JANGAN hapus script sama sekali untuk plugin ini
        console.log('⚠️ Script cleanup disabled for Quality Trend plugin');
        
        // PERBAIKAN: Pastikan DataSelector tetap ada di window
        if (!window.DataSelector) {
            console.log('⚠️ DataSelector not found in window, initializing...');
        }
    }
    
    // mainhandler.js - cleanupModuleState
    function cleanupModuleState(activeTabId) {
        console.log('🧹 Cleaning up module state for non-active tabs');
        
        // Cleanup berdasarkan tab yang tidak aktif
        if (activeTabId !== 'trendlist' && window.QualityTrendCoreHandler) {
            if (typeof window.QualityTrendCoreHandler.cleanup === 'function') {
                window.QualityTrendCoreHandler.cleanup();
            }
            // Reset variabel global
            delete window.QualityTrendCoreHandler;
        }
        
        if (activeTabId !== 'trendchart') {
            if (window.TrendChartApp && typeof window.TrendChartApp.cleanup === 'function') {
                window.TrendChartApp.cleanup();
            }
            // PERBAIKAN: JANGAN delete window.ChartRenderer - biarkan tetap ada
            // delete window.ChartRenderer; // ❌ KOMENTARI INI
            delete window.TrendChartApp;
        }
        
        // DataSelector tetap di window untuk semua tab
    }
    
    // ========== TAB SWITCHING ==========
    let isSwitchingTab = false;

    // Pindahkan fungsi updateTabUI ke luar untuk akses global
    function updateTabUI(tabId) {
        console.log(`🎨 Updating UI for tab: ${tabId}`);

        // Update header visibility berdasarkan tab
        updateHeaderVisibility(tabId);
        
        // Remove active class dari semua link di .nav-tabs
        document.querySelectorAll('.nav-tabs a').forEach(l => {
            l.classList.remove('active');
        });
        
        // Add active class ke link yang sesuai
        const activeLink = document.querySelector(`.nav-tabs a[data-tab="${tabId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            console.log(`✅ Active link set for tab: ${tabId}`);
        } else {
            console.warn(`⚠️ Could not find link for tab: ${tabId}`);
            
            // Coba cari secara manual
            document.querySelectorAll('.nav-tabs a').forEach(link => {
                const linkTabId = link.getAttribute('data-tab');
                if (linkTabId === tabId) {
                    link.classList.add('active');
                    console.log(`✅ Found and activated link manually`);
                }
            });
        }
        
        // Hide semua tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
        });
        
        // Show tab content yang sesuai
        const tabContent = document.getElementById(`${tabId}-tab`);
        if (tabContent) {
            tabContent.style.display = 'block';
            tabContent.classList.add('active');
            
            // Force reflow untuk trigger animation
            tabContent.offsetHeight;
            
            console.log(`✅ Tab content shown: ${tabId}-tab`);
        } else {
            console.error(`❌ Tab content not found: ${tabId}-tab`);
            
            // Coba cari dengan selector lain
            const contentSelectors = [
                `#${tabId}`,
                `[data-content="${tabId}"]`,
                `.${tabId}-content`
            ];
            
            contentSelectors.forEach(selector => {
                const altContent = document.querySelector(selector);
                if (altContent) {
                    altContent.style.display = 'block';
                    altContent.classList.add('active');
                    console.log(`✅ Found content with selector: ${selector}`);
                }
            });
        }
    }

    async function handleTabClick(e) {
        console.log('🖱️ Tab clicked event triggered');
        
        // Debounce: cegah multiple clicks
        if (isSwitchingTab) {
            console.log('⚠️ Already switching tab, ignoring click');
            return;
        }
        
        isSwitchingTab = true;
        
        e.preventDefault();
        
        const tabId = e.currentTarget.getAttribute('data-tab');
        if (!tabId) {
            console.error('❌ No data-tab attribute found');
            isSwitchingTab = false;
            return;
        }
        
        console.log(`🔄 Switching to tab: ${tabId}`);
        
        try {
            // Update header visibility pertama
            updateHeaderVisibility(tabId);

            // Update UI
            updateTabUI(tabId);
            
            // Update current tab
            currentTab = tabId;
            
            // Load module untuk tab yang aktif
            await loadTabModule(tabId);
            
            // SPECIAL CASE: Jika switch ke trendchart dan ada template data
            if (tabId === 'trendchart' && window.currentTemplateData) {
                console.log('🎯 Template data detected, triggering load...');
                
                // Tunggu sebentar untuk memastikan trendchart siap
                setTimeout(() => {
                    // Coba semua cara untuk load template
                    triggerTemplateLoad(window.currentTemplateData); // PERBAIKAN: Panggil fungsi global, bukan this.triggerTemplateLoad
                }, 300);
            }
            
            console.log(`✅ Switched to tab: ${tabId}`);
            
        } catch (error) {
            console.error('❌ Error switching tab:', error);
        } finally {
            // Reset debounce flag
            setTimeout(() => {
                isSwitchingTab = false;
            }, 500);
        }
    }

    // Tambahkan fungsi triggerTemplateLoad
    function triggerTemplateLoad(templateData) {
        console.log('🔧 Triggering template load with all methods...');
        
        // Method 1: Direct function call
        if (window.TrendChartApp && window.TrendChartApp.loadTemplateFromData) {
            console.log('🎯 Method 1: Direct function call');
            window.TrendChartApp.loadTemplateFromData(templateData);
        }
        
        // Method 2: Global function
        if (typeof window.loadTemplateToChart === 'function') {
            console.log('🎯 Method 2: Global function');
            window.loadTemplateToChart(templateData);
        }
        
        // Method 3: Event dispatch
        console.log('🎯 Method 3: Event dispatch');
        const event = new CustomEvent('loadTemplateNow', {
            detail: { templateData }
        });
        window.dispatchEvent(event);
        
        // Method 4: Check if TrendChart instance exists
        if (window.trendChart && typeof window.trendChart.loadTemplateFromData === 'function') {
            console.log('🎯 Method 4: Window.trendChart instance');
            window.trendChart.loadTemplateFromData(templateData);
        }
    }
    
    // ========== TRENDLIST UI SETUP ==========

    // mainhandler.js - tambahkan fungsi ini
    function ensureDateListenersWorking() {
        console.log('🔧 Ensuring date listeners are working...');
        
        // Cek apakah event listeners terpasang dengan benar
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        
        if (startDateInput) {
            // Simpan reference ke fungsi untuk debugging
            const originalHandler = startDateInput.onchange;
            console.log('🔍 Start date input event handler check:', {
                hasOnchangeAttribute: startDateInput.hasAttribute('onchange'),
                hasEventListener: startDateInput.hasAttribute('data-date-listener'),
                value: startDateInput.value
            });
            
            // Tambah manual trigger jika diperlukan
            if (!startDateInput.hasAttribute('data-date-listener-set')) {
                console.log('🔗 Manually setting up start date listener');
                startDateInput.setAttribute('data-date-listener-set', 'true');
                
                startDateInput.addEventListener('change', function() {
                    console.log('🔄 Manual change event for start date');
                    if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.autoUpdateDates) {
                        window.QualityTrendCoreHandler.autoUpdateDates();
                    }
                });
            }
        }
        
        if (endDateInput) {
            // Simpan reference ke fungsi untuk debugging
            const originalHandler = endDateInput.onchange;
            console.log('🔍 End date input event handler check:', {
                hasOnchangeAttribute: endDateInput.hasAttribute('onchange'),
                hasEventListener: endDateInput.hasAttribute('data-date-listener'),
                value: endDateInput.value
            });
            
            // Tambah manual trigger jika diperlukan
            if (!endDateInput.hasAttribute('data-date-listener-set')) {
                console.log('🔗 Manually setting up end date listener');
                endDateInput.setAttribute('data-date-listener-set', 'true');
                
                endDateInput.addEventListener('change', function() {
                    console.log('🔄 Manual change event for end date');
                    if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.autoUpdateDates) {
                        window.QualityTrendCoreHandler.autoUpdateDates();
                    }
                });
            }
        }
    }

    // mainhandler.js - update setupDateEventListeners()
    function setupDateEventListeners() {
        console.log('📅 Setting up date event listeners...');
        
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        
        if (!startDateInput || !endDateInput) {
            console.warn('⚠️ Date inputs not found, skipping listener setup');
            return;
        }
        
        // Hapus event listeners lama
        const newStartDateInput = startDateInput.cloneNode(true);
        const newEndDateInput = endDateInput.cloneNode(true);
        startDateInput.parentNode.replaceChild(newStartDateInput, startDateInput);
        endDateInput.parentNode.replaceChild(newEndDateInput, endDateInput);
        
        // Setup dengan safety check
        const safeAutoUpdateDates = () => {
            console.log('🔄 Safe date update triggered');
            autoUpdateDates();
        };
        
        if (newStartDateInput) {
            newStartDateInput.addEventListener('change', safeAutoUpdateDates);
            newStartDateInput.addEventListener('input', () => {
                clearTimeout(window.dateSearchTimeout);
                window.dateSearchTimeout = setTimeout(() => {
                    safeAutoUpdateDates();
                }, 800);
            });
            console.log('✅ Start date listener set up');
        }
        
        if (newEndDateInput) {
            newEndDateInput.addEventListener('change', safeAutoUpdateDates);
            newEndDateInput.addEventListener('input', () => {
                clearTimeout(window.dateSearchTimeout);
                window.dateSearchTimeout = setTimeout(() => {
                    safeAutoUpdateDates();
                }, 800);
            });
            console.log('✅ End date listener set up');
        }
    }

    // Update setupTrendListUI() di mainhandler.js
    function setupTrendListUI() {
        console.log('🎨 Setting up trendlist UI...');

        // Setup tanggal default jika belum di-set
        setTimeout(() => {
            const startDateInput = document.getElementById('start-date');
            const endDateInput = document.getElementById('end-date');
            
            if (startDateInput && !startDateInput.value) {
                resetDateToDefault();
            }
            
            // Tunggu sedikit lebih lama untuk memastikan corehandler siap
            setTimeout(() => {
                setupDateEventListeners();
            }, 500);
        }, 300);
        
        // Setup tag search input (tetap)
        const tagSearchInput = document.getElementById('tag-search');
        if (tagSearchInput && !tagSearchInput.hasAttribute('data-handler-initialized')) {
            tagSearchInput.setAttribute('data-handler-initialized', 'true');
            tagSearchInput.addEventListener('input', () => {
                clearTimeout(window.searchTimeout);
                window.searchTimeout = setTimeout(() => {
                    if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.displayAvailableTags) {
                        window.QualityTrendCoreHandler.displayAvailableTags();
                    }
                }, 300);
            });
        }
        
        // Load templates jika user sudah login
        setTimeout(() => {
            if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.loadUserTemplates) {
                window.QualityTrendCoreHandler.loadUserTemplates();
            }
        }, 800);
    }
    
    function autoUpdateDates() {
        console.log('📅 autoUpdateDates called from mainhandler');
        
        // Coba akses langsung dari window
        if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.instance) {
            const handler = window.QualityTrendCoreHandler.instance;
            if (handler && typeof handler.autoUpdateDates === 'function') {
                console.log('🔄 Calling QualityTrendCoreHandler.autoUpdateDates');
                handler.autoUpdateDates();
                return;
            }
        }
        
        // Coba akses dari window global
        if (typeof window.qualityTrendCoreHandlerInstance !== 'undefined' && 
            window.qualityTrendCoreHandlerInstance && 
            typeof window.qualityTrendCoreHandlerInstance.autoUpdateDates === 'function') {
            console.log('🔄 Calling window.qualityTrendCoreHandlerInstance.autoUpdateDates');
            window.qualityTrendCoreHandlerInstance.autoUpdateDates();
            return;
        }
        
        // Coba akses function langsung
        if (typeof window.autoUpdateDates === 'function') {
            console.log('🔄 Calling window.autoUpdateDates global function');
            window.autoUpdateDates();
            return;
        }
        
        // Wait dan coba lagi jika handler belum ready
        console.warn('⚠️ QualityTrendCoreHandler not ready yet, waiting...');
        setTimeout(() => {
            autoUpdateDates();
        }, 500);
    }
    
    // ========== TRENDCHART UI SETUP ==========
    function setupTrendChartUI() {
        console.log('🎨 Setting up trendchart UI...');
        
        // Setup back button
        const backButton = document.querySelector('.back-button');
        if (backButton && !backButton.hasAttribute('data-handler-initialized')) {
            backButton.setAttribute('data-handler-initialized', 'true');
            
            // Hapus onclick inline dan ganti dengan event listener
            backButton.removeAttribute('onclick');
            backButton.addEventListener('click', function(e) {
                e.preventDefault();
                window.goBackToTrendList();
            });
        }
        
        // Setup reload button (jika ada)
        const reloadBtn = document.getElementById('reload-chart-btn');
        if (reloadBtn && !reloadBtn.hasAttribute('data-handler-initialized')) {
            reloadBtn.setAttribute('data-handler-initialized', 'true');
            reloadBtn.addEventListener('click', function() {
                if (window.trendChart && typeof window.trendChart.reloadChartsWithNewDates === 'function') {
                    window.trendChart.reloadChartsWithNewDates();
                }
            });
        }
    }
    
    function isTemplateView() {
        const params = new URLSearchParams(window.location.search);
        const templateId = params.get('template_id');
        const tags = params.get('tags');
        return templateId !== null || (tags && tags.length > 0);
    }
    
    function loadTemplateForChart() {
        if (window.TrendChartApp && window.TrendChartApp.initialize) {
            window.TrendChartApp.initialize();
        } else if (window.trendChart && window.trendChart.loadTemplateFromUrl) {
            window.trendChart.loadTemplateFromUrl();
        }
    }
    
    function goBackToTrendList() {
        // Switch back to trendlist tab
        const trendlistTab = document.querySelector('.nav-tabs a[data-tab="trendlist"]');
        if (trendlistTab) {
            trendlistTab.click();
        }
        
        // Clear template data
        delete window.currentTemplateData;
    }
    
    // ========== GLOBAL FUNCTIONS ==========
    // Export fungsi untuk diakses dari HTML onclick
    window.showTagSettings = function() {
        if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.showTagSettings) {
            window.QualityTrendCoreHandler.showTagSettings();
        }
    };
    
    window.hideCustomSelector = function() {
        if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.hideCustomSelector) {
            window.QualityTrendCoreHandler.hideCustomSelector();
        }
    };
    
    window.loadTemplate = function(templateId) {
        if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.loadTemplate) {
            window.QualityTrendCoreHandler.loadTemplate(templateId);
        }
    };
    
    window.editTemplate = function(templateId) {
        if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.editTemplate) {
            window.QualityTrendCoreHandler.editTemplate(templateId);
        }
    };
    
    window.deleteTemplate = function(templateId) {
        if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.deleteTemplate) {
            window.QualityTrendCoreHandler.deleteTemplate(templateId);
        }
    };
    
    window.saveTagSettings = function() {
        if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.saveTagSettings) {
            window.QualityTrendCoreHandler.saveTagSettings();
        }
    };
    
    window.selectAllTags = function() {
        if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.selectAllTags) {
            window.QualityTrendCoreHandler.selectAllTags();
        }
    };
    
    window.clearSelection = function() {
        if (window.QualityTrendCoreHandler && window.QualityTrendCoreHandler.clearSelection) {
            window.QualityTrendCoreHandler.clearSelection();
        }
    };

    window.reloadTrendCharts = function() {
        if (window.trendChart && typeof window.trendChart.reloadChartsWithNewDates === 'function') {
            window.trendChart.reloadChartsWithNewDates();
        } else if (window.TrendChartApp && window.TrendChartApp.instance) {
            // Coba akses dari TrendChartApp
            const trendChart = window.TrendChartApp.instance;
            if (trendChart && typeof trendChart.reloadChartsWithNewDates === 'function') {
                trendChart.reloadChartsWithNewDates();
            }
        } else {
            console.warn('⚠️ TrendChart instance not found for reload');
        }
    };
    
    window.scrollToTop = function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.goBackToTrendList = function() {
        console.log('🔙 goBackToTrendList called');

        // Update header visibility terlebih dahulu
        updateHeaderVisibility('trendlist');
        
        // 1. Cleanup chart data
        cleanupCharts();
        
        // 2. Clear template data
        delete window.currentTemplateData;
        localStorage.removeItem('currentTemplateData');
        
        // 3. Switch back to trendlist tab
        const trendlistTab = document.querySelector('.nav-tabs a[data-tab="trendlist"]');
        if (trendlistTab) {
            trendlistTab.click();
        } else {
            console.error('❌ Trendlist tab not found');
            // Fallback: manually update UI
            updateTabUI('trendlist');
        }
        
        // 4. Reset trendchart state
        resetTrendChartState();
        
        // 5. Reset tanggal ke default SETELAH tab berhasil di-switch
        setTimeout(() => {
            resetDateToDefault();
        }, 300);
    };

    // Fungsi baru untuk reset tanggal ke default
    // mainhandler.js - perbaiki bagian resetDateToDefault
    function resetDateToDefault() {
        console.log('📅 Resetting dates to default...');
        
        // Set end date ke hari ini
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // H-7
        
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        
        if (startDateInput) {
            const formattedStartDate = startDate.toISOString().split('T')[0];
            startDateInput.value = formattedStartDate;
            console.log('✅ Start date reset to:', formattedStartDate);
        }
        
        if (endDateInput) {
            const formattedEndDate = endDate.toISOString().split('T')[0];
            endDateInput.value = formattedEndDate;
            console.log('✅ End date reset to:', formattedEndDate);
        }
        
        // Trigger autoUpdateDates melalui QualityTrendCoreHandler jika tersedia
        setTimeout(() => {
            const handler = window.QualityTrendCoreHandler?.instance || 
                          window.qualityTrendCoreHandlerInstance;
            
            if (handler && typeof handler.autoUpdateDates === 'function') {
                console.log('🔄 Triggering autoUpdateDates after reset');
                handler.autoUpdateDates();
            } else {
                console.log('ℹ️ QualityTrendCoreHandler not ready yet, dates will update on change');
            }
        }, 300);
    }

    // Fungsi untuk cleanup semua chart
    function cleanupCharts() {
        console.log('🧹 Cleaning up charts...');
        
        // Destroy semua Chart.js instances
        if (window.Chart) {
            Chart.helpers.each(Chart.instances, (instance) => {
                instance.destroy();
            });
        }
        
        // Clear chart containers
        const tagSections = document.getElementById('tag-sections');
        if (tagSections) {
            tagSections.innerHTML = '';
        }
        
        // Clear chart loading state
        const chartLoading = document.getElementById('chart-loading');
        if (chartLoading) {
            chartLoading.style.display = 'none';
        }
        
        // Reset template info display
        resetTemplateInfo();
        
        console.log('✅ Charts cleaned up');
    }

    // Fungsi untuk reset template info
    function resetTemplateInfo() {
        console.log('🔄 Resetting template info...');
        
        const nameDisplay = document.getElementById('template-name-display');
        const dateDisplay = document.getElementById('date-range-display');
        const countDisplay = document.getElementById('tag-count-display');
        
        if (nameDisplay) {
            nameDisplay.innerHTML = '<i class="fas fa-chart-line"></i><span>No Template Loaded</span>';
        }
        
        if (dateDisplay) {
            dateDisplay.innerHTML = '<i class="fas fa-calendar-alt"></i><span>Select a template first</span>';
        }
        
        if (countDisplay) {
            countDisplay.innerHTML = '<i class="fas fa-tags"></i><span>0 Tags</span>';
        }
    }

    // Fungsi untuk reset trendchart state
    function resetTrendChartState() {
        console.log('🔄 Resetting trendchart state...');
        
        // Reset trendchart instance jika ada
        if (window.trendChart) {
            if (typeof window.trendChart.cleanup === 'function') {
                window.trendChart.cleanup();
            }
            delete window.trendChart;
        }
        
        // Reset TrendChartApp state
        if (window.TrendChartApp) {
            if (typeof window.TrendChartApp.cleanup === 'function') {
                window.TrendChartApp.cleanup();
            }
        }
        
        // Reset ChartRenderer
        if (window.ChartRenderer) {
            if (typeof window.ChartRenderer.cleanup === 'function') {
                window.ChartRenderer.cleanup();
            }
        }
        
        console.log('✅ Trendchart state reset');
    }

    // ========== TRENDCHART UI SETUP ==========
    function setupTrendChartUI() {
        console.log('🎨 Setting up trendchart UI...');
        
        // Setup back button
        const backButton = document.querySelector('.back-button');
        if (backButton && !backButton.hasAttribute('data-handler-initialized')) {
            backButton.setAttribute('data-handler-initialized', 'true');
            
            // Hapus onclick inline dan ganti dengan event listener
            backButton.removeAttribute('onclick');
            backButton.addEventListener('click', function(e) {
                e.preventDefault();
                window.goBackToTrendList();
            });
        }
        
        // Setup reload button (jika ada)
        const reloadBtn = document.getElementById('reload-chart-btn');
        if (reloadBtn && !reloadBtn.hasAttribute('data-handler-initialized')) {
            reloadBtn.setAttribute('data-handler-initialized', 'true');
            reloadBtn.addEventListener('click', function() {
                if (window.trendChart && typeof window.trendChart.reloadChartsWithNewDates === 'function') {
                    window.trendChart.reloadChartsWithNewDates();
                }
            });
        }
    }
    
    // ========== INITIALIZATION ==========
    async function initializeApp() {
        console.log('🚀 Initializing Quality Trend System...');
        
        // Set plugin base URL
        pluginBaseUrl = getPluginBaseUrl();
        console.log('🔧 Plugin Base URL:', pluginBaseUrl);
        
        // Setup tab navigation
        setupTabNavigation();

        // Set header visibility untuk tab default (trendlist)
        updateHeaderVisibility('trendlist');
        
        // Load DataSelector pertama - TUNGGU SAMPAI SIAP
        console.log('📥 Loading DataSelector...');
        await loadScript('js/DataSelector.js', 'DataSelector');
        
        // Tunggu DataSelector benar-benar siap
        await new Promise(resolve => {
            if (window.DataSelector && window.DataSelector.getInstance) {
                console.log('✅ DataSelector ready');
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.DataSelector && window.DataSelector.getInstance) {
                        clearInterval(checkInterval);
                        console.log('✅ DataSelector ready after wait');
                        resolve();
                    }
                }, 100);
                
                // Timeout
                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.warn('⚠️ DataSelector loading timeout, continuing anyway');
                    resolve();
                }, 5000);
            }
        });
        
        // Load module untuk tab default
        await loadTabModule('trendlist');
        
        console.log('✅ Quality Trend System initialized');
    }

    // Fungsi baru untuk setup tab navigation
    function setupTabNavigation() {
        console.log('🔗 Setting up tab navigation...');
        
        // Gunakan selector yang lebih spesifik
        const navLinks = document.querySelectorAll('.nav-tabs a[data-tab]');
        console.log('📋 Found nav links:', navLinks.length);
        
        if (navLinks.length === 0) {
            console.warn('⚠️ No nav links found with selector .nav-tabs a[data-tab]');
            // Coba selector alternatif
            const altLinks = document.querySelectorAll('.nav-tabs a');
            console.log('🔄 Trying alternative selector .nav-tabs a:', altLinks.length);
            
            if (altLinks.length > 0) {
                altLinks.forEach((link, index) => {
                    console.log(`  ${index + 1}. Link:`, {
                        text: link.textContent.trim(),
                        hasDataTab: link.hasAttribute('data-tab'),
                        className: link.className
                    });
                });
                
                // Gunakan alternatif jika ada
                navLinks = altLinks;
            }
        }
        
        navLinks.forEach((link) => {
            console.log(`📝 Setting up link:`, {
                'data-tab': link.getAttribute('data-tab'),
                text: link.textContent.trim(),
                className: link.className
            });
            
            // Hapus semua event listeners lama
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            // Tambahkan event listener
            newLink.addEventListener('click', handleTabClick);
            
            console.log(`✅ Listener added to: ${newLink.getAttribute('data-tab') || 'Unknown tab'}`);
        });
        
        // Jika masih tidak ada, buat secara manual
        if (navLinks.length === 0) {
            console.warn('⚠️ No tab links found, creating default tabs');
            createDefaultTabs();
        }
    }

    // Fungsi untuk membuat default tabs jika tidak ada
    function createDefaultTabs() {
        const navTabs = document.querySelector('.nav-tabs');
        if (!navTabs) {
            console.error('❌ .nav-tabs container not found');
            return;
        }
        
        // Clear existing content
        navTabs.innerHTML = '';
        
        // Buat tab list
        const trendlistTab = document.createElement('a');
        trendlistTab.href = '#';
        trendlistTab.setAttribute('data-tab', 'trendlist');
        trendlistTab.className = 'active';
        trendlistTab.innerHTML = '<i class="fas fa-list"></i> Trend List';
        
        // Buat tab chart
        const trendchartTab = document.createElement('a');
        trendchartTab.href = '#';
        trendchartTab.setAttribute('data-tab', 'trendchart');
        trendchartTab.innerHTML = '<i class="fas fa-chart-line"></i> Trend Chart';
        
        // Tambahkan ke container
        navTabs.appendChild(trendlistTab);
        navTabs.appendChild(trendchartTab);
        
        console.log('✅ Default tabs created');
        
        // Setup event listeners untuk tab baru
        setupTabNavigation();
    }
    
    // Export ke window object
    window.QualityTrendMainHandler = {
        initializeApp: initializeApp,
        loadTabModule: loadTabModule,
        getActiveModules: () => activeModules,
        getCurrentTab: () => currentTab,
        getPluginBaseUrl: () => pluginBaseUrl,
        cleanup: function() {
            console.log('🧹 Cleaning up QualityTrendMainHandler...');
            
            // Reset header visibility
            const headerContent = document.querySelector('.header-content');
            if (headerContent) {
                headerContent.style.display = 'flex'; // Default ke visible
            }
            
            Object.values(activeModules).forEach(module => {
                if (module && typeof module.cleanup === 'function') {
                    module.cleanup();
                }
            });
            activeModules = {
                trendlist: null,
                trendchart: null,
                DataSelector: null,
                chartrender: null
            };
        }
    };
    
    console.log('=== MAINHANDLER.JS LOADED ===');
    
    // Auto-initialize ketika DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📋 DOM ready, initializing...');
            setTimeout(initializeApp, 100);
        });
    } else {
        console.log('📋 DOM already loaded, initializing...');
        setTimeout(initializeApp, 100);
    }

    window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('DataSelectorApp')) {
            console.log('ℹ️ DataSelectorApp not found, using DataSelector instead');
            // Coba fallback ke DataSelector
            if (window.DataSelector && !window.DataSelectorApp) {
                window.DataSelectorApp = window.DataSelector;
            }
        }
    });
    
})();