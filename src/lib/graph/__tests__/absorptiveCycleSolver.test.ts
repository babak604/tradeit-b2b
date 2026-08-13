// src/lib/graph/__tests__/absorptiveCycleSolver.test.ts
import { describe, it, expect } from 'vitest';
import {
  solveAbsorptiveCycle,
  GraphNode,
} from '../absorptiveCycleSolver';

describe('absorptiveCycleSolver', () => {
  const dummyEmbedding = new Array(1536).fill(0);

  const primaryCompanyA: GraphNode = {
    id: 'node-A',
    companyName: 'Apex Tech Solutions',
    offeringValueCAD: 12000,
    seekingValueCAD: 12000,
    offeringEmbedding: dummyEmbedding,
    seekingEmbedding: dummyEmbedding,
  };

  const counterpartyCompanyB: GraphNode = {
    id: 'node-B',
    companyName: 'Vivid Media Group',
    offeringValueCAD: 8000,
    seekingValueCAD: 8000,
    offeringEmbedding: dummyEmbedding,
    seekingEmbedding: dummyEmbedding,
  };

  const exactMatchCompanyB: GraphNode = {
    id: 'node-B-exact',
    companyName: 'EquiTrade Corp',
    offeringValueCAD: 12000,
    seekingValueCAD: 12000,
    offeringEmbedding: dummyEmbedding,
    seekingEmbedding: dummyEmbedding,
  };

  const candidatePoolCompanyC: GraphNode = {
    id: 'node-C',
    companyName: 'Legal Shield Partners',
    offeringValueCAD: 4000,
    seekingValueCAD: 4000,
    offeringEmbedding: dummyEmbedding,
    seekingEmbedding: dummyEmbedding,
  };

  it('should resolve an exact 1:1 reciprocal match ($0 delta)', () => {
    const result = solveAbsorptiveCycle(primaryCompanyA, exactMatchCompanyB, []);

    expect(result).not.toBeNull();
    expect(result?.isFullyBalanced).toBe(true);
    expect(result?.cycleNodes).toEqual(['node-A', 'node-B-exact']);
    expect(result?.edges).toHaveLength(2);
    expect(result?.totalCycleValueCAD).toBe(12000);
  });

  it('should construct a 3-way absorptive cycle when a $4,000 delta absorber is present', () => {
    const candidatePool = [candidatePoolCompanyC];

    const result = solveAbsorptiveCycle(
      primaryCompanyA,
      counterpartyCompanyB,
      candidatePool
    );

    expect(result).not.toBeNull();
    expect(result?.isFullyBalanced).toBe(true);
    expect(result?.cycleNodes).toEqual(['node-A', 'node-B', 'node-C']);
    expect(result?.edges).toHaveLength(3);

    const [primaryToB, primaryToC, cToPrimary] = result!.edges;

    expect(primaryToB).toEqual({
      fromNodeId: 'node-A',
      toNodeId: 'node-B',
      allocatedValueCAD: 8000,
      similarityScore: 0.88,
    });

    expect(primaryToC).toEqual({
      fromNodeId: 'node-A',
      toNodeId: 'node-C',
      allocatedValueCAD: 4000,
      similarityScore: 0.85,
    });

    expect(cToPrimary).toEqual({
      fromNodeId: 'node-C',
      toNodeId: 'node-A',
      allocatedValueCAD: 4000,
      similarityScore: 0.9,
    });
  });

  it('should return null if no suitable candidate exists to absorb the value delta', () => {
    const invalidPool: GraphNode[] = [
      {
        id: 'node-D',
        companyName: 'Mismatched Logistics',
        offeringValueCAD: 9500,
        seekingValueCAD: 9500,
        offeringEmbedding: dummyEmbedding,
        seekingEmbedding: dummyEmbedding,
      },
    ];

    const result = solveAbsorptiveCycle(
      primaryCompanyA,
      counterpartyCompanyB,
      invalidPool
    );

    expect(result).toBeNull();
  });
});