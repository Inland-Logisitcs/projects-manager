import { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  ConnectionMode,
  ConnectionLineType,
} from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';
import { addTaskDependency, removeTaskDependency } from '../../services/taskService';
import { addProjectDependency, removeProjectDependency } from '../../services/projectService';
import RootNode from './nodes/RootNode';
import ProjectNode from './nodes/ProjectNode';
import TaskNode from './nodes/TaskNode';
import ConnectorNode from './nodes/ConnectorNode';
import '../../styles/DependenciesFlow.css';

const nodeTypes = {
  root: RootNode,
  project: ProjectNode,
  task: TaskNode,
  connector: ConnectorNode,
};

// Node dimensions for dagre layout
const NODE_DIMENSIONS = {
  root: { width: 150, height: 60 },
  task: { width: 250, height: 70 },
  group: { width: 300, height: 150 },
};

// Create dagre graph and apply layout only to groups, then layout tasks within each group
const getLayoutedElements = (nodes, edges) => {
  console.log('=== DAGRE LAYOUT DEBUG ===');
  console.log('Input nodes:', nodes.map(n => ({ id: n.id, type: n.type, parentId: n.parentId })));
  console.log('Input edges:', edges.map(e => ({ id: e.id, source: e.source, target: e.target })));

  // Separate nodes by type
  const rootNode = nodes.find(n => n.type === 'root');
  const groupNodes = nodes.filter(n => n.type === 'group');
  const projectNodes = nodes.filter(n => n.type === 'project');
  const taskNodes = nodes.filter(n => n.type === 'task');

  // === LAYOUT GROUPS HORIZONTALLY WITH DAGRE ===
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'LR', // Left to Right for groups
    nodesep: 80,   // Vertical spacing between groups in same rank
    ranksep: 150,  // Horizontal spacing between root and groups
    marginx: 50,
    marginy: 50,
  });

  // Add root node
  if (rootNode) {
    dagreGraph.setNode(rootNode.id, {
      width: NODE_DIMENSIONS.root.width,
      height: NODE_DIMENSIONS.root.height,
    });
  }

  // Add group nodes to dagre
  groupNodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.style.width || 320,
      height: node.style.height || 150
    });
  });

  // Find project dependencies from edges (connector -> project connections)
  const projectDependencies = new Map(); // Map<targetProjectId, Set<sourceProjectId>>
  edges.forEach(edge => {
    if (edge.data?.isProjectDependency) {
      const targetProjectId = edge.data.targetProjectId;
      const sourceProjectId = edge.data.sourceProjectId;
      if (!projectDependencies.has(targetProjectId)) {
        projectDependencies.set(targetProjectId, new Set());
      }
      projectDependencies.get(targetProjectId).add(sourceProjectId);
    }
  });

  // Add edges from root to groups that don't have project dependencies
  groupNodes.forEach((groupNode) => {
    const projectId = groupNode.id.replace('group-', '');
    const hasDependencies = projectDependencies.has(projectId);

    if (!hasDependencies) {
      // Only connect to root if project has no dependencies
      dagreGraph.setEdge('root', groupNode.id);
    }
  });

  // Add edges between groups based on project dependencies
  projectDependencies.forEach((sourceProjectIds, targetProjectId) => {
    sourceProjectIds.forEach(sourceProjectId => {
      const sourceGroupId = `group-${sourceProjectId}`;
      const targetGroupId = `group-${targetProjectId}`;
      dagreGraph.setEdge(sourceGroupId, targetGroupId);
    });
  });

  // Calculate layout for groups
  dagre.layout(dagreGraph);

  // Apply positions to root node (will be updated after groups are positioned)
  let layoutedRootNode = rootNode;

  // Apply positions to group nodes (will be updated after task layout)
  // Calculate dependency levels for horizontal positioning
  const groupDependencyLevels = new Map();

  const calculateDependencyLevel = (groupId, visited = new Set()) => {
    if (groupDependencyLevels.has(groupId)) {
      return groupDependencyLevels.get(groupId);
    }

    // Prevent circular dependencies
    if (visited.has(groupId)) {
      return 0;
    }
    visited.add(groupId);

    const projectId = groupId.replace('group-', '');
    const dependencies = projectDependencies.get(projectId);

    if (!dependencies || dependencies.size === 0) {
      // No dependencies = level 0
      groupDependencyLevels.set(groupId, 0);
      return 0;
    }

    // Level = max level of dependencies + 1
    let maxDepLevel = -1;
    dependencies.forEach(depProjectId => {
      const depGroupId = `group-${depProjectId}`;
      const depLevel = calculateDependencyLevel(depGroupId, new Set(visited));
      maxDepLevel = Math.max(maxDepLevel, depLevel);
    });

    const level = maxDepLevel + 1;
    groupDependencyLevels.set(groupId, level);
    return level;
  };

  // Calculate levels for all groups
  groupNodes.forEach(node => {
    calculateDependencyLevel(node.id);
  });

  // Sort groups by dependency level, then by dagre Y position for same level
  const groupsWithPositioning = groupNodes.map(node => ({
    node,
    dagrePos: dagreGraph.node(node.id),
    dependencyLevel: groupDependencyLevels.get(node.id) || 0
  })).sort((a, b) => {
    // First sort by level, then by dagre Y position
    if (a.dependencyLevel !== b.dependencyLevel) {
      return a.dependencyLevel - b.dependencyLevel;
    }
    return a.dagrePos.y - b.dagrePos.y;
  });

  const baseGroupX = 300; // Starting X position for level 0
  const levelSpacing = 600; // Horizontal spacing between dependency levels

  // Calculate Y positions based on dependencies (align with source project)
  const groupPositions = new Map();

  // First, position level 0 groups (no dependencies) stacked vertically
  const level0Groups = groupsWithPositioning.filter(g => g.dependencyLevel === 0);
  let accumulatedY = 50;

  level0Groups.forEach(({ node }) => {
    const width = node.style.width || 320;
    const height = node.style.height || 150;

    groupPositions.set(node.id, {
      x: baseGroupX,
      y: accumulatedY,
      width,
      height
    });

    accumulatedY += height + 50;
  });

  // Now position dependent groups aligned with their dependencies
  const positionDependentGroup = (groupId, level) => {
    if (groupPositions.has(groupId)) {
      return groupPositions.get(groupId);
    }

    const node = groupsWithPositioning.find(g => g.node.id === groupId).node;
    const projectId = groupId.replace('group-', '');
    const dependencies = projectDependencies.get(projectId);

    if (!dependencies || dependencies.size === 0) {
      // Shouldn't happen, but fallback
      const pos = {
        x: baseGroupX + (level * levelSpacing),
        y: 50,
        width: node.style.width || 320,
        height: node.style.height || 150
      };
      groupPositions.set(groupId, pos);
      return pos;
    }

    // Calculate average Y position and max X position of dependencies
    let totalY = 0;
    let maxX = -Infinity;
    let depCount = 0;

    dependencies.forEach(depProjectId => {
      const depGroupId = `group-${depProjectId}`;
      const depLevel = groupDependencyLevels.get(depGroupId) || 0;

      // Recursively ensure dependency is positioned first
      const depPos = positionDependentGroup(depGroupId, depLevel);

      // Align with the vertical center of the dependency
      totalY += depPos.y + (depPos.height / 2);

      // Find the rightmost edge of dependencies
      const depRightEdge = depPos.x + depPos.width;
      maxX = Math.max(maxX, depRightEdge);

      depCount++;
    });

    const avgCenterY = totalY / depCount;
    const width = node.style.width || 320;
    const height = node.style.height || 150;
    const horizontalGap = 100;

    // Initial Y position centered with dependencies
    const targetX = maxX + horizontalGap;
    let desiredY = avgCenterY - (height / 2);

    // Check for collisions with ALL already positioned groups
    const minGap = 50; // Minimum vertical gap between projects
    let finalY = desiredY;

    // Get all groups already positioned, sorted by Y
    const positionedGroups = Array.from(groupPositions.entries())
      .map(([id, pos]) => ({ id, ...pos }))
      .sort((a, b) => a.y - b.y);

    // Check for overlaps and adjust Y if needed
    let hasCollision = true;
    let attempts = 0;
    const maxAttempts = 200;

    while (hasCollision && attempts < maxAttempts) {
      hasCollision = false;
      attempts++;

      for (const other of positionedGroups) {
        // Check if groups overlap horizontally (bounding boxes intersect)
        const thisLeft = targetX;
        const thisRight = targetX + width;
        const otherLeft = other.x;
        const otherRight = other.x + other.width;

        const horizontalOverlap = !(thisRight < otherLeft || thisLeft > otherRight);

        // Only check vertical collision if there's horizontal overlap
        if (horizontalOverlap) {
          const thisTop = finalY;
          const thisBottom = finalY + height;
          const otherTop = other.y;
          const otherBottom = other.y + other.height;

          // Check if there's a vertical overlap
          if (!(thisBottom + minGap < otherTop || thisTop > otherBottom + minGap)) {
            // Collision detected, move below this group
            finalY = otherBottom + minGap;
            hasCollision = true;
            break;
          }
        }
      }
    }

    const pos = {
      x: maxX + horizontalGap,
      y: finalY,
      width,
      height
    };

    groupPositions.set(groupId, pos);
    return pos;
  };

  // Position all groups
  groupsWithPositioning.forEach(({ node, dependencyLevel }) => {
    positionDependentGroup(node.id, dependencyLevel);
  });

  // Build layouted nodes from positions
  let layoutedGroupNodes = [];
  groupPositions.forEach((pos, groupId) => {
    const node = groupNodes.find(n => n.id === groupId);
    const level = groupDependencyLevels.get(groupId) || 0;

    console.log(`Group Node ${groupId}:`);
    console.log('  - Dependency level:', level);
    console.log('  - Dimensions:', { width: pos.width, height: pos.height });
    console.log('  - Final position:', { x: pos.x, y: pos.y });

    layoutedGroupNodes.push({
      ...node,
      position: {
        x: pos.x,
        y: pos.y,
      },
    });
  });

  // Now position root node centered vertically among level 0 groups
  if (rootNode && layoutedRootNode) {
    // Get all groups at level 0 (no dependencies)
    const level0Groups = layoutedGroupNodes.filter(node => {
      const level = groupDependencyLevels.get(node.id) || 0;
      return level === 0;
    });

    if (level0Groups.length > 0) {
      // Calculate center Y based on level 0 groups
      const minY = Math.min(...level0Groups.map(g => g.position.y));
      const maxY = Math.max(...level0Groups.map(g => g.position.y + (g.style?.height || 150)));
      const groupsCenterY = (minY + maxY) / 2;

      const finalPosition = {
        x: 50, // Fixed X position for root (left side)
        y: groupsCenterY - (NODE_DIMENSIONS.root.height / 2),
      };

      console.log('Root Node:');
      console.log('  - Level 0 groups count:', level0Groups.length);
      console.log('  - Min Y:', minY, 'Max Y:', maxY);
      console.log('  - Groups center Y:', groupsCenterY);
      console.log('  - Final position:', finalPosition);

      layoutedRootNode = {
        ...rootNode,
        position: finalPosition,
      };
    } else {
      // Fallback: center among all groups
      const allMinY = Math.min(...layoutedGroupNodes.map(g => g.position.y));
      const allMaxY = Math.max(...layoutedGroupNodes.map(g => g.position.y + (g.style?.height || 150)));
      const centerY = (allMinY + allMaxY) / 2;

      layoutedRootNode = {
        ...rootNode,
        position: {
          x: 50,
          y: centerY - (NODE_DIMENSIONS.root.height / 2),
        },
      };
    }
  }

  // === LAYOUT TASKS WITHIN EACH GROUP ===
  const layoutedTaskNodes = [];
  const layoutedProjectNodes = [];
  const layoutedConnectorNodes = [];

  // Group tasks by their parent
  const tasksByParent = {};
  taskNodes.forEach(task => {
    const parentId = task.parentId;
    if (!tasksByParent[parentId]) {
      tasksByParent[parentId] = [];
    }
    tasksByParent[parentId].push(task);
  });

  // Layout tasks within each group using dagre
  const groupSizes = {}; // Store calculated group sizes

  // Process all groups, even if they have no tasks
  groupNodes.forEach((groupNode) => {
    const parentId = groupNode.id;
    const tasks = tasksByParent[parentId] || []; // Empty array if no tasks
    const taskDagreGraph = new dagre.graphlib.Graph();
    taskDagreGraph.setDefaultEdgeLabel(() => ({}));
    taskDagreGraph.setGraph({
      rankdir: 'LR', // Left to Right for tasks within group
      nodesep: 30,   // Vertical spacing between tasks
      ranksep: 80,   // Horizontal spacing between dependency levels
      marginx: 15,
      marginy: 15,
    });

    // Find the project node for this group
    const projectNodeId = `project-${parentId.replace('group-', '')}`;
    const projectNode = projectNodes.find(n => n.id === projectNodeId);
    const connectorNodeId = `connector-${parentId.replace('group-', '')}`;

    // Add project node to dagre if it exists
    if (projectNode) {
      taskDagreGraph.setNode(projectNodeId, {
        width: 200, // projectNodeWidth
        height: 70, // projectNodeHeight
      });
    }

    // Add connector node to dagre (end of project flow)
    taskDagreGraph.setNode(connectorNodeId, {
      width: 30,
      height: 30,
    });

    // Add tasks to dagre
    tasks.forEach(task => {
      taskDagreGraph.setNode(task.id, {
        width: task.style?.width || 180,
        height: 70, // Fixed task height
      });
    });

    // Add edges from project node to tasks without internal dependencies
    tasks.forEach(task => {
      const taskDependencies = task.data?.task?.dependencies || [];

      // Check if any dependency is from the same group (internal)
      const hasInternalDependency = taskDependencies.some(depId => {
        const depTask = tasks.find(t => t.data?.task?.id === depId);
        return depTask !== undefined; // If found in same group, it's internal
      });

      // Connect to project node if no internal dependencies
      if (!hasInternalDependency && projectNode) {
        taskDagreGraph.setEdge(projectNodeId, task.id);
      }
    });

    // Add dependency edges between tasks for layout
    edges.forEach(edge => {
      const sourceTask = tasks.find(t => t.id === edge.source);
      const targetTask = tasks.find(t => t.id === edge.target);
      if (sourceTask && targetTask && edge.data?.isDependency) {
        taskDagreGraph.setEdge(edge.source, edge.target);
      }
    });

    // Find tasks that don't have any dependents (final tasks)
    const taskIds = new Set(tasks.map(t => t.id));
    const tasksWithDependents = new Set();

    tasks.forEach(task => {
      const deps = task.data?.task?.dependencies || [];
      deps.forEach(depId => {
        if (taskIds.has(depId)) {
          tasksWithDependents.add(`task-${depId}`);
        }
      });
    });

    // DON'T connect final tasks to connector in dagre layout
    // We'll position the connector manually after dagre layout
    // This prevents the connector from affecting task positioning

    // Calculate layout for tasks
    dagre.layout(taskDagreGraph);

    // Calculate actual bounds based on dagre positions
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // Apply dagre position to project node
    if (projectNode) {
      const projectPosition = taskDagreGraph.node(projectNodeId);
      const projectWidth = 200;
      const projectHeight = 70;

      const projectX = projectPosition.x - projectWidth / 2;
      const projectY = projectPosition.y - projectHeight / 2;

      minX = Math.min(minX, projectX);
      maxX = Math.max(maxX, projectX + projectWidth);
      minY = Math.min(minY, projectY);
      maxY = Math.max(maxY, projectY + projectHeight);

      layoutedProjectNodes.push({
        ...projectNode,
        position: {
          x: projectX,
          y: projectY,
        },
      });
    }

    // Apply positions to tasks and calculate bounds
    tasks.forEach(task => {
      const nodeWithPosition = taskDagreGraph.node(task.id);
      const width = task.style?.width || 180;
      const height = 70;

      const taskX = nodeWithPosition.x - width / 2;
      const taskY = nodeWithPosition.y - height / 2;

      minX = Math.min(minX, taskX);
      maxX = Math.max(maxX, taskX + width);
      minY = Math.min(minY, taskY);
      maxY = Math.max(maxY, taskY + height);

      layoutedTaskNodes.push({
        ...task,
        position: {
          x: taskX,
          y: taskY,
        },
      });
    });

    // Position connector node manually at the end of the flow
    // Find the rightmost X position among all tasks and project
    const connectorWidth = 30;
    const connectorHeight = 30;
    const connectorGap = 80; // Gap from the rightmost element

    // The connector should be positioned to the right of the rightmost element
    const connectorX = maxX + connectorGap;

    // Center it vertically based on the current bounds
    const verticalCenter = (minY + maxY) / 2;
    const connectorY = verticalCenter - (connectorHeight / 2);

    minX = Math.min(minX, connectorX);
    maxX = Math.max(maxX, connectorX + connectorWidth);
    minY = Math.min(minY, connectorY);
    maxY = Math.max(maxY, connectorY + connectorHeight);

    layoutedConnectorNodes.push({
      id: connectorNodeId,
      type: 'connector',
      position: {
        x: connectorX,
        y: connectorY,
      },
      data: {
        projectId: parentId.replace('group-', ''),
      },
      draggable: false,
      parentId: parentId,
      extent: 'parent',
    });

    // Calculate group size with padding
    const padding = 30;
    const bottomPadding = 20; // Smaller padding at the bottom

    groupSizes[parentId] = {
      width: (maxX - minX) + (padding * 2),
      height: (maxY - minY) + padding + bottomPadding,
    };

    console.log(`Group ${parentId} calculated size:`, groupSizes[parentId]);
  });

  // Update group nodes with calculated sizes and reposition them maintaining alignment
  const updatedGroupPositions = new Map();

  // Recalculate positions with new sizes using the same alignment logic
  const repositionGroup = (groupId, level) => {
    if (updatedGroupPositions.has(groupId)) {
      return updatedGroupPositions.get(groupId);
    }

    const groupSize = groupSizes[groupId];
    const width = groupSize?.width || 320;
    const height = groupSize?.height || 150;

    // Level 0: stack vertically
    if (level === 0) {
      const level0Nodes = layoutedGroupNodes.filter(n => {
        const lvl = groupDependencyLevels.get(n.id) || 0;
        return lvl === 0;
      });

      // Find this node's index in level 0
      const nodeIndex = level0Nodes.findIndex(n => n.id === groupId);

      // Calculate Y based on accumulated heights of previous level 0 nodes
      let accumulatedY = 50;
      for (let i = 0; i < nodeIndex; i++) {
        const prevNodeId = level0Nodes[i].id;
        const prevSize = groupSizes[prevNodeId];
        const prevHeight = prevSize?.height || 150;
        accumulatedY += prevHeight + 50;
      }

      const pos = {
        x: baseGroupX,
        y: accumulatedY,
        width,
        height
      };

      updatedGroupPositions.set(groupId, pos);
      return pos;
    }

    // Dependent groups: align with dependencies
    const projectId = groupId.replace('group-', '');
    const dependencies = projectDependencies.get(projectId);

    if (!dependencies || dependencies.size === 0) {
      // Fallback
      const pos = {
        x: baseGroupX + (level * levelSpacing),
        y: 50,
        width,
        height
      };
      updatedGroupPositions.set(groupId, pos);
      return pos;
    }

    // Calculate average Y position and max X position of dependencies
    let totalY = 0;
    let maxX = -Infinity;
    let depCount = 0;

    dependencies.forEach(depProjectId => {
      const depGroupId = `group-${depProjectId}`;
      const depLevel = groupDependencyLevels.get(depGroupId) || 0;

      // Recursively ensure dependency is positioned first
      const depPos = repositionGroup(depGroupId, depLevel);

      // Align with the vertical center of the dependency
      totalY += depPos.y + (depPos.height / 2);

      // Find the rightmost edge of dependencies
      const depRightEdge = depPos.x + depPos.width;
      maxX = Math.max(maxX, depRightEdge);

      depCount++;
    });

    const avgCenterY = totalY / depCount;
    const horizontalGap = 100; // Gap between projects
    const targetX = maxX + horizontalGap;
    const desiredY = avgCenterY - (height / 2);

    // Collision detection: check for overlaps with ALL already positioned groups
    const minGap = 50;
    let finalY = desiredY;

    // Get all already positioned groups, sorted by Y
    const positionedGroups = Array.from(updatedGroupPositions.entries())
      .map(([id, pos]) => ({ id, ...pos }))
      .sort((a, b) => a.y - b.y);

    // Iteratively check for collisions and adjust position
    let hasCollision = true;
    let attempts = 0;
    const maxAttempts = 200;

    while (hasCollision && attempts < maxAttempts) {
      hasCollision = false;
      attempts++;

      for (const other of positionedGroups) {
        // Check if groups overlap horizontally (bounding boxes intersect)
        const thisLeft = targetX;
        const thisRight = targetX + width;
        const otherLeft = other.x;
        const otherRight = other.x + other.width;

        const horizontalOverlap = !(thisRight < otherLeft || thisLeft > otherRight);

        // Only check vertical collision if there's horizontal overlap
        if (horizontalOverlap) {
          const thisTop = finalY;
          const thisBottom = finalY + height;
          const otherTop = other.y;
          const otherBottom = other.y + other.height;

          // Check if there's a vertical overlap
          if (!(thisBottom + minGap < otherTop || thisTop > otherBottom + minGap)) {
            // Collision detected, move below the other group
            finalY = otherBottom + minGap;
            hasCollision = true;
            break;
          }
        }
      }
    }

    const pos = {
      x: targetX,
      y: finalY,
      width,
      height
    };

    updatedGroupPositions.set(groupId, pos);
    return pos;
  };

  // Reposition all groups with new sizes
  layoutedGroupNodes.forEach(node => {
    const level = groupDependencyLevels.get(node.id) || 0;
    repositionGroup(node.id, level);
  });

  // Build updated nodes
  const updatedLayoutedGroupNodes = layoutedGroupNodes.map(groupNode => {
    const pos = updatedGroupPositions.get(groupNode.id);
    const groupSize = groupSizes[groupNode.id];

    if (pos && groupSize) {
      console.log(`Updated group ${groupNode.id} with size:`, groupSize, 'at position:', pos);
      console.log(`Group ${groupNode.id} color:`, groupNode.style.backgroundColor, groupNode.style.border);
      return {
        ...groupNode,
        position: {
          x: pos.x,
          y: pos.y,
        },
        style: {
          ...groupNode.style, // This preserves backgroundColor and border colors
          width: groupSize.width,
          height: groupSize.height,
        },
      };
    }

    return groupNode;
  });

  layoutedGroupNodes = updatedLayoutedGroupNodes;

  // Recalculate root position based on new group heights (level 0 groups only)
  if (rootNode && layoutedRootNode) {
    const level0Groups = layoutedGroupNodes.filter(node => {
      const level = groupDependencyLevels.get(node.id) || 0;
      return level === 0;
    });

    if (level0Groups.length > 0) {
      const minY = Math.min(...level0Groups.map(g => g.position.y));
      const maxY = Math.max(...level0Groups.map(g => g.position.y + (g.style?.height || 150)));
      const groupsCenterY = (minY + maxY) / 2;

      layoutedRootNode = {
        ...layoutedRootNode,
        position: {
          x: 50,
          y: groupsCenterY - (NODE_DIMENSIONS.root.height / 2),
        },
      };

      console.log('Root repositioned based on level 0 groups. Center Y:', groupsCenterY);
    }
  }

  // Combine all nodes
  const layoutedNodes = [
    ...(layoutedRootNode ? [layoutedRootNode] : []),
    ...layoutedGroupNodes,
    ...layoutedProjectNodes, // Project nodes now use dagre positions
    ...layoutedTaskNodes,
    ...layoutedConnectorNodes, // Connector nodes at end of each project
  ];

  console.log('Output nodes with positions:', layoutedNodes.map(n => ({ id: n.id, position: n.position, parentId: n.parentId })));

  console.log('=== END DAGRE DEBUG ===');

  return { nodes: layoutedNodes, edges };
};

