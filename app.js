/**
 * CHRONOS // QUANTUM APP CONTROLLER
 * Orquestador principal de eventos, sincronización con Base64 en URL hash,
 * interacción con modal, Chaos Monkey slider interactivo y renderizado de tablas.
 */

// Presets de Proyectos
const PRESETS = {
  orbital: [
    { id: "A", nombre: "Diseño Estructural Satelital", predecesoras: [], modo: "PERT", t_optimista: 2, t_probable: 4, t_pesimista: 6 },
    { id: "B", nombre: "Cálculo de Órbita Cuántica", predecesoras: ["A"], modo: "PERT", t_optimista: 3, t_probable: 5, t_pesimista: 9 },
    { id: "C", nombre: "Propulsores de Plasma Iónico", predecesoras: ["A"], modo: "PERT", t_optimista: 4, t_probable: 7, t_pesimista: 12 },
    { id: "D", nombre: "Escudo Térmico & Revestimiento", predecesoras: ["B"], modo: "CPM", tiempo_fijo: 6 },
    { id: "E", nombre: "Matriz Fotónica de Comunicaciones", predecesoras: ["B", "C"], modo: "PERT", t_optimista: 4, t_probable: 8, t_pesimista: 14 },
    { id: "F", nombre: "Integración de Carga Útil", predecesoras: ["D", "E"], modo: "PERT", t_optimista: 2, t_probable: 3, t_pesimista: 5 },
    { id: "G", nombre: "Prueba de Vacío Criogénico", predecesoras: ["F"], modo: "CPM", tiempo_fijo: 4 }
  ],
  reactor: [
    { id: "R1", nombre: "Confinamiento Magnético", predecesoras: [], modo: "PERT", t_optimista: 5, t_probable: 8, t_pesimista: 14 },
    { id: "R2", nombre: "Inyectores de Tritio y Deuterio", predecesoras: [], modo: "PERT", t_optimista: 3, t_probable: 6, t_pesimista: 9 },
    { id: "R3", nombre: "Bobinas Superconductoras", predecesoras: ["R1"], modo: "CPM", tiempo_fijo: 10 },
    { id: "R4", nombre: "Enfriamiento Helio Supercrítico", predecesoras: ["R2"], modo: "PERT", t_optimista: 4, t_probable: 7, t_pesimista: 12 },
    { id: "R5", nombre: "Divertor de Plasma Pesado", predecesoras: ["R3", "R4"], modo: "PERT", t_optimista: 6, t_probable: 11, t_pesimista: 18 },
    { id: "R6", nombre: "Ignición Cuántica Q-Break", predecesoras: ["R5"], modo: "CPM", tiempo_fijo: 5 }
  ]
};

