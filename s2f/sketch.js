// left bar = 24 hour, bottom bar = minute, column = second

// basics
let noiseScale = 0.001;
const hourWidth = 0.1;
const minHeight = 0.1;
const secWidth = 0.01;

// fonts
let spookyFont;
let normalFont;

function preload() {
  spookyFont = loadFont("Melted Monster.ttf");
  normalFont = "Helvetica";
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(RIGHT, BOTTOM);
}

function draw() {
  // time
  const now = new Date();
  const sec = now.getSeconds() + now.getMilliseconds() / 1000;
  const min = now.getMinutes() + sec / 60;
  const hr = now.getHours() + min / 60;

  // day-night blend (0 = night, 1 = day)
  let mixAmt;

  if (hr >= 5 && hr < 9) {
    // sunrise (5–9am): fade night → day
    mixAmt = map(hr, 5, 9, 0, 1);
  } else if (hr >= 9 && hr < 18) {
    // daytime (9am–6pm): full brightness
    mixAmt = 1;
  } else if (hr >= 18 && hr < 22) {
    // sunset (6–10pm): fade day → night
    mixAmt = map(hr, 18, 22, 1, 0);
  } else {
    // night (10pm–5am): fully dark
    mixAmt = 0;
  }

  mixAmt = constrain(mixAmt, 0, 1);

  // colors
  const bgColor = lerpColor(color(0), color(255), mixAmt);
  const flowCol = lerpColor(
    color(100, 100, 255, 45), //lighter purple-ish
    color(130, 170, 255, 40), //light blue
    mixAmt
  );
  const hourCol = lerpColor(
    color(120, 80, 255, 180), //darker purple-ish
    color(255, 180, 70, 180), //dull orange
    mixAmt
  );
  const minCol = lerpColor(
    color(255, 69, 0, 160), //bright orange
    color(60, 190, 180, 160), //teal
    mixAmt
  );
  const secCol = lerpColor(
    color(99, 195, 40, 220), //green
    color(255, 120, 200, 200), //pink
    mixAmt
  );
  const timeCol = lerpColor(
    color(180, 200, 255, 200), //lavender
    color(50, 50, 50, 230), //grey
    mixAmt
  );

  // fade background
  noStroke();
  fill(red(bgColor), green(bgColor), blue(bgColor), 30);
  rect(0, 0, width, height);

  // font
  if (mixAmt < 0.5) {
    textFont(spookyFont);
  } else {
    textFont(normalFont);
  }

  // map time to visuals
  const secX = map(sec, 0, 60, 0, width);
  const minWidth = width * (min / 60);
  const hourHeight = height * (hr / 24);
  const timeOffset = sec * 0.15;

  // flow
  drawFlowField(timeOffset, secX, flowCol);

  // bars
  drawHourBar(hourHeight, hourCol);
  drawMinuteBar(minWidth, minCol);
  drawSecondBar(secX, secCol);

  // digital time
  drawDigitalTime(hr, now.getMinutes(), now.getSeconds(), timeCol);
}

// flow field
function drawFlowField(timeShift, secX, col) {
  const spacing = 20;
  const shift = secX * noiseScale * 25;
  strokeWeight(1);
  stroke(col);

  for (let y = 0; y < height; y += spacing) {
    for (let x = 0; x < width; x += spacing) {
      const n = noise(x * noiseScale + shift, y * noiseScale, timeShift);
      const a = n * TWO_PI;
      const x2 = x + cos(a) * 10;
      const y2 = y + sin(a) * 10;
      line(x, y, x2, y2);
    }
  }
}

// hour bar
function drawHourBar(hPixels, col) {
  const bw = width * hourWidth;
  noStroke();
  fill(col);
  rect(0, 0, bw, hPixels);
}

// minute bar
function drawMinuteBar(wPixels, col) {
  const bh = height * minHeight;
  const by = height - bh;
  noStroke();
  fill(col);
  rect(0, by, wPixels, bh);
}

// second bar
function drawSecondBar(xPos, col) {
  const bw = max(2, width * secWidth);
  const x0 = xPos - bw / 2;
  noStroke();
  fill(col);
  rect(x0, 0, bw, height);
}

// digital time
function drawDigitalTime(hr, min, sec, col) {
  const h = nf(floor(hr), 2);
  const m = nf(floor(min), 2);
  const s = nf(floor(sec), 2);
  const t = `${h}:${m}:${s}`;

  noStroke();
  fill(col);
  textSize(20);
  text(t, width - 5, height);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
