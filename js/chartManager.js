// Chart Manager Module
import { generateColors, formatNumber } from './utils.js';

export class ChartManager {
  constructor() {
    this.charts = {
      raw: null,
      normalized: null,
      derivative: null,
      difference: null
    };
    this.colors = [];
    this.setupChartDefaults();
  }

  setupChartDefaults() {
    // Set Chart.js defaults for dark theme
    if (typeof Chart !== 'undefined') {
      Chart.defaults.color = 'hsl(210, 15%, 75%)';
      Chart.defaults.borderColor = 'hsla(210, 20%, 40%, 0.3)';
      Chart.defaults.font.family = "'Inter', sans-serif";
    }
  }

  createCharts(data) {
    if (!data) return;

    const { temperatures, samples } = data;
    this.colors = generateColors(samples.length);

    // Destroy existing charts
    this.destroyCharts();

    // Create all charts
    this.createRawChart(temperatures, samples);
    this.createNormalizedChart(temperatures, samples);
    this.createDerivativeChart(temperatures, samples);
    this.createDifferenceChart(temperatures, samples);
  }

  createRawChart(temperatures, samples) {
    const ctx = document.getElementById('rawChart');
    if (!ctx) return;

    const datasets = samples.map((sample, idx) => ({
      label: sample.name,
      data: sample.fluorescence,
      borderColor: this.colors[idx],
      backgroundColor: this.colors[idx] + '20',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      hidden: !sample.visible,
      tension: 0.1
    }));

    this.charts.raw = new Chart(ctx, {
      type: 'line',
      data: {
        labels: temperatures,
        datasets: datasets
      },
      options: this.getChartOptions('Fluorescence', 'Temperature (°C)', 'Fluorescence (RFU)')
    });
  }

  createNormalizedChart(temperatures, samples) {
    const ctx = document.getElementById('normalizedChart');
    if (!ctx) return;

    const datasets = samples
      .filter(sample => sample.normalized)
      .map((sample, idx) => ({
        label: sample.name,
        data: sample.normalized,
        borderColor: this.colors[idx],
        backgroundColor: this.colors[idx] + '20',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        hidden: !sample.visible,
        tension: 0.1
      }));

    this.charts.normalized = new Chart(ctx, {
      type: 'line',
      data: {
        labels: temperatures,
        datasets: datasets
      },
      options: this.getChartOptions('Normalized Fluorescence', 'Temperature (°C)', 'Normalized Fluorescence')
    });
  }

  createDerivativeChart(temperatures, samples) {
    const ctx = document.getElementById('derivativeChart');
    if (!ctx) return;

    const datasets = samples
      .filter(sample => sample.derivative)
      .map((sample, idx) => ({
        label: `${sample.name} (Tm: ${formatNumber(sample.tm, 1)}°C)`,
        data: sample.derivative,
        borderColor: this.colors[idx],
        backgroundColor: this.colors[idx] + '20',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        hidden: !sample.visible,
        tension: 0.1
      }));

    this.charts.derivative = new Chart(ctx, {
      type: 'line',
      data: {
        labels: temperatures,
        datasets: datasets
      },
      options: this.getChartOptions('Derivative', 'Temperature (°C)', '-dF/dT')
    });
  }

  createDifferenceChart(temperatures, samples) {
    const ctx = document.getElementById('differenceChart');
    if (!ctx) return;

    const datasets = samples
      .filter(sample => sample.difference)
      .map((sample, idx) => ({
        label: sample.name,
        data: sample.difference,
        borderColor: this.colors[idx],
        backgroundColor: this.colors[idx] + '20',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        hidden: !sample.visible,
        tension: 0.1
      }));

    if (datasets.length === 0) {
      // Show empty state
      return;
    }

    this.charts.difference = new Chart(ctx, {
      type: 'line',
      data: {
        labels: temperatures,
        datasets: datasets
      },
      options: this.getChartOptions('Difference from Reference', 'Temperature (°C)', 'Difference')
    });
  }

  getChartOptions(title, xLabel, yLabel) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: false // We'll use custom legend
        },
        tooltip: {
          backgroundColor: 'hsla(210, 25%, 12%, 0.95)',
          titleColor: 'hsl(210, 20%, 98%)',
          bodyColor: 'hsl(210, 15%, 75%)',
          borderColor: 'hsla(210, 20%, 40%, 0.5)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += formatNumber(context.parsed.y, 4);
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: xLabel,
            color: 'hsl(210, 15%, 75%)',
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            color: 'hsla(210, 20%, 40%, 0.2)'
          },
          ticks: {
            color: 'hsl(210, 15%, 75%)'
          }
        },
        y: {
          title: {
            display: true,
            text: yLabel,
            color: 'hsl(210, 15%, 75%)',
            font: {
              size: 12,
              weight: '500'
            }
          },
          grid: {
            color: 'hsla(210, 20%, 40%, 0.2)'
          },
          ticks: {
            color: 'hsl(210, 15%, 75%)'
          }
        }
      }
    };
  }

  updateCharts(data) {
    if (!data) return;

    const { temperatures, samples } = data;

    // Update each chart
    Object.keys(this.charts).forEach(chartKey => {
      const chart = this.charts[chartKey];
      if (!chart) return;

      chart.data.datasets.forEach((dataset, idx) => {
        if (samples[idx]) {
          dataset.hidden = !samples[idx].visible;
        }
      });

      chart.update();
    });
  }

  destroyCharts() {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
        this.charts[key] = null;
      }
    });
  }

  exportChart(chartName) {
    const chart = this.charts[chartName];
    if (!chart) return;

    const url = chart.toBase64Image();
    const link = document.createElement('a');
    link.download = `hrm_${chartName}_chart.png`;
    link.href = url;
    link.click();
  }

  getColors() {
    return this.colors;
  }
}
