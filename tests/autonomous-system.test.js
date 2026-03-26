import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const autonomousSystem = JSON.parse(
  readFileSync(new URL('../autonomous-system.json', import.meta.url), 'utf8')
);

describe('autonomous-system.json', () => {
  it('defines the required autonomous protocol sections', () => {
    expect(autonomousSystem).toMatchObject({
      operatingPrinciple: expect.any(Object),
      intentInterpretation: expect.any(Object),
      autonomousSystemDesign: expect.any(Object),
      selfDirectedPlanning: expect.any(Object),
      autonomousExecutionEngine: expect.any(Object),
      continuousSelfValidation: expect.any(Object),
      observabilityDrivenAdaptation: expect.any(Object),
      autonomousImprovementLoop: expect.any(Object),
      decisionAuthorityModel: expect.any(Object),
      safetyConstraints: expect.any(Object),
      selfDocumentation: expect.any(Object),
      evolutionStrategy: expect.any(Object),
      terminationCondition: expect.any(Object),
      coreBehavioralHeuristics: expect.any(Array),
      decisionRationale: expect.any(Object),
      changeLog: expect.any(Array),
      knownLimitations: expect.any(Array),
    });
  });

  it('references real system component paths', () => {
    autonomousSystem.autonomousSystemDesign.components.forEach(({ path }) => {
      expect(existsSync(new URL(`../${path}`, import.meta.url))).toBe(true);
    });
  });

  it('tracks documentation and validation artifacts', () => {
    const documentationPaths = autonomousSystem.selfDocumentation.artifacts.map(
      ({ path }) => path
    );

    expect(documentationPaths).toContain('autonomous-system.json');
    expect(documentationPaths).toContain('README.md');
    expect(autonomousSystem.selfDocumentation.validation).toBe(
      'tests/autonomous-system.test.js'
    );
    expect(autonomousSystem.changeLog.length).toBeGreaterThan(0);
  });
});