class ChronosApp {
  constructor() {
    this.actividades = [];
    this.resultadoActual = null;
    this.chaosEntropy = 0;

    // Elementos del DOM
    this.dom = {
      // Telemetría Header
      statTe: document.getElementById('stat-project-te'),
      statSigma: document.getElementById('stat-project-sigma'),
      statVariance: document.getElementById('stat-project-variance'),
      statCritical: document.getElementById('stat-critical-path'),
      btnAudio: document.getElementById('btn-audio-toggle'),
      audioStatus: document.getElementById('audio-status'),
      btnShare: document.getElementById('btn-share-url'),
      btnAdd: document.getElementById('btn-add-activity'),

      // Chaos Monkey
      chaosSlider: document.getElementById('chaos-slider'),
      chaosVal: document.getElementById('chaos-val'),

      // Contenedores Sidebar
      cardsContainer: document.getElementById('activity-cards-container'),
      tableBody: document.getElementById('hud-table-body'),

      // Presets
      btnPreset1: document.getElementById('btn-load-preset-1'),
      btnPreset2: document.getElementById('btn-load-preset-2'),
      btnClear: document.getElementById('btn-clear-all'),

      // Oráculo
      gaussCanvas: document.getElementById('gauss-canvas'),
      oracleSlider: document.getElementById('oracle-target-slider'),
      oracleTargetDisplay: document.getElementById('oracle-target-display'),
      oracleProbDisplay: document.getElementById('oracle-prob-display'),
      oracleZDisplay: document.getElementById('oracle-z-display'),
      oracleVerdict: document.getElementById('oracle-verdict'),

      // Modal
      modal: document.getElementById('activity-modal'),
      modalClose: document.getElementById('modal-close-btn'),
      modalCancel: document.getElementById('btn-modal-cancel'),
      modalDelete: document.getElementById('btn-modal-delete'),
      form: document.getElementById('activity-form'),
      heading: document.getElementById('modal-heading'),

      // Campos Modal
      originalId: document.getElementById('form-act-original-id'),
      idInput: document.getElementById('form-act-id'),
      nameInput: document.getElementById('form-act-name'),
      modeSelect: document.getElementById('form-act-mode'),
      predsInput: document.getElementById('form-act-preds'),
      optInput: document.getElementById('form-act-opt'),
      probInput: document.getElementById('form-act-prob'),
      pesInput: document.getElementById('form-act-pes'),
      fixedInput: document.getElementById('form-act-fixed'),
      fieldsPert: document.getElementById('fields-pert'),
      fieldsCpm: document.getElementById('fields-cpm'),

      // Viewport Controls
      btnRecenter: document.getElementById('btn-recenter'),
      btnAutoLayout: document.getElementById('btn-auto-layout'),
      btnToggleParticles: document.getElementById('btn-toggle-particles'),

      // Toast
      toast: document.getElementById('hud-toast'),
      toastText: document.getElementById('toast-text')
    };

    // Inicializar Canvas Renderer
    this.renderer = new QuantumCanvasRenderer('quantum-canvas');
    this.renderer.onNodeClick = (node) => this.openEditModal(node);

    this.bindEvents();
    this.loadInitialState();
  }

