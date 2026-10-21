# CHRONOS // QUANTUM PERT & CPM HUD NEXUS

Aplicación web 100% client-side (sin backend, lista para desplegar en **GitHub Pages**) que implementa las fórmulas de **PERT** y **CPM** con una estética holográfica cuántica / Cyberpunk HUD con grafos reactivos, rayos de plasma láser y oráculo probabilístico.

---

## ⚡ Características Principales

1. **Motor Algorítmico DAG (Directed Acyclic Graph):**
   - Ordenamiento topológico de Kahn con detección instantánea de ciclos y dependencias circulares.
   - Cálculo de duración esperada ($T_e = \frac{O + 4M + P}{6}$) y varianza ($\sigma^2 = (\frac{P - O}{6})^2$) para PERT, o tiempo fijo determinista para CPM.
   - Recorrido hacia adelante (*Forward Pass*): Cálculo de Inicio Temprano ($ES$) y Fin Temprano ($EF$).
   - Recorrido hacia atrás (*Backward Pass*): Cálculo de Fin Tardío ($LF$) e Inicio Tardío ($LS$).
   - Identificación de Ruta Crítica (Holgura = 0) y cálculo de desviación estándar global del proyecto ($\sigma = \sqrt{\sum \sigma_{crítica}^2}$).

2. **Lienzo Holográfico Cuántico 3D (Estilo JARVIS HUD):**
   - **Capa A - El Vacío:** Fondo abisal negro-azulado con suspensión de partículas cósmicas y polvo de luz flotante con efecto parallax tridimensional.
   - **Capa B - Rejilla Fantasma 3D:** Malla con perspectiva infinita que se desplaza suavemente hacia la cámara ($z \to 0$) con desvanecimiento radial.
   - **Capa C - Efecto Holograma:** Aberración cromática RGB dinámica (desfase espectral), Fresnel Glow volumétrico en los bordes de los nodos y barrido de Scanline láser vertical con parpadeo (*flicker*) cuántico.
   - **Capa D - Nodos como Proyectores de Luz:** Cada actividad proyecta un pilar cónico de luz volumétrica con altura exacta proporcional a su duración $T_e$. La ruta crítica genera la autopista de plasma más imponente.
   - **Manipulación Orbital 3D:** Agarra y rota el holograma en tiempo real arrastrando el fondo del lienzo (Pitch & Yaw) al estilo de la interfaz holográfica de Tony Stark.

3. **Entidad de Luz JARVIS IA (Patrulla y Modo Alerta):**
   - **Modo Patrulla:** Un orbe fotónico viviente recorre ininterrumpidamente el camino crítico dejando una estela y cola de plasma con degradado blanco-magenta-cian.
   - **Modo Alerta:** Al inyectar entropía con el *Chaos Monkey Slider*, la entidad detecta la perturbación, vira a rojo fuego acelerando a máxima velocidad hacia el nodo afectado para emitir pulsos acústicos y visuales de diagnóstico.

4. **Oráculo Probabilístico (Campana de Gauss Holográfica):**
   - Trazo de la curva de distribución normal interactiva en tiempo real.
   - Cálculo del puntaje $Z$:
     $$Z = \frac{T_{meta} - T_{total}}{\sigma}$$
   - Cálculo de la probabilidad acumulada exacta $P(T \le T_{meta})$ con lectura de porcentaje holográfica.

5. **Simulador de Caos (Chaos Monkey Slider):**
   - Deslizador para inyectar micro-entropía y retrasos en tiempo real sobre las actividades para ver cómo se consume la holgura temporal y cómo cambia la ruta crítica al instante.

6. **Sintetizador de Audio Cuántico (Web Audio API):**
   - Efectos sonoros procedurales para interacciones táctiles, clics HUD, bips de patrulla JARVIS, alarmas de ruta crítica y ráfagas de cambio cuántico.

6. **Persistencia Instantánea vía URL Hash (Base64):**
   - Permite compartir cualquier proyecto complejo generando un enlace permanente (`#eyJhY3...`) sin necesidad de base de datos ni servidor.

---

## 🚀 Despliegue en GitHub Pages

1. Sube los archivos del repositorio a GitHub:
   - `index.html`
   - `style.css`
   - `engine.js`
   - `oracle.js`
   - `canvas.js`
   - `audio.js`
   - `app.js`
2. En GitHub ve a **Settings > Pages**.
3. En **Source**, selecciona `Deploy from a branch` y elige la rama `main` (carpeta `/root`).
4. ¡Tu aplicación estará en vivo al instante en `https://<tu-usuario>.github.io/<tu-repo>/`!
