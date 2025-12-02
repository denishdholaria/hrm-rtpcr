// Data Processor Module
import {
  normalizeArray,
  detectMeltRegions,
  calculateDerivative,
  movingAverage,
  findTm,
  showToast,
  showLoading
} from './utils.js';

export class DataProcessor {
  constructor() {
    this.rawData = null;
    this.processedData = null;
    this.settings = {
      normalizationMode: 'auto',
      smoothingWindow: 5,
      referenceSample: null
    };
  }

  setData(parsedData) {
    this.rawData = parsedData;
    this.extractSamples();
  }

  extractSamples() {
    if (!this.rawData) return;

    const { data, headers, tempHeader } = this.rawData;
    
    // 1. Filter valid rows (must have valid temperature)
    const validRows = data.filter(row => {
      const t = parseFloat(row[tempHeader]);
      return !isNaN(t);
    });

    if (validRows.length === 0) {
      showToast('Error', 'No valid temperature data found', 'error');
      return;
    }

    // 2. Extract temperatures
    const temperatures = validRows.map(row => parseFloat(row[tempHeader]));
    
    // 3. Extract samples
    const samples = [];
    headers.forEach((header, idx) => {
      if (header === tempHeader) return; // Skip temperature column
      
      // Extract values for this sample from VALID ROWS only
      const fluorescence = validRows.map(row => {
        const val = parseFloat(row[header]);
        return isNaN(val) ? null : val;
      });
      
      // Check data quality
      const validCount = fluorescence.filter(f => f !== null).length;
      const coverage = validCount / temperatures.length;

      // Allow samples with at least 50% valid data
      if (coverage > 0.5) {
        // Fill missing values to prevent analysis crashes
        const filledFluorescence = this.fillMissingValues(fluorescence);
        
        samples.push({
          name: header,
          fluorescence: filledFluorescence,
          visible: true
        });
      } else {
        console.warn(`Sample ${header} dropped: low data coverage (${(coverage*100).toFixed(1)}%)`);
      }
    });

    if (samples.length === 0) {
      showToast('Error', 'No valid samples found. Check CSV format.', 'error');
      return;
    }

    this.processedData = {
      temperatures,
      samples,
      normalized: null,
      derivative: null,
      difference: null
    };

    console.log(`Extracted ${samples.length} samples with ${temperatures.length} points`);
  }

  fillMissingValues(arr) {
    // Simple forward fill then backward fill
    let lastVal = arr.find(v => v !== null) || 0;
    const forwardFilled = arr.map(v => {
      if (v === null) return lastVal;
      lastVal = v;
      return v;
    });

    // Backward fill for any remaining nulls at start
    let nextVal = forwardFilled.slice().reverse().find(v => v !== null) || 0;
    return forwardFilled.reverse().map(v => {
      if (v === null) return nextVal;
      nextVal = v;
      return v;
    }).reverse();
  }

  analyze(settings = {}) {
    if (!this.processedData) {
      showToast('No data', 'Please upload data first', 'error');
      return null;
    }

    // Update settings
    this.settings = { ...this.settings, ...settings };
    
    showLoading(true, 'Analyzing data...');

    try {
      const { temperatures, samples } = this.processedData;
      
      // 1. Detect melt regions
      const regions = detectMeltRegions(temperatures, samples[0].fluorescence);
      console.log('Melt regions:', regions);

      // 2. Normalize all samples
      const normalizedSamples = samples.map(sample => {
        const normalized = normalizeArray(
          sample.fluorescence,
          regions.preStart,
          regions.preEnd,
          regions.postStart,
          regions.postEnd
        );
        
        return {
          ...sample,
          normalized
        };
      });

      // 3. Calculate derivatives
      const derivativeSamples = normalizedSamples.map(sample => {
        // Smooth the normalized data first
        const smoothed = movingAverage(sample.normalized, this.settings.smoothingWindow);
        
        // Calculate derivative
        const deriv = calculateDerivative(temperatures, smoothed);
        
        // Negative derivative for -dF/dT
        const negDeriv = deriv.map(d => -d);
        
        // Find Tm
        const tm = findTm(temperatures, negDeriv);
        
        return {
          ...sample,
          derivative: negDeriv,
          tm: tm
        };
      });

      // 4. Calculate difference plot (if reference selected)
      let differenceSamples = derivativeSamples;
      if (this.settings.referenceSample !== null) {
        const refIdx = parseInt(this.settings.referenceSample);
        if (refIdx >= 0 && refIdx < derivativeSamples.length) {
          const reference = derivativeSamples[refIdx].normalized;
          
          differenceSamples = derivativeSamples.map((sample, idx) => {
            if (idx === refIdx) {
              return {
                ...sample,
                difference: new Array(reference.length).fill(0)
              };
            }
            
            const diff = sample.normalized.map((val, i) => val - reference[i]);
            return {
              ...sample,
              difference: diff
            };
          });
        }
      }

      this.processedData.samples = differenceSamples;
      this.processedData.regions = regions;

      showLoading(false);
      showToast('Analysis complete', 'Data processed successfully', 'success');

      // Trigger analysis complete event
      window.dispatchEvent(new CustomEvent('analysisComplete', { 
        detail: this.processedData 
      }));

      return this.processedData;
      
    } catch (error) {
      showLoading(false);
      showToast('Analysis error', error.message, 'error');
      console.error('Analysis error:', error);
      return null;
    }
  }

  getProcessedData() {
    return this.processedData;
  }

  toggleSampleVisibility(sampleIndex) {
    if (this.processedData && this.processedData.samples[sampleIndex]) {
      this.processedData.samples[sampleIndex].visible = 
        !this.processedData.samples[sampleIndex].visible;
      
      window.dispatchEvent(new CustomEvent('sampleVisibilityChanged', {
        detail: { index: sampleIndex, samples: this.processedData.samples }
      }));
    }
  }

  setSampleVisibility(sampleIndex, visible) {
    if (this.processedData && this.processedData.samples[sampleIndex]) {
      this.processedData.samples[sampleIndex].visible = visible;
      
      window.dispatchEvent(new CustomEvent('sampleVisibilityChanged', {
        detail: { index: sampleIndex, samples: this.processedData.samples }
      }));
    }
  }

  setAllSamplesVisibility(visible) {
    if (this.processedData) {
      this.processedData.samples.forEach(sample => {
        sample.visible = visible;
      });
      
      window.dispatchEvent(new CustomEvent('sampleVisibilityChanged', {
        detail: { samples: this.processedData.samples }
      }));
    }
  }

  exportProcessedData() {
    if (!this.processedData) return null;

    const { temperatures, samples } = this.processedData;
    const exportData = [];

    // Create header row
    const headers = ['Temperature'];
    samples.forEach(sample => {
      headers.push(`${sample.name}_Raw`);
      if (sample.normalized) headers.push(`${sample.name}_Normalized`);
      if (sample.derivative) headers.push(`${sample.name}_Derivative`);
      if (sample.difference) headers.push(`${sample.name}_Difference`);
    });

    exportData.push(headers);

    // Create data rows
    for (let i = 0; i < temperatures.length; i++) {
      const row = [temperatures[i]];
      
      samples.forEach(sample => {
        row.push(sample.fluorescence[i]);
        if (sample.normalized) row.push(sample.normalized[i]);
        if (sample.derivative) row.push(sample.derivative[i]);
        if (sample.difference) row.push(sample.difference[i]);
      });
      
      exportData.push(row);
    }

    return exportData;
  }
}
