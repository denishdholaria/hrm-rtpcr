// File Handler Module
import { showToast, showLoading, getFileExtension, validateCSVData } from './utils.js';
import { EDSParser } from './edsParser.js';

export class FileHandler {
  constructor() {
    this.files = [];
    this.parsedData = null;
    this.edsParser = new EDSParser();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    // Click to upload
    uploadZone.addEventListener('click', () => {
      fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      this.handleFiles(e.dataTransfer.files);
    });
  }

  async handleFiles(fileList) {
    const files = Array.from(fileList);
    
    if (files.length === 0) {
      showToast('No files', 'Please select at least one file', 'error');
      return;
    }

    // Validate file types
    const validFiles = files.filter(file => {
      const ext = getFileExtension(file.name);
      return ['csv', 'tsv', 'txt', 'eds'].includes(ext);
    });

    if (validFiles.length === 0) {
      showToast('Invalid files', 'Please upload CSV, TSV, TXT, or EDS files', 'error');
      return;
    }

    if (validFiles.length < files.length) {
      showToast('Some files skipped', `${files.length - validFiles.length} files were not CSV/TSV format`, 'warning');
    }

    showLoading(true, 'Reading files...');

    try {
      // For now, we'll process the first file
      // TODO: Support multiple files
      const file = validFiles[0];
      const ext = getFileExtension(file.name);
      
      if (ext === 'eds') {
        await this.parseEDSFile(file);
      } else {
        await this.parseCSVFile(file);
      }
      
      if (validFiles.length > 1) {
        showToast('Multiple files', 'Currently processing first file only. Multi-file support coming soon!', 'info');
      }
    } catch (error) {
      showToast('Error', error.message, 'error');
      showLoading(false);
    }
  }

  async parseCSVFile(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          showLoading(false);
          
          if (results.errors.length > 0) {
            console.warn('Parse warnings:', results.errors);
          }

          // Validate data structure
          const validation = validateCSVData(results.data);
          if (!validation.valid) {
            reject(new Error(validation.error));
            return;
          }

          this.parsedData = {
            filename: file.name,
            headers: validation.headers,
            tempHeader: validation.tempHeader,
            data: results.data,
            sampleCount: validation.headers.length - 1
          };

          showToast('Success', `Loaded ${file.name} with ${this.parsedData.sampleCount} samples`, 'success');
          
          // Trigger data loaded event
          window.dispatchEvent(new CustomEvent('dataLoaded', { detail: this.parsedData }));
          
          resolve(this.parsedData);
        },
        error: (error) => {
          showLoading(false);
          reject(new Error(`Failed to parse file: ${error.message}`));
        }
      });
    });
  }

  async parseEDSFile(file) {
    try {
      showLoading(true, 'Parsing .eds file...');
      
      const parsedData = await this.edsParser.parseEDSFile(file);
      
      this.parsedData = {
        ...parsedData,
        filename: file.name
      };

      showLoading(false);
      showToast('Success', `Loaded ${file.name} with ${this.parsedData.sampleCount} samples from .eds file`, 'success');
      
      // Trigger data loaded event
      window.dispatchEvent(new CustomEvent('dataLoaded', { detail: this.parsedData }));
      
      return this.parsedData;
    } catch (error) {
      showLoading(false);
      throw error;
    }
  }

  getData() {
    return this.parsedData;
  }

  clear() {
    this.files = [];
    this.parsedData = null;
    document.getElementById('fileInput').value = '';
  }
}
