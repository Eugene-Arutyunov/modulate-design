/**
 * Extract models from the detection models table
 * @returns {Array<string>} Array of model names
 */
function extractModels() {
  const table = document.querySelector('#detection-models-table');
  if (!table) return [];

  const models = [];
  const rows = table.querySelectorAll('tbody tr');
  
  rows.forEach(row => {
    const modelCell = row.querySelector('td:first-child');
    if (modelCell) {
      const modelName = modelCell.textContent.trim();
      // Remove <strong> tags if present and get text
      const strongTag = modelCell.querySelector('strong');
      const name = strongTag ? strongTag.textContent.trim() : modelName;
      if (name) {
        models.push(name);
      }
    }
  });

  return models;
}

/**
 * Parse model names from the third column of behaviors table
 * Handles comma-separated values and "None" badges
 * @param {HTMLElement} cell - The table cell element
 * @returns {Array<string>} Array of model names
 */
function parseModelNames(cell) {
  if (!cell) return [];

  // Check for badge with "None"
  const badge = cell.querySelector('.badge');
  if (badge && badge.textContent.trim() === 'None') {
    return ['None'];
  }

  // Get text content and split by comma
  const text = cell.textContent.trim();
  if (!text || text === '' || text === 'None') {
    return ['None'];
  }

  // Split by comma and clean up
  return text.split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
}

/**
 * Extract behaviours and their model associations from the behaviors table
 * @returns {Array<{behaviour: string, models: Array<string>}>} Array of behaviour objects
 */
function extractBehaviours() {
  const table = document.querySelector('#behaviors-table');
  if (!table) return [];

  const behaviours = [];
  const rows = table.querySelectorAll('tbody tr');
  
  rows.forEach(row => {
    const behaviourCell = row.querySelector('td:first-child');
    const modelsCell = row.querySelector('td:nth-child(3)');
    
    if (behaviourCell && modelsCell) {
      const behaviourName = behaviourCell.textContent.trim();
      const modelNames = parseModelNames(modelsCell);
      
      if (behaviourName && modelNames.length > 0) {
        behaviours.push({
          behaviour: behaviourName,
          models: modelNames
        });
      }
    }
  });

  return behaviours;
}

/**
 * Build graph data structure
 * @returns {{models: Array<string>, behaviours: Array<{behaviour: string, models: Array<string>}>, connections: Array<{model: string, behaviour: string}>}}
 */
function buildGraphData() {
  const models = extractModels();
  const behaviours = extractBehaviours();

  // Check if we need to add "None" to models
  const hasNone = behaviours.some(b => b.models.includes('None'));
  if (hasNone && !models.includes('None')) {
    models.push('None');
  }

  // Build connections array
  const connections = [];
  behaviours.forEach(behaviour => {
    behaviour.models.forEach(model => {
      connections.push({
        model: model,
        behaviour: behaviour.behaviour
      });
    });
  });

  // Count connections for each model
  const modelConnectionCounts = new Map();
  connections.forEach(conn => {
    const count = modelConnectionCounts.get(conn.model) || 0;
    modelConnectionCounts.set(conn.model, count + 1);
  });

  // Count connections for each behaviour
  const behaviourConnectionCounts = new Map();
  connections.forEach(conn => {
    const count = behaviourConnectionCounts.get(conn.behaviour) || 0;
    behaviourConnectionCounts.set(conn.behaviour, count + 1);
  });

  // Sort models by connection count (descending), but None should be last
  models.sort((a, b) => {
    if (a === 'None') return 1;
    if (b === 'None') return -1;
    const countA = modelConnectionCounts.get(a) || 0;
    const countB = modelConnectionCounts.get(b) || 0;
    return countB - countA; // Descending order
  });

  // Sort behaviours by connection count (descending)
  behaviours.sort((a, b) => {
    const countA = behaviourConnectionCounts.get(a.behaviour) || 0;
    const countB = behaviourConnectionCounts.get(b.behaviour) || 0;
    return countB - countA; // Descending order
  });

  return {
    models: models,
    behaviours: behaviours,
    connections: connections
  };
}

/**
 * Calculate text width (approximate)
 * @param {string} text 
 * @param {number} fontSize 
 * @returns {number}
 */
function getTextWidth(text, fontSize = 12) {
  // Approximate: average character width is about 0.6 * fontSize
  return text.length * fontSize * 0.6;
}

/**
 * Create SVG visualization
 * @param {HTMLElement} container - Container element for the SVG
 * @param {Object} graphData - Graph data structure
 */
