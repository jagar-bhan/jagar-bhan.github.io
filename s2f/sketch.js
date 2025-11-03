// left bar = hour, bottom bar = minute, column = second

// basics
let noiseScale = 0.001;
const hourWidth = 0.1;
const minHeight = 0.1;
const secWidth  = 0.01;

// fonts
let spookyFont;
let normalFont;

// time div
let timeDiv;

function preload() {
  spookyFont = loadFont('Melted Monster.ttf'); // night font
  normalFont = 'Helvetica';                    // day font
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(RIGHT, BOTTOM);

  // create <div> for the time (starts hidden)
  timeDiv = createDiv('');
  timeDiv.id('timetest');
}

function draw() {
  // get time
  const now = new Date();
  const sec = now.getSeconds() + now.getMilliseconds() / 1000;
  const min = now.getMinutes() + sec / 60;
  const hr  = now.getHours()   + min / 60;

  // smooth day-night blend
  let mixAmt;
  if      (hr >= 5 && hr < 9)   mixAmt = map(hr, 5, 9, 0, 1);   // sunrise
  else if (hr >= 9 && hr < 18)  mixAmt = 1;                     // day
  else if (hr >= 18 && hr < 22) mixAmt = map(hr, 18, 22, 1, 0); // sunset
  else                          mixAmt = 0;                     // night
  mixAmt = constrain(mixAmt, 0, 1);

  // colors
  const bgColor = lerpColor(color(0), color(255), mixAmt);
  const flowCol = lerpColor(color(100, 100, 255, 45), color(130, 170, 255, 40), mixAmt);
  const hourCol = lerpColor(color(120, 80, 255, 180), color(255, 180, 70, 180), mixAmt);
  const minCol  = lerpColor(color(255, 69, 0, 160),   color(60, 190, 180, 160), mixAmt);
  const secCol  = lerpColor(color(99, 195, 40, 220),  color(255, 120, 200, 200), mixAmt);
  const timeCol = lerpColor(color(180, 200, 255, 200), color(50, 50, 50, 230),  mixAmt);

  // fade background
  noStroke();
  fill(red(bgColor), green(bgColor), blue(bgColor), 30);
  rect(0, 0, width, height);

  // font on canvas
  textFont(mixAmt < 0.5 ? spookyFont : normalFont);

  // map time to visuals
  const secX       = map(sec, 0, 60, 0, width);
  const minWidth   = width  * (min / 60);
  const hourHeight = height * (hr  / 24);
  const timeOffset = sec * 0.15;

  // draw elements
  drawFlowField(timeOffset, secX, flowCol);
  drawHourBar(hourHeight, hourCol);
  drawMinuteBar(minWidth, minCol);
  drawSecondBar(secX, secCol);

  // bottom-right hover zone
  const hoverW = 140;
  const hoverH = 60;
  const inHotspot =
    mouseX >= width  - hoverW &&
    mouseX <= width &&
    mouseY >= height - hoverH &&
    mouseY <= height;

  // update time text + div font
  const h = nf(floor(hr), 2);
  const m = nf(floor(min), 2);
  const s = nf(floor(sec), 2);
  timeDiv.html(`${h}:${m}:${s}`);

  if (mixAmt < 0.5) {
    timeDiv.style('font-family', '"Melted Monster", cursive');
  } else {
    timeDiv.style('font-family', 'Helvetica, Arial, sans-serif');
  }

  if (inHotspot) {
    timeDiv.addClass('visible');
    timeDiv.style('color', `rgba(${red(timeCol)},${green(timeCol)},${blue(timeCol)},0.95)`);
  } else {
    timeDiv.removeClass('visible');
  }
}

// flow field
function drawFlowField(timeShift, secX, col) {
  const spacing = 20;
  const shift = secX * noiseScale * 25;
  strokeWeight(1);
  stroke(col);
  for (let y = 0; y < height; y += spacing) {
    for (let x = 0; x < width; x += spacing) {
      const n  = noise(x * noiseScale + shift, y * noiseScale, timeShift);
      const a  = n * TWO_PI;
      const x2 = x + cos(a) * 10;
      const y2 = y + sin(a) * 10;
      line(x, y, x2, y2);
    }
  }
}

// bars
function drawHourBar(hPixels, col) {
  const bw = width * hourWidth;
  noStroke();
  fill(col);
  rect(0, 0, bw, hPixels);
}

function drawMinuteBar(wPixels, col) {
  const bh = height * minHeight;
  const by = height - bh;
  noStroke();
  fill(col);
  rect(0, by, wPixels, bh);
}

function drawSecondBar(xPos, col) {
  const bw = max(2, width * secWidth);
  const x0 = xPos - bw / 2;
  noStroke();
  fill(col);
  rect(x0, 0, bw, height);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