const DependenciesFlow = ({ projects, tasks, onTaskClick, isAdmin = false }) => {
  // Generar un color consistente para un proyecto basado en su ID
  const getProjectColor = useCallback((projectId) => {
    if (!projectId) return '#6B7280'; // Color gris por defecto

    // Paleta de colores suaves y diferenciables
    const colors = [
      '#3B82F6', // Azul
      '#10B981', // Verde
      '#F59E0B', // Naranja
      '#EF4444', // Rojo
      '#8B5CF6', // Púrpura
      '#EC4899', // Rosa
      '#14B8A6', // Teal
      '#F97316', // Naranja oscuro
      '#6366F1', // Índigo
      '#84CC16', // Lima
    ];

    // Generar un índice consistente basado en el projectId
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;

    return colors[index];
  }, []);

  // Calcular la ruta crítica (critical path) para un conjunto de tareas
  const calculateCriticalPath = useCallback((projectTasks) => {
    if (!projectTasks || projectTasks.length === 0) return new Set();

    // Crear un mapa de tareas por ID
    const taskMap = new Map(projectTasks.map(t => [t.id, t]));

    // Calcular el "earliest start" y "earliest finish" para cada tarea
    const earlyStart = new Map();
    const earlyFinish = new Map();

    // Función recursiva para calcular early start/finish
    const calculateEarly = (taskId, visited = new Set()) => {
      if (earlyStart.has(taskId)) return earlyFinish.get(taskId);
      if (visited.has(taskId)) return 0; // Circular dependency

      visited.add(taskId);
      const task = taskMap.get(taskId);
      if (!task) return 0;

      const duration = 1; // Cada tarea tiene duración 1 (se puede mejorar con estimaciones reales)
      const dependencies = task.dependencies || [];

      if (dependencies.length === 0) {
        earlyStart.set(taskId, 0);
        earlyFinish.set(taskId, duration);
        return duration;
      }

      // Early start = max(early finish de todas las dependencias)
      let maxFinish = 0;
      dependencies.forEach(depId => {
        if (taskMap.has(depId)) {
          const depFinish = calculateEarly(depId, new Set(visited));
          maxFinish = Math.max(maxFinish, depFinish);
        }
      });

      earlyStart.set(taskId, maxFinish);
      earlyFinish.set(taskId, maxFinish + duration);
      return maxFinish + duration;
    };

    // Calcular early times para todas las tareas
    projectTasks.forEach(task => calculateEarly(task.id));

    // Encontrar el tiempo máximo de finalización (project finish time)
    const projectFinishTime = Math.max(...Array.from(earlyFinish.values()));

    // Calcular "latest start" y "latest finish" trabajando hacia atrás
    const lateStart = new Map();
    const lateFinish = new Map();

    // Inicializar las tareas finales (sin dependientes)
    const taskIds = new Set(projectTasks.map(t => t.id));
    const tasksWithDependents = new Set();
    projectTasks.forEach(task => {
      (task.dependencies || []).forEach(depId => {
        if (taskIds.has(depId)) {
          tasksWithDependents.add(depId);
        }
      });
    });

    const calculateLate = (taskId, visited = new Set()) => {
      if (lateStart.has(taskId)) return lateStart.get(taskId);
      if (visited.has(taskId)) return projectFinishTime;

      visited.add(taskId);
      const task = taskMap.get(taskId);
      if (!task) return projectFinishTime;

      const duration = 1;

      // Encontrar todas las tareas que dependen de esta
      const dependents = projectTasks.filter(t =>
        (t.dependencies || []).includes(taskId)
      );

      if (dependents.length === 0) {
        // Tarea final
        lateFinish.set(taskId, projectFinishTime);
        lateStart.set(taskId, projectFinishTime - duration);
        return projectFinishTime - duration;
      }

      // Late finish = min(late start de todos los dependientes)
      let minStart = projectFinishTime;
      dependents.forEach(dep => {
        const depStart = calculateLate(dep.id, new Set(visited));
        minStart = Math.min(minStart, depStart);
      });

      lateFinish.set(taskId, minStart);
      lateStart.set(taskId, minStart - duration);
      return minStart - duration;
    };

    // Calcular late times para todas las tareas
    projectTasks.forEach(task => calculateLate(task.id));

    // Una tarea está en la ruta crítica si su slack (holgura) es 0
    // Slack = late start - early start
    const criticalPath = new Set();
    projectTasks.forEach(task => {
      const slack = (lateStart.get(task.id) || 0) - (earlyStart.get(task.id) || 0);
      if (Math.abs(slack) < 0.01) { // Usar epsilon para comparación de floats
        criticalPath.add(task.id);
      }
    });

    return criticalPath;
  }, []);

  // Build nodes and edges from data
  const { rawNodes, rawEdges } = useMemo(() => {
    const nodes = [];
    const edges = [];

    // Create a map of all tasks by ID for quick lookup
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Group tasks by projectId
    const tasksByProject = {};
    projects.forEach(p => {
      tasksByProject[p.id] = [];
    });
    tasksByProject['unassigned'] = [];

    tasks.forEach(task => {
      const projectId = task.projectId || 'unassigned';
      if (tasksByProject[projectId]) {
        tasksByProject[projectId].push(task);
      } else {
        tasksByProject['unassigned'].push(task);
      }
    });

    // Build list of groups to render
    const groups = [
      ...projects.map(p => ({
        id: p.id,
        type: 'project',
        data: p,
        tasks: tasksByProject[p.id] || []
      }))
    ];

    if (tasksByProject['unassigned'].length > 0) {
      groups.push({
        id: 'unassigned',
        type: 'unassigned',
        data: { name: 'Sin Proyecto', status: 'planning' },
        tasks: tasksByProject['unassigned']
      });
    }

    // Root node
    nodes.push({
      id: 'root',
      type: 'root',
      position: { x: 0, y: 0 },
      data: { label: 'Inicio' },
      selectable: false,
      draggable: false,
    });

    // Calculate critical paths for each project
    const criticalPaths = new Map();
    groups.forEach(group => {
      if (group.tasks.length > 0) {
        criticalPaths.set(group.id, calculateCriticalPath(group.tasks));
      }
    });

    // Process each group (project) as a parent node (group)
    groups.forEach((group) => {
      const groupNodeId = `group-${group.id}`;
      const criticalPath = criticalPaths.get(group.id) || new Set();

      // Calculate dynamic task widths based on content
      const calculateTaskWidth = (task) => {
        const minWidth = 180;
        const maxWidth = 400;
        const charWidth = 7; // Approximate pixels per character
        const padding = 60; // Icon + priority + padding

        const titleWidth = task.title.length * charWidth + padding;
        return Math.min(Math.max(titleWidth, minWidth), maxWidth);
      };

      // Calculate task widths for all tasks in this group
      const taskWidths = new Map();
      group.tasks.forEach(task => {
        taskWidths.set(task.id, calculateTaskWidth(task));
      });

      // Calculate group dimensions based on number of tasks and dependency levels
      const taskHeight = 95; // Height per task including spacing
      const headerHeight = 50; // Space for the group header/label
      const horizontalPadding = 30; // Left + right padding
      const verticalPadding = 30; // Top + bottom padding
      const minHeight = 150; // Minimum height even if no tasks
      const columnSpacing = 40; // Spacing between columns

      // Calculate max dependency depth for this group
      const calculateDepth = (task, visited = new Set()) => {
        if (!task.dependencies || task.dependencies.length === 0) return 0;
        if (visited.has(task.id)) return 0; // Prevent circular dependencies

        visited.add(task.id);
        let maxDepth = 0;

        task.dependencies.forEach(depId => {
          const depTask = taskMap.get(depId);
          if (depTask && tasksByProject[task.projectId || 'unassigned']?.includes(depTask)) {
            const depth = calculateDepth(depTask, new Set(visited));
            maxDepth = Math.max(maxDepth, depth + 1);
          }
        });

        return maxDepth;
      };

      const maxDepth = group.tasks.reduce((max, task) => {
        return Math.max(max, calculateDepth(task));
      }, 0);

      // Calculate width needed for each column (depth level)
      const columnWidths = [];
      for (let depth = 0; depth <= maxDepth; depth++) {
        const tasksAtDepth = group.tasks.filter(task => {
          const taskDepth = (() => {
            if (!task.dependencies || task.dependencies.length === 0) return 0;
            let maxD = 0;
            task.dependencies.forEach(depId => {
              const depTask = taskMap.get(depId);
              if (depTask && tasksByProject[task.projectId || 'unassigned']?.includes(depTask)) {
                const d = calculateDepth(depTask);
                maxD = Math.max(maxD, d + 1);
              }
            });
            return maxD;
          })();
          return taskDepth === depth;
        });

        const maxWidthAtDepth = tasksAtDepth.reduce((max, task) => {
          return Math.max(max, taskWidths.get(task.id) || 180);
        }, 180);

        columnWidths[depth] = maxWidthAtDepth;
      }

      // Calculate total group width based on column widths
      const projectNodeWidth = 200;
      const projectToTasksSpacing = 25;
      const totalColumnWidth = columnWidths.reduce((sum, width) => sum + width + columnSpacing, 0);
      const groupWidth = projectNodeWidth + projectToTasksSpacing + totalColumnWidth + horizontalPadding + 30;
      const projectNodeHeight = 70; // Height of project node
      const groupHeight = Math.max(
        minHeight,
        headerHeight + (group.tasks.length * taskHeight) + verticalPadding
      );

      // Create group node (parent container)
      // Use generated project color for border and background
      const projectColor = getProjectColor(group.id);
      const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      nodes.push({
        id: groupNodeId,
        type: 'group',
        position: { x: 0, y: 0 },
        style: {
          width: groupWidth,
          height: groupHeight,
          backgroundColor: group.type === 'unassigned' ? 'rgba(150, 150, 150, 0.05)' : hexToRgba(projectColor, 0.05),
          border: group.type === 'unassigned' ? '2px dashed #999' : `2px solid ${projectColor}`,
          borderRadius: '12px',
          padding: '15px',
        },
        className: group.type === 'unassigned' ? 'group-unassigned' : '',
        data: {
          label: group.data.name,
          color: projectColor, // Store color for later use
        },
        draggable: false,
      });

      // Create project node (visible inside the group, centered vertically on the left)
      const projectNodeId = `project-${group.id}`;
      // Center the project node vertically within the group
      // We want to center it in the total available height minus padding
      const projectYPosition = (groupHeight - projectNodeHeight) / 2;

      nodes.push({
        id: projectNodeId,
        type: 'project',
        position: {
          x: 15,
          y: projectYPosition
        },
        data: {
          project: group.data,
          taskCount: group.tasks.length,
          isUnassigned: group.type === 'unassigned',
        },
        draggable: false,
        parentId: groupNodeId,
        extent: 'parent',
      });

      // Edge from root to project node (only if project has no dependencies)
      const projectHasDependencies = group.data.dependencies && group.data.dependencies.length > 0;

      if (!projectHasDependencies) {
        edges.push({
          id: `edge-root-${projectNodeId}`,
          source: 'root',
          target: projectNodeId,
          type: 'default',
          style: {
            strokeWidth: 2,
            stroke: group.type === 'unassigned' ? '#888' : '#0099CC',
            strokeDasharray: group.type === 'unassigned' ? '5,5' : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: group.type === 'unassigned' ? '#888' : '#0099CC',
            width: 10,
            height: 10,
          },
          deletable: false,
        });
      }

      // Calculate horizontal position for each task based on dependency depth
      const taskDepths = new Map();

      const getTaskDepth = (task, visited = new Set()) => {
        if (taskDepths.has(task.id)) return taskDepths.get(task.id);
        if (!task.dependencies || task.dependencies.length === 0) {
          taskDepths.set(task.id, 0);
          return 0;
        }
        if (visited.has(task.id)) return 0;

        visited.add(task.id);
        let maxDepth = 0;

        task.dependencies.forEach(depId => {
          const depTask = taskMap.get(depId);
          if (depTask && tasksByProject[task.projectId || 'unassigned']?.includes(depTask)) {
            const depth = getTaskDepth(depTask, new Set(visited));
            maxDepth = Math.max(maxDepth, depth + 1);
          }
        });

        taskDepths.set(task.id, maxDepth);
        return maxDepth;
      };

      // Calculate depths for all tasks
      group.tasks.forEach(task => getTaskDepth(task));

      // Process tasks for this group
      const tasksStartX = 240; // Start tasks after project node (15 + 200 + 25 spacing)

      group.tasks.forEach((task, index) => {
        const taskNodeId = `task-${task.id}`;
        const depth = taskDepths.get(task.id) || 0;
        const taskWidth = taskWidths.get(task.id) || 180;

        // Calculate x position based on cumulative column widths (starting after project node)
        let xPosition = tasksStartX;
        for (let d = 0; d < depth; d++) {
          xPosition += (columnWidths[d] || 180) + columnSpacing;
        }

        // Task node - child of group, positioned based on dependency depth
        const isInCriticalPath = criticalPath.has(task.id);

        nodes.push({
          id: taskNodeId,
          type: 'task',
          position: {
            x: xPosition, // Position horizontally based on dependency depth and column widths
            y: 50 + (index * 95)   // Position vertically by index
          },
          data: {
            task,
            isCriticalPath: isInCriticalPath
          },
          draggable: false,
          parentId: groupNodeId, // This makes it a child of the group
          extent: 'parent', // Constrain to parent bounds
          style: {
            width: taskWidth, // Dynamic width based on content
          }
        });

        // Check if task has dependencies
        const taskDependencies = task.dependencies || [];

        // Check if any dependency is internal (from same project)
        const hasInternalDependency = taskDependencies.some(depId => {
          const depTask = group.tasks.find(t => t.id === depId);
          return depTask !== undefined;
        });

        // Create edges for dependency tasks
        taskDependencies.forEach(depTaskId => {
          if (taskMap.has(depTaskId)) {
            // Check if both tasks are in critical path
            const isSourceCritical = criticalPath.has(depTaskId);
            const isTargetCritical = criticalPath.has(task.id);
            const isCriticalEdge = isSourceCritical && isTargetCritical;

            edges.push({
              id: `edge-dep-${depTaskId}-${task.id}`,
              source: `task-${depTaskId}`,
              target: taskNodeId,
              type: 'default',
              style: {
                strokeWidth: isCriticalEdge ? 3 : 2,
                stroke: isCriticalEdge ? '#FB923C' : '#6B7280',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isCriticalEdge ? '#FB923C' : '#6B7280',
                width: 10,
                height: 10,
              },
              data: {
                isDependency: true,
                sourceTaskId: depTaskId,
                targetTaskId: task.id,
                isCriticalPath: isCriticalEdge,
              },
            });
          }
        });

        // Connect to project node if no internal dependencies
        if (!hasInternalDependency) {
          edges.push({
            id: `edge-${projectNodeId}-${taskNodeId}`,
            source: projectNodeId,
            target: taskNodeId,
            type: 'default',
            style: {
              strokeWidth: 1.5,
              stroke: group.type === 'unassigned' ? '#888' : '#666',
              strokeDasharray: group.type === 'unassigned' ? '5,5' : undefined,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: group.type === 'unassigned' ? '#888' : '#666',
              width: 10,
              height: 10,
            },
            deletable: false,
          });
        }
      });

      // Create edges from final tasks to connector node
      const connectorNodeId = `connector-${group.id}`;
      const taskIds = new Set(group.tasks.map(t => `task-${t.id}`));
      const tasksWithDependents = new Set();

      // Find which tasks have dependents within the same group
      group.tasks.forEach(task => {
        const deps = task.dependencies || [];
        deps.forEach(depId => {
          if (taskIds.has(`task-${depId}`)) {
            tasksWithDependents.add(`task-${depId}`);
          }
        });
      });

      // Connect final tasks (those without dependents) to connector
      group.tasks.forEach(task => {
        const taskNodeId = `task-${task.id}`;
        if (!tasksWithDependents.has(taskNodeId)) {
          edges.push({
            id: `edge-${taskNodeId}-${connectorNodeId}`,
            source: taskNodeId,
            target: connectorNodeId,
            type: 'default',
            style: {
              strokeWidth: 1.5,
              stroke: '#0099CC',
              strokeDasharray: '5,5', // Dotted line
              opacity: 0.3, // Lower visibility
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#0099CC',
              width: 10,
              height: 10,
            },
            deletable: false,
          });
        }
      });
    });

    // Create edges for project dependencies
    projects.forEach(project => {
      if (project.dependencies && project.dependencies.length > 0) {
        project.dependencies.forEach(dependsOnProjectId => {
          const sourceConnectorId = `connector-${dependsOnProjectId}`;
          const targetProjectId = `project-${project.id}`;

          edges.push({
            id: `edge-project-dep-${dependsOnProjectId}-${project.id}`,
            source: sourceConnectorId,
            target: targetProjectId,
            type: 'default',
            style: {
              strokeWidth: 2,
              stroke: '#015E7C',
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#015E7C',
              width: 10,
              height: 10,
            },
            data: {
              isProjectDependency: true,
              sourceProjectId: dependsOnProjectId,
              targetProjectId: project.id,
            },
          });
        });
      }
    });

    return { rawNodes: nodes, rawEdges: edges };
  }, [projects, tasks, getProjectColor]);

  // Apply dagre layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);
    return { initialNodes: layoutedNodes, initialEdges: layoutedEdges };
  }, [rawNodes, rawEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle new connection (create dependency)
  const onConnect = useCallback(async (connection) => {
    const { source, target } = connection;

    // Handle connector→project connections (project dependencies)
    if (source.startsWith('connector-') && target.startsWith('project-')) {
      const sourceProjectId = source.replace('connector-', '');
      const targetProjectId = target.replace('project-', '');

      console.log('Creating project dependency:', sourceProjectId, '→', targetProjectId);

      // Add dependency in Firebase
      const result = await addProjectDependency(targetProjectId, sourceProjectId);

      if (result.success) {
        // Add edge visually (will be updated by subscription anyway)
        const newEdge = {
          ...connection,
          id: `edge-project-dep-${sourceProjectId}-${targetProjectId}`,
          type: 'default',
          style: {
            strokeWidth: 2,
            stroke: '#015E7C',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#015E7C',
            width: 10,
            height: 10,
          },
          data: {
            isProjectDependency: true,
            sourceProjectId,
            targetProjectId,
          },
        };
        setEdges((eds) => addEdge(newEdge, eds));
      } else {
        console.error('Error al crear dependencia de proyecto:', result.error);
      }
      return;
    }

    // Only allow connections between tasks
    if (!source.startsWith('task-') || !target.startsWith('task-')) {
      console.log('Solo se pueden crear dependencias entre tareas o entre proyectos');
      return;
    }

    const sourceTaskId = source.replace('task-', '');
    const targetTaskId = target.replace('task-', '');

    // Prevent self-connection
    if (sourceTaskId === targetTaskId) {
      return;
    }

    // Add dependency in Firebase
    const result = await addTaskDependency(targetTaskId, sourceTaskId);

    if (result.success) {
      // Add edge visually (will be updated by subscription anyway)
      const newEdge = {
        ...connection,
        id: `edge-dep-${sourceTaskId}-${targetTaskId}`,
        type: 'default',
        style: {
          strokeWidth: 2,
          stroke: '#F5A623',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#F5A623',
          width: 10,
          height: 10,
        },
        data: {
          isDependency: true,
          sourceTaskId,
          targetTaskId,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    } else {
      console.error('Error al crear dependencia:', result.error);
    }
  }, [setEdges]);

  // Handle edge deletion (remove dependency)
  const onEdgesDelete = useCallback(async (deletedEdges) => {
    for (const edge of deletedEdges) {
      if (edge.data?.isDependency) {
        const { sourceTaskId, targetTaskId } = edge.data;
        const result = await removeTaskDependency(targetTaskId, sourceTaskId);
        if (!result.success) {
          console.error('Error al eliminar dependencia:', result.error);
        }
      } else if (edge.data?.isProjectDependency) {
        const { sourceProjectId, targetProjectId } = edge.data;
        const result = await removeProjectDependency(targetProjectId, sourceProjectId);
        if (!result.success) {
          console.error('Error al eliminar dependencia de proyecto:', result.error);
        }
      }
    }
  }, []);

  // Validate connection before allowing it
  const isValidConnection = useCallback((connection) => {
    const { source, target } = connection;

    // Allow connector→project connections (project dependencies)
    if (source.startsWith('connector-') && target.startsWith('project-')) {
      const sourceProjectId = source.replace('connector-', '');
      const targetProjectId = target.replace('project-', '');
      // Prevent self-connection
      return sourceProjectId !== targetProjectId;
    }

    // Only allow task-to-task connections
    if (!source.startsWith('task-') || !target.startsWith('task-')) {
      return false;
    }

    // Prevent self-connection
    if (source === target) {
      return false;
    }

    return true;
  }, []);

  // Handle node click - open task detail sidebar
  const onNodeClick = useCallback((event, node) => {
    if (node.type === 'task' && onTaskClick) {
      onTaskClick(node.data.task);
    }
  }, [onTaskClick]);

  if (projects.length === 0 && tasks.length === 0) {
    return (
      <div className="dependencies-empty">
        <p className="text-secondary">No hay proyectos ni tareas para mostrar dependencias</p>
      </div>
    );
  }

  return (
    <div className="dependencies-flow-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={isAdmin ? onConnect : undefined}
        onEdgesDelete={isAdmin ? onEdgesDelete : undefined}
        onNodeClick={onNodeClick}
        isValidConnection={isAdmin ? isValidConnection : undefined}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.Bezier}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        connectOnClick={false}
        connectionMode={isAdmin ? ConnectionMode.Loose : ConnectionMode.Strict}
        defaultEdgeOptions={{
          type: 'default', // bezier
        }}
        deleteKeyCode={isAdmin ? ['Backspace', 'Delete'] : null}
      >
        <Background color="#ddd" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'root') return '#0099CC';
            if (node.type === 'project') return '#015E7C';
            return '#f0f0f0';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};

export default DependenciesFlow;
