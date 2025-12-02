// EDS File Parser for Applied Biosystems .eds files
// .eds files are ZIP archives containing XML and data files

export class EDSParser {
  constructor() {
    this.zipLib = null;
  }

  async loadJSZip() {
    if (this.zipLib) return this.zipLib;
    if (window.JSZip) {
      this.zipLib = window.JSZip;
      return this.zipLib;
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'lib/jszip.min.js';
      script.onload = () => {
        this.zipLib = window.JSZip;
        resolve(this.zipLib);
      };
      script.onerror = () => reject(new Error('Failed to load JSZip'));
      document.head.appendChild(script);
    });
  }

  async parseEDSFile(file) {
    await this.loadJSZip();
    
    try {
      const zip = await this.zipLib.loadAsync(file);
      
      // Try to get melt curve result file (best source for HRM data)
      const meltResultFile = zip.file('apldbio/sds/meltcuve_result.txt');
      
      if (meltResultFile) {
        const meltText = await meltResultFile.async('text');
        return this.parseMeltCurveResult(meltText);
      }
      
      throw new Error('No HRM/melt curve data found in this .eds file');
      
    } catch (error) {
      console.error('EDS parsing error:', error);
      throw new Error(`Failed to parse .eds file: ${error.message}`);
    }
  }

  parseMeltCurveResult(meltText) {
    const samples = [];
    // Normalize line endings and split
    const lines = meltText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    
    let currentSample = null;
    let lineIndex = 0;
    
    // Skip header lines (Session Name, Well header)
    while (lineIndex < lines.length) {
      const line = lines[lineIndex];
      if (line.startsWith('Session Name') || line.startsWith('Well\t')) {
        lineIndex++;
        continue;
      }
      break;
    }
    
    while (lineIndex < lines.length) {
      const line = lines[lineIndex];
      
      // Skip empty lines
      if (!line.trim()) {
        lineIndex++;
        continue;
      }
      
      // Check for sample info line (starts with well number)
      // Format: "0\tA\tSNP_AG\tTarget\t60.8444,78.73188"
      const sampleMatch = line.match(/^(\d+)\t([^\t]+)\t([^\t]+)\t([^\t]+)\t(.*)$/);
      
      if (sampleMatch) {
        // Save previous sample if exists
        if (currentSample && currentSample.temperatures.length > 0) {
          samples.push(currentSample);
        }
        
        currentSample = {
          wellNumber: parseInt(sampleMatch[1]),
          sampleName: sampleMatch[2],
          detector: sampleMatch[3],
          task: sampleMatch[4],
          tmValues: sampleMatch[5],
          temperatures: [],
          rnValues: [],
          deltaRnTemperatures: [],
          deltaRnValues: []
        };
        lineIndex++;
        continue;
      }
      
      // Check for Sample Temperatures line
      if (line.startsWith('Sample Temperatures\t') && currentSample) {
        const temps = this.parseTabValues(line.substring('Sample Temperatures\t'.length));
        currentSample.temperatures = temps;
        lineIndex++;
        continue;
      }
      
      // Check for Rn values line
      if (line.startsWith('Rn values\t') && currentSample) {
        const values = this.parseTabValues(line.substring('Rn values\t'.length));
        currentSample.rnValues = values;
        lineIndex++;
        continue;
      }
      
      // Check for Delta Rn Sample Temperatures
      if (line.startsWith('Delta Rn Sample Temperatures\t') && currentSample) {
        const temps = this.parseTabValues(line.substring('Delta Rn Sample Temperatures\t'.length));
        currentSample.deltaRnTemperatures = temps;
        lineIndex++;
        continue;
      }
      
      // Check for Delta Rn values
      if (line.startsWith('Delta Rn values\t') && currentSample) {
        const values = this.parseTabValues(line.substring('Delta Rn values\t'.length));
        currentSample.deltaRnValues = values;
        lineIndex++;
        continue;
      }
      
      lineIndex++;
    }
    
    // Don't forget the last sample
    if (currentSample && currentSample.temperatures.length > 0) {
      samples.push(currentSample);
    }
    
    if (samples.length === 0) {
      throw new Error('No valid melt curve data found in file');
    }
    
    console.log(`Parsed ${samples.length} samples from EDS file`);
    return this.formatForHRMAnalyzer(samples);
  }

  parseTabValues(str) {
    const values = [];
    const parts = str.split('\t');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed === '') continue;
      
      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        values.push(num);
      }
    }
    
    return values;
  }

  formatForHRMAnalyzer(samples) {
    // Use the first sample's temperatures as the reference
    const refTemps = samples[0].temperatures;
    
    // Build headers with unique names
    const headers = ['Temperature'];
    const usedNames = new Set();
    
    samples.forEach((s, idx) => {
      let name = s.sampleName || `Well_${s.wellNumber + 1}`;
      
      // Ensure unique names
      if (usedNames.has(name)) {
        name = `${name}_${idx + 1}`;
      }
      usedNames.add(name);
      headers.push(name);
    });
    
    // Build data rows - align all samples to reference temperatures
    const data = [];
    
    for (let i = 0; i < refTemps.length; i++) {
      const row = { Temperature: refTemps[i] };
      
      samples.forEach((s, idx) => {
        const colName = headers[idx + 1]; // +1 to skip Temperature header
        // Use Rn values (raw fluorescence) - better for HRM analysis
        row[colName] = s.rnValues[i] !== undefined ? s.rnValues[i] : null;
      });
      
      data.push(row);
    }
    
    console.log(`Formatted ${samples.length} samples with ${refTemps.length} temperature points`);
    
    return {
      filename: 'eds_file',
      headers: headers,
      tempHeader: 'Temperature',
      data: data,
      sampleCount: samples.length
    };
  }
}
