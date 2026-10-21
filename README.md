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

2. **Lienzo Holográfico Reactivo (Canvas / WebGL Glow):**
   - Nodos representados como cápsulas de cristal con métricas en tiempo real ($ES$, $EF$, $LS$, $LF$, $T_e$ y holgura).
   - Rayos de plasma láser magenta incandescente para los enlaces críticos y fibras ópticas tenues para los no críticos.
   - **Simulación de Fotones Cuánticos**: Partículas de energía fluyendo a través de las aristas a velocidades dinámicas.
   - Soporte para **arrastrar y soltar nodos libremente**, zoom con rueda de ratón y recentrado inteligente.

3. **Oráculo Probabilístico (Campana de Gauss Holográfica):**
   - Trazo de la curva de distribución normal interactiva en tiempo real.
   - Cálculo del puntaje $Z$:
     $$Z = \frac{T_{meta} - T_{total}}{\sigma}$$
   - Cálculo de la probabilidad acumulada exacta $P(T \le T_{meta})$ con lectura de porcentaje holográfica.

4. **Simulador de Caos (Chaos Monkey Slider):**
   - Deslizador para inyectar micro-entropía y retrasos en tiempo real sobre las actividades para ver cómo se consume la holgura temporal y cómo cambia la ruta crítica al instante.

5. **Sintetizador de Audio Cuántico (Web Audio API):**
   - Efectos sonoros procedurales para interacciones táctiles, clics HUD, alarmas de ruta crítica y recalibración de red sin dependencias de archivos externos.

6. **Persistencia Instantánea vía URL Hash (Base64):**
   - Permite compartir cualquier proyecto complejo generando un enlace permanente (`#eyJhY3...`) sin necesidad de base de datos ni servidor.

---
