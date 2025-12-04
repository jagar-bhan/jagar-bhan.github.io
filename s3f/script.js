let buildingCount = 6;
let cols = 9;
let rows = 16;

let buildings = [];
let windowState = [];
let windowHue = [];
let stars = [];
let colorModeState = "normal";

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("canvas-wrapper");
  colorMode(HSB, 360, 100, 100);

  initBuildings();
  initWindows();
  initStars();

  const regenBtn = document.getElementById("regen");
  const modeBtn = document.getElementById("mode");

  if (regenBtn) regenBtn.onclick = () => {
    initBuildings();
    initWindows();
    initStars();
  };

  if (modeBtn) modeBtn.onclick = () => {
    initWindows();
  };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initBuildings();
  initWindows();
  initStars();
}

function draw() {
  updateColorModeByMouseY();
  drawSky();
  drawBuildings();
  updateWindows();
}

function initBuildings() {
  buildings = [];
  const baseWidth = width / buildingCount;

  for (let i = 0; i < buildingCount; i++) {
    const w = baseWidth + random(-40, 20);
    const h = random(height * 0.4, height * 0.9);
    const x = i * baseWidth + random(-10, 10);
    const y = height - h;
    buildings.push({ x, y, w, h });
  }
}

function initWindows() {
  windowState = [];
  windowHue = [];
  for (let b = 0; b < buildingCount; b++) {
    windowState[b] = [];
    windowHue[b] = [];
    for (let c = 0; c < cols; c++) {
      windowState[b][c] = [];
      windowHue[b][c] = [];
      for (let r = 0; r < rows; r++) {
        windowState[b][c][r] = random(1) < 0.55;
        windowHue[b][c][r] = random(360);
      }
    }
  }
}

function initStars() {
  stars = [];
  const count = 60;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: random(width),
      y: random(height * 0.6),
      r: random(1, 3),
      b: random(50, 90)
    });
  }
}

function updateColorModeByMouseY() {
  if (mouseY < height / 3) {
    colorModeState = "off";
  } else if (mouseY < (2 * height) / 3) {
    colorModeState = "normal";
  } else {
    colorModeState = "party";
  }
}

function drawSky() {
  background(230, 50, 8);
  noStroke();
  for (let s of stars) {
    fill(55, 20, s.b, 40);
    circle(s.x, s.y, s.r);
  }
}

function drawBuildings() {
  noStroke();
  for (let b = 0; b < buildings.length; b++) {
    const B = buildings[b];
    fill(230, 40, 18);
    rect(B.x, B.y, B.w, B.h);
    drawWindowsOnBuilding(b);
  }
}

function drawWindowsOnBuilding(bIndex) {
  const B = buildings[bIndex];
  const marginX = 16;
  const marginY = 20;
  const cellWidth = (B.w - marginX * 2) / cols;
  const cellHeight = (B.h - marginY * 2) / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const wx = B.x + marginX + c * cellWidth;
      const wy = B.y + marginY + r * cellHeight;
      const ww = cellWidth * 0.7;
      const wh = cellHeight * 0.6;

      const on = windowState[bIndex][c][r];

      let hue, sat, bright;

      if (colorModeState === "off") {
        hue = 50;
        sat = 20;
        bright = 8;
      } else if (!on) {
        hue = 50;
        sat = 20;
        bright = 10;
      } else if (colorModeState === "normal") {
        hue = 50;
        sat = 35;
        bright = 95;
      } else {
        hue = windowHue[bIndex][c][r];
        sat = 90;
        bright = 100;
      }

      fill(hue, sat, bright);
      rect(wx, wy, ww, wh, 3);
    }
  }
}

function updateWindows() {
  if (colorModeState === "off") return;

  let prob = map(mouseX, 0, width, 0.00002, 0.0015);
  prob = constrain(prob, 0.00002, 0.0015);

  for (let b = 0; b < buildingCount; b++) {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (random(1) < prob) {
          windowState[b][c][r] = !windowState[b][c][r];
          if (windowState[b][c][r]) {
            windowHue[b][c][r] = random(360);
          }
        }
      }
    }
  }
}
