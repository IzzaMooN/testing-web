// chartrender.js - Regular Script Version with IIFE
// Konversi dari module ke IIFE regular script

(function() {
    console.log('=== CHARTRENDER.JS LOADING (Regular Script) ===');
    
    // ========== CHART FUNCTIONS ==========
        function renderChart(tagName, values, minLimit, maxLimit, minGuaranteeLimit, maxGuaranteeLimit) {
        console.log('🎨 RENDER APEXCHART:', { 
            tagName, 
            minLimit, 
            maxLimit, 
            minGuaranteeLimit, 
            maxGuaranteeLimit,
            valuesLength: values.length 
        });
        
        const containerId = `chart-${tagName.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error('❌ Chart container not found for tag:', tagName);
            return null;
        }

        // Destroy existing chart if any
        if (container.chart) {
            container.chart.destroy();
        }

        // Process data untuk ApexCharts
        const dataValues = [];
        const categories = [];
        const timestamps = [];
        
        values.forEach((item, index) => {
            let value, timestamp;
            
            if (typeof item === 'object' && item !== null) {
                value = parseFloat(item.value || item.Value || item.val || 0);
                timestamp = item.datetime || item.timestamp || item.time || Date.now();
            } else {
                value = parseFloat(item) || 0;
                timestamp = Date.now() + (index * 1000); // Generate dummy timestamp
            }
            
            if (!isNaN(value) && value !== null) {
                dataValues.push({
                    x: new Date(timestamp).getTime(),
                    y: value
                });
                categories.push(new Date(timestamp));
                timestamps.push(timestamp);
            } else {
                // Handle null/missing values dengan null
                dataValues.push({
                    x: new Date(timestamp).getTime(),
                    y: null
                });
                categories.push(new Date(timestamp));
                timestamps.push(timestamp);
            }
        });

        if (dataValues.length === 0) {
            console.warn('⚠️ No valid data for chart:', tagName);
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Tidak ada data yang valid untuk ditampilkan</p>';
            return null;
        }

        // Sort data by timestamp
        dataValues.sort((a, b) => a.x - b.x);

        // ========== NEW: Calculate Y-Axis Range Dynamically ==========
        function calculateYAxisRange() {
            const allYValues = [];
            
            // Collect all main data values
            dataValues.forEach(point => {
                if (point.y !== null && !isNaN(point.y)) {
                    allYValues.push(point.y);
                }
            });
            
            // Add limit values if they exist
            if (minLimit !== null && minLimit !== undefined && !isNaN(parseFloat(minLimit))) {
                allYValues.push(parseFloat(minLimit));
            }
            if (maxLimit !== null && maxLimit !== undefined && !isNaN(parseFloat(maxLimit))) {
                allYValues.push(parseFloat(maxLimit));
            }
            if (minGuaranteeLimit !== null && minGuaranteeLimit !== undefined && !isNaN(parseFloat(minGuaranteeLimit))) {
                allYValues.push(parseFloat(minGuaranteeLimit));
            }
            if (maxGuaranteeLimit !== null && maxGuaranteeLimit !== undefined && !isNaN(parseFloat(maxGuaranteeLimit))) {
                allYValues.push(parseFloat(maxGuaranteeLimit));
            }
            
            if (allYValues.length === 0) {
                return { min: 0, max: 10 };
            }
            
            const minValue = Math.min(...allYValues);
            const maxValue = Math.max(...allYValues);
            
            // Add padding (10% of range or fixed value if range is small)
            const range = maxValue - minValue;
            let padding;
            
            if (range === 0) {
                padding = Math.abs(minValue) * 0.1 || 1; // Jika semua nilai sama
            } else {
                padding = range * 0.1; // 10% padding
            }
            
            // Ensure padding is at least a reasonable value
            padding = Math.max(padding, Math.abs(minValue) * 0.05 || 0.1);
            
            const paddedMin = minValue - padding;
            const paddedMax = maxValue + padding;
            
            console.log('📐 Y-Axis Range Calculation:', {
                minValue,
                maxValue,
                range,
                padding,
                paddedMin,
                paddedMax,
                limitCount: allYValues.length - dataValues.filter(p => p.y !== null).length
            });
            
            return { min: paddedMin, max: paddedMax };
        }
        
        const yAxisRange = calculateYAxisRange();
        // ========== END NEW ==========

        // Prepare series data
        const series = [{
            name: tagName.replace('Root.LAB.', ''),
            data: dataValues,
            type: 'line',
            color: '#6366f1',
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.1,
                    stops: [0, 90, 100]
                }
            }
        }];

        // Add Control Limits (lsl & usl) - WARNA KUNING
        if (minLimit !== null && minLimit !== undefined && !isNaN(parseFloat(minLimit))) {
            const lslValue = parseFloat(minLimit);
            console.log('➕ Adding lower control limit line:', lslValue);
            
            const lslData = dataValues.map(point => ({
                x: point.x,
                y: lslValue
            }));
            
            series.push({
                name: 'LSL',
                data: lslData,
                type: 'line',
                color: '#f59e0b',
                strokeDashArray: 5,
                fill: false
            });
        }

        if (maxLimit !== null && maxLimit !== undefined && !isNaN(parseFloat(maxLimit))) {
            const uslValue = parseFloat(maxLimit);
            console.log('➕ Adding upper control limit line:', uslValue);
            
            const uslData = dataValues.map(point => ({
                x: point.x,
                y: uslValue
            }));
            
            series.push({
                name: 'USL',
                data: uslData,
                type: 'line',
                color: '#f59e0b',
                strokeDashArray: 5,
                fill: false
            });
        }

        // Add Guarantee Limits (LGL & UGL) - WARNA MERAH
        if (minGuaranteeLimit !== null && minGuaranteeLimit !== undefined && !isNaN(parseFloat(minGuaranteeLimit))) {
            const lglValue = parseFloat(minGuaranteeLimit);
            console.log('➕ Adding lower guarantee limit line:', lglValue);
            
            const lglData = dataValues.map(point => ({
                x: point.x,
                y: lglValue
            }));
            
            series.push({
                name: 'LGL',
                data: lglData,
                type: 'line',
                color: '#dc2626',
                strokeDashArray: 5,
                fill: false
            });
        }

        if (maxGuaranteeLimit !== null && maxGuaranteeLimit !== undefined && !isNaN(parseFloat(maxGuaranteeLimit))) {
            const uglValue = parseFloat(maxGuaranteeLimit);
            console.log('➕ Adding upper guarantee limit line:', uglValue);
            
            const uglData = dataValues.map(point => ({
                x: point.x,
                y: uglValue
            }));
            
            series.push({
                name: 'UGL',
                data: uglData,
                type: 'line',
                color: '#dc2626',
                strokeDashArray: 5,
                fill: false
            });
        }

        console.log('📊 Final series count:', series.length);

        // ============================================================
        // TAMBAHKAN BAGIAN PERTAMA DI SINI (Sebelum try-catch options)
        // ============================================================
        const discreteMarkers = [];
        dataValues.forEach((point, index) => {
            const val = point.y;
            if (val !== null && !isNaN(val)) {
                let isOut = false;
                // Cek terhadap LSL (minLimit)
                if (minLimit !== null && minLimit !== undefined && val < parseFloat(minLimit)) isOut = true;
                // Cek terhadap USL (maxLimit)
                if (maxLimit !== null && maxLimit !== undefined && val > parseFloat(maxLimit)) isOut = true;

                if (isOut) {
                    discreteMarkers.push({
                        seriesIndex: 0, // 0 merujuk pada series data utama (tagName)
                        dataPointIndex: index,
                        fillColor: '#dc2626', // Merah Solid
                        strokeColor: '#ffffff',
                        size: 6,
                        shape: "circle"
                    });
                }
            }
        });

        try {
            // Konfigurasi ApexCharts
            const options = {
                series: series,
                chart: {
                    type: 'line',
                    height: 275,
                    zoom: {
                        enabled: true,
                        type: 'x',
                        autoScaleYaxis: true
                    },
                    toolbar: {
                        autoSelected: 'zoom',
                        tools: {
                            download: true,
                            selection: true,
                            zoom: true,
                            zoomin: true,
                            zoomout: true,
                            pan: true,
                            reset: true
                        }
                    },
                    animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                        animateGradually: {
                            enabled: true,
                            delay: 150
                        },
                        dynamicAnimation: {
                            enabled: true,
                            speed: 350
                        }
                    }
                },
                title: {
                    text: `Grafik - ${tagName.replace('Root.LAB.', '')}`,
                    align: 'left',
                    style: {
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }
                },
                dataLabels: {
                    enabled: false
                },
                stroke: {
                    curve: 'smooth',
                    width: [3, 2, 2, 2, 2],
                    dashArray: [0, 5, 5, 5, 5]
                },
                markers: {
                    size: [5, 0, 0, 0, 0], // Sesuai urutan series
                    colors: ['#6366f1'],
                    strokeColors: '#ffffff',
                    strokeWidth: 2,
                    hover: {
                        size: 7
                    },
                    // TAMBAHKAN PROPERTI DISCRETE DI SINI:
                    discrete: discreteMarkers
                },
                xaxis: {
                    type: 'datetime',
                    labels: {
                        datetimeUTC: false,
                        format: 'dd MMM HH:mm'
                    },
                    tooltip: {
                        enabled: true,
                        formatter: function(val) {
                            return new Date(val).toLocaleString('id-ID');
                        }
                    }
                },
                yaxis: {
                    title: {
                        text: 'Value'
                    },
                    labels: {
                        formatter: function(val) {
                            return val.toFixed(2);
                        }
                    },
                    // ========== NEW: Set min and max for Y-axis ==========
                    min: yAxisRange.min,
                    max: yAxisRange.max,
                    // ========== END NEW ==========
                    forceNiceScale: true
                },
                tooltip: {
                    shared: true,
                    intersect: false,
                    x: {
                        show: true,
                        formatter: function(val) {
                            return new Date(val).toLocaleString('id-ID');
                        }
                    },
                    y: {
                        formatter: function(val, opts) {
                            const seriesName = opts.w.globals.seriesNames[opts.seriesIndex];
                            const isOutOfBounds = isValueOutOfBounds(val, minLimit, maxLimit, seriesName);
                            const warningIcon = isOutOfBounds ? '🚨 ' : '';
                            
                            if (seriesName.includes('LSL') || seriesName.includes('USL')) {
                                return `⚠️ ${seriesName}: ${val}`;
                            } else if (seriesName.includes('LGL') || seriesName.includes('UGL')) {
                                return `🚨 ${seriesName}: ${val}`;
                            } else {
                                return `${warningIcon}${val.toFixed(2)}${isOutOfBounds ? ' (OUT OF RANGE)' : ''}`;
                            }
                        }
                    },
                    custom: function({ series, seriesIndex, dataPointIndex, w }) {
                        const value = series[seriesIndex][dataPointIndex];
                        const seriesName = w.globals.seriesNames[seriesIndex];
                        const timestamp = w.globals.seriesX[seriesIndex][dataPointIndex];
                        
                        if (seriesName === tagName) {
                            const isOutOfBounds = isValueOutOfBounds(value, minLimit, maxLimit, seriesName);
                            
                            if (isOutOfBounds) {
                                let reason = '';
                                if (minLimit !== null && minLimit !== undefined && !isNaN(parseFloat(minLimit)) && value < parseFloat(minLimit)) {
                                    reason = `Di bawah control limit (${minLimit})`;
                                } else if (maxLimit !== null && maxLimit !== undefined && !isNaN(parseFloat(maxLimit)) && value > parseFloat(maxLimit)) {
                                    reason = `Di atas control limit (${maxLimit})`;
                                }
                                
                                return `<div class="apexcharts-tooltip-box">
                                    <div class="tooltip-warning">🚨 Data ini di luar range!</div>
                                    <div class="tooltip-reason">${reason}</div>
                                </div>`;
                            }
                        }
                        return '';
                    }
                },
                grid: {
                    borderColor: '#f1f1f1',
                    row: {
                        colors: ['#f3f4f6', 'transparent'],
                        opacity: 0.5
                    }
                },
                legend: {
                    position: 'top',
                    horizontalAlign: 'center',
                    floating: true,
                    offsetY: -35,
                    offsetX: -5
                },
                noData: {
                    text: 'Loading data...',
                    align: 'center',
                    verticalAlign: 'middle',
                    style: {
                        color: '#666666',
                        fontSize: '14px'
                    }
                }
            };

            // Create chart
            container.chart = new ApexCharts(container, options);
            container.chart.render();

            console.log('✅ ApexChart rendered successfully for:', tagName);
            console.log('📏 Y-Axis range applied:', yAxisRange);

            return container.chart;

        } catch (error) {
            console.error('❌ ApexChart error:', error);
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #dc2626;">Error rendering chart</p>';
            return null;
        }
    }

    // Helper function untuk cek out of bounds
    function isValueOutOfBounds(value, minLimit, maxLimit, seriesName) {
        if (seriesName.includes('Limit') || seriesName.includes('LSL') || seriesName.includes('USL') || 
            seriesName.includes('LGL') || seriesName.includes('UGL')) {
            return false;
        }
        
        if (value === null || value === undefined || isNaN(value)) return false;
        
        if (minLimit !== null && minLimit !== undefined && !isNaN(parseFloat(minLimit))) {
            if (value < parseFloat(minLimit)) return true;
        }
        
        if (maxLimit !== null && maxLimit !== undefined && !isNaN(parseFloat(maxLimit))) {
            if (value > parseFloat(maxLimit)) return true;
        }
        
        return false;
    }

    // ========== UTILITY FUNCTIONS ==========
    function calculateStatistics(values) {
        if (!Array.isArray(values) || values.length === 0) {
            return { avg: 0, max: 0, min: 0, stdev: 0 };
        }

        // Filter out null values
        const numbers = values.map(item => {
            if (typeof item === 'object' && item !== null) {
                return parseFloat(item.value || item.Value || item.val || 0);
            }
            return parseFloat(item) || 0;
        }).filter(n => !isNaN(n) && n !== null);
        
        if (numbers.length === 0) {
            return { avg: 0, max: 0, min: 0, stdev: 0 };
        }

        const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const max = Math.max(...numbers);
        const min = Math.min(...numbers);
        
        const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
        const stdev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / numbers.length);

        return { avg, max, min, stdev };
    }

    function calculateCapabilityIndices(values, minLimit, maxLimit, stdev) {
        if (!Array.isArray(values) || values.length === 0 || stdev === 0) {
            return { cpk: null, cpl: null, cpu: null };
        }

        const numbers = values.map(item => {
            if (typeof item === 'object' && item !== null) {
                return parseFloat(item.value || item.Value || item.val || 0);
            }
            return parseFloat(item) || 0;
        }).filter(n => !isNaN(n) && n !== null);
        
        if (numbers.length === 0) {
            return { cpk: null, cpl: null, cpu: null };
        }

        const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        
        let cpk = null;
        let cpl = null;
        let cpu = null;

        // Calculate CPL (Lower capability)
        if (minLimit !== null && minLimit !== undefined && !isNaN(parseFloat(minLimit))) {
            const lsl = parseFloat(minLimit);
            cpl = (avg - lsl) / (3 * stdev);
        }

        // Calculate CPU (Upper capability)
        if (maxLimit !== null && maxLimit !== undefined && !isNaN(parseFloat(maxLimit))) {
            const usl = parseFloat(maxLimit);
            cpu = (usl - avg) / (3 * stdev);
        }

        // Calculate CPK (Overall capability)
        if (cpl !== null && cpu !== null) {
            cpk = Math.min(cpl, cpu);
        } else if (cpl !== null) {
            cpk = cpl;
        } else if (cpu !== null) {
            cpk = cpu;
        }

        return { cpk, cpl, cpu };
    }

    function countOutOfBounds(values, minLimit, maxLimit) {
        if (!Array.isArray(values) || values.length === 0) return 0;
        if (!minLimit && !maxLimit) return 0;

        return values.filter(item => {
            let value;
            if (typeof item === 'object' && item !== null) {
                value = parseFloat(item.value || item.Value || item.val || 0);
            } else {
                value = parseFloat(item) || 0;
            }

            if (isNaN(value) || value === null) return false;

            if (minLimit && value < parseFloat(minLimit)) return true;
            if (maxLimit && value > parseFloat(maxLimit)) return true;
            return false;
        }).length;
    }

    // ========== TEMPLATE CHART SECTION CREATION ==========

    /**
     * Membuat tag section dari data template
     * @param {string} tagName - Nama tag
     * @param {object} tagData - Data tag dari server
     * @param {Array} availableTagsList - List semua tags yang tersedia (opsional)
     */
    function createTagSectionFromTemplate(tagName, tagData, availableTagsList = []) {
        console.log('🎨 APEXCHART - Creating tag section:', {
            tagName,
            tagDataKeys: Object.keys(tagData),
            tagDataValues: Array.isArray(tagData.values) ? tagData.values.length : 
                           Array.isArray(tagData) ? tagData.length : 
                           Object.keys(tagData).length,
            availableTagsCount: availableTagsList.length
        });
        
        const section = document.createElement('div');
        section.className = 'tag-section';
        
        // Cari informasi limit dari availableTagsList jika tersedia
        let minLimit = null; // lsl
        let maxLimit = null; // usl
        let minGuaranteeLimit = null; // LGL
        let maxGuaranteeLimit = null; // UGL

        console.log('🔍 Searching for limits in availableTagsList...');
        if (availableTagsList && availableTagsList.length > 0) {
            const originalTagData = availableTagsList.find(tag => {
                const availableTagName = tag.tagname || tag.name || tag.tag_name;
                console.log('🔍 Comparing:', availableTagName, '===', tagName, '→', availableTagName === tagName);
                return availableTagName === tagName;
            });
            
            if (originalTagData) {
                minLimit = originalTagData.lsl || originalTagData.lower_limit || 
                          originalTagData.minLimit || originalTagData.min_limit || null;
                maxLimit = originalTagData.usl || originalTagData.upper_limit || 
                          originalTagData.maxLimit || originalTagData.max_limit || null;
                minGuaranteeLimit = originalTagData.lgl || originalTagData.lower_guarantee_limit || 
                                   originalTagData.minGuaranteeLimit || originalTagData.min_guarantee_limit || null;
                maxGuaranteeLimit = originalTagData.ugl || originalTagData.upper_guarantee_limit || 
                                   originalTagData.maxGuaranteeLimit || originalTagData.max_guarantee_limit || null;
                console.log('✅ Found limits:', { minLimit, maxLimit, minGuaranteeLimit, maxGuaranteeLimit });
            } else {
                console.warn('❌ Tag not found in availableTagsList:', tagName);
            }
        } else {
            console.warn('⚠️ availableTagsList is empty');
        }
        
        // Fallback ke data dari tagData jika tidak ditemukan di availableTagsList
        if (minLimit === null && maxLimit === null) {
            console.log('🔄 Falling back to tagData for limits');
            minLimit = tagData.min_limit || tagData.lsl || 
                      tagData.minLimit || tagData.lower_limit || null;
            maxLimit = tagData.max_limit || tagData.usl || 
                      tagData.maxLimit || tagData.upper_limit || null;
            minGuaranteeLimit = tagData.min_guarantee_limit || tagData.lgl || 
                               tagData.minGuaranteeLimit || tagData.lower_guarantee_limit || null;
            maxGuaranteeLimit = tagData.max_guarantee_limit || tagData.ugl || 
                               tagData.maxGuaranteeLimit || tagData.upper_guarantee_limit || null;
        }

        console.log('🎯 Final limits for chart:', { 
            tagName, 
            minLimit, 
            maxLimit, 
            minGuaranteeLimit, 
            maxGuaranteeLimit 
        });

        // Pastikan values selalu array
        const values = Array.isArray(tagData.values) ? tagData.values : 
                      Array.isArray(tagData.data) ? tagData.data : 
                      Array.isArray(tagData) ? tagData : [];

        const stats = calculateStatistics(values);
        const outOfBoundsCount = countOutOfBounds(values, minLimit, maxLimit);
        
        // Calculate CPK, CPL, CPU (hanya dari Control Limits)
        const capabilityIndices = calculateCapabilityIndices(values, minLimit, maxLimit, stats.stdev);

        // Fungsi untuk menentukan warna capability index
        const getCapabilityColor = (value) => {
            if (value === null || value === undefined) return '';
            if (value < 1) return 'capability-red';
            if (value < 1.33) return 'capability-green';
            return 'capability-blue';
        };

        section.innerHTML = `
            <div class="tag-content">
                <div class="chart-container">
                    <div id="chart-${tagName.replace(/[^a-zA-Z0-9]/g, '-')}"></div>
                </div>
                <div class="statistics-table-container">
                    <table class="statistics-table">
                        <tr class="stat-row">
                            <th class="stat-header">Rata-rata</th>
                            <td class="stat-value">${stats.avg.toFixed(2)}</td>
                        </tr>
                        <tr class="stat-row">
                            <th class="stat-header">Maksimum</th>
                            <td class="stat-value">${stats.max.toFixed(2)}</td>
                        </tr>
                        <tr class="stat-row">
                            <th class="stat-header">Minimum</th>
                            <td class="stat-value">${stats.min.toFixed(2)}</td>
                        </tr>
                        <tr class="stat-row">
                            <th class="stat-header">Standar Deviasi</th>
                            <td class="stat-value">${stats.stdev.toFixed(2)}</td>
                        </tr>
                        <tr class="stat-row">
                            <th class="stat-header">Out of Bounds</th>
                            <td class="stat-value">${outOfBoundsCount} dari ${values.length}</td>
                        </tr>
                        <!-- Capability Index Rows -->
                        <tr class="stat-row">
                            <th class="stat-header">CPK</th>
                            <td class="stat-value ${getCapabilityColor(capabilityIndices.cpk)}">
                                ${capabilityIndices.cpk !== null ? capabilityIndices.cpk.toFixed(3) : 'N/A'}
                            </td>
                        </tr>
                        <tr class="stat-row">
                            <th class="stat-header">CPL</th>
                            <td class="stat-value ${getCapabilityColor(capabilityIndices.cpl)}">
                                ${capabilityIndices.cpl !== null ? capabilityIndices.cpl.toFixed(3) : 'N/A'}
                            </td>
                        </tr>
                        <tr class="stat-row">
                            <th class="stat-header">CPU</th>
                            <td class="stat-value ${getCapabilityColor(capabilityIndices.cpu)}">
                                ${capabilityIndices.cpu !== null ? capabilityIndices.cpu.toFixed(3) : 'N/A'}
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        `;

        // Render chart dengan semua parameter limit
        setTimeout(() => {
            renderChart(tagName, values, minLimit, maxLimit, minGuaranteeLimit, maxGuaranteeLimit);
        }, 300);

        return section;
    }

    // ========== EXPORT KE WINDOW OBJECT ==========
    window.ChartRenderer = {
        // Main chart functions
        renderChart: renderChart,
        createTagSectionFromTemplate: createTagSectionFromTemplate,
        
        // Utility functions
        calculateStatistics: calculateStatistics,
        calculateCapabilityIndices: calculateCapabilityIndices,
        countOutOfBounds: countOutOfBounds,
        
        // Cleanup function
        cleanup: function() {
            console.log('🧹 Cleaning up ApexCharts...');
            
            // Destroy all ApexCharts instances
            const chartContainers = document.querySelectorAll('.apexcharts-canvas');
            chartContainers.forEach(container => {
                if (container.chart) {
                    try {
                        container.chart.destroy();
                    } catch (e) {
                        console.warn('Error destroying ApexChart:', e);
                    }
                }
            });
            
            console.log('✅ ChartRenderer (ApexCharts) cleaned up');
        }
    };

    console.log('=== CHARTRENDER.JS LOADED (ApexCharts Version) ===');
})();