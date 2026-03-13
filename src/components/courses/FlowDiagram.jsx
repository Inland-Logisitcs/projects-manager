import { useMemo } from 'react';

const FONT_SIZE = 11;
const CHAR_WIDTH = 6.6;
const LINE_HEIGHT = 16;
const PAD_X = 14;
const PAD_Y = 10;
const GAP_X = 60;
const GAP_Y = 50;
const ARROW_SIZE = 6;

const NODE_STYLES = {
  entryPoint: { fill: '#dbeafe', stroke: '#2563eb', color: '#1e40af' },
  warehouse:  { fill: '#fef3c7', stroke: '#d97706', color: '#92400e' },
  lm:         { fill: '#d1fae5', stroke: '#059669', color: '#065f46' },
  postalcode: { fill: '#f3e8ff', stroke: '#7c3aed', color: '#5b21b6' },
  state:      { fill: '#e8f4f8', stroke: '#015E7C', color: '#1a1a2e' },
};

const measureText = (text) => {
  const lines = text.split('\n');
  const maxLen = Math.max(...lines.map(l => l.length));
  return {
    w: maxLen * CHAR_WIDTH + PAD_X * 2,
    h: lines.length * LINE_HEIGHT + PAD_Y * 2,
    lines,
  };
};

const layoutNodes = (nodes, edges) => {
  const nodeIds = new Set(nodes.map(n => n.id));

  // Build adjacency
  const children = new Map();
  const parents = new Map();
  nodes.forEach(n => { children.set(n.id, []); parents.set(n.id, []); });

  // Detect back-edges: first pass assigns layers ignoring cycles
  // Use DFS to find back-edges
  const visited = new Set();
  const inStack = new Set();
  const backEdges = new Set();

  const dfs = (nodeId) => {
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const e of edges) {
      if (e.from !== nodeId || !nodeIds.has(e.to)) continue;
      if (inStack.has(e.to)) {
        backEdges.add(`${e.from}->${e.to}`);
      } else if (!visited.has(e.to)) {
        dfs(e.to);
      }
    }
    inStack.delete(nodeId);
  };

  nodes.forEach(n => { if (!visited.has(n.id)) dfs(n.id); });

  // Build adjacency excluding back-edges
  edges.forEach(e => {
    if (backEdges.has(`${e.from}->${e.to}`)) return;
    children.get(e.from)?.push(e.to);
    parents.get(e.to)?.push(e.from);
  });

  // Assign layers via BFS from roots (using DAG edges only)
  const roots = nodes.filter(n => (parents.get(n.id) || []).length === 0);
  if (roots.length === 0) roots.push(nodes[0]); // fallback for pure cycles

  const layer = new Map();
  const queue = [...roots.map(r => r.id)];
  queue.forEach(id => layer.set(id, 0));

  let i = 0;
  while (i < queue.length) {
    const curr = queue[i++];
    const currLayer = layer.get(curr);
    for (const child of (children.get(curr) || [])) {
      const newLayer = currLayer + 1;
      if (!layer.has(child) || layer.get(child) < newLayer) {
        layer.set(child, newLayer);
      }
      if (!queue.includes(child)) queue.push(child);
    }
  }

  // Handle unreached nodes
  nodes.forEach(n => { if (!layer.has(n.id)) layer.set(n.id, 0); });

  // Group by layer
  const layers = new Map();
  nodes.forEach(n => {
    const l = layer.get(n.id);
    if (!layers.has(l)) layers.set(l, []);
    layers.get(l).push(n);
  });

  // Measure all nodes
  const measured = new Map();
  nodes.forEach(n => {
    const label = n.type === 'state' ? n.label : `${n.type}\n${n.label}`;
    measured.set(n.id, { ...measureText(label), label });
  });

  const isVertical = nodes.length > 4;
  const positioned = new Map();
  const sortedLayers = [...layers.keys()].sort((a, b) => a - b);

  if (isVertical) {
    // Calculate max layer width for centering
    const maxLayerWidth = Math.max(...sortedLayers.map(sl => {
      const ln = layers.get(sl);
      return ln.reduce((s, n) => s + measured.get(n.id).w, 0) + (ln.length - 1) * GAP_X;
    }));

    let y = 20;
    for (const l of sortedLayers) {
      const layerNodes = layers.get(l);
      const totalWidth = layerNodes.reduce((sum, n) => sum + measured.get(n.id).w, 0) + (layerNodes.length - 1) * GAP_X;
      let x = 20 + (maxLayerWidth - totalWidth) / 2;

      let maxH = 0;
      for (const n of layerNodes) {
        const m = measured.get(n.id);
        positioned.set(n.id, { x, y, w: m.w, h: m.h, lines: m.lines, label: m.label, node: n });
        x += m.w + GAP_X;
        maxH = Math.max(maxH, m.h);
      }
      y += maxH + GAP_Y;
    }
  } else {
    const maxLayerHeight = Math.max(...sortedLayers.map(sl => {
      const ln = layers.get(sl);
      return ln.reduce((s, n) => s + measured.get(n.id).h, 0) + (ln.length - 1) * GAP_Y;
    }));

    let x = 20;
    for (const l of sortedLayers) {
      const layerNodes = layers.get(l);
      const totalHeight = layerNodes.reduce((sum, n) => sum + measured.get(n.id).h, 0) + (layerNodes.length - 1) * GAP_Y;
      let y = 20 + (maxLayerHeight - totalHeight) / 2;

      let maxW = 0;
      for (const n of layerNodes) {
        const m = measured.get(n.id);
        positioned.set(n.id, { x, y, w: m.w, h: m.h, lines: m.lines, label: m.label, node: n });
        y += m.h + GAP_Y;
        maxW = Math.max(maxW, m.w);
      }
      x += maxW + GAP_X;
    }
  }

  return { positioned, isVertical, backEdges };
};