function createSVGVisualization(container, graphData) {
  const { models, behaviours, connections } = graphData;

  if (models.length === 0 || behaviours.length === 0) {
    return;
  }

  // Configuration
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };
  const columnGap = 200; // Distance between columns
  const itemSpacing = 16; // Vertical spacing between items (reduced for compactness)
  const fontSize = 13;
  const lineStrokeWidth = 1.2;
  const curveOffset = 60; // Offset for Bezier curve control point

  // Calculate column widths
  const maxModelWidth = Math.max(...models.map(m => getTextWidth(m, fontSize))) + 20;
  const maxBehaviourWidth = Math.max(...behaviours.map(b => getTextWidth(b.behaviour, fontSize))) + 20;
  
  // Models column: right-aligned text, lines start from right edge
  const modelsRightEdge = padding.left + maxModelWidth;
  const leftColumnX = modelsRightEdge; // Right edge for right-aligned text
  const rightColumnX = padding.left + maxModelWidth + columnGap;

  // Calculate total height needed
  const maxItems = Math.max(models.length, behaviours.length);
  const totalHeight = padding.top + (maxItems * itemSpacing) + padding.bottom;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${rightColumnX + maxBehaviourWidth + padding.right} ${totalHeight}`);
  svg.setAttribute('class', 'models-behaviours-svg');
  svg.style.width = '100%';
  svg.style.height = 'auto';

  // Create defs for styles
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.appendChild(defs);

  // Create groups for layers (lines behind, text on top)
  const linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  linesGroup.setAttribute('class', 'connection-lines');
  svg.appendChild(linesGroup);

  const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  textGroup.setAttribute('class', 'labels');
  svg.appendChild(textGroup);

  // Create model positions map (text position and line start position)
  const modelPositions = new Map();
  models.forEach((model, index) => {
    const y = padding.top + (index * itemSpacing) + fontSize / 2;
    modelPositions.set(model, { 
      textX: leftColumnX, // Right edge for right-aligned text
      lineX: modelsRightEdge, // Line starts from right edge
      y: y 
    });
  });

  // Create behaviour positions map (text position and line end position)
  const behaviourPositions = new Map();
  behaviours.forEach((behaviour, index) => {
    const y = padding.top + (index * itemSpacing) + fontSize / 2;
    behaviourPositions.set(behaviour.behaviour, { 
      textX: rightColumnX, 
      lineX: rightColumnX, // Line ends at left edge of behaviours column
      y: y 
    });
  });

  // Draw connection lines with horizontal entry/exit
  connections.forEach(connection => {
    const modelPos = modelPositions.get(connection.model);
    const behaviourPos = behaviourPositions.get(connection.behaviour);

    if (!modelPos || !behaviourPos) return;

    // Horizontal offset for smooth curves
    const horizontalOffset = 40;
    
    // Start point: right edge of models column
    const startX = modelPos.lineX;
    const startY = modelPos.y;
    
    // End point: left edge of behaviours column
    const endX = behaviourPos.lineX;
    const endY = behaviourPos.y;
    
    // Control points for cubic Bezier curve
    // First control point: horizontal from start
    const cp1X = startX + horizontalOffset;
    const cp1Y = startY;
    
    // Second control point: horizontal to end
    const cp2X = endX - horizontalOffset;
    const cp2Y = endY;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // Cubic Bezier: M start, C cp1 cp2 end
    const d = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
    path.setAttribute('d', d);
    
    // Add class for None connections to make them semi-transparent
    const isNone = connection.model === 'None';
    path.setAttribute('class', `connection-line ${isNone ? 'connection-line--none' : ''}`);
    path.setAttribute('stroke', 'rgba(var(--ids__text-RGB), 0.3)');
    path.setAttribute('stroke-width', lineStrokeWidth.toString());
    path.setAttribute('fill', 'none');
    linesGroup.appendChild(path);
  });

  // Draw model labels (right-aligned)
  models.forEach((model, index) => {
    const modelPos = modelPositions.get(model);
    const y = modelPos.y;
    const isNone = model === 'None';
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', modelPos.textX.toString());
    text.setAttribute('y', y.toString());
    text.setAttribute('class', `model-label ${isNone ? 'model-label--none' : ''}`);
    text.setAttribute('font-size', fontSize.toString());
    text.setAttribute('fill', 'rgba(var(--ids__text-RGB), 1)');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'end');
    text.textContent = model;
    textGroup.appendChild(text);
  });

  // Draw behaviour labels
  behaviours.forEach((behaviour, index) => {
    const behaviourPos = behaviourPositions.get(behaviour.behaviour);
    const y = behaviourPos.y;
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', behaviourPos.textX.toString());
    text.setAttribute('y', y.toString());
    text.setAttribute('class', 'behaviour-label');
    text.setAttribute('font-size', fontSize.toString());
    text.setAttribute('fill', 'rgba(var(--ids__text-RGB), 1)');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'start');
    text.textContent = behaviour.behaviour;
    textGroup.appendChild(text);
  });

  container.appendChild(svg);
}

/**
 * Initialize the visualization
 */
function initModelsBehavioursGraph() {
  const container = document.querySelector('#models-behaviours-graph');
  if (!container) return;

  const graphData = buildGraphData();
  createSVGVisualization(container, graphData);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModelsBehavioursGraph);
} else {
  initModelsBehavioursGraph();
}
