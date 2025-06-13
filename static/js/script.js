function submitNoise() {
  const stepSize = parseFloat(document.getElementById('stepSize').value);
  const steps = parseInt(document.getElementById('steps').value);
  const color = document.getElementById('lineColor').value;
  const errorBox = document.getElementById('formErrors');
  const canvas = document.getElementById('noiseCanvas');
  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;
  errorBox.innerHTML = '';

  // Live-Validierung
  const errors = [];
  if (isNaN(stepSize) || stepSize < 1 || stepSize > 1000) errors.push("Schrittweite ungültig.");
  if (isNaN(steps) || steps < 10 || steps > 1000000) errors.push("Anzahl Schritte ungültig.");
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) errors.push("Farbwert ungültig.");

  if (errors.length > 0) {
    errors.forEach(err => {
      const p = document.createElement("p");
      p.textContent = err;
      errorBox.appendChild(p);
    });
    return;
  }

  // AJAX-Request
  fetch("/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stepSize, steps, color, canvasWidth, canvasHeight })
  })
    .then(res => {
      if (!res.ok) throw new Error("Serverfehler");
      return res.json();
    })
    .then(data => {
      drawBrownianPath(data.path, data.color, data.canvasWidth, data.canvasHeight);
    //   showJsonOutput(data);
    document.getElementById('output').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(err => {
      document.getElementById('jsonOutput').innerHTML = `<p class="w3-text-red">${err.message}</p>`;
    });
}

function drawBrownianPath(path, color, canvasWidth, canvasHeight) {
  const canvas = document.getElementById('noiseCanvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // 1. Bounding box of raw data
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  path.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  });

  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;

  // 2. Scale factor to fit into canvas (with padding)
  const padding = 20;
  const scaleX = (canvas.width - 2 * padding) / rawWidth;
  const scaleY = (canvas.height - 2 * padding) / rawHeight;
  const scale = Math.min(scaleX, scaleY);

  // 3. Translate and scale path
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.2;

  const start = path[0];
  ctx.moveTo(
    padding + (start.x - minX) * scale,
    padding + (start.y - minY) * scale
  );

  for (let i = 1; i < path.length; i++) {
    const p = path[i];
    const x = padding + (p.x - minX) * scale;
    const y = padding + (p.y - minY) * scale;
    ctx.lineTo(x, y);
  }

  ctx.stroke();
}

function showJsonOutput(data) {
  const output = document.getElementById("jsonOutput");
  output.innerHTML = "";

  Object.entries(data).forEach(([key, value]) => {
    if (["path", "previousColor", "canvasWidth", "canvasHeight"].includes(key)) return;
    const p = document.createElement("p");
    p.textContent = `${key}: ${value}`;
    output.appendChild(p);
  });

  if (data.previousColor) {
    const p = document.createElement("p");
    p.textContent = `Letzte Farbe aus Cookie: ${data.previousColor}`;
    p.style.fontStyle = "italic";
    output.appendChild(p);
  }
}

// Cookies laden & Felder vorausfüllen
window.addEventListener('DOMContentLoaded', () => {
  fetch('/load-cookies')
    .then(res => res.json())
    .then(data => {
      if (data.stepSize) document.getElementById('stepSize').value = data.stepSize;
      if (data.steps) document.getElementById('steps').value = data.steps;
      if (data.color) document.getElementById('lineColor').value = data.color;
    })
    .catch(err => {
      console.warn("Konnte Cookie-Daten nicht laden:", err.message);
    });
});
