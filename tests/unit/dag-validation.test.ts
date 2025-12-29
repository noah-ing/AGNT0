import { describe, it, expect } from '@jest/globals';

interface DAGNode {
  id: string;
  type: string;
}

interface DAGEdge {
  source: string;
  target: string;
}

function validateDAG(nodes: DAGNode[], edges: DAGEdge[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  // Check all edge references are valid
  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references non-existent target node: ${edge.target}`);
    }
  }

  // Check for cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const adjacencyList = new Map<string, string[]>();
  for (const node of nodes) {
    adjacencyList.set(node.id, []);
  }
  for (const edge of edges) {
    adjacencyList.get(edge.source)?.push(edge.target);
  }

  const hasCycle = (nodeId: string): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    for (const neighbor of adjacencyList.get(nodeId) || []) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        errors.push('DAG contains a cycle');
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

describe('DAG Validation', () => {
  it('should validate a simple linear DAG', () => {
    const nodes: DAGNode[] = [
      { id: 'a', type: 'input' },
      { id: 'b', type: 'agent' },
      { id: 'c', type: 'output' },
    ];
    const edges: DAGEdge[] = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ];

    const result = validateDAG(nodes, edges);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a branching DAG', () => {
    const nodes: DAGNode[] = [
      { id: 'input', type: 'input' },
      { id: 'condition', type: 'condition' },
      { id: 'branch1', type: 'agent' },
      { id: 'branch2', type: 'agent' },
      { id: 'merge', type: 'merge' },
      { id: 'output', type: 'output' },
    ];
    const edges: DAGEdge[] = [
      { source: 'input', target: 'condition' },
      { source: 'condition', target: 'branch1' },
      { source: 'condition', target: 'branch2' },
      { source: 'branch1', target: 'merge' },
      { source: 'branch2', target: 'merge' },
      { source: 'merge', target: 'output' },
    ];

    const result = validateDAG(nodes, edges);
    expect(result.valid).toBe(true);
  });

  it('should detect cycles', () => {
    const nodes: DAGNode[] = [
      { id: 'a', type: 'input' },
      { id: 'b', type: 'agent' },
      { id: 'c', type: 'agent' },
    ];
    const edges: DAGEdge[] = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'b' }, // Cycle!
    ];

    const result = validateDAG(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('DAG contains a cycle');
  });

  it('should detect invalid edge references', () => {
    const nodes: DAGNode[] = [
      { id: 'a', type: 'input' },
      { id: 'b', type: 'output' },
    ];
    const edges: DAGEdge[] = [
      { source: 'a', target: 'nonexistent' },
    ];

    const result = validateDAG(nodes, edges);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Edge references non-existent target node: nonexistent');
  });

  it('should validate an empty DAG', () => {
    const result = validateDAG([], []);
    expect(result.valid).toBe(true);
  });

  it('should validate disconnected nodes', () => {
    const nodes: DAGNode[] = [
      { id: 'a', type: 'input' },
      { id: 'b', type: 'agent' },
      { id: 'c', type: 'output' },
    ];
    const edges: DAGEdge[] = [
      { source: 'a', target: 'c' },
      // Node 'b' is disconnected
    ];

    const result = validateDAG(nodes, edges);
    expect(result.valid).toBe(true); // Disconnected nodes are allowed
  });
});
