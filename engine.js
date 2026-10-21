/**
 * CHRONOS // MOTOR MATEMÁTICO Y TOPOLÓGICO PERT / CPM
 * Implementación exacta del pseudocódigo de Grafos Dirigidos Acíclicos (DAG),
 * Ordenamiento Topológico de Kahn, Forward Pass, Backward Pass, Holguras y Varianza.
 */

class Actividad {
  constructor(data) {
    this.id = String(data.id || '').trim().toUpperCase();
    this.nombre = data.nombre || this.id;
    this.predecesoras = Array.isArray(data.predecesoras) 
      ? data.predecesoras.map(p => String(p).trim().toUpperCase()).filter(Boolean)
      : [];
    this.sucesoras = [];

    // Modo y Tiempos
    this.modo = data.modo === 'CPM' ? 'CPM' : 'PERT';
    this.tiempo_fijo = parseFloat(data.tiempo_fijo) || 0;
    this.t_optimista = parseFloat(data.t_optimista) || 0;
    this.t_probable = parseFloat(data.t_probable) || 0;
    this.t_pesimista = parseFloat(data.t_pesimista) || 0;

    // Inyección de Caos (Delay temporal inducido por el Chaos Monkey)
    this.retraso_caos = parseFloat(data.retraso_caos) || 0;

    // Resultados calculados
    this.Te = 0;
    this.varianza = 0;
    this.desviacion = 0;

    // Telemetría de Ruta Crítica
    this.ES = 0; // Early Start
    this.EF = 0; // Early Finish
    this.LS = Infinity; // Late Start
    this.LF = Infinity; // Late Finish
    this.holgura = 0;
    this.es_critica = false;

    // Coordenadas para renderizado en Canvas (se calculan por capas topológicas o drag)
    this.x = data.x !== undefined ? data.x : null;
    this.y = data.y !== undefined ? data.y : null;
    this.layer = 0;
  }

  clonar() {
    return new Actividad({
      id: this.id,
      nombre: this.nombre,
      predecesoras: [...this.predecesoras],
      modo: this.modo,
      tiempo_fijo: this.tiempo_fijo,
      t_optimista: this.t_optimista,
      t_probable: this.t_probable,
      t_pesimista: this.t_pesimista,
      retraso_caos: this.retraso_caos,
      x: this.x,
      y: this.y
    });
  }
}

class MotorPertCpm {
  /**
   * Ordenamiento Topológico de Kahn para detectar ciclos y establecer secuencia de ejecución
   * @param {Array<Actividad>} actividades 
   * @returns {Array<Actividad>|null} Lista ordenada o null si hay ciclo
   */
  static ordenamientoTopologicoKahn(actividades) {
    const mapa = new Map();
    const inDegree = new Map();
    const adj = new Map();

    actividades.forEach(act => {
      mapa.set(act.id, act);
      inDegree.set(act.id, 0);
      adj.set(act.id, []);
    });

    // Construir sucesoras y grados de entrada
    actividades.forEach(act => {
      act.predecesoras.forEach(predId => {
        if (mapa.has(predId)) {
          adj.get(predId).push(act.id);
          inDegree.set(act.id, inDegree.get(act.id) + 1);
        }
      });
    });

    // Sincronizar campo sucesoras en cada objeto actividad
    actividades.forEach(act => {
      act.sucesoras = adj.get(act.id) || [];
    });

    // Cola con nodos de grado de entrada 0 (nodos iniciales)
    const cola = [];
    inDegree.forEach((grado, id) => {
      if (grado === 0) {
        cola.push(id);
      }
    });

    const orden = [];
    while (cola.length > 0) {
      const u = cola.shift();
      orden.push(mapa.get(u));

      const vecinos = adj.get(u) || [];
      vecinos.forEach(v => {
        inDegree.set(v, inDegree.get(v) - 1);
        if (inDegree.get(v) === 0) {
          cola.push(v);
        }
      });
    }

    // Si no procesamos todos los nodos, existe dependencia circular (ciclo cuántico)
    if (orden.length !== actividades.length) {
      return null;
    }

    return orden;
  }