  showToast(msg, isAlert = false) {
    this.dom.toastText.textContent = msg;
    if (isAlert) {
      this.dom.toast.style.borderColor = '#ff0055';
      this.dom.toast.style.boxShadow = '0 0 20px rgba(255, 0, 85, 0.7)';
      if (window.quantumAudio) window.quantumAudio.playAlarm();
    } else {
      this.dom.toast.style.borderColor = '#00f0ff';
      this.dom.toast.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.5)';
    }
    this.dom.toast.classList.add('active');
    setTimeout(() => {
      this.dom.toast.classList.remove('active');
    }, 3200);
  }

  bindEvents() {
    // Audio Toggle
    this.dom.btnAudio.addEventListener('click', () => {
      const active = window.quantumAudio.toggle();
      this.dom.audioStatus.textContent = active ? 'FX ON' : 'FX MUTE';
      this.dom.btnAudio.style.borderColor = active ? 'rgba(0,240,255,0.45)' : 'rgba(255,255,255,0.2)';
      if (active) window.quantumAudio.playClick();
    });

    // Compartir URL con Base64
    this.dom.btnShare.addEventListener('click', () => {
      this.exportStateToUrl();
      if (window.quantumAudio) window.quantumAudio.playClick();
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.showToast('¡ENLACE CUÁNTICO COPIADO AL PORTAPAPELES!');
      }).catch(() => {
        this.showToast('ESTADO SERIALIZADO EN EL HASH DE LA URL');
      });
    });

    // Presets
    this.dom.btnPreset1.addEventListener('click', () => {
      this.loadDataset(PRESETS.orbital);
      this.showToast('PROYECTO: SAT-ORBIT CARGADO');
    });
    this.dom.btnPreset2.addEventListener('click', () => {
      this.loadDataset(PRESETS.reactor);
      this.showToast('PROYECTO: REACTOR DE FUSIÓN CARGADO');
    });
    this.dom.btnClear.addEventListener('click', () => {
      this.actividades = [];
      this.recalculate();
      this.showToast('RED PURGADA Y REINICIALIZADA');
    });

    // Chaos Monkey Slider
    this.dom.chaosSlider.addEventListener('input', (e) => {
      this.chaosEntropy = parseFloat(e.target.value) || 0;
      this.dom.chaosVal.textContent = `+${this.chaosEntropy.toFixed(1)}d`;
      this.applyChaosEntropy();
    });

    // Oráculo Target Slider
    this.dom.oracleSlider.addEventListener('input', (e) => {
      const targetVal = parseFloat(e.target.value);
      this.updateOracleDisplay(targetVal);
    });

    // Viewport Controls
    this.dom.btnRecenter.addEventListener('click', () => {
      this.renderer.recenter();
      if (window.quantumAudio) window.quantumAudio.playClick();
    });
    this.dom.btnAutoLayout.addEventListener('click', () => {
      MotorPertCpm.calcularCapasTopologicas(this.actividades);
      this.renderer.autoLayout();
      if (window.quantumAudio) window.quantumAudio.playClick();
    });
    this.dom.btnToggleParticles.addEventListener('click', () => {
      this.renderer.particlesEnabled = !this.renderer.particlesEnabled;
      this.dom.btnToggleParticles.classList.toggle('active', this.renderer.particlesEnabled);
      if (window.quantumAudio) window.quantumAudio.playClick();
    });

    // Modal Crear / Editar
    this.dom.btnAdd.addEventListener('click', () => this.openCreateModal());
    this.dom.modalClose.addEventListener('click', () => this.closeModal());
    this.dom.modalCancel.addEventListener('click', () => this.closeModal());

    this.dom.modeSelect.addEventListener('change', () => {
      const isPert = this.dom.modeSelect.value === 'PERT';
      this.dom.fieldsPert.style.display = isPert ? 'flex' : 'none';
      this.dom.fieldsCpm.style.display = isPert ? 'none' : 'flex';
    });

    this.dom.modalDelete.addEventListener('click', () => {
      const origId = this.dom.originalId.value;
      if (origId) {
        this.actividades = this.actividades.filter(a => a.id !== origId);
        // Quitar también de predecesoras de otros nodos
        this.actividades.forEach(a => {
          a.predecesoras = a.predecesoras.filter(p => p !== origId);
        });
        this.closeModal();
        this.recalculate();
        this.showToast(`ACTIVIDAD ${origId} DESINTEGRADA`);
      }
    });

    this.dom.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveModalActivity();
    });
  }

  loadInitialState() {
    // 1. Intentar cargar desde hash en URL (Base64)
    if (window.location.hash && window.location.hash.length > 2) {
      try {
        const hashData = window.location.hash.substring(1);
        const jsonStr = decodeURIComponent(atob(hashData));
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.loadDataset(parsed);
          this.showToast('RED DESERIALIZADA DESDE HASH URL');
          return;
        }
      } catch (err) {
        console.warn('Hash inválido, recurriendo al preset predeterminado.', err);
      }
    }

    // 2. Cargar Preset Orbital por defecto
    this.loadDataset(PRESETS.orbital);
  }

  loadDataset(list) {
    this.actividades = list.map(item => new Actividad(item));
    MotorPertCpm.calcularCapasTopologicas(this.actividades);
    this.renderer.autoLayout();
    this.recalculate();
  }

  applyChaosEntropy() {
    // Aplicamos entropía sólo a las actividades no críticas o proporcionalmente
    let causedCriticalShift = false;
    const oldCritical = new Set(
      this.resultadoActual && this.resultadoActual.ruta_critica 
        ? this.resultadoActual.ruta_critica.map(a => a.id) 
        : []
    );

    this.actividades.forEach(act => {
      // Inyección caótica ponderada por ID hash para consistencia
      const charCode = act.id.charCodeAt(0) || 1;
      const weight = (charCode % 5) / 5;
      act.retraso_caos = this.chaosEntropy * weight;
    });

    this.recalculate();

    // Comprobar si cambió la ruta crítica
    if (this.resultadoActual && this.resultadoActual.ruta_critica) {
      const newCritical = new Set(this.resultadoActual.ruta_critica.map(a => a.id));
      for (const id of newCritical) {
        if (!oldCritical.has(id)) {
          causedCriticalShift = true;
          break;
        }
      }
    }

    if (causedCriticalShift && window.quantumAudio) {
      window.quantumAudio.playCriticalExplosion();
    }
  }

  recalculate() {
    const res = MotorPertCpm.calcularProyecto(this.actividades);
    this.resultadoActual = res;

    if (res.error === 'CICLO_DETECTADO') {
      this.showToast(res.mensaje, true);
      return;
    }

    if (window.quantumAudio) {
      window.quantumAudio.playRecalculate();
    }

    // 1. Actualizar Telemetría Superior
    this.dom.statTe.innerHTML = `${res.duracion_total.toFixed(2)} <span class="unit">días</span>`;
    this.dom.statSigma.textContent = res.sigma.toFixed(3);
    this.dom.statVariance.textContent = res.varianza_total.toFixed(3);

    const criticalNames = res.ruta_critica.map(a => a.id).join(' ➔ ') || 'NINGUNA';
    this.dom.statCritical.textContent = criticalNames;
    this.dom.statCritical.title = criticalNames;

    // 2. Sincronizar Canvas
    this.renderer.setGraphData(res);

    // 3. Renderizar Sidebar de Tarjetas de Actividades
    this.renderActivityCards();

    // 4. Renderizar Tabla de Métricas (ES/EF/LS/LF)
    this.renderMetricsTable();

    // 5. Actualizar Slider y Gráfico de Gauss del Oráculo
    const baseDuration = res.duracion_total || 10;
    this.dom.oracleSlider.min = Math.max(1, Math.floor(baseDuration * 0.6));
    this.dom.oracleSlider.max = Math.ceil(baseDuration * 1.5);
    
    // Si el valor actual está fuera del rango, ajustarlo a la media
    if (parseFloat(this.dom.oracleSlider.value) < this.dom.oracleSlider.min || 
        parseFloat(this.dom.oracleSlider.value) > this.dom.oracleSlider.max) {
      this.dom.oracleSlider.value = baseDuration;
    }
    
    this.updateOracleDisplay(parseFloat(this.dom.oracleSlider.value));

    // 6. Serializar URL hash
    this.exportStateToUrl();
  }

  renderActivityCards() {
    this.dom.cardsContainer.innerHTML = '';
    const sorted = [...this.actividades].sort((a, b) => a.ES - b.ES);

    sorted.forEach(act => {
      const card = document.createElement('div');
      card.className = `activity-card ${act.es_critica ? 'is-critical' : ''}`;
      
      let slackColor = 'var(--cyan-primary)';
      if (act.es_critica) {
        slackColor = 'var(--magenta-primary)';
      } else if (act.holgura <= 2.5) {
        slackColor = 'var(--amber-warning)';
      }

      card.innerHTML = `
        <div class="card-top">
          <span class="act-badge">${act.id}</span>
          <span class="act-type">${act.modo} | Te: ${act.Te.toFixed(1)}d</span>
        </div>
        <div class="act-name">${act.nombre}</div>
        <div class="card-metrics-grid">
          <div class="metric-box"><span class="m-lbl">ES</span><span class="m-val">${act.ES.toFixed(1)}</span></div>
          <div class="metric-box"><span class="m-lbl">EF</span><span class="m-val">${act.EF.toFixed(1)}</span></div>
          <div class="metric-box"><span class="m-lbl">LS</span><span class="m-val">${act.LS.toFixed(1)}</span></div>
          <div class="metric-box"><span class="m-lbl">LF</span><span class="m-val">${act.LF.toFixed(1)}</span></div>
        </div>
        <div class="card-slack-bar">
          <span>HOLGURA TEMPORAL:</span>
          <span class="slack-indicator" style="color:${slackColor}">
            ${act.es_critica ? '0.0 (CRÍTICA)' : act.holgura.toFixed(1) + 'd'}
          </span>
        </div>
      `;

      card.addEventListener('click', () => this.openEditModal(act));
      this.dom.cardsContainer.appendChild(card);
    });
  }

  renderMetricsTable() {
    this.dom.tableBody.innerHTML = '';
    const sorted = [...this.actividades].sort((a, b) => a.ES - b.ES);

    sorted.forEach(act => {
      const tr = document.createElement('tr');
      if (act.es_critica) tr.className = 'row-critical';

      tr.innerHTML = `
        <td><strong>${act.id}</strong></td>
        <td>${act.Te.toFixed(1)}</td>
        <td>${act.ES.toFixed(1)}</td>
        <td>${act.EF.toFixed(1)}</td>
        <td>${act.LS.toFixed(1)}</td>
        <td>${act.LF.toFixed(1)}</td>
        <td style="color:${act.es_critica ? 'var(--magenta-primary)' : 'var(--cyan-primary)'}">
          ${act.holgura.toFixed(1)}
        </td>
      `;

      tr.addEventListener('click', () => this.openEditModal(act));
      this.dom.tableBody.appendChild(tr);
    });
  }

  updateOracleDisplay(targetDays) {
    if (!this.resultadoActual) return;
    const duracion = this.resultadoActual.duracion_total;
    const sigma = this.resultadoActual.sigma;

    this.dom.oracleTargetDisplay.textContent = `${targetDays.toFixed(1)} días`;

    const stats = OraculoPert.calcularProbabilidad(targetDays, duracion, sigma);
    this.dom.oracleProbDisplay.textContent = stats.porcentaje;
    this.dom.oracleZDisplay.textContent = `Puntaje Cuántico Z: ${stats.z >= 0 ? '+' : ''}${stats.z}σ`;
    this.dom.oracleVerdict.textContent = stats.veredicto;

    // Colorear según riesgo
    if (stats.p >= 0.8) {
      this.dom.oracleProbDisplay.style.color = 'var(--cyan-primary)';
      this.dom.oracleVerdict.style.background = 'rgba(0, 240, 255, 0.2)';
    } else if (stats.p >= 0.5) {
      this.dom.oracleProbDisplay.style.color = 'var(--amber-warning)';
      this.dom.oracleVerdict.style.background = 'rgba(255, 183, 0, 0.2)';
    } else {
      this.dom.oracleProbDisplay.style.color = 'var(--magenta-primary)';
      this.dom.oracleVerdict.style.background = 'rgba(255, 0, 85, 0.25)';
    }

    // Dibujar Curva Gaussiana Holográfica
    OraculoPert.dibujarCampana(this.dom.gaussCanvas, targetDays, duracion, sigma);
  }

  exportStateToUrl() {
    try {
      const cleanData = this.actividades.map(a => ({
        id: a.id,
        nombre: a.nombre,
        predecesoras: a.predecesoras,
        modo: a.modo,
        tiempo_fijo: a.tiempo_fijo,
        t_optimista: a.t_optimista,
        t_probable: a.t_probable,
        t_pesimista: a.t_pesimista,
        x: a.x,
        y: a.y
      }));
      const jsonStr = JSON.stringify(cleanData);
      const encoded = btoa(encodeURIComponent(jsonStr));
      window.history.replaceState(null, '', `#${encoded}`);
    } catch (e) {
      console.error('Error serializando a URL hash', e);
    }
  }

  openCreateModal() {
    this.dom.heading.textContent = 'CREAR ACTIVIDAD CUÁNTICA';
    this.dom.originalId.value = '';
    this.dom.idInput.value = `ACT-0${this.actividades.length + 1}`;
    this.dom.idInput.disabled = false;
    this.dom.nameInput.value = '';
    this.dom.modeSelect.value = 'PERT';
    this.dom.predsInput.value = this.actividades.length > 0 ? this.actividades[this.actividades.length - 1].id : '';
    this.dom.optInput.value = '3';
    this.dom.probInput.value = '6';
    this.dom.pesInput.value = '9';
    this.dom.fixedInput.value = '5';
    this.dom.fieldsPert.style.display = 'flex';
    this.dom.fieldsCpm.style.display = 'none';
    this.dom.modalDelete.style.display = 'none';

    this.dom.modal.classList.add('active');
    if (window.quantumAudio) window.quantumAudio.playClick();
  }

  openEditModal(act) {
    this.dom.heading.textContent = `CONFIGURAR NODO // ${act.id}`;
    this.dom.originalId.value = act.id;
    this.dom.idInput.value = act.id;
    this.dom.idInput.disabled = false;
    this.dom.nameInput.value = act.nombre;
    this.dom.modeSelect.value = act.modo;
    this.dom.predsInput.value = act.predecesoras.join(', ');
    this.dom.optInput.value = act.t_optimista;
    this.dom.probInput.value = act.t_probable;
    this.dom.pesInput.value = act.t_pesimista;
    this.dom.fixedInput.value = act.tiempo_fijo;

    const isPert = act.modo === 'PERT';
    this.dom.fieldsPert.style.display = isPert ? 'flex' : 'none';
    this.dom.fieldsCpm.style.display = isPert ? 'none' : 'flex';
    this.dom.modalDelete.style.display = 'block';

    this.dom.modal.classList.add('active');
    if (window.quantumAudio) window.quantumAudio.playClick();
  }

  closeModal() {
    this.dom.modal.classList.remove('active');
  }

  saveModalActivity() {
    const origId = this.dom.originalId.value;
    const newId = this.dom.idInput.value.trim().toUpperCase();
    const name = this.dom.nameInput.value.trim() || newId;
    const mode = this.dom.modeSelect.value;
    const predsRaw = this.dom.predsInput.value;
    const preds = predsRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    const opt = parseFloat(this.dom.optInput.value) || 0;
    const prob = parseFloat(this.dom.probInput.value) || 0;
    const pes = parseFloat(this.dom.pesInput.value) || 0;
    const fixed = parseFloat(this.dom.fixedInput.value) || 0;

    if (!newId) return;

    if (origId) {
      // Edición de actividad existente
      const act = this.actividades.find(a => a.id === origId);
      if (act) {
        act.id = newId;
        act.nombre = name;
        act.modo = mode;
        act.predecesoras = preds;
        act.t_optimista = opt;
        act.t_probable = prob;
        act.t_pesimista = pes;
        act.tiempo_fijo = fixed;

        // Si cambió el ID, actualizar referencias en otros nodos
        if (origId !== newId) {
          this.actividades.forEach(a => {
            a.predecesoras = a.predecesoras.map(p => p === origId ? newId : p);
          });
        }
      }
    } else {
      // Creación de nueva actividad
      if (this.actividades.some(a => a.id === newId)) {
        this.showToast(`ERROR: EL IDENTIFICADOR ${newId} YA EXISTE`, true);
        return;
      }

      const nueva = new Actividad({
        id: newId,
        nombre: name,
        modo: mode,
        predecesoras: preds,
        t_optimista: opt,
        t_probable: prob,
        t_pesimista: pes,
        tiempo_fijo: fixed
      });

      this.actividades.push(nueva);
      MotorPertCpm.calcularCapasTopologicas(this.actividades);
      this.renderer.autoLayout();
    }

    this.closeModal();
    this.recalculate();
    this.showToast(`ACTIVIDAD ${newId} SINCRONIZADA`);
  }
}

// Inicializar la aplicación cuando cargue el DOM
window.addEventListener('DOMContentLoaded', () => {
  window.chronosApp = new ChronosApp();
});
