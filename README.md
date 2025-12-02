# HRM Analyzer - Progressive Web App

A modern, offline-capable Progressive Web App for analyzing High Resolution Melting (HRM) curve data from RT-PCR experiments.

## Features

- 📊 **Interactive Visualizations**: Four chart types (Raw, Normalized, Derivative, Difference)
- 🔬 **Automated Analysis**: Automatic normalization and Tm detection
- 💾 **Data Export**: Export processed data and charts as CSV/PNG
- 📱 **PWA Support**: Install on desktop or mobile, works offline
- 🎨 **Beautiful UI**: Modern dark theme with smooth animations
- ⚡ **Fast & Lightweight**: Pure JavaScript, no heavy frameworks

## Quick Start

### Local Development

1. **Start a local server** (required for service worker):

   ```bash
   cd /Volumes/ai/HRM/hrm-analyzer
   python3 -m http.server 8000
   ```

2. **Open in browser**:

   ```
   http://localhost:8000
   ```

3. **Upload sample data**:
   - Use the provided sample file: `data/samples/sample_hrm_data.csv`
   - Or export your own data from RT-PCR software

### Deploy to Cloudflare Pages

This PWA is **100% Cloudflare-compatible** and can be deployed for free:

1. **Push to GitHub**:

   ```bash
   cd /Volumes/ai/HRM/hrm-analyzer
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

2. **Deploy on Cloudflare Pages**:

   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Connect your GitHub repository
   - Build settings:
     - **Framework preset**: None
     - **Build command**: (leave empty)
     - **Build output directory**: `/`
   - Deploy!

3. **Your app will be live at**: `https://your-project.pages.dev`

## Data Format

Upload CSV files with the following structure:

```csv
Temperature,Sample1,Sample2,Sample3
60.0,1000,980,1020
60.5,998,978,1018
...
```

- **First column**: Temperature values (°C)
- **Subsequent columns**: Fluorescence values for each sample

## Analysis Features

### 1. Raw Melt Curves

- Plots fluorescence vs. temperature
- Shows original data from RT-PCR instrument

### 2. Normalized Melt Curves

- Scales data to 0-1 range
- Removes baseline variations
- Enables comparison between samples

### 3. Derivative Plot (-dF/dT)

- Shows rate of fluorescence change
- Peak indicates melting temperature (Tm)
- Automatically detects Tm for each sample

### 4. Difference Plot

- Compares samples against a reference
- Highlights sequence variations
- Useful for genotyping

## Controls

- **Normalization Mode**: Auto or Manual pre/post-melt region selection
- **Smoothing Window**: Adjust derivative smoothing (1-20 points)
- **Reference Sample**: Select sample for difference plot
- **Sample Visibility**: Toggle individual samples on/off

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ✅ Mobile browsers

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **CSV Parsing**: PapaParse
- **File Export**: FileSaver.js
- **PWA**: Service Worker, Web App Manifest

## File Structure

```
hrm-analyzer/
├── index.html              # Main app page
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   ├── main.css           # Core styles
│   ├── components.css     # UI components
│   └── charts.css         # Chart styles
├── js/
│   ├── app.js             # Main application
│   ├── fileHandler.js     # File upload/parsing
│   ├── dataProcessor.js   # HRM analysis
│   ├── chartManager.js    # Visualization
│   ├── exportManager.js   # Data export
│   └── utils.js           # Utilities
├── lib/                   # External libraries
├── assets/icons/          # PWA icons
└── data/samples/          # Sample data
```

## Offline Support

The app caches all resources for offline use:

- Install as PWA on desktop/mobile
- Works without internet connection
- Analyzes data locally (privacy-friendly)

## Export Options

- **CSV**: Processed data with all analysis results
- **PNG**: Individual charts as high-quality images
- **Batch Export**: All data and charts at once

## EDS File Support

The app now natively supports Applied Biosystems .eds files! Simply drag and drop your .eds file directly - no conversion needed.

### Supported .eds Data
- Melt curve data from StepOne/StepOnePlus instruments
- Automatically extracts sample names, temperatures, and fluorescence values
- Works with HRM Control Kit and custom experiments

## Future Enhancements

- [x] Native .eds file parser (Applied Biosystems format)
- [ ] Calibration file support
- [ ] Advanced clustering algorithms
- [ ] Multi-file batch processing
- [ ] PDF report generation
- [ ] Machine learning for genotype calling

## License

MIT License - Free to use for research and commercial purposes

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ for the scientific community**
