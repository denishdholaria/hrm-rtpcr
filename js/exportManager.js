// Export Manager Module
import { downloadCSV, showToast } from './utils.js';

export class ExportManager {
  constructor(dataProcessor, chartManager) {
    this.dataProcessor = dataProcessor;
    this.chartManager = chartManager;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Export all results
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportAll());
    }

    // Export data table
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => this.exportData());
    }

    // Export individual charts
    document.querySelectorAll('[data-export]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chartName = e.target.dataset.export;
        this.exportChart(chartName);
      });
    });
  }

  exportData() {
    const data = this.dataProcessor.exportProcessedData();
    if (!data) {
      showToast('No data', 'No processed data available to export', 'error');
      return;
    }

    const filename = `hrm_analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(data, filename);
    showToast('Exported', `Data saved as ${filename}`, 'success');
  }

  exportChart(chartName) {
    this.chartManager.exportChart(chartName);
    showToast('Exported', `${chartName} chart saved as PNG`, 'success');
  }

  exportAll() {
    // Export data
    this.exportData();

    // Export all charts
    ['raw', 'normalized', 'derivative', 'difference'].forEach(chartName => {
      setTimeout(() => {
        this.chartManager.exportChart(chartName);
      }, 100);
    });

    showToast('Export complete', 'All data and charts exported', 'success');
  }
}
