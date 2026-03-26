// Utility Functions

// Toast Notifications
export function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';

  const iconEl = document.createElement('div');
  iconEl.className = 'toast-icon';
  iconEl.textContent = icon;

  const contentEl = document.createElement('div');
  contentEl.className = 'toast-content';

  const titleEl = document.createElement('div');
  titleEl.className = 'toast-title';
  titleEl.textContent = title;

  const messageEl = document.createElement('div');
  messageEl.className = 'toast-message';
  messageEl.textContent = message;

  contentEl.appendChild(titleEl);
  contentEl.appendChild(messageEl);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.textContent = '✕';

  toast.appendChild(iconEl);
  toast.appendChild(contentEl);
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  // Close button
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

// Loading Overlay
export function showLoading(show = true, message = 'Processing data...') {
  const overlay = document.getElementById('loadingOverlay');
  const text = overlay.querySelector('.loading-text');
  text.textContent = message;
  
  if (show) {
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
}

// Statistical Functions
export const MELT_REGION_FRACTION = 0.1; // fraction of data used for pre/post melt baselines
export const MIN_SAMPLE_COVERAGE = 0.5;  // minimum valid-data coverage to include a sample

export function mean(arr) {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

export function stdDev(arr) {
  const avg = mean(arr);
  const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

// Moving Average (for smoothing)
export function movingAverage(arr, windowSize) {
  const result = [];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(arr.length, i + halfWindow + 1);
    const window = arr.slice(start, end);
    result.push(mean(window));
  }
  
  return result;
}

// Calculate derivative (numerical differentiation)
export function calculateDerivative(xValues, yValues) {
  const derivative = [];
  
  for (let i = 0; i < xValues.length; i++) {
    if (i === 0) {
      // Forward difference for first point
      const dx = xValues[1] - xValues[0];
      const dy = yValues[1] - yValues[0];
      derivative.push(dy / dx);
    } else if (i === xValues.length - 1) {
      // Backward difference for last point
      const dx = xValues[i] - xValues[i - 1];
      const dy = yValues[i] - yValues[i - 1];
      derivative.push(dy / dx);
    } else {
      // Central difference for middle points
      const dx = xValues[i + 1] - xValues[i - 1];
      const dy = yValues[i + 1] - yValues[i - 1];
      derivative.push(dy / dx);
    }
  }
  
  return derivative;
}

// Normalize array to 0-1 range
export function normalizeArray(arr, preStart, preEnd, postStart, postEnd) {
  // Calculate pre-melt and post-melt average values
  const preMeltValues = arr.slice(preStart, preEnd);
  const postMeltValues = arr.slice(postStart, postEnd);
  
  const preMeltAvg = mean(preMeltValues);
  const postMeltAvg = mean(postMeltValues);
  
  // Normalize: (F - F_post) / (F_pre - F_post)
  return arr.map(val => {
    return (val - postMeltAvg) / (preMeltAvg - postMeltAvg);
  });
}

// Auto-detect pre and post melt regions
export function detectMeltRegions(temperatures) {
  // Pre-melt: first MELT_REGION_FRACTION of data
  const preEnd = Math.floor(temperatures.length * MELT_REGION_FRACTION);
  const preStart = 0;

  // Post-melt: last MELT_REGION_FRACTION of data
  const postStart = Math.floor(temperatures.length * (1 - MELT_REGION_FRACTION));
  const postEnd = temperatures.length;

  return { preStart, preEnd, postStart, postEnd };
}

// Find melting temperature (Tm) from derivative plot
export function findTm(temperatures, derivative) {
  // Find the index of maximum derivative (most negative for -dF/dT)
  let maxDerivIdx = 0;
  let maxDeriv = derivative[0];
  
  for (let i = 1; i < derivative.length; i++) {
    if (Math.abs(derivative[i]) > Math.abs(maxDeriv)) {
      maxDeriv = derivative[i];
      maxDerivIdx = i;
    }
  }
  
  return temperatures[maxDerivIdx];
}

// Generate color palette (colorblind-friendly)
export function generateColors(count) {
  const baseColors = [
    'hsl(210, 90%, 50%)',  // Blue
    'hsl(30, 90%, 50%)',   // Orange
    'hsl(150, 70%, 40%)',  // Green
    'hsl(280, 70%, 50%)',  // Purple
    'hsl(0, 80%, 50%)',    // Red
    'hsl(180, 70%, 40%)',  // Cyan
    'hsl(320, 70%, 50%)',  // Magenta
    'hsl(60, 90%, 40%)',   // Yellow
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
}

// Format number with fixed decimals
export function formatNumber(num, decimals = 2) {
  return Number(num).toFixed(decimals);
}

// Download data as CSV
export function downloadCSV(data, filename) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

// Local Storage helpers
export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
    return false;
  }
}

export function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    return null;
  }
}

export function clearStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
    return false;
  }
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Check if PWA is installed
export function isPWAInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

// Get file extension
export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

// Validate CSV structure
export function validateCSVData(data) {
  if (!data || data.length === 0) {
    return { valid: false, error: 'No data found in file' };
  }
  
  if (!data[0] || Object.keys(data[0]).length < 2) {
    return { valid: false, error: 'File must have at least 2 columns (Temperature + 1 sample)' };
  }
  
  const headers = Object.keys(data[0]);
  const tempHeader = headers[0];
  
  // Check if first column contains numeric temperature values
  const firstTemp = parseFloat(data[0][tempHeader]);
  if (isNaN(firstTemp)) {
    return { valid: false, error: 'First column must contain temperature values' };
  }
  
  return { valid: true, headers, tempHeader };
}
