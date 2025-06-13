const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '..', 'static')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'static', 'frontend.html'));
});

// Brownian Path Generator
function generateBrownianPath(steps, stepSize, originX, originY) {
  const path = [];
  let x = originX;
  let y = originY;
  path.push({ x, y });

  for (let i = 0; i < steps; i++) {
    const angle = Math.random() * 2 * Math.PI;
    x += stepSize * Math.cos(angle);
    y += stepSize * Math.sin(angle);
    path.push({ x, y });
  }

  return path;
}

// Haupt-Endpunkt
app.post('/generate', (req, res) => {
  const { stepSize, steps, color, canvasWidth, canvasHeight } = req.body;

  // Validierung
  if (
    typeof stepSize !== 'number' || stepSize < 1 || stepSize > 1000 ||
    typeof steps !== 'number' || steps < 10 || steps > 1000000 ||
    typeof color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(color) ||
    typeof canvasWidth !== 'number' || typeof canvasHeight !== 'number'
  ) {
    return res.status(400).json({ error: "Ungültige Eingabewerte." });
  }

  // Cookies setzen
  res.cookie('lastColor', color, { maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.cookie('lastStepSize', stepSize, { maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.cookie('lastSteps', steps, { maxAge: 7 * 24 * 60 * 60 * 1000 });

  const originX = canvasWidth / 2;
  const originY = canvasHeight / 2;
  const path = generateBrownianPath(steps, stepSize, originX, originY);

  res.json({
    stepSize,
    steps,
    color,
    canvasWidth,
    canvasHeight,
    path
  });
});

// REST-API 
const memoryStore = [];
let idCounter = 1;

app.post('/api/noise', (req, res) => {
  const { stepSize, steps, color } = req.body;
  const path = generateBrownianPath(steps, stepSize, 300, 200); // fixiertes Zentrum
  const entry = { id: idCounter++, steps, stepSize, color, path };
  memoryStore.push(entry);
  res.json({ success: true, id: entry.id });
});

app.get('/api/noise', (req, res) => {
  res.json(memoryStore.map(({ id, stepSize, steps, color }) => ({ id, stepSize, steps, color })));
});

app.get('/api/noise/:id', (req, res) => {
  const found = memoryStore.find(e => e.id === parseInt(req.params.id));
  if (!found) return res.status(404).json({ error: "Nicht gefunden" });
  res.json(found);
});

app.get('/load-cookies', (req, res) => {
  res.json({
    stepSize: parseFloat(req.cookies.lastStepSize) || '',
    steps: parseInt(req.cookies.lastSteps) || '',
    color: req.cookies.lastColor || '#000000'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
