/**
 * CHRONOS // ORÁCULO PROBABILÍSTICO (CAMPANA DE GAUSS HOLOGRÁFICA)
 * Renderizado de función de densidad normal estándar N(0, 1), cálculo de puntaje Z
 * e interpolación de probabilidad acumulada mediante aproximación polinomial de Abramowitz & Stegun.
 */

class OraculoPert {
  /**
   * Función de Error Gaussiana erf(x) aproximada
   */
  static erf(x) {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Probabilidad acumulada CDF para distribución normal estándar Φ(Z)
   * P(X <= Z) = 0.5 * (1 + erf(Z / sqrt(2)))
   */
  static cdfNormal(z) {
    return 0.5 * (1.0 + this.erf(z / Math.SQRT2));
  }

  /**
   * Función de densidad de probabilidad normal f(x, mu, sigma)
   */
  static pdfNormal(x, mu, sigma) {
    if (sigma <= 0) return 0;
    const expFactor = -0.5 * Math.pow((x - mu) / sigma, 2);
    return (1.0 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(expFactor);
  }

  /**
   * Calcula el puntaje Z y la probabilidad para un tiempo meta dado
   */
  static calcularProbabilidad(tMeta, tTotal, sigma) {
    if (sigma <= 0) {
      if (tMeta >= tTotal) {
        return { z: 0, p: 1.0, porcentaje: '100.00%', veredicto: 'CERTIDUMBRE ABSOLUTA (CPM DETERMINISTA)' };
      } else {
        return { z: 0, p: 0.0, porcentaje: '0.00%', veredicto: 'INVIABLE (DURACIÓN FIJA SUPERIOR)' };
      }
    }

    const z = (tMeta - tTotal) / sigma;
    let prob = this.cdfNormal(z);
    prob = Math.max(0, Math.min(1, prob));
    const porcentaje = (prob * 100).toFixed(2) + '%';

    let veredicto = 'CUMPLIMIENTO MEDIO';
    if (prob >= 0.95) veredicto = 'PROBABILIDAD CRÍTICA ULTRA SEGURA';
    else if (prob >= 0.80) veredicto = 'ALTA PROBABILIDAD DE ÉXITO';
    else if (prob >= 0.50) veredicto = 'ZONA NOMINAL PROBABLE';
    else if (prob >= 0.20) veredicto = 'RIESGO DE DESVIACIÓN SEVERO';
    else veredicto = 'ALERTA: PROYECTO EN RIESGO CUÁNTICO';

    return {
      z: Number(z.toFixed(2)),
      p: prob,
      porcentaje,
      veredicto
    };
  }

  /**
   * Dibuja la Campana de Gauss Holográfica interactiva en el canvas asignado
   */
  static dibujarCampana(canvas, tMeta, tTotal, sigma) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Fondo con rejilla técnica sutil
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Si sigma es 0 (modo puramente determinista)
    const activeSigma = sigma > 0 ? sigma : 1.0;
    const rangoZ = 3.5; // Graficamos de -3.5σ a +3.5σ
    const xMin = tTotal - rangoZ * activeSigma;
    const xMax = tTotal + rangoZ * activeSigma;
    const peakPdf = this.pdfNormal(tTotal, tTotal, activeSigma);

    const padLeft = 20;
    const padRight = 20;
    const padBottom = 25;
    const padTop = 15;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padBottom - padTop;

    const toCanvasX = (val) => padLeft + ((val - xMin) / (xMax - xMin)) * plotWidth;
    const toCanvasY = (val) => height - padBottom - (val / (peakPdf * 1.15)) * plotHeight;

    const targetCanvasX = toCanvasX(tMeta);

    // 1. Dibujar Área Sombreada Bajo la Curva hasta tMeta (Probabilidad acumulada)
    ctx.beginPath();
    const startX = toCanvasX(xMin);
    const baseY = height - padBottom;
    ctx.moveTo(startX, baseY);

    const step = (xMax - xMin) / 120;
    for (let x = xMin; x <= Math.min(xMax, tMeta); x += step) {
      const pdf = this.pdfNormal(x, tTotal, activeSigma);
      ctx.lineTo(toCanvasX(x), toCanvasY(pdf));
    }
    // Si tMeta está dentro del rango visible, cerramos al piso
    if (tMeta <= xMax && tMeta >= xMin) {
      const pdfMeta = this.pdfNormal(tMeta, tTotal, activeSigma);
      ctx.lineTo(targetCanvasX, toCanvasY(pdfMeta));
      ctx.lineTo(targetCanvasX, baseY);
    } else if (tMeta > xMax) {
      ctx.lineTo(toCanvasX(xMax), baseY);
    }
    ctx.closePath();

    // Gradiente holográfico para el área de probabilidad
    const areaGrad = ctx.createLinearGradient(0, padTop, 0, height);
    areaGrad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
    areaGrad.addColorStop(1, 'rgba(0, 240, 255, 0.05)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // 2. Trazo de la Curva de Gauss (Contorno de Neón)
    ctx.beginPath();
    ctx.moveTo(startX, baseY);
    for (let x = xMin; x <= xMax; x += step) {
      const pdf = this.pdfNormal(x, tTotal, activeSigma);
      ctx.lineTo(toCanvasX(x), toCanvasY(pdf));
    }
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset

    // 3. Eje Base
    ctx.beginPath();
    ctx.moveTo(padLeft, baseY);
    ctx.lineTo(width - padRight, baseY);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 4. Línea de Media (T_total)
    const meanCanvasX = toCanvasX(tTotal);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(meanCanvasX, baseY);
    ctx.lineTo(meanCanvasX, toCanvasY(peakPdf));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Línea Vertical Objetivo Láser Magenta (T_meta)
    if (targetCanvasX >= padLeft && targetCanvasX <= width - padRight) {
      ctx.beginPath();
      ctx.moveTo(targetCanvasX, baseY);
      ctx.lineTo(targetCanvasX, padTop);
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Puntero láser superior
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(targetCanvasX, padTop + 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Etiquetas de Eje
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`μ=${tTotal.toFixed(1)}d`, meanCanvasX, height - 8);
    ctx.fillText(`${(tTotal - 2 * activeSigma).toFixed(1)}d`, toCanvasX(tTotal - 2 * activeSigma), height - 8);
    ctx.fillText(`${(tTotal + 2 * activeSigma).toFixed(1)}d`, toCanvasX(tTotal + 2 * activeSigma), height - 8);
  }
}

window.OraculoPert = OraculoPert;
