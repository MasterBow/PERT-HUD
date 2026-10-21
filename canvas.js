/**
 * CHRONOS // QUANTUM CANVAS & HOLOGRAPHIC GRAPH RENDERER 3.0
 * 
 * Capa A - El Vacío: Partículas cósmicas profundas flotantes con parallax orgánico.
 * Capa B - Rejilla Fantasma 3D: Perspectiva infinita con desplazamiento z continuo y fade en bordes.
 * Capa C - Efecto Holograma: Aberración cromática RGB, Fresnel Glow en nodos, Scanline interactivo & flicker.
 * Capa D - Nodos como Proyectores de Luz: Pilares volumétricos de luz proporcionales a Te.
 * Capa E - Rotación Holográfica 3D (JARVIS HUD): Manipulación orbital con mouse (pitch & yaw).
 * Capa F - Entidad de Luz JARVIS IA: Patrulla continua sobre el camino crítico con cola de plasma
 *          y Modo Alerta con velocidad acelerada hacia nodos perturbados por el Chaos Monkey.
 */

class QuantumCanvasRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Canvas secundario para el pase de Aberración Cromática y Post-procesado Holográfico
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    
    // Transformaciones de cámara 3D (Manipulación tipo JARVIS)
    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.rotX = 0.35; // Ángulo de inclinación (Pitch)
    this.rotY = 0.0;  // Ángulo de rotación (Yaw)
    this.targetRotX = 0.35;
    this.targetRotY = 0.0;

    // Estado del mouse e interacción
    this.isOrbiting = false; // Botón derecho o arrastre libre
    this.isPanning = false;  // Cuando se presiona shift o drag de fondo
    this.startMouse = { x: 0, y: 0 };

    // Estado del Grafo
    this.actividades = [];
    this.resultado = null;
    this.selectedNode = null;
    this.hoveredNode = null;
    this.draggedNode = null;
    this.dragOffset = { x: 0, y: 0 };

    // Capa A: Polvo Cósmico / Partículas Profundas en el Vacío
    this.ambientParticles = [];
    this.initAmbientParticles();

    // Capa B: Rejilla en Perspectiva Infinita
    this.gridZOffset = 0;

    // Capa C: Efecto Holograma (Aberración Cromática y Scanline Sweep)
    this.chromaticEnabled = true;
    this.scanlineY = 0;
    this.flickerAlpha = 1.0;
    this.lastFlickerTime = 0;

    // Fotones Cuánticos en aristas
    this.particles = [];
    this.particlesEnabled = true;

    // Capa F: Entidad de Luz JARVIS IA
    this.jarvisLight = {
      x: 0,
      y: 0,
      z: 0,
      currentNodeIndex: 0,
      progress: 0,
      speed: 0.015,
      trail: [], // Cola de plasma [ {x, y, z, alpha, size} ]
      mode: 'PATROL', // 'PATROL' | 'ALERT'
      alertTargetNode: null,
      alertColor: '#ff0055',
      patrolColor: '#00f0ff',
      pulseIntensity: 0
    };

    // Callbacks hacia la UI
    this.onNodeClick = null;
    this.onNodeHover = null;

    this.initCanvasSize();
    this.bindEvents();
    this.startRenderLoop();
  }

  initAmbientParticles() {
    this.ambientParticles = [];
    const count = 75;
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: (Math.random() - 0.5) * 1600,
        y: (Math.random() - 0.5) * 1200,
        z: Math.random() * 800 - 400,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2 - 0.1,
        size: Math.random() * 2 + 0.6,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  initCanvasSize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    // Limitar DPR a 2.0 máximo para evitar sobrecargar GPUs móviles en pantallas 3x/4x
    const rawDpr = window.devicePixelRatio || 1;
    const isMobile = window.innerWidth <= 960;
    const dpr = isMobile ? Math.min(1.75, rawDpr) : Math.min(2.0, rawDpr);

    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    this.offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.offscreenCtx.scale(dpr, dpr);

    if (this.panX === 0 && this.panY === 0) {
      this.panX = this.width / 2;
      this.panY = this.height / 2 + 60;
    }
  }

  bindEvents() {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.initCanvasSize(), 100);
    }, { passive: true });

    // Ahorro de batería y recursos: pausar renderizado cuando la pestaña está oculta
    this.isTabVisible = true;
    document.addEventListener('visibilitychange', () => {
      this.isTabVisible = !document.hidden;
    });

    // Mouse Down
    this.canvas.addEventListener('mousedown', (e) => {
      const mouse = this.getScreenCoords(e);
      const clicked = this.getNodeAtScreen(mouse.x, mouse.y);

      if (clicked && e.button === 0) {
        // Clic en nodo -> seleccionar y arrastrar
        this.draggedNode = clicked;
        const proj = this.project3D(clicked.x, clicked.y, 0);
        this.dragOffset.x = mouse.x - proj.x;
        this.dragOffset.y = mouse.y - proj.y;
        this.selectedNode = clicked;
        if (window.quantumAudio) window.quantumAudio.playClick();
        if (this.onNodeClick) this.onNodeClick(clicked);
      } else {
        // Arrastrar fondo -> Rotación 3D tipo JARVIS
        this.isOrbiting = true;
        this.startMouse.x = e.clientX;
        this.startMouse.y = e.clientY;
      }
    });

    // Mouse Move
    this.canvas.addEventListener('mousemove', (e) => {
      const mouse = this.getScreenCoords(e);

      if (this.draggedNode) {
        // Proyección inversa aproximada en el plano Z=0
        const dx = (e.clientX - this.startMouse.x) / this.scale;
        const dy = (e.clientY - this.startMouse.y) / this.scale;
        this.draggedNode.x += dx * 0.7;
        this.draggedNode.y += dy * 0.7;
        this.startMouse.x = e.clientX;
        this.startMouse.y = e.clientY;
      } else if (this.isOrbiting) {
        const deltaX = e.clientX - this.startMouse.x;
        const deltaY = e.clientY - this.startMouse.y;
        
        // Rotación orbital del holograma
        this.targetRotY += deltaX * 0.005;
        this.targetRotX += deltaY * 0.005;
        // Limitar pitch para que no se voltee completamente
        this.targetRotX = Math.max(-0.2, Math.min(0.95, this.targetRotX));

        this.startMouse.x = e.clientX;
        this.startMouse.y = e.clientY;
      } else {
        const hovered = this.getNodeAtScreen(mouse.x, mouse.y);
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
      this.isOrbiting = false;
      this.draggedNode = null;
    });

    // Zoom con rueda de ratón
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.scale = Math.min(Math.max(0.4, this.scale * zoomFactor), 2.2);
    }, { passive: false });

    // Touch Events para móviles y tablets Android / iOS
    this.initialPinchDistance = null;
    this.initialPinchScale = 1.0;
    this.lastTouchPos = { x: 0, y: 0 };
    this.isTouchDragging = false;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const screenCoords = this.getScreenCoords(touch);
        const clicked = this.getNodeAtScreen(screenCoords.x, screenCoords.y);

        this.lastTouchPos.x = touch.clientX;
        this.lastTouchPos.y = touch.clientY;

        if (clicked) {
          this.draggedNode = clicked;
          const proj = this.project3D(clicked.x, clicked.y, 0);
          this.dragOffset.x = screenCoords.x - proj.x;
          this.dragOffset.y = screenCoords.y - proj.y;
          this.selectedNode = clicked;
          if (window.quantumAudio) window.quantumAudio.playClick();
          if (this.onNodeClick) this.onNodeClick(clicked);
        } else {
          this.isOrbiting = true;
          this.startMouse.x = touch.clientX;
          this.startMouse.y = touch.clientY;
        }
      } else if (e.touches.length === 2) {
        // Inicializar gesto Pinch-to-Zoom con Delta
        this.isOrbiting = false;
        this.draggedNode = null;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.initialPinchDistance = Math.hypot(dx, dy);
        this.initialPinchScale = this.scale;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevenir scroll nativo del viewport al interactuar con el holograma

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.lastTouchPos.x;
        const deltaY = touch.clientY - this.lastTouchPos.y;

        if (this.draggedNode) {
          this.draggedNode.x += deltaX * (0.8 / Math.max(0.5, this.scale));
          this.draggedNode.y += deltaY * (0.8 / Math.max(0.5, this.scale));
        } else if (this.isOrbiting) {
          // Rotación orbital con sensibilidad delta adaptativa
          this.targetRotY += deltaX * 0.007;
          this.targetRotX += deltaY * 0.007;
          this.targetRotX = Math.max(-0.25, Math.min(1.0, this.targetRotX));
        }

        this.lastTouchPos.x = touch.clientX;
        this.lastTouchPos.y = touch.clientY;
      } else if (e.touches.length === 2 && this.initialPinchDistance) {
        // Pinch Zoom reactivo
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.hypot(dx, dy);
        const pinchDeltaFactor = currentDistance / this.initialPinchDistance;

        this.scale = Math.min(Math.max(0.35, this.initialPinchScale * pinchDeltaFactor), 2.5);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        this.isOrbiting = false;
        this.draggedNode = null;
        this.initialPinchDistance = null;
      } else if (e.touches.length === 1) {
        this.lastTouchPos.x = e.touches[0].clientX;
        this.lastTouchPos.y = e.touches[0].clientY;
        this.initialPinchDistance = null;
      }
    });

    // Deshabilitar menú contextual en el canvas para rotación libre
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  getScreenCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const cy = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: cx - rect.left,
      y: cy - rect.top
    };
  }

  /**
   * Proyección 3D isométrica con rotación Euler (Pitch / Yaw) y perspectiva simulada
   */
  project3D(x, y, z = 0) {
    // 1. Centrar respecto al origen del grafo
    const cx = x - 450;
    const cy = y - 250;
    const cz = z;

    // 2. Rotación Yaw (alrededor del eje Y vertical)
    const cosY = Math.cos(this.rotY);
    const sinY = Math.sin(this.rotY);
    const x1 = cx * cosY - cz * sinY;
    const z1 = cx * sinY + cz * cosY;

    // 3. Rotación Pitch (alrededor del eje X horizontal)
    const cosX = Math.cos(this.rotX);
    const sinX = Math.sin(this.rotX);
    const y2 = cy * cosX - z1 * sinX;
    const z2 = cy * sinX + z1 * cosX;

    // 4. Perspectiva cónica hacia la cámara (Fov)
    const cameraDistance = 900;
    const perspective = cameraDistance / (cameraDistance + z2);

    return {
      x: this.panX + x1 * perspective * this.scale,
      y: this.panY + y2 * perspective * this.scale,
      z: z2,
      scale: perspective * this.scale
    };
  }

  getNodeAtScreen(sx, sy) {
    for (let i = this.actividades.length - 1; i >= 0; i--) {
      const act = this.actividades[i];
      const p = this.project3D(act.x, act.y, 0);
      const w = 130 * p.scale;
      const h = 70 * p.scale;

      if (
        sx >= p.x - w / 2 &&
        sx <= p.x + w / 2 &&
        sy >= p.y - h / 2 &&
        sy <= p.y + h / 2
      ) {
        return act;
      }
    }
    return null;
  }

  autoLayout() {
    if (!this.actividades || this.actividades.length === 0) return;

    const layers = new Map();
    this.actividades.forEach(act => {
      const l = act.layer || 0;
      if (!layers.has(l)) layers.set(l, []);
      layers.get(l).push(act);
    });

    const colWidth = 240;
    const rowHeight = 130;
    const startX = 120;
    const startY = 120;

    layers.forEach((actsInLayer, layerIndex) => {
      const totalH = actsInLayer.length * rowHeight;
      const layerStartY = startY + (380 - totalH) / 2;

      actsInLayer.forEach((act, actIndex) => {
        act.x = startX + layerIndex * colWidth;
        act.y = layerStartY + actIndex * rowHeight;
      });
    });

    this.recenter();
  }

  recenter() {
    this.scale = 1.0;
    this.targetRotX = 0.35;
    this.targetRotY = 0.0;
    this.panX = this.width / 2;
    this.panY = this.height / 2 + 40;
  }

  setGraphData(resultado) {
    this.resultado = resultado;
    this.actividades = resultado.grafo || [];

    const hasCoords = this.actividades.some(a => a.x !== null && a.y !== null);
    if (!hasCoords) {
      this.autoLayout();
    }

    this.syncParticles();
    this.syncJarvisPatrol();
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
              speed: isCriticalEdge ? 0.008 + Math.random() * 0.004 : 0.003,
              isCritical: isCriticalEdge,
              size: isCriticalEdge ? 3.5 : 2
            });
          }
        }
      });
    });
  }

  /**
   * Inicializa o reorienta la patrulla de la entidad JARVIS
   */
  syncJarvisPatrol() {
    if (!this.resultado || !this.resultado.ruta_critica || this.resultado.ruta_critica.length === 0) {
      return;
    }
    const criticalActs = this.resultado.ruta_critica;
    if (this.jarvisLight.currentNodeIndex >= criticalActs.length) {
      this.jarvisLight.currentNodeIndex = 0;
    }
  }

  /**
   * Activa el Modo Alerta de la Luz JARVIS cuando se inyecta entropía o cambia la red
   */
  triggerAlert(targetAct) {
    this.jarvisLight.mode = 'ALERT';
    this.jarvisLight.alertTargetNode = targetAct;
    this.jarvisLight.speed = 0.045; // Acelera rápidamente
    if (window.quantumAudio) {
      window.quantumAudio.playAlertEngage();
    }
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (this.isTabVisible !== false) {
        this.update(timestamp);
        this.render();
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(timestamp) {
    // 1. Suavizado lerp de rotación orbital 3D
    this.rotX += (this.targetRotX - this.rotX) * 0.1;
    this.rotY += (this.targetRotY - this.rotY) * 0.1;

    // 2. Desplazamiento z continuo de la rejilla perspectiva infinita
    this.gridZOffset = (this.gridZOffset + 0.45) % 40;

    // 3. Partículas cósmicas profundas (Capa A)
    this.ambientParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -600) p.y = 600;
      if (p.x < -800) p.x = 800;
      if (p.x > 800) p.x = -800;
    });

    // 4. Scanline sweep vertical y parpadeo aleatorio (Capa C)
    this.scanlineY = (this.scanlineY + 3.5) % (this.height + 60);

    // Flicker cada 3-4 segundos de 0.08s
    if (timestamp - this.lastFlickerTime > 3200) {
      if (Math.random() < 0.1) {
        this.flickerAlpha = 0.88 + Math.random() * 0.1;
        if (Math.random() < 0.3) this.lastFlickerTime = timestamp;
      } else {
        this.flickerAlpha = 1.0;
      }
    }

    // 5. Actualizar Entidad de Luz JARVIS
    this.updateJarvisLight();
  }

  updateJarvisLight() {
    const critical = this.resultado && this.resultado.ruta_critica ? this.resultado.ruta_critica : [];
    if (critical.length === 0) return;

    let targetNode = null;
    let startNode = null;

    if (this.jarvisLight.mode === 'ALERT' && this.jarvisLight.alertTargetNode) {
      // Modo Alerta: Vuela directamente hacia el nodo en peligro
      targetNode = this.jarvisLight.alertTargetNode;
      startNode = { x: this.jarvisLight.x, y: this.jarvisLight.y, Te: 5 };
    } else {
      // Modo Patrulla: Recorre la ruta crítica cíclicamente
      const idx = this.jarvisLight.currentNodeIndex;
      const nextIdx = (idx + 1) % critical.length;
      startNode = critical[idx];
      targetNode = critical[nextIdx];
    }

    if (!startNode || !targetNode) return;

    this.jarvisLight.progress += this.jarvisLight.speed;

    // Interpolación de posición con elevación hacia la columna de luz
    const t = Math.min(1, this.jarvisLight.progress);
    const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const currentX = startNode.x + (targetNode.x - startNode.x) * easeT;
    const currentY = startNode.y + (targetNode.y - startNode.y) * easeT;
    // La luz se eleva a la altura del pilar de luz (Te * 9)
    const targetZ = -(targetNode.Te || 4) * 9;
    const startZ = -(startNode.Te || 4) * 9;
    const currentZ = startZ + (targetZ - startZ) * easeT;

    this.jarvisLight.x = currentX;
    this.jarvisLight.y = currentY;
    this.jarvisLight.z = currentZ;

    // Registrar rastro de la cola de plasma (hasta 22 posiciones previas)
    this.jarvisLight.trail.unshift({
      x: currentX,
      y: currentY,
      z: currentZ,
      alpha: 1.0,
      size: this.jarvisLight.mode === 'ALERT' ? 6 : 4.5
    });
    if (this.jarvisLight.trail.length > 22) {
      this.jarvisLight.trail.pop();
    }

    // Llegó al nodo objetivo
    if (this.jarvisLight.progress >= 1) {
      this.jarvisLight.progress = 0;
      this.jarvisLight.pulseIntensity = 1.0;

      if (this.jarvisLight.mode === 'ALERT') {
        // Pulso de inspección en nodo con retraso
        if (window.quantumAudio) window.quantumAudio.playPatrolBeep(false);
        // Regresa a modo patrulla normal
        this.jarvisLight.mode = 'PATROL';
        this.jarvisLight.speed = 0.015;
        this.jarvisLight.alertTargetNode = null;
      } else {
        // Avanza en el circuito de patrulla
        this.jarvisLight.currentNodeIndex = (this.jarvisLight.currentNodeIndex + 1) % critical.length;
        if (window.quantumAudio) {
          window.quantumAudio.playPatrolBeep(true);
        }
      }
    }

    if (this.jarvisLight.pulseIntensity > 0) {
      this.jarvisLight.pulseIntensity = Math.max(0, this.jarvisLight.pulseIntensity - 0.05);
    }
  }

  render() {
    // Renderizamos la escena en el canvas offscreen
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);

    // =========================================================================
    // CAPA A: EL VACÍO CÓSMICO (Fondo negro azulado profundo con polvo de luz)
    // =========================================================================
    this.drawCosmicVoid(this.offscreenCtx);

    // =========================================================================
    // CAPA B: LA REJILLA FANTASMA CON PERSPECTIVA INFINITA
    // =========================================================================
    this.drawInfiniteGrid(this.offscreenCtx);

    // =========================================================================
    // GRAFO HOLOGRÁFICO (MODO COMPOSICIÓN LUZ 'LIGHTER')
    // =========================================================================
    const mapa = new Map();
    this.actividades.forEach(a => mapa.set(a.id, a));

    // 1. Dibujar Pilares de Luz Holográficos (Altura = Te)
    this.drawHoloLightPillars(this.offscreenCtx);

    // 2. Dibujar Enlaces de Rayos de Plasma y Fibras Ópticas
    this.actividades.forEach(act => {
      act.sucesoras.forEach(sucId => {
        const suc = mapa.get(sucId);
        if (suc) {
          this.drawEdge3D(this.offscreenCtx, act, suc);
        }
      });
    });

    // 3. Dibujar Fotones Cuánticos
    if (this.particlesEnabled) {
      this.drawParticles3D(this.offscreenCtx);
    }

    // 4. Dibujar Nodos (Cápsulas Holográficas con Fresnel Glow)
    // Ordenar nodos por profundidad Z para renderizado correcto
    const sortedNodes = [...this.actividades].map(act => ({
      act,
      p: this.project3D(act.x, act.y, 0)
    })).sort((a, b) => a.p.z - b.p.z);

    sortedNodes.forEach(item => {
      this.drawHoloNode3D(this.offscreenCtx, item.act, item.p);
    });

    // 5. Dibujar Entidad de Luz JARVIS y Cola de Plasma
    this.drawJarvisLight(this.offscreenCtx);

    // =========================================================================
    // CAPA C: EFECTO HOLOGRAMA FINAL (Aberración Cromática, Fresnel & Scanline)
    // =========================================================================
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.applyHolographicFilters();
  }

  drawCosmicVoid(ctx) {
    // Fondo abisal con viñeta radial oscura
    const bgGrad = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 80,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.75
    );
    bgGrad.addColorStop(0, '#070b1a');
    bgGrad.addColorStop(0.6, '#03050c');
    bgGrad.addColorStop(1, '#010206');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Polvo cósmico en suspensión con parallax
    ctx.save();
    this.ambientParticles.forEach(p => {
      const proj = this.project3D(p.x + 450, p.y + 250, p.z);
      if (proj.x >= 0 && proj.x <= this.width && proj.y >= 0 && proj.y <= this.height) {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, Math.max(0.5, p.size * proj.scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha * 0.7})`;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 4;
        ctx.fill();
      }
    });
    ctx.restore();
  }

  drawInfiniteGrid(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.14)';
    ctx.lineWidth = 1;

    const gridLines = 26;
    const step = 45;
    const extent = gridLines * step / 2;

    // Rejilla que se desliza hacia la cámara en Z
    const zOffset = this.gridZOffset;

    // Líneas Longitudinales (Paralelas a X)
    for (let i = -extent; i <= extent; i += step) {
      const pStart = this.project3D(-extent + 450, i + 250, 40 + zOffset);
      const pEnd = this.project3D(extent + 450, i + 250, 40 + zOffset);

      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    }

    // Líneas Transversales (Hacia la profundidad)
    for (let i = -extent; i <= extent; i += step) {
      const pStart = this.project3D(i + 450, -extent + 250, 40 + zOffset);
      const pEnd = this.project3D(i + 450, extent + 250, 40 + zOffset);

      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Dibuja Pilares Volumétricos de Luz hacia arriba, proporcionales a Te
   */
  drawHoloLightPillars(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    this.actividades.forEach(act => {
      // Altura del pilar = Te * factor de escala
      const pillarHeight = Math.max(25, (act.Te || 2) * 9.5);
      const base = this.project3D(act.x, act.y, 0);
      const top = this.project3D(act.x, act.y, -pillarHeight);

      const isCritical = act.es_critica;
      const baseColor = isCritical ? 'rgba(255, 0, 85, ' : 'rgba(0, 240, 255, ';

      // Haz cónico de luz volumétrica
      const beamGrad = ctx.createLinearGradient(base.x, base.y, top.x, top.y);
      beamGrad.addColorStop(0, baseColor + '0.45)');
      beamGrad.addColorStop(0.7, baseColor + '0.15)');
      beamGrad.addColorStop(1, baseColor + '0.0)');

      const beamRadius = (isCritical ? 35 : 24) * base.scale;

      ctx.beginPath();
      ctx.moveTo(base.x - beamRadius, base.y);
      ctx.lineTo(top.x - beamRadius * 0.4, top.y);
      ctx.lineTo(top.x + beamRadius * 0.4, top.y);
      ctx.lineTo(base.x + beamRadius, base.y);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.fill();

      // Columna central de luz de alta intensidad
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(top.x, top.y);
      ctx.strokeStyle = isCritical ? 'rgba(255, 120, 180, 0.7)' : 'rgba(180, 250, 255, 0.5)';
      ctx.lineWidth = (isCritical ? 3.0 : 1.8) * base.scale;
      ctx.shadowColor = isCritical ? '#ff0055' : '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Anillo emisor en la cima de la columna de luz
      ctx.beginPath();
      ctx.ellipse(top.x, top.y, 14 * top.scale, 6 * top.scale, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isCritical ? '#ff0055' : '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    ctx.restore();
  }

  drawEdge3D(ctx, source, target) {
    const isCritical = source.es_critica && target.es_critica;
    
    // Conectar desde los centros proyectados
    const p1 = this.project3D(source.x + 65, source.y, 0);
    const p2 = this.project3D(target.x - 65, target.y, 0);

    const dx = p2.x - p1.x;
    const cp1x = p1.x + dx * 0.5;
    const cp1y = p1.y;
    const cp2x = p1.x + dx * 0.5;
    const cp2y = p2.y;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);

    if (isCritical) {
      // Rayo de Plasma Láser Carmesí/Magenta
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.95)';
      ctx.lineWidth = 3.5 * p1.scale;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Núcleo blanco caliente incandescente
      ctx.strokeStyle = 'rgba(255, 235, 245, 0.95)';
      ctx.lineWidth = 1.2 * p1.scale;
      ctx.stroke();
    } else {
      // Fibra óptica cian suave
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.8 * p1.scale;
      ctx.shadowBlur = 0;
      ctx.stroke();
    }

    // Punta de flecha direccional
    const angle = Math.atan2(p2.y - cp2y, p2.x - cp2x);
    ctx.translate(p2.x, p2.y);
    ctx.rotate(angle);
    ctx.fillStyle = isCritical ? '#ff0055' : '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(-10 * p2.scale, -5 * p2.scale);
    ctx.lineTo(0, 0);
    ctx.lineTo(-10 * p2.scale, 5 * p2.scale);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawParticles3D(ctx) {
    ctx.save();
    this.particles.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;

      const p1 = this.project3D(p.source.x + 65, p.source.y, 0);
      const p2 = this.project3D(p.target.x - 65, p.target.y, 0);

      const dx = p2.x - p1.x;
      const cp1x = p1.x + dx * 0.5;
      const cp1y = p1.y;
      const cp2x = p1.x + dx * 0.5;
      const cp2y = p2.y;

      const t = p.progress;
      const cx = 3 * (cp1x - p1.x);
      const bx = 3 * (cp2x - cp1x) - cx;
      const ax = p2.x - p1.x - cx - bx;

      const cy = 3 * (cp1y - p1.y);
      const by = 3 * (cp2y - cp1y) - cy;
      const ay = p2.y - p1.y - cy - by;

      const px = ax * t * t * t + bx * t * t + cx * t + p1.x;
      const py = ay * t * t * t + by * t * t + cy * t + p1.y;

      ctx.beginPath();
      ctx.arc(px, py, p.size * p1.scale, 0, Math.PI * 2);
      ctx.fillStyle = p.isCritical ? '#ff3388' : '#00f0ff';
      ctx.shadowColor = p.isCritical ? '#ff0055' : '#00f0ff';
      ctx.shadowBlur = p.isCritical ? 12 : 8;
      ctx.fill();
    });
    ctx.restore();
  }

  /**
   * Dibuja Nodo Holográfico con Fresnel Glow en los bordes
   */
  drawHoloNode3D(ctx, act, p) {
    // Factor de legibilidad dinámica para pantallas de diferente densidad y escala
    const effectiveScale = Math.max(0.65, Math.min(1.4, p.scale));
    const w = 142 * effectiveScale;
    const h = 76 * effectiveScale;
    const x = p.x - w / 2;
    const y = p.y - h / 2;
    const r = Math.max(4, 6 * effectiveScale);

    const isHovered = this.hoveredNode === act;
    const isSelected = this.selectedNode === act;

    let borderColor = '#00f0ff';
    let glowColor = 'rgba(0, 240, 255, 0.45)';
    let badgeColor = '#00f0ff';

    if (act.es_critica) {
      borderColor = '#ff0055';
      glowColor = 'rgba(255, 0, 85, 0.8)';
      badgeColor = '#ff0055';
    } else if (act.holgura > 0 && act.holgura <= 2.5) {
      borderColor = '#ffb700';
      glowColor = 'rgba(255, 183, 0, 0.7)';
      badgeColor = '#ffb700';
    }

    ctx.save();

    // 1. Fresnel Glow en el contorno del nodo
    // (Bordes más brillantes cuando se ve de lado con rotación rotX/rotY)
    const fresnelIntensity = Math.min(1.5, Math.abs(this.rotX) * 1.8 + Math.abs(this.rotY) * 1.2 + 0.6);

    // 2. Fondo de Cristal Glassmorphism
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = act.es_critica ? 'rgba(32, 9, 24, 0.90)' : 'rgba(9, 18, 38, 0.88)';
    ctx.fill();

    // 3. Resplandor Neón
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = (isHovered || isSelected ? 2.8 : 1.8) * effectiveScale;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = (isHovered || isSelected ? 20 : 10) * fresnelIntensity;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 4. Franja Superior (ID y Te)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, w - 2, 23 * effectiveScale, [r, r, 0, 0]);
    ctx.fill();

    // Textos con tamaños protegidos para legibilidad en Android / móvil
    const fontSizeId = Math.max(10, Math.round(12 * effectiveScale));
    ctx.font = `bold ${fontSizeId}px "Orbitron", sans-serif`;
    ctx.fillStyle = badgeColor;
    ctx.textAlign = 'left';
    ctx.fillText(act.id, x + 8 * effectiveScale, y + 16 * effectiveScale);

    const fontSizeTe = Math.max(9, Math.round(11 * effectiveScale));
    ctx.font = `600 ${fontSizeTe}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(`Te:${act.Te.toFixed(1)}d`, x + w - 8 * effectiveScale, y + 16 * effectiveScale);

    // Nombre de Actividad
    const fontSizeName = Math.max(9.5, Math.round(11.5 * effectiveScale));
    ctx.font = `600 ${fontSizeName}px "Rajdhani", sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    const cleanName = act.nombre.length > 17 ? act.nombre.slice(0, 16) + '…' : act.nombre;
    ctx.fillText(cleanName, x + 8 * effectiveScale, y + 37 * effectiveScale);

    // Matriz de Tiempos ES, EF, LS, LF
    const fontSizeMatrix = Math.max(8.5, Math.round(9.5 * effectiveScale));
    ctx.font = `500 ${fontSizeMatrix}px "JetBrains Mono", monospace`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`ES:${act.ES.toFixed(1)}`, x + 8 * effectiveScale, y + 52 * effectiveScale);
    ctx.fillText(`EF:${act.EF.toFixed(1)}`, x + 72 * effectiveScale, y + 52 * effectiveScale);
    ctx.fillText(`LS:${act.LS.toFixed(1)}`, x + 8 * effectiveScale, y + 66 * effectiveScale);
    ctx.fillText(`LF:${act.LF.toFixed(1)}`, x + 72 * effectiveScale, y + 66 * effectiveScale);

    // Indicador de Holgura
    ctx.textAlign = 'right';
    if (!act.es_critica) {
      ctx.fillStyle = act.holgura <= 2.5 ? '#ffb700' : '#00f0ff';
      ctx.fillText(`H:${act.holgura.toFixed(1)}`, x + w - 6 * effectiveScale, y + 66 * effectiveScale);
    } else {
      ctx.fillStyle = '#ff0055';
      ctx.fillText('CRÍTICO', x + w - 6 * effectiveScale, y + 66 * effectiveScale);
    }

    ctx.restore();
  }

  /**
   * Dibuja la Entidad de Luz JARVIS IA patrullando la red con cola de plasma
   */
  drawJarvisLight(ctx) {
    if (!this.jarvisLight.trail || this.jarvisLight.trail.length === 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const isAlert = this.jarvisLight.mode === 'ALERT';
    const baseColor = isAlert ? '255, 0, 85' : '0, 240, 255';

    // 1. Dibujar Cola de Plasma (degradado desde blanco/rosa hasta transparente)
    for (let i = this.jarvisLight.trail.length - 1; i >= 1; i--) {
      const p1 = this.project3D(this.jarvisLight.trail[i].x, this.jarvisLight.trail[i].y, this.jarvisLight.trail[i].z);
      const p2 = this.project3D(this.jarvisLight.trail[i - 1].x, this.jarvisLight.trail[i - 1].y, this.jarvisLight.trail[i - 1].z);

      const ratio = 1 - (i / this.jarvisLight.trail.length);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(${baseColor}, ${ratio * 0.8})`;
      ctx.lineWidth = (ratio * 5.5 + 1.5) * p1.scale;
      ctx.shadowColor = isAlert ? '#ff0055' : '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.stroke();
    }

    // 2. Núcleo de la Entidad de Luz JARVIS
    const head = this.jarvisLight.trail[0];
    const headProj = this.project3D(head.x, head.y, head.z);

    // Halo esférico de luz que ilumina nodos circundantes
    const haloRadius = (isAlert ? 45 : 30) * headProj.scale;
    const haloGrad = ctx.createRadialGradient(
      headProj.x, headProj.y, 2,
      headProj.x, headProj.y, haloRadius
    );
    haloGrad.addColorStop(0, '#ffffff');
    haloGrad.addColorStop(0.3, `rgba(${baseColor}, 0.9)`);
    haloGrad.addColorStop(0.7, `rgba(${baseColor}, 0.25)`);
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(headProj.x, headProj.y, haloRadius, 0, Math.PI * 2);
    ctx.fillStyle = haloGrad;
    ctx.fill();

    // Pulso expansivo al llegar a nodos
    if (this.jarvisLight.pulseIntensity > 0) {
      const pulseR = haloRadius * (1 + (1 - this.jarvisLight.pulseIntensity) * 2.2);
      ctx.beginPath();
      ctx.arc(headProj.x, headProj.y, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${baseColor}, ${this.jarvisLight.pulseIntensity * 0.8})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Post-procesado Holográfico: Aberración Cromática RGB + Scanline Sweep + Flicker
   */
  applyHolographicFilters() {
    this.ctx.save();
    this.ctx.globalAlpha = this.flickerAlpha;

    if (this.chromaticEnabled) {
      // Aberración Cromática optimizada (desfase RGB con dos pases aditivos ligeros)
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);

      this.ctx.globalCompositeOperation = 'screen';
      this.ctx.globalAlpha = 0.35 * this.flickerAlpha;
      this.ctx.drawImage(this.offscreenCanvas, -1.8, 0, this.width, this.height);
      this.ctx.drawImage(this.offscreenCanvas, 1.8, 0, this.width, this.height);
    } else {
      this.ctx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);
    }

    // Scanline láser horizontal que barre de arriba hacia abajo cada 3 segundos
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.scanlineY);
    this.ctx.lineTo(this.width, this.scanlineY);
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 8;
    this.ctx.stroke();

    this.ctx.restore();
  }
}

window.QuantumCanvasRenderer = QuantumCanvasRenderer;
