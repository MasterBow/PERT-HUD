/**
 * CHRONOS // QUANTUM CANVAS & HOLOGRAPHIC GRAPH RENDERER
 * Motor de renderizado en Canvas 2D acelerado con resplandores de neón,
 * cápsulas holográficas reactivas, rayos de plasma con fotones cuánticos en ruta crítica,
 * zoom/pan y soporte para arrastrar nodos libremente.
 */

class QuantumCanvasRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // Transformaciones de cámara
    this.scale = 1.0;
    this.panX = 60;
    this.panY = 100;
    this.isPanning = false;
    this.startPan = { x: 0, y: 0 };

    // Estado del Grafo
    this.actividades = [];
    this.resultado = null;
    this.selectedNode = null;
    this.hoveredNode = null;
    this.draggedNode = null;
    this.dragOffset = { x: 0, y: 0 };

    // Sistema de Partículas (Fotones Cuánticos sobre aristas)
    this.particles = [];
    this.particlesEnabled = true;
    this.lastTime = performance.now();

    // Callbacks hacia la UI
    this.onNodeClick = null;
    this.onNodeHover = null;
    this.onNodeTimeChange = null;

    this.initCanvasSize();
    this.bindEvents();
    this.startRenderLoop();
  }

  initCanvasSize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => this.initCanvasSize());

    // Mouse Down (Arrastre de nodo o paneo de canvas)
    this.canvas.addEventListener('mousedown', (e) => {
      const mouse = this.getCanvasCoords(e);
      const clicked = this.getNodeAt(mouse.x, mouse.y);

      if (clicked) {
        this.draggedNode = clicked;
        this.dragOffset.x = mouse.x - clicked.x;
        this.dragOffset.y = mouse.y - clicked.y;
        this.selectedNode = clicked;
        if (window.quantumAudio) window.quantumAudio.playClick();
        if (this.onNodeClick) this.onNodeClick(clicked);
      } else {
        this.isPanning = true;
        this.startPan.x = e.clientX - this.panX;
        this.startPan.y = e.clientY - this.panY;
      }
    });

    // Mouse Move
    this.canvas.addEventListener('mousemove', (e) => {
      const mouse = this.getCanvasCoords(e);

      if (this.draggedNode) {
        this.draggedNode.x = mouse.x - this.dragOffset.x;
        this.draggedNode.y = mouse.y - this.dragOffset.y;
      } else if (this.isPanning) {
        this.panX = e.clientX - this.startPan.x;
        this.panY = e.clientY - this.startPan.y;
      } else {
        const hovered = this.getNodeAt(mouse.x, mouse.y);
        if (hovered !== this.hoveredNode) {
          this.hoveredNode = hovered;
          this.canvas.style.cursor = hovered ? 'pointer' : 'grab';
          if (hovered && window.quantumAudio) {
            window.quantumAudio.playHover();
          }
          if (this.onNodeHover) this.onNodeHover(hovered);
        }
      }
    });

    // Mouse Up
    window.addEventListener('mouseup', () => {
      this.isPanning = false;
      this.draggedNode = null;
    });

    // Rueda de ratón (Zoom)
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const mouse = { x: e.offsetX, y: e.offsetY };

      // Zoom centrado en el puntero del cursor
      const newScale = Math.min(Math.max(0.35, this.scale * zoomFactor), 2.5);
      this.panX = mouse.x - (mouse.x - this.panX) * (newScale / this.scale);
      this.panY = mouse.y - (mouse.y - this.panY) * (newScale / this.scale);
      this.scale = newScale;
    }, { passive: false });
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return {
      x: (clientX - this.panX) / this.scale,
      y: (clientY - this.panY) / this.scale
    };
  }

  getNodeAt(x, y) {
    const nodeW = 140;
    const nodeH = 75;
    for (let i = this.actividades.length - 1; i >= 0; i--) {
      const act = this.actividades[i];
      if (
        x >= act.x - nodeW / 2 &&
        x <= act.x + nodeW / 2 &&
        y >= act.y - nodeH / 2 &&
        y <= act.y + nodeH / 2
      ) {
        return act;
      }
    }
    return null;
  }

  /**
   * Disposición automática por capas topológicas (Layered DAG layout)
   */
  autoLayout() {
    if (!this.actividades || this.actividades.length === 0) return;

    // Agrupar por capa
    const layers = new Map();
    this.actividades.forEach(act => {
      const l = act.layer || 0;
      if (!layers.has(l)) layers.set(l, []);
      layers.get(l).push(act);
    });

    const colWidth = 230;
    const rowHeight = 110;
    const startX = 120;
    const startY = 100;

    layers.forEach((actsInLayer, layerIndex) => {
      const totalH = actsInLayer.length * rowHeight;
      const layerStartY = startY + (350 - totalH) / 2; // centrar verticalmente

      actsInLayer.forEach((act, actIndex) => {
        act.x = startX + layerIndex * colWidth;
        act.y = layerStartY + actIndex * rowHeight;
      });
    });

    this.recenter();
  }

  recenter() {
    this.scale = 1.0;
    this.panX = 60;
    this.panY = 60;
  }

  setGraphData(resultado) {
    this.resultado = resultado;
    this.actividades = resultado.grafo || [];

    // Asignar coordenadas iniciales si no existen
    let hasCoords = this.actividades.some(a => a.x !== null && a.y !== null);
    if (!hasCoords) {
      this.autoLayout();
    }

    // Inicializar o sincronizar partículas de plasma
    this.syncParticles();
  }

  syncParticles() {
    this.particles = [];
    if (!this.resultado || !this.resultado.grafo) return;

    const mapa = new Map();
    this.actividades.forEach(a => mapa.set(a.id, a));

    this.actividades.forEach(act => {
      act.sucesoras.forEach(sucId => {
        const suc = mapa.get(sucId);
        if (suc) {
          const isCriticalEdge = act.es_critica && suc.es_critica;
          const count = isCriticalEdge ? 4 : 2;
          for (let i = 0; i < count; i++) {
            this.particles.push({
              source: act,
              target: suc,
              progress: Math.random(),
              speed: isCriticalEdge ? 0.007 + Math.random() * 0.005 : 0.003,
              isCritical: isCriticalEdge,
              size: isCriticalEdge ? 3.5 : 2
            });
          }
        }
      });
    });
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Dibujar Rejilla Holográfica de Fondo
    this.drawHoloGrid();

    this.ctx.save();
    this.ctx.translate(this.panX, this.panY);
    this.ctx.scale(this.scale, this.scale);

    const mapa = new Map();
    this.actividades.forEach(a => mapa.set(a.id, a));

    // 1. Dibujar Conexiones y Rayos Láser de Plasma
    this.actividades.forEach(act => {
      act.sucesoras.forEach(sucId => {
        const suc = mapa.get(sucId);
        if (suc) {
          this.drawEdge(act, suc);
        }
      });
    });

    // 2. Dibujar Fotones Cuánticos en Movimiento
    if (this.particlesEnabled) {
      this.drawParticles();
    }

    // 3. Dibujar Nodos (Cápsulas Holográficas)
    this.actividades.forEach(act => {
      this.drawHoloNode(act);
    });

    this.ctx.restore();
  }

  drawHoloGrid() {
    const gridSize = 40 * this.scale;
    const offsetX = this.panX % gridSize;
    const offsetY = this.panY % gridSize;

    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    for (let x = offsetX; x < this.width; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
    }
    for (let y = offsetY; y < this.height; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
    }
    this.ctx.stroke();
  }

  drawEdge(source, target) {
    const isCritical = source.es_critica && target.es_critica;
    
    // Coordenadas de salida y entrada
    const startX = source.x + 70;
    const startY = source.y;
    const endX = target.x - 70;
    const endY = target.y;

    const dx = endX - startX;
    const cp1x = startX + dx * 0.5;
    const cp1y = startY;
    const cp2x = startX + dx * 0.5;
    const cp2y = endY;

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);

    if (isCritical) {
      // Rayo de Plasma Láser Magenta
      this.ctx.strokeStyle = 'rgba(255, 0, 85, 0.9)';
      this.ctx.lineWidth = 3.5;
      this.ctx.shadowColor = '#ff0055';
      this.ctx.shadowBlur = 12;
      this.ctx.stroke();

      // Centro blanco incandescente
      this.ctx.strokeStyle = 'rgba(255, 220, 240, 0.9)';
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    } else {
      // Fibra óptica cian suave
      this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      this.ctx.lineWidth = 1.8;
      this.ctx.shadowBlur = 0;
      this.ctx.stroke();
    }

    // Punta de flecha direccional
    const angle = Math.atan2(endY - cp2y, endX - cp2x);
    this.ctx.save();
    this.ctx.translate(endX, endY);
    this.ctx.rotate(angle);
    this.ctx.fillStyle = isCritical ? '#ff0055' : '#00f0ff';
    this.ctx.beginPath();
    this.ctx.moveTo(-10, -5);
    this.ctx.lineTo(0, 0);
    this.ctx.lineTo(-10, 5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();
  }

  drawParticles() {
    this.particles.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;

      const startX = p.source.x + 70;
      const startY = p.source.y;
      const endX = p.target.x - 70;
      const endY = p.target.y;

      const dx = endX - startX;
      const cp1x = startX + dx * 0.5;
      const cp1y = startY;
      const cp2x = startX + dx * 0.5;
      const cp2y = endY;

      // Evaluar Bezier cúbica en 'progress' (t)
      const t = p.progress;
      const cx = 3 * (cp1x - startX);
      const bx = 3 * (cp2x - cp1x) - cx;
      const ax = endX - startX - cx - bx;

      const cy = 3 * (cp1y - startY);
      const by = 3 * (cp2y - cp1y) - cy;
      const ay = endY - startY - cy - by;

      const px = ax * t * t * t + bx * t * t + cx * t + startX;
      const py = ay * t * t * t + by * t * t + cy * t + startY;

      this.ctx.beginPath();
      this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.isCritical ? '#ff3377' : '#00f0ff';
      this.ctx.shadowColor = p.isCritical ? '#ff0055' : '#00f0ff';
      this.ctx.shadowBlur = p.isCritical ? 10 : 6;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }

  drawHoloNode(act) {
    const w = 140;
    const h = 75;
    const x = act.x - w / 2;
    const y = act.y - h / 2;
    const r = 6;

    const isHovered = this.hoveredNode === act;
    const isSelected = this.selectedNode === act;

    // Color del borde según holgura
    let borderColor = '#00f0ff';
    let glowColor = 'rgba(0, 240, 255, 0.4)';
    let badgeColor = '#00f0ff';

    if (act.es_critica) {
      borderColor = '#ff0055';
      glowColor = 'rgba(255, 0, 85, 0.7)';
      badgeColor = '#ff0055';
    } else if (act.holgura > 0 && act.holgura <= 2.5) {
      // Holgura en zona de riesgo ámbar
      borderColor = '#ffb700';
      glowColor = 'rgba(255, 183, 0, 0.6)';
      badgeColor = '#ffb700';
    }

    // 1. Cuerpo de Cristal / Glassmorphism
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, r);
    this.ctx.fillStyle = act.es_critica ? 'rgba(25, 8, 18, 0.88)' : 'rgba(8, 16, 32, 0.85)';
    this.ctx.fill();

    // 2. Borde con Resplandor Neón
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = isHovered || isSelected ? 2.5 : 1.5;
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = isHovered || isSelected ? 16 : 8;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // 3. Franja superior (ID y Te)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.ctx.beginPath();
    this.ctx.roundRect(x + 1, y + 1, w - 2, 22, [r, r, 0, 0]);
    this.ctx.fill();

    // Texto ID
    this.ctx.font = 'bold 11px "Orbitron", sans-serif';
    this.ctx.fillStyle = badgeColor;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(act.id, x + 8, y + 15);

    // Texto Te (Duración)
    this.ctx.font = '10px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Te: ${act.Te.toFixed(1)}d`, x + w - 8, y + 15);

    // 4. Nombre de Actividad (Recortado)
    this.ctx.font = '600 11px "Rajdhani", sans-serif';
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.textAlign = 'left';
    const cleanName = act.nombre.length > 17 ? act.nombre.slice(0, 16) + '…' : act.nombre;
    this.ctx.fillText(cleanName, x + 8, y + 36);

    // 5. Matriz de Tiempos Cuánticos: ES | EF / LS | LF
    this.ctx.font = '9px "JetBrains Mono", monospace';
    this.ctx.fillStyle = '#64748b';
    this.ctx.fillText(`ES:${act.ES.toFixed(1)}`, x + 8, y + 51);
    this.ctx.fillText(`EF:${act.EF.toFixed(1)}`, x + 72, y + 51);

    this.ctx.fillText(`LS:${act.LS.toFixed(1)}`, x + 8, y + 64);
    this.ctx.fillText(`LF:${act.LF.toFixed(1)}`, x + 72, y + 64);

    // 6. Barra o Indicador de Holgura
    if (!act.es_critica) {
      this.ctx.fillStyle = act.holgura <= 2.5 ? '#ffb700' : '#00f0ff';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`H:${act.holgura.toFixed(1)}`, x + w - 8, y + 64);
    } else {
      this.ctx.fillStyle = '#ff0055';
      this.ctx.textAlign = 'right';
      this.ctx.fillText('CRÍTICO', x + w - 8, y + 64);
    }

    this.ctx.restore();
  }
}

window.QuantumCanvasRenderer = QuantumCanvasRenderer;
