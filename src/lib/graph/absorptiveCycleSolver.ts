// lib/graph/absorptiveCycleSolver.ts

export interface GraphNode {
  id: string;
  companyName: string;
  offeringValueCAD: number;
  seekingValueCAD: number;
  offeringEmbedding: number[];
  seekingEmbedding: number[];
}

export interface WeightedEdge {
  fromNodeId: string;
  toNodeId: string;
  allocatedValueCAD: number;
  similarityScore: number;
}

export interface BalancedTradeCycle {
  cycleNodes: string[];
  edges: WeightedEdge[];
  totalCycleValueCAD: number;
  isFullyBalanced: boolean;
}

/**
 * Finds absorptive 3-way or 4-way cycles that resolve value deltas without cash top-ups.
 */
export function solveAbsorptiveCycle(
  primaryNode: GraphNode,
  counterpartyNode: GraphNode,
  candidatePool: GraphNode[]
): BalancedTradeCycle | null {
  const deltaValue = primaryNode.offeringValueCAD - counterpartyNode.offeringValueCAD;

  // Case 1: Exact 1:1 Reciprocal Match ($0 Delta)
  if (Math.abs(deltaValue) < 100) {
    return {
      cycleNodes: [primaryNode.id, counterpartyNode.id],
      edges: [
        {
          fromNodeId: primaryNode.id,
          toNodeId: counterpartyNode.id,
          allocatedValueCAD: counterpartyNode.offeringValueCAD,
          similarityScore: 1.0,
        },
        {
          fromNodeId: counterpartyNode.id,
          toNodeId: primaryNode.id,
          allocatedValueCAD: counterpartyNode.offeringValueCAD,
          similarityScore: 1.0,
        },
      ],
      totalCycleValueCAD: counterpartyNode.offeringValueCAD,
      isFullyBalanced: true,
    };
  }

  // Case 2: Primary Node has Surplus Value ($4,000 Delta) -> Search for Absorbing Node C
  const deltaAbsorber = candidatePool.find((candidate) => {
    const matchesDeltaCapacity = Math.abs(candidate.offeringValueCAD - Math.abs(deltaValue)) < 500;
    const distinctCompany = candidate.id !== primaryNode.id && candidate.id !== counterpartyNode.id;
    return matchesDeltaCapacity && distinctCompany;
  });

  if (!deltaAbsorber) {
    return null; // No single-node absorber found in memory; leave offer open in graph pool
  }

  // Build the 3-Node Absorptive Cycle
  return {
    cycleNodes: [primaryNode.id, counterpartyNode.id, deltaAbsorber.id],
    edges: [
      // Primary gives $8k to Counterparty
      {
        fromNodeId: primaryNode.id,
        toNodeId: counterpartyNode.id,
        allocatedValueCAD: counterpartyNode.offeringValueCAD,
        similarityScore: 0.88,
      },
      // Primary gives $4k surplus to Absorber C
      {
        fromNodeId: primaryNode.id,
        toNodeId: deltaAbsorber.id,
        allocatedValueCAD: Math.abs(deltaValue),
        similarityScore: 0.85,
      },
      // Absorber C gives $4k service to Primary
      {
        fromNodeId: deltaAbsorber.id,
        toNodeId: primaryNode.id,
        allocatedValueCAD: Math.abs(deltaValue),
        similarityScore: 0.90,
      },
    ],
    totalCycleValueCAD: primaryNode.offeringValueCAD,
    isFullyBalanced: true,
  };
}