const buildEdgePath = (from, to, isVertical, isBackEdge, allPositioned) => {
  if (!from || !to) return null;

  const fromCx = from.x + from.w / 2;
  const fromCy = from.y + from.h / 2;
  const toCx = to.x + to.w / 2;
  const toCy = to.y + to.h / 2;

  if (isBackEdge) {
    // Back-edge: curve around the side
    if (isVertical) {
      // Going upward: exit from side, curve around, enter from side
      const goRight = fromCx <= toCx;
      const offsetX = goRight ? Math.max(from.x + from.w, to.x + to.w) + 30 : Math.min(from.x, to.x) - 30;
      const x1 = goRight ? from.x + from.w : from.x;
      const y1 = fromCy;
      const x2 = goRight ? to.x + to.w : to.x;
      const y2 = toCy;
      return {
        path: `M ${x1} ${y1} C ${offsetX} ${y1}, ${offsetX} ${y2}, ${x2} ${y2}`,
        x2, y2,
        endSide: goRight ? 'right' : 'left',
      };
    } else {
      const offsetY = Math.max(from.y + from.h, to.y + to.h) + 30;
      const x1 = fromCx;
      const y1 = from.y + from.h;
      const x2 = toCx;
      const y2 = to.y + to.h;
      return {
        path: `M ${x1} ${y1} C ${x1} ${offsetY}, ${x2} ${offsetY}, ${x2} ${y2}`,
        x2, y2,
        endSide: 'bottom',
      };
    }
  }

  // Normal forward edge
  let x1, y1, x2, y2;
  if (isVertical) {
    x1 = fromCx;
    y1 = from.y + from.h;
    x2 = toCx;
    y2 = to.y;
  } else {
    x1 = from.x + from.w;
    y1 = fromCy;
    x2 = to.x;
    y2 = toCy;
  }

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const path = isVertical
    ? `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
    : `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

  return { path, x2, y2, endSide: isVertical ? 'top' : 'left' };
};

const FlowDiagram = ({ nodes, edges }) => {
  const { positioned, svgWidth, svgHeight, edgePaths } = useMemo(() => {
    const { positioned, isVertical, backEdges } = layoutNodes(nodes, edges);

    // Build edge paths
    const paths = edges.map((e, i) => {
      const from = positioned.get(e.from);
      const to = positioned.get(e.to);
      if (!from || !to) return null;

      const isBack = backEdges.has(`${e.from}->${e.to}`);
      const result = buildEdgePath(from, to, isVertical, isBack, positioned);
      if (!result) return null;

      return { ...result, label: e.label, isBackEdge: isBack };
    }).filter(Boolean);

    // Calculate SVG size accounting for back-edge curves
    let maxX = 0, maxY = 0;
    for (const p of positioned.values()) {
      maxX = Math.max(maxX, p.x + p.w);
      maxY = Math.max(maxY, p.y + p.h);
    }
    // Add extra space for back-edge curves
    if (paths.some(p => p.isBackEdge)) {
      maxX += 50;
      maxY += 20;
    }

    return {
      positioned,
      svgWidth: maxX + 20,
      svgHeight: maxY + 20,
      edgePaths: paths,
    };
  }, [nodes, edges]);

  return (
    <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
      <defs>
        <marker id="arrowhead" markerWidth={ARROW_SIZE} markerHeight={ARROW_SIZE} refX={ARROW_SIZE} refY={ARROW_SIZE / 2} orient="auto">
          <polygon points={`0 0, ${ARROW_SIZE} ${ARROW_SIZE / 2}, 0 ${ARROW_SIZE}`} fill="#015E7C" />
        </marker>
        <marker id="arrowhead-back" markerWidth={ARROW_SIZE} markerHeight={ARROW_SIZE} refX={ARROW_SIZE} refY={ARROW_SIZE / 2} orient="auto">
          <polygon points={`0 0, ${ARROW_SIZE} ${ARROW_SIZE / 2}, 0 ${ARROW_SIZE}`} fill="#8899aa" />
        </marker>
      </defs>

      {edgePaths.map((e, i) => (
        <g key={`edge-${i}`}>
          <path
            d={e.path}
            fill="none"
            stroke={e.isBackEdge ? '#8899aa' : '#015E7C'}
            strokeWidth={1.5}
            strokeDasharray={e.isBackEdge ? '5,3' : 'none'}
            markerEnd={e.isBackEdge ? 'url(#arrowhead-back)' : 'url(#arrowhead)'}
          />
          {e.label && (
            <text
              x={(parseFloat(e.path.split(' ')[1]) + e.x2) / 2}
              y={(parseFloat(e.path.split(' ')[2]) + e.y2) / 2 - 6}
              fontSize={9}
              fill="#666"
              textAnchor="middle"
            >
              {e.label}
            </text>
          )}
        </g>
      ))}

      {[...positioned.values()].map(p => {
        const style = NODE_STYLES[p.node.type] || NODE_STYLES.state;
        const lines = p.label.split('\n');
        const rx = p.node.type === 'postalcode' ? p.w / 2 : 6;
        const ry = p.node.type === 'postalcode' ? p.h / 2 : 6;

        return (
          <g key={p.node.id}>
            <rect
              x={p.x} y={p.y}
              width={p.w} height={p.h}
              rx={rx} ry={ry}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth={1.5}
            />
            {lines.map((line, li) => (
              <text
                key={li}
                x={p.x + p.w / 2}
                y={p.y + PAD_Y + (li + 0.7) * LINE_HEIGHT}
                fontSize={FONT_SIZE}
                fill={style.color}
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight={li === 0 && lines.length > 1 ? 600 : 400}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
};

export default FlowDiagram;
