/**
 * Unit tests for core utility functions (pure algorithms only).
 * DOM-dependent helpers (showToast, showLoading) are excluded.
 */
import { describe, it, expect } from 'vitest';
import {
  mean,
  stdDev,
  movingAverage,
  calculateDerivative,
  normalizeArray,
  detectMeltRegions,
  findTm,
  generateColors,
  formatNumber,
  getFileExtension,
  validateCSVData,
  debounce,
  MELT_REGION_FRACTION,
  MIN_SAMPLE_COVERAGE,
} from '../js/utils.js';

// ---------------------------------------------------------------------------
// mean
// ---------------------------------------------------------------------------
describe('mean', () => {
  it('computes the average of a simple array', () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
  });

  it('handles a single-element array', () => {
    expect(mean([42])).toBe(42);
  });

  it('handles negative values', () => {
    expect(mean([-1, 0, 1])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// stdDev
// ---------------------------------------------------------------------------
describe('stdDev', () => {
  it('returns 0 for a constant array', () => {
    expect(stdDev([5, 5, 5, 5])).toBe(0);
  });

  it('computes std deviation for a known dataset', () => {
    // dataset [2,4,4,4,5,5,7,9] -> stdDev = 2
    const result = stdDev([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result).toBeCloseTo(2, 5);
  });
});

// ---------------------------------------------------------------------------
// movingAverage
// ---------------------------------------------------------------------------
describe('movingAverage', () => {
  it('returns an array of the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(movingAverage(arr, 3)).toHaveLength(arr.length);
  });

  it('smooths out a step function', () => {
    const arr = [0, 0, 0, 10, 10, 10];
    const smoothed = movingAverage(arr, 3);
    // The middle values should be between 0 and 10
    expect(smoothed[2]).toBeGreaterThan(0);
    expect(smoothed[3]).toBeLessThan(10);
  });

  it('returns the same array for window size 1', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(movingAverage(arr, 1)).toEqual(arr);
  });
});

// ---------------------------------------------------------------------------
// calculateDerivative
// ---------------------------------------------------------------------------
describe('calculateDerivative', () => {
  it('returns an array of the same length', () => {
    const x = [0, 1, 2, 3];
    const y = [0, 1, 4, 9];
    expect(calculateDerivative(x, y)).toHaveLength(x.length);
  });

  it('computes the derivative of a linear function (y = 2x)', () => {
    const x = [0, 1, 2, 3, 4];
    const y = x.map(v => 2 * v);
    const deriv = calculateDerivative(x, y);
    deriv.forEach(d => expect(d).toBeCloseTo(2, 10));
  });

  it('computes derivative of a quadratic (y = x²) using central differences', () => {
    const x = [0, 1, 2, 3, 4];
    const y = x.map(v => v * v);
    const deriv = calculateDerivative(x, y);
    // dy/dx = 2x; central differences give exact result for quadratics
    expect(deriv[1]).toBeCloseTo(2, 10); // 2*1
    expect(deriv[2]).toBeCloseTo(4, 10); // 2*2
    expect(deriv[3]).toBeCloseTo(6, 10); // 2*3
  });
});

// ---------------------------------------------------------------------------
// normalizeArray
// ---------------------------------------------------------------------------
describe('normalizeArray', () => {
  it('maps pre-melt region average to ~1 and post-melt region average to ~0', () => {
    // pre-melt values [10,10], post-melt values [0,0], array = [10, 5, 0]
    const arr = [10, 10, 5, 0, 0];
    const normalized = normalizeArray(arr, 0, 2, 3, 5);
    expect(normalized[0]).toBeCloseTo(1, 5);
    expect(normalized[4]).toBeCloseTo(0, 5);
    expect(normalized[2]).toBeCloseTo(0.5, 5);
  });
});

// ---------------------------------------------------------------------------
// detectMeltRegions
// ---------------------------------------------------------------------------
describe('detectMeltRegions', () => {
  it('returns correct region boundaries for a 100-point dataset', () => {
    const temps = Array.from({ length: 100 }, (_, i) => 60 + i * 0.1);
    const regions = detectMeltRegions(temps);
    expect(regions.preStart).toBe(0);
    expect(regions.preEnd).toBe(Math.floor(100 * MELT_REGION_FRACTION));
    expect(regions.postStart).toBe(Math.floor(100 * (1 - MELT_REGION_FRACTION)));
    expect(regions.postEnd).toBe(100);
  });

  it('pre and post regions do not overlap for typical dataset sizes', () => {
    const temps = Array.from({ length: 50 }, (_, i) => i);
    const { preEnd, postStart } = detectMeltRegions(temps);
    expect(preEnd).toBeLessThanOrEqual(postStart);
  });
});

// ---------------------------------------------------------------------------
// findTm
// ---------------------------------------------------------------------------
describe('findTm', () => {
  it('identifies the temperature at the largest absolute derivative', () => {
    const temps = [60, 61, 62, 63, 64];
    // Peak derivative at index 2 (temperature 62)
    const deriv = [0.1, 0.5, 2.0, 0.4, 0.1];
    expect(findTm(temps, deriv)).toBe(62);
  });

  it('works with negative derivative peaks', () => {
    const temps = [60, 61, 62, 63, 64];
    const deriv = [-0.1, -0.5, -3.0, -0.4, -0.1];
    expect(findTm(temps, deriv)).toBe(62);
  });
});

// ---------------------------------------------------------------------------
// generateColors
// ---------------------------------------------------------------------------
describe('generateColors', () => {
  it('returns the requested number of colors', () => {
    expect(generateColors(5)).toHaveLength(5);
  });

  it('cycles colors when count exceeds palette size', () => {
    const colors = generateColors(20);
    expect(colors).toHaveLength(20);
    expect(colors[0]).toBe(colors[8]); // palette has 8 colors
  });

  it('returns HSL color strings', () => {
    generateColors(3).forEach(c => {
      expect(c).toMatch(/^hsl\(/);
    });
  });
});

// ---------------------------------------------------------------------------
// formatNumber
// ---------------------------------------------------------------------------
describe('formatNumber', () => {
  it('formats to 2 decimal places by default', () => {
    expect(formatNumber(3.14159)).toBe('3.14');
  });

  it('respects the decimals parameter', () => {
    expect(formatNumber(3.14159, 4)).toBe('3.1416');
  });

  it('handles integer input', () => {
    expect(formatNumber(5)).toBe('5.00');
  });
});

// ---------------------------------------------------------------------------
// getFileExtension
// ---------------------------------------------------------------------------
describe('getFileExtension', () => {
  it('extracts the extension from a normal filename', () => {
    expect(getFileExtension('data.csv')).toBe('csv');
  });

  it('returns empty string for a file with no extension', () => {
    expect(getFileExtension('README')).toBe('');
  });

  it('handles filenames with multiple dots', () => {
    expect(getFileExtension('my.data.file.eds')).toBe('eds');
  });
});

// ---------------------------------------------------------------------------
// validateCSVData
// ---------------------------------------------------------------------------
describe('validateCSVData', () => {
  it('returns invalid for null input', () => {
    expect(validateCSVData(null).valid).toBe(false);
  });

  it('returns invalid for empty array', () => {
    expect(validateCSVData([]).valid).toBe(false);
  });

  it('returns invalid when fewer than 2 columns', () => {
    expect(validateCSVData([{ Temp: 60 }]).valid).toBe(false);
  });

  it('returns invalid when first column is non-numeric', () => {
    const data = [{ Sample: 'A', Fluorescence: 100 }];
    expect(validateCSVData(data).valid).toBe(false);
  });

  it('returns valid for well-formed CSV data', () => {
    const data = [
      { Temperature: 60, Sample1: 1000 },
      { Temperature: 61, Sample1: 950 },
    ];
    const result = validateCSVData(data);
    expect(result.valid).toBe(true);
    expect(result.headers).toEqual(['Temperature', 'Sample1']);
    expect(result.tempHeader).toBe('Temperature');
  });
});

// ---------------------------------------------------------------------------
// debounce
// ---------------------------------------------------------------------------
describe('debounce', () => {
  it('delays function execution', async () => {
    let callCount = 0;
    const debounced = debounce(() => { callCount++; }, 50);

    debounced();
    debounced();
    debounced();

    expect(callCount).toBe(0);

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(callCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
describe('exported constants', () => {
  it('MELT_REGION_FRACTION is 0.1', () => {
    expect(MELT_REGION_FRACTION).toBe(0.1);
  });

  it('MIN_SAMPLE_COVERAGE is 0.5', () => {
    expect(MIN_SAMPLE_COVERAGE).toBe(0.5);
  });
});
