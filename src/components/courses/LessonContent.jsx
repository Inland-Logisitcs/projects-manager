import { useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import FlowDiagram from './FlowDiagram';

const isGraphDiagram = (text) => /-\[:GO\]->/.test(text);

const isStateDiagram = (text) => {
  return /(?:^|\n)\s*\w[\w_]*\s*-->/.test(text) && !/WHERE/.test(text);
};

const parseGraph = (text) => {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const nodesMap = new Map();
  const edges = [];

  for (const line of lines) {
    const match = line.match(/\((\w+):\s*(\w+)\)\s*-\[:GO\]->\s*\((\w+):\s*(\w+)\)/);
    if (!match) continue;
    const [, sourceType, sourceName, targetType, targetName] = match;
    const sourceId = `${sourceType}_${sourceName}`;
    const targetId = `${targetType}_${targetName}`;
    nodesMap.set(sourceId, { id: sourceId, label: sourceName, type: sourceType });
    nodesMap.set(targetId, { id: targetId, label: targetName, type: targetType });
    edges.push({ from: sourceId, to: targetId, label: 'GO' });
  }

  return { nodes: [...nodesMap.values()], edges };
};

const parseState = (text) => {
  const allNodes = new Map();
  const edges = [];
  const lines = text.trim().split('\n').filter(l => l.trim());

  for (const line of lines) {
    const parts = line.split(/\s*-+>\s*/);
    if (parts.length < 2) continue;
    for (let i = 0; i < parts.length - 1; i++) {
      const from = parts[i].trim().replace(/[()]/g, '').replace(/\s*\(.*?\)\s*/g, '').trim();
      const to = parts[i + 1].trim().replace(/[()]/g, '').replace(/\s*\(o\s+\w+\)\s*/g, '').trim();
      if (!from || !to) continue;
      const fromLabel = from.replace(/_/g, ' ');
      const toLabel = to.replace(/_/g, ' ');
      allNodes.set(from, { id: from, label: fromLabel, type: 'state' });
      allNodes.set(to, { id: to, label: toLabel, type: 'state' });
      edges.push({ from, to });
    }
  }

  if (edges.length === 0) return null;
  return { nodes: [...allNodes.values()], edges };
};

const LessonContent = ({ html }) => {
  const containerRef = useRef(null);
  const renderIdRef = useRef(0);
  const rootsRef = useRef([]);

  const processCodeBlocks = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    // Cleanup previous React roots
    rootsRef.current.forEach(root => root.unmount());
    rootsRef.current = [];

    const renderId = ++renderIdRef.current;
    const preBlocks = container.querySelectorAll('pre');

    for (const pre of preBlocks) {
      const code = pre.querySelector('code');
      if (!code) continue;

      const text = code.textContent || '';
      let data = null;

      if (isGraphDiagram(text)) {
        data = parseGraph(text);
      } else if (isStateDiagram(text)) {
        data = parseState(text);
      }

      if (!data || renderId !== renderIdRef.current) continue;

      const wrapper = document.createElement('div');
      wrapper.className = 'mermaid-diagram';

      const details = document.createElement('details');
      details.className = 'diagram-source';
      const summary = document.createElement('summary');
      summary.textContent = 'Ver notacion original';
      details.appendChild(summary);
      const originalPre = pre.cloneNode(true);
      details.appendChild(originalPre);

      pre.replaceWith(wrapper, details);

      const root = createRoot(wrapper);
      root.render(<FlowDiagram nodes={data.nodes} edges={data.edges} />);
      rootsRef.current.push(root);
    }
  }, []);

  useEffect(() => {
    processCodeBlocks();
    return () => {
      rootsRef.current.forEach(root => root.unmount());
      rootsRef.current = [];
    };
  }, [html, processCodeBlocks]);

  return (
    <div
      ref={containerRef}
      className="lesson-content-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default LessonContent;
