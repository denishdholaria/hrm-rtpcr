// Main Application
import { FileHandler } from './fileHandler.js';
import { DataProcessor } from './dataProcessor.js';
import { ChartManager } from './chartManager.js';
import { ExportManager } from './exportManager.js';
import { showToast, formatNumber } from './utils.js';

class HRMAnalyzer {
  constructor() {
    this.fileHandler = new FileHandler();
    this.dataProcessor = new DataProcessor();
    this.chartManager = new ChartManager();
    this.exportManager = new ExportManager(this.dataProcessor, this.chartManager);
    
    this.init();
  }

  init() {
    console.log('HRM Analyzer initialized');
    
    // Register service worker
    this.registerServiceWorker();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup custom events
    this.setupCustomEvents();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  setupEventListeners() {
    // Analysis controls
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => this.runAnalysis());
    }

    // Smoothing window slider
    const smoothingSlider = document.getElementById('smoothingWindow');
    const smoothingValue = document.getElementById('smoothingValue');
    if (smoothingSlider && smoothingValue) {
      smoothingSlider.addEventListener('input', (e) => {
        smoothingValue.textContent = e.target.value;
      });
    }

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Sample selection buttons
    const selectAllBtn = document.getElementById('selectAllSamples');
    const deselectAllBtn = document.getElementById('deselectAllSamples');
    
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        this.dataProcessor.setAllSamplesVisibility(true);
      });
    }
    
    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => {
        this.dataProcessor.setAllSamplesVisibility(false);
      });
    }

    // Help button
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => this.showHelp());
    }
  }

  setupCustomEvents() {
    // Data loaded event
    window.addEventListener('dataLoaded', (e) => {
      this.onDataLoaded(e.detail);
    });

    // Analysis complete event
    window.addEventListener('analysisComplete', (e) => {
      this.onAnalysisComplete(e.detail);
    });

    // Sample visibility changed
    window.addEventListener('sampleVisibilityChanged', (e) => {
      this.onSampleVisibilityChanged(e.detail);
    });
  }

  onDataLoaded(data) {
    console.log('Data loaded:', data);
    
    // Set data in processor
    this.dataProcessor.setData(data);
    
    // Show analysis section
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('analysisSection').classList.remove('hidden');
    
    // Populate reference sample dropdown
    this.populateReferenceSamples(data);
    
    // Populate data table
    this.populateDataTable(data);
    
    // Auto-run analysis
    setTimeout(() => this.runAnalysis(), 500);
  }

  populateReferenceSamples(data) {
    const select = document.getElementById('referenceSample');
    if (!select) return;

    select.innerHTML = '<option value="">Select reference...</option>';
    
    data.headers.forEach((header, idx) => {
      if (idx === 0) return; // Skip temperature column
      const option = document.createElement('option');
      option.value = idx - 1;
      option.textContent = header;
      select.appendChild(option);
    });
  }

  populateDataTable(data) {
    const thead = document.getElementById('dataTableHead');
    const tbody = document.getElementById('dataTableBody');
    
    if (!thead || !tbody) return;

    // Create header
    const headerRow = document.createElement('tr');
    data.headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.innerHTML = '';
    thead.appendChild(headerRow);

    // Create body (show first 50 rows)
    tbody.innerHTML = '';
    const maxRows = Math.min(50, data.data.length);
    
    for (let i = 0; i < maxRows; i++) {
      const row = document.createElement('tr');
      data.headers.forEach(header => {
        const td = document.createElement('td');
        const value = data.data[i][header];
        td.textContent = typeof value === 'number' ? formatNumber(value, 3) : value;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    }

    if (data.data.length > maxRows) {
      const row = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = data.headers.length;
      td.textContent = `... and ${data.data.length - maxRows} more rows`;
      td.style.textAlign = 'center';
      td.style.fontStyle = 'italic';
      row.appendChild(td);
      tbody.appendChild(row);
    }
  }

  runAnalysis() {
    const settings = {
      normalizationMode: document.getElementById('normalizationMode').value,
      smoothingWindow: parseInt(document.getElementById('smoothingWindow').value),
      referenceSample: document.getElementById('referenceSample').value || null
    };

    const result = this.dataProcessor.analyze(settings);
    
    if (!result) {
      showToast('Analysis failed', 'Could not process data', 'error');
    }
  }

  onAnalysisComplete(data) {
    console.log('Analysis complete:', data);
    
    // Create charts
    this.chartManager.createCharts(data);
    
    // Populate sample list
    this.populateSampleList(data.samples);
    
    // Enable export button
    document.getElementById('exportBtn').disabled = false;
    
    // Switch to charts tab
    this.switchTab('charts');
  }

  populateSampleList(samples) {
    const sampleList = document.getElementById('sampleList');
    if (!sampleList) return;

    const colors = this.chartManager.getColors();
    
    sampleList.innerHTML = '';
    
    samples.forEach((sample, idx) => {
      const item = document.createElement('div');
      item.className = `sample-item ${sample.visible ? 'selected' : ''}`;
      
      item.innerHTML = `
        <input type="checkbox" class="sample-checkbox" ${sample.visible ? 'checked' : ''} data-index="${idx}">
        <div class="sample-color" style="background-color: ${colors[idx]}"></div>
        <div class="sample-name">${sample.name}</div>
        <div class="sample-tm">${sample.tm ? `Tm: ${formatNumber(sample.tm, 1)}°C` : ''}</div>
      `;
      
      // Toggle visibility on click
      const checkbox = item.querySelector('.sample-checkbox');
      checkbox.addEventListener('change', (e) => {
        this.dataProcessor.toggleSampleVisibility(idx);
      });
      
      item.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
          this.dataProcessor.toggleSampleVisibility(idx);
        }
      });
      
      sampleList.appendChild(item);
    });
  }

  onSampleVisibilityChanged(data) {
    // Update charts
    const processedData = this.dataProcessor.getProcessedData();
    this.chartManager.updateCharts(processedData);
    
    // Update sample list checkboxes
    const checkboxes = document.querySelectorAll('.sample-checkbox');
    checkboxes.forEach((checkbox, idx) => {
      if (processedData.samples[idx]) {
        checkbox.checked = processedData.samples[idx].visible;
        checkbox.closest('.sample-item').classList.toggle('selected', processedData.samples[idx].visible);
      }
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
  }

  showHelp() {
    showToast(
      'HRM Analyzer Help',
      'Upload CSV files with temperature in first column and fluorescence values in subsequent columns. The app will automatically normalize, calculate derivatives, and generate melt curves.',
      'info'
    );
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.hrmApp = new HRMAnalyzer();
  });
} else {
  window.hrmApp = new HRMAnalyzer();
}