  /**
   * Ejecuta el cálculo completo de PERT/CPM:
   * 1. Te y Varianza
   * 2. Ordenamiento Topológico
   * 3. Forward Pass (ES, EF)
   * 4. Backward Pass (LF, LS)
   * 5. Holguras y Camino Crítico
   */
  static calcularProyecto(listaActividades) {
    if (!listaActividades || listaActividades.length === 0) {
      return {
        error: 'LISTA_VACIA',
        grafo: [],
        duracion_total: 0,
        ruta_critica: [],
        sigma: 0,
        varianza_total: 0
      };
    }

    // PASO 1: Calcular Duración Esperada (Te) y Varianza por Actividad
    listaActividades.forEach(act => {
      if (act.modo === 'PERT') {
        // Fórmula Beta: Te = (O + 4M + P) / 6
        const teBase = (act.t_optimista + (4 * act.t_probable) + act.t_pesimista) / 6;
        act.Te = Math.max(0, teBase + (act.retraso_caos || 0));
        act.varianza = Math.pow((act.t_pesimista - act.t_optimista) / 6, 2);
      } else {
        // Modo CPM determinista
        act.Te = Math.max(0, act.tiempo_fijo + (act.retraso_caos || 0));
        act.varianza = 0;
      }
      act.desviacion = Math.sqrt(act.varianza);
    });

    // PASO 2: Ordenamiento Topológico
    const grafoOrdenado = this.ordenamientoTopologicoKahn(listaActividades);
    if (!grafoOrdenado) {
      return {
        error: 'CICLO_DETECTADO',
        mensaje: 'ERROR CUÁNTICO: Se ha detectado una dependencia circular en la red.',
        grafo: listaActividades,
        duracion_total: 0,
        ruta_critica: [],
        sigma: 0,
        varianza_total: 0
      };
    }

    const mapa = new Map();
    grafoOrdenado.forEach(act => mapa.set(act.id, act));

    // PASO 3: Forward Pass (Recorrido hacia adelante -> ES y EF)
    grafoOrdenado.forEach(act => {
      if (!act.predecesoras || act.predecesoras.length === 0) {
        act.ES = 0;
      } else {
        let maxEF = 0;
        act.predecesoras.forEach(predId => {
          const pred = mapa.get(predId);
          if (pred && pred.EF > maxEF) {
            maxEF = pred.EF;
          }
        });
        act.ES = maxEF;
      }
      act.EF = act.ES + act.Te;
    });

    // Duración total mínima del proyecto
    let duracionTotal = 0;
    grafoOrdenado.forEach(act => {
      if (act.EF > duracionTotal) {
        duracionTotal = act.EF;
      }
    });

    // PASO 4: Backward Pass (Recorrido hacia atrás -> LF y LS)
    const invertido = [...grafoOrdenado].reverse();
    invertido.forEach(act => {
      if (!act.sucesoras || act.sucesoras.length === 0) {
        act.LF = duracionTotal;
      } else {
        let minLS = Infinity;
        act.sucesoras.forEach(sucId => {
          const suc = mapa.get(sucId);
          if (suc && suc.LS < minLS) {
            minLS = suc.LS;
          }
        });
        act.LF = minLS === Infinity ? duracionTotal : minLS;
      }
      act.LS = act.LF - act.Te;
    });

    // PASO 5: Cálculo de Holgura Temporal e Identificación del Camino Crítico
    const caminoCritico = [];
    let varianzaRutaCritica = 0;

    grafoOrdenado.forEach(act => {
      // Holgura = LS - ES (o LF - EF)
      act.holgura = Number((act.LS - act.ES).toFixed(4));
      
      // En precisión flotante consideramos crítico si la holgura es prácticamente cero
      if (Math.abs(act.holgura) < 0.0001) {
        act.holgura = 0;
        act.es_critica = true;
        caminoCritico.push(act);
        varianzaRutaCritica += act.varianza;
      } else {
        act.es_critica = false;
      }
    });

    const sigmaProyecto = Math.sqrt(varianzaRutaCritica);

    return {
      error: null,
      grafo: grafoOrdenado,
      duracion_total: Number(duracionTotal.toFixed(2)),
      ruta_critica: caminoCritico,
      varianza_total: Number(varianzaRutaCritica.toFixed(4)),
      sigma: Number(sigmaProyecto.toFixed(4))
    };
  }

  /**
   * Asigna capas topológicas a cada nodo para facilitar el layout espacial en canvas
   */
  static calcularCapasTopologicas(grafoOrdenado) {
    if (!grafoOrdenado || grafoOrdenado.length === 0) return;
    const mapa = new Map();
    grafoOrdenado.forEach(act => mapa.set(act.id, act));

    grafoOrdenado.forEach(act => {
      if (!act.predecesoras || act.predecesoras.length === 0) {
        act.layer = 0;
      } else {
        let maxPredLayer = 0;
        act.predecesoras.forEach(pid => {
          const pred = mapa.get(pid);
          if (pred && pred.layer !== undefined && pred.layer >= maxPredLayer) {
            maxPredLayer = pred.layer + 1;
          }
        });
        act.layer = maxPredLayer;
      }
    });
  }
}

window.Actividad = Actividad;
window.MotorPertCpm = MotorPertCpm;
