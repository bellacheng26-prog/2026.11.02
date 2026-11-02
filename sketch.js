// 游泳小達人：安全大冒險
let gameState = "HOME";
let soundEnabled = false;
let ambientEnabled = false;
let ambientActive = false;
let backgroundMusic;
let helpVisible = false;
let scoreVisible = false;
let tones = {};
let nextAmbientSound = 0;
let buttons = [];
let homeStillImage;
let scoreTotals = {
  matching: 0,
  puzzle: 0,
  hazards: 0
};

let matchLeft = -1;
let matchedPairs = [];
let matchRightOrder = [1, 0, 2, 3];
let matchMessage = "";
let matchMessageUntil = 0;
let wrongPair = null;

const puzzleQuestions = [
  {
    question: "暑假到了，小明和家人想去玩水，哪個地點安全又合法？",
    options: [
      "設有救生員與安全警示牌的合法水域／游泳池",
      "寫著「水深危險，禁止游泳」的溪邊",
      "看起來很涼爽但沒有救生員的水庫或暗流區"
    ],
    answer: 0,
    explanation: "合法水域配有專業救生員與防護設施，安全才有保障。",
    skill: "能了解水中安全知識"
  },
  {
    question: "跳進水裡游泳之前，先做哪件事可以保護自己？",
    options: [
      "剛吃飽飯馬上衝進水裡",
      "做好充分暖身，並穿戴合格的救生裝備",
      "趁沒有大人看見時自己偷偷跑下水"
    ],
    answer: 1,
    explanation: "暖身可以預防抽筋，穿戴救生裝備能降低溺水風險。",
    skill: "能了解水中安全知識"
  },
  {
    question: "在溪邊玩水時，如果腳突然抽筋了，該怎麼辦？",
    options: [
      "慌張地大力踩水，放開所有體力",
      "保持冷靜、放鬆身體改用水母漂，並慢慢伸展抽筋部位",
      "閉上眼睛直接往水底沉"
    ],
    answer: 1,
    explanation: "保持冷靜漂浮並伸展，才能爭取救援時間並避免沉入水中。",
    skill: "能在危險時自救"
  },
  {
    question: "看到小朋友在水裡揮手掙扎，第一步應該怎麼做？",
    options: [
      "覺得自己會游泳，立刻跳下水去救人",
      "大聲呼救，並請大人幫忙打 119／110",
      "裝作沒看到，趕快跑掉"
    ],
    answer: 1,
    explanation: "絕對不可貿然下水，應先大聲呼救並尋求大人與專業救援協助。",
    skill: "能看到溺水者施以救援"
  },
  {
    question: "呼救後，在救生員或大人趕到前，可以利用什麼物品協助？",
    options: [
      "扔大石頭過去",
      "遞出長樹枝、竹竿，或拋擲空保特瓶、救生圈",
      "遞出自己的小手抓對方"
    ],
    answer: 1,
    explanation: "採取「岸上救援」原則，利用延伸物或拋擲漂浮物協助溺水者。",
    skill: "能看到溺水者施以救援"
  },
  {
    question: "天色變黑、聽到雷聲或溪水變混濁，代表什麼？",
    options: [
      "溪水暴漲的徵兆，要立刻上岸離開溪床",
      "可以準備抓魚了，繼續留下來玩",
      "完全不用理會，繼續泡在水裡"
    ],
    answer: 0,
    explanation: "溪水混濁與雷雨是山洪暴發的前兆，必須立刻撤離溪床。",
    skill: "能了解水中安全知識"
  }
];
let puzzleQuestionIndex = 0;
let puzzleSolved = [];
let puzzlePlaced = [];
let puzzleFeedback = null;
let puzzlePhase = "question";
let draggingPuzzlePiece = false;
let puzzleDragPosition = null;
let puzzlePlacementMessage = "";
let puzzlePlacementMessageUntil = 0;
const puzzleColumns = 3;
const puzzleRows = 2;

const hazards = [
  { x: 0.22, y: 0.63, radius: 0.09, label: "深水區沒有救生員", tip: "選擇有救生員、設有安全標示的合法水域。" },
  { x: 0.53, y: 0.34, radius: 0.09, label: "雷雨雲與溪水變色", tip: "天色變黑、聽到雷聲或溪水混濁時，立刻上岸離開溪床。" },
  { x: 0.79, y: 0.67, radius: 0.09, label: "岸邊推擠嬉鬧", tip: "不推擠、不在岸邊奔跑，玩水時要有大人陪同。" }
];
let foundHazards = [];
let findStartedAt = 0;
let safeMessage = "";
let safeMessageUntil = 0;
let hazardFlashIndex = -1;
let hazardFlashUntil = 0;

function preload() {
  homeStillImage = loadImage(
    "Gemini_Generated_Image_9zmys49zmys49zmy.jpg",
    () => {},
    error => console.error("無法載入開始畫面圖片：", error)
  );
  backgroundMusic = loadSound(
    "jumpingbunny-relax-summer-397430.mp3",
    () => {},
    error => console.error("無法載入背景音樂：", error)
  );
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textFont("sans-serif");
  initializeSounds();
}

function addScore(mode) {
  if (!Object.prototype.hasOwnProperty.call(scoreTotals, mode)) {
    console.error(`無法增加未知遊戲模式的分數：${mode}`);
    return;
  }
  scoreTotals[mode] += 10;
}

function initializeSounds() {
  tones.success = new p5.Oscillator("sine");
  tones.soft = new p5.Oscillator("sine");
  tones.warning = new p5.Oscillator("triangle");
  tones.ambient = new p5.Oscillator("sine");
  tones.wind = new p5.Oscillator("sine");
  tones.insect = new p5.Oscillator("sine");
  for (const oscillator of Object.values(tones)) {
    oscillator.amp(0);
    oscillator.start();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function playTone(name, frequency, duration = 0.18, volume = 0.12) {
  if (!soundEnabled || !tones[name]) return;
  const oscillator = tones[name];
  oscillator.freq(frequency);
  oscillator.amp(volume, 0.015);
  oscillator.amp(0, duration);
}

function playSuccess() {
  playTone("success", 880, 0.12);
  setTimeout(() => playTone("success", 1175, 0.2), 110);
}

function draw() {
  buttons = [];
  drawScenery();
  syncAmbient();

  if (gameState === "HOME") drawHome();
  if (gameState === "MATCH") drawMatchGame();
  if (gameState === "PUZZLE") drawPuzzleGame();
  if (gameState === "FIND") drawFindGame();
  if (gameState === "MATCH_DONE") drawMatchGame();
  if (gameState === "PUZZLE_DONE") drawPuzzleGame();

  if (soundEnabled && ambientEnabled && gameState === "HOME" && millis() > nextAmbientSound) {
    playTone("ambient", random([1480, 1760, 1980]), 0.09, 0.018);
    nextAmbientSound = millis() + random(2400, 5200);
  }
}

function syncAmbient() {
  const musicShouldPlay = soundEnabled && ambientEnabled;
  if (backgroundMusic && backgroundMusic.isLoaded()) {
    if (musicShouldPlay && !backgroundMusic.isPlaying()) {
      backgroundMusic.setVolume(0.28);
      backgroundMusic.loop();
    } else if (!musicShouldPlay && backgroundMusic.isPlaying()) {
      backgroundMusic.stop();
    }
  }
  const ambienceShouldPlay = musicShouldPlay && gameState === "HOME";
  if (ambienceShouldPlay === ambientActive) return;
  ambientActive = ambienceShouldPlay;
  tones.wind.freq(115);
  tones.wind.amp(ambienceShouldPlay ? 0.012 : 0, 1.1);
  tones.insect.freq(4800);
  tones.insect.amp(ambienceShouldPlay ? 0.003 : 0, 0.8);
}

function drawScenery() {
  const skyBottom = height * 0.57;
  background(162, 222, 248);
  noStroke();
  fill(255, 222, 125);
  circle(width * 0.84, height * 0.13, min(width, height) * 0.12);

  fill(116, 196, 146);
  ellipse(width * 0.13, height * 0.48, width * 0.5, height * 0.4);
  fill(83, 171, 126);
  ellipse(width * 0.9, height * 0.49, width * 0.55, height * 0.42);

  fill(126, 201, 111);
  rect(0, skyBottom, width, height - skyBottom);
  fill(75, 182, 203);
  beginShape();
  vertex(0, height * 0.58);
  bezierVertex(width * 0.24, height * 0.52, width * 0.36, height * 0.69, width * 0.57, height * 0.64);
  bezierVertex(width * 0.78, height * 0.58, width * 0.87, height * 0.58, width, height * 0.55);
  vertex(width, height * 0.91);
  bezierVertex(width * 0.78, height * 0.97, width * 0.63, height * 0.83, width * 0.42, height * 0.88);
  bezierVertex(width * 0.21, height * 0.93, width * 0.13, height * 0.85, 0, height * 0.91);
  endShape(CLOSE);
  fill(196, 240, 233, 170);
  for (let i = 0; i < 12; i++) {
    const x = ((i * 193 + frameCount * 0.35) % (width + 80)) - 40;
    const y = height * (0.65 + (i % 4) * 0.055);
    ellipse(x, y, 34, 4);
  }
  drawReeds();
  drawChildren();
}

function drawReeds() {
  stroke(63, 135, 85);
  strokeWeight(max(2, width * 0.002));
  for (let i = 0; i < 13; i++) {
    const x = width * (0.025 + i * 0.027);
    const baseY = height * 0.68 + sin(frameCount * 0.035 + i) * 3;
    line(x, baseY, x + sin(frameCount * 0.02 + i) * 7, baseY - height * (0.07 + (i % 3) * 0.015));
  }
  noStroke();
}

function drawChildren() {
  const scale = constrain(min(width / 1000, height / 650), 0.5, 1.15);
  const people = [
    { x: 0.22, y: 0.69, shirt: [255, 139, 90], hair: [75, 49, 35] },
    { x: 0.36, y: 0.77, shirt: [255, 222, 96], hair: [57, 42, 34] },
    { x: 0.67, y: 0.72, shirt: [255, 132, 155], hair: [83, 53, 38] }
  ];
  for (const person of people) {
    const x = width * person.x;
    const y = height * person.y;
    const bob = sin(frameCount * 0.055 + x) * 3 * scale;
    noStroke();
    fill(60, 117, 153, 90);
    ellipse(x, y + 34 * scale, 57 * scale, 12 * scale);
    fill(person.shirt);
    ellipse(x, y + 12 * scale + bob, 35 * scale, 38 * scale);
    fill(255, 219, 180);
    circle(x, y - 17 * scale + bob, 29 * scale);
    fill(person.hair);
    arc(x, y - 22 * scale + bob, 30 * scale, 24 * scale, PI, TWO_PI);
    fill(52, 48, 48);
    circle(x - 5 * scale, y - 16 * scale + bob, 2.5 * scale);
    circle(x + 5 * scale, y - 16 * scale + bob, 2.5 * scale);
    stroke(255, 246, 232);
    strokeWeight(2 * scale);
    noFill();
    arc(x, y - 11 * scale + bob, 8 * scale, 5 * scale, 0, PI);
    noStroke();
  }
  fill(255, 255, 255, 210);
  circle(width * 0.45, height * 0.76, 11 * scale);
  circle(width * 0.47, height * 0.75, 8 * scale);
}

function roundedCard(x, y, w, h, color = [255, 255, 255, 235]) {
  fill(...color);
  stroke(255, 255, 255, 230);
  strokeWeight(2);
  rectMode(CENTER);
  rect(x, y, w, h, 18);
  noStroke();
}

function drawWrappedText(content, x, centerY, maxWidth, fontSize) {
  textSize(fontSize);
  const lines = [];
  let line = "";
  for (const character of content) {
    if (line && textWidth(line + character) > maxWidth) {
      lines.push(line);
      line = character;
    } else {
      line += character;
    }
  }
  if (line) lines.push(line);
  const lineHeight = fontSize * 1.2;
  const firstY = centerY - (lines.length - 1) * lineHeight / 2;
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], x, firstY + i * lineHeight);
  }
}

function addButton(label, x, y, w, h, action, color = [31, 126, 221]) {
  buttons.push({ label, x, y, w, h, action });
  const hovering = mouseX >= x - w / 2 && mouseX <= x + w / 2 &&
    mouseY >= y - h / 2 && mouseY <= y + h / 2;
  fill(hovering ? 255 : 255, hovering ? 255 : 255, hovering ? 255 : 255, 32);
  noStroke();
  rectMode(CENTER);
  rect(x, y + 3, w, h, 15);
  fill(...color);
  rect(x, y, w, h, 15);
  fill(255);
  textSize(constrain(w * 0.105, 15, 23));
  text(label, x, y);
}

function drawHome() {
  const compact = width < 680 || width / height < 1;
  const homeArtwork = homeStillImage;
  if (homeArtwork) {
    background(162, 222, 248);
    imageMode(CENTER);
    const scale = compact
      ? max(width / homeArtwork.width, height / homeArtwork.height)
      : min(width / homeArtwork.width, height / homeArtwork.height);
    image(homeArtwork, width / 2, height / 2, homeArtwork.width * scale, homeArtwork.height * scale);
  } else {
    drawScenery();
  }

  const games = [
    { title: "水域連連看", detail: "安全觀念與裝備配對", action: startMatch },
    { title: "自救大拼圖", detail: "排出正確自救步驟", action: startPuzzle },
    { title: "危機找找看", detail: "找出溪邊 3 個危機", action: startFind }
  ];

  if (compact) {
    fill(0, 0, 0, 45);
    rectMode(CORNER);
    rect(0, 0, width, height);
    const titleY = height * 0.2;
    roundedCard(width / 2, titleY, width * 0.9, 76, [255, 248, 226, 225]);
    fill(103, 55, 27);
    textSize(constrain(width * 0.061, 21, 30));
    drawWrappedText("🌊 游泳小達人：安全大冒險", width / 2, titleY, width * 0.84, textSize());

    for (let i = 0; i < games.length; i++) {
      const y = height * (0.52 + i * 0.135);
      const w = width * 0.86;
      const h = min(height * 0.115, 82);
      roundedCard(width / 2, y, w, h, [106, 57, 28, 230]);
      noFill();
      stroke(255, 215, 121);
      strokeWeight(2);
      rectMode(CENTER);
      rect(width / 2, y, w - 8, h - 8, 12);
      noStroke();
      fill(255, 242, 207);
      textSize(constrain(width * 0.052, 17, 23));
      text(`▶ ${games[i].title}`, width / 2, y - 10);
      fill(255, 222, 157);
      textSize(constrain(width * 0.035, 12, 15));
      text(games[i].detail, width / 2, y + 18);
      buttons.push({ x: width / 2, y, w, h, action: games[i].action });
    }
    addButton("查看分數", width * 0.82, height * 0.08, min(width * 0.35, 136), 40, () => {
      scoreVisible = !scoreVisible;
      helpVisible = false;
    }, [55, 119, 147]);
  } else if (homeArtwork) {
    const scale = min(width / homeArtwork.width, height / homeArtwork.height);
    const imageW = homeArtwork.width * scale;
    const imageH = homeArtwork.height * scale;
    const imageLeft = (width - imageW) / 2;
    const imageTop = (height - imageH) / 2;
    const hotspots = [
      { x: 0.155, y: 0.445, w: 0.19, h: 0.2 },
      { x: 0.38, y: 0.445, w: 0.19, h: 0.2 },
      { x: 0.845, y: 0.78, w: 0.21, h: 0.2 }
    ];
    for (let i = 0; i < hotspots.length; i++) {
      const spot = hotspots[i];
      const x = imageLeft + imageW * spot.x;
      const y = imageTop + imageH * spot.y;
      const w = imageW * spot.w;
      const h = imageH * spot.h;
      const hovering = mouseX >= x - w / 2 && mouseX <= x + w / 2 &&
        mouseY >= y - h / 2 && mouseY <= y + h / 2;
      if (hovering) {
        noFill();
        stroke(255, 236, 146, 230);
        strokeWeight(4);
        rectMode(CENTER);
        rect(x, y, w, h, 16);
        noStroke();
      }
      buttons.push({ x, y, w, h, action: games[i].action });
    }
    const navY = imageTop + imageH * 0.052;
    noStroke();
    fill(181, 231, 244);
    rectMode(CENTER);
    rect(
      imageLeft + imageW * 0.915,
      imageTop + imageH * 0.055,
      imageW * 0.175,
      imageH * 0.12,
      13
    );
    stroke(116, 77, 43);
    strokeWeight(2);
    noFill();
    rect(
      imageLeft + imageW * 0.915,
      imageTop + imageH * 0.055,
      imageW * 0.175,
      imageH * 0.12,
      13
    );
    noStroke();
    const navButtons = [
      {
        label: "查看分數",
        icon: "score",
        x: imageLeft + imageW * 0.86,
        action: () => {
          scoreVisible = !scoreVisible;
          helpVisible = false;
        }
      },
      {
        label: "幫助",
        icon: "help",
        x: imageLeft + imageW * 0.915,
        action: () => {
          helpVisible = !helpVisible;
          scoreVisible = false;
        }
      },
      {
        label: ambientEnabled ? "音效 開" : "音效 關",
        icon: "sound",
        x: imageLeft + imageW * 0.97,
        action: () => {
          ambientEnabled = !ambientEnabled;
          syncAmbient();
        }
      }
    ];
    for (const navButton of navButtons) {
      drawHeaderIconButton(navButton.icon, navButton.label, navButton.x, navY, imageW);
      buttons.push({
        x: navButton.x,
        y: navY + imageH * 0.012,
        w: imageW * 0.05,
        h: imageH * 0.105,
        action: navButton.action
      });
    }

    if (helpVisible) {
      drawHomeHelpPanel();
    }
    if (scoreVisible) {
      drawHomeScorePanel();
    }
    return;
  } else {
    for (let i = 0; i < games.length; i++) {
      const x = width * (0.19 + i * 0.31);
      const y = height * 0.72;
      const w = min(width * 0.27, 330);
      const h = min(height * 0.22, 158);
      roundedCard(x, y, w, h, [255, 255, 255, 238]);
      fill(28, 68, 87);
      textSize(22);
      text(games[i].title, x, y);
      buttons.push({ x, y, w, h, action: games[i].action });
    }
  }

  addButton(ambientEnabled ? "♪ 音效：開" : "♪ 開啟音效", width / 2, height * 0.94, 190, 38, () => {
    ambientEnabled = !ambientEnabled;
    syncAmbient();
  }, [111, 69, 37]);
  if (compact && scoreVisible) {
    drawHomeScorePanel();
  }
}

function drawHeaderIconButton(icon, label, x, y, imageW) {
  const radius = constrain(imageW * 0.0145, 12, 21);
  const buttonWidth = radius * 3.6;
  const buttonHeight = radius * 1.15;
  const labelY = y + radius + 10;

  fill(181, 231, 244);
  stroke(116, 77, 43);
  strokeWeight(max(1.5, radius * 0.12));
  circle(x, y, radius * 2.7);

  noStroke();
  fill(92, 63, 43);
  if (icon === "home") {
    triangle(x - radius * 0.58, y - radius * 0.05, x, y - radius * 0.62, x + radius * 0.58, y - radius * 0.05);
    rectMode(CENTER);
    rect(x, y + radius * 0.28, radius * 0.82, radius * 0.66, 3);
    fill(181, 231, 244);
    rect(x, y + radius * 0.36, radius * 0.18, radius * 0.34, 2);
  } else if (icon === "help") {
    fill(255, 244, 215);
    textSize(radius * 1.55);
    text("?", x, y - 1);
  } else if (icon === "sound") {
    stroke(92, 63, 43);
    strokeWeight(max(1.2, radius * 0.1));
    for (let i = 0; i < 8; i++) {
      const angle = TWO_PI * i / 8;
      line(
        x + cos(angle) * radius * 0.42,
        y + sin(angle) * radius * 0.42,
        x + cos(angle) * radius * 0.63,
        y + sin(angle) * radius * 0.63
      );
    }
    noStroke();
    fill(255, 218, 147);
    circle(x, y, radius * 0.95);
    fill(92, 63, 43);
    circle(x, y, radius * 0.38);
  } else {
    fill(255, 213, 106);
    circle(x, y, radius * 0.95);
    fill(116, 77, 43);
    textSize(radius * 1.15);
    text("★", x, y - 1);
  }

  fill(181, 231, 244);
  stroke(116, 77, 43);
  strokeWeight(1);
  rectMode(CENTER);
  rect(x, labelY, buttonWidth, buttonHeight, 5);
  noStroke();
  fill(92, 63, 43);
  textSize(constrain(radius * 0.72, 12, 16));
  text(label, x, labelY);
}

function drawHomeHelpPanel() {
  fill(33, 54, 72, 150);
  noStroke();
  rectMode(CORNER);
  rect(0, 0, width, height);
  const panelW = min(width * 0.78, 620);
  const panelH = min(height * 0.55, 390);
  roundedCard(width / 2, height / 2, panelW, panelH, [226, 245, 250, 250]);
  fill(38, 91, 116);
  textSize(constrain(width * 0.035, 22, 32));
  text("遊戲說明", width / 2, height / 2 - panelH * 0.34);
  const helpLines = [
    "水域連連看：配對安全情境與正確行動",
    "自救大拼圖：依順序完成水中自救步驟",
    "危機找找看：在時間內找出溪邊的危險"
  ];
  fill(48, 73, 82);
  textSize(constrain(width * 0.019, 14, 18));
  for (let i = 0; i < helpLines.length; i++) {
    text(helpLines[i], width / 2, height / 2 - panelH * 0.12 + i * 38, panelW - 36, 36);
  }
  addButton("知道了", width / 2, height / 2 + panelH * 0.34, 150, 42, () => {
    helpVisible = false;
  }, [45, 136, 109]);
}

function drawHomeScorePanel() {
  buttons.push({
    x: width / 2,
    y: height / 2,
    w: width,
    h: height,
    action: () => {}
  });
  fill(33, 54, 72, 165);
  noStroke();
  rectMode(CORNER);
  rect(0, 0, width, height);

  const compact = width < 600 || height < 560;
  const panelW = min(width * 0.86, 640);
  const panelH = min(height * 0.62, 470);
  const centerY = height / 2;
  roundedCard(width / 2, centerY, panelW, panelH, [226, 245, 250, 250]);

  fill(38, 91, 116);
  textSize(constrain(width * 0.04, 25, 38));
  text("🏆 我的分數", width / 2, centerY - panelH * 0.37);

  fill(29, 103, 77);
  textSize(constrain(width * 0.052, 34, 54));
  text(`${getTotalScore()} 分`, width / 2, centerY - panelH * 0.18);

  const rows = [
    { label: "水域連連看", score: scoreTotals.matching },
    { label: "自救大拼圖", score: scoreTotals.puzzle },
    { label: "危機找找看", score: scoreTotals.hazards }
  ];
  const rowGap = compact ? 40 : 48;
  const firstRowY = centerY - (rows.length - 1) * rowGap / 2 + panelH * 0.04;
  for (let i = 0; i < rows.length; i++) {
    const y = firstRowY + i * rowGap;
    roundedCard(width / 2, y, panelW * 0.78, compact ? 34 : 40, [255, 255, 255, 230]);
    fill(48, 73, 82);
    textSize(constrain(width * 0.021, 15, 20));
    text(`${rows[i].label}　${rows[i].score} 分`, width / 2, y);
  }

  fill(77, 95, 98);
  textSize(constrain(width * 0.016, 12, 15));
  text("每完成一組配對、答對一題或找到一個危機，可得 10 分", width / 2, centerY + panelH * 0.31, panelW - 30, 34);
  addButton("返回主畫面", width / 2, centerY + panelH * 0.42, 160, 42, () => {
    scoreVisible = false;
  }, [45, 136, 109]);
}

function getTotalScore() {
  return scoreTotals.matching + scoreTotals.puzzle + scoreTotals.hazards;
}

function drawHeader(title, subtitle = "") {
  const compact = width < 600;
  const titleY = compact ? height * 0.16 : height * 0.075;
  const subtitleY = compact ? height * 0.22 : height * 0.135;
  const controlY = height * 0.07;
  fill(18, 67, 99);
  textSize(constrain(width * 0.037, 20, 36));
  text(title, width / 2, titleY);
  if (subtitle) {
    fill(44, 82, 88);
    textSize(constrain(width * 0.018, 12, 17));
    text(subtitle, width / 2, subtitleY);
  }
  const backW = compact ? min(104, width * 0.28) : min(width * 0.18, 150);
  const backX = compact ? backW / 2 + 8 : width * 0.11;
  addButton("← 回主畫面", backX, controlY, backW, 42, goHome, [61, 111, 130]);
}

function drawMatchGame() {
  drawHeader("🛟 水域連連看", "先點左側情境，再點右側正確的裝備或行動");
  const leftItems = ["安全合法的戲水地點", "下水前的準備", "遇到抽筋時", "溪水突然變混濁"];
  const rightItems = ["有救生員的合法泳池", "暖身並穿戴合格裝備", "冷靜漂浮並呼救", "立刻上岸離開溪床"];
  const itemTop = height * 0.31;
  const gap = height * 0.145;
  const itemH = min(height * 0.105, 78);
  const itemW = min(width * 0.39, 420);
  const leftX = width * 0.25;
  const rightX = width * 0.75;

  fill(255, 246, 212);
  textSize(constrain(width * 0.022, 15, 21));
  text("🌿 情境木牌", leftX, height * 0.225);
  text("🛟 安全行動", rightX, height * 0.225);

  for (const pair of matchedPairs) {
    const leftY = itemTop + pair * gap;
    const rightPosition = matchRightOrder.indexOf(pair);
    const rightY = itemTop + rightPosition * gap;
    stroke(255, 229, 129, 240);
    strokeWeight(7);
    line(leftX + itemW / 2, leftY, rightX - itemW / 2, rightY);
    noStroke();
    fill(59, 173, 117);
    circle(width / 2, (leftY + rightY) / 2, 17);
    noStroke();
  }
  for (let i = 0; i < 4; i++) {
    const y = itemTop + i * gap;
    const leftShake = wrongPair && wrongPair[0] === i ? sin(frameCount * 0.8) * 5 : 0;
    const leftColor = matchedPairs.includes(i) ? [98, 167, 95] :
      (wrongPair && wrongPair[0] === i ? [166, 69, 49] :
        (matchLeft === i ? [201, 140, 49] : [137, 83, 44]));
    drawWoodMatchCard(leftItems[i], leftX + leftShake, y, itemW, itemH, leftColor, i + 1);
    buttons.push({ x: leftX + leftShake, y, w: itemW, h: itemH, action: () => selectMatchLeft(i) });

    const rightValue = matchRightOrder[i];
    const rightShake = wrongPair && wrongPair[1] === rightValue ? sin(frameCount * 0.8) * 5 : 0;
    const rightColor = matchedPairs.includes(rightValue) ? [98, 167, 95] :
      (wrongPair && wrongPair[1] === rightValue ? [166, 69, 49] : [137, 83, 44]);
    drawWoodMatchCard(rightItems[rightValue], rightX + rightShake, y, itemW, itemH, rightColor, i + 1);
    buttons.push({ x: rightX + rightShake, y, w: itemW, h: itemH, action: () => selectMatchRight(rightValue) });
  }
  fill(wrongPair && millis() < matchMessageUntil ? color(255, 161, 133) : color(255, 246, 212));
  textSize(15);
  text(matchMessage && millis() < matchMessageUntil ? matchMessage :
    `已完成 ${matchedPairs.length} / 4 組配對`, width / 2, height * 0.89);
  if (matchedPairs.length === 4 || gameState === "MATCH_DONE") {
    drawCompletionCard("太棒了！全部配對成功！", "你已經掌握重要的戲水安全觀念。", () => startMatch());
  }
  addButton("再玩一次", width * 0.78, height * 0.92, 130, 42, startMatch, [45, 136, 109]);
}

function drawWoodMatchCard(label, x, y, w, h, woodColor, number) {
  const [red, green, blue] = woodColor;
  noStroke();
  fill(72, 54, 41, 90);
  rectMode(CENTER);
  rect(x + 4, y + 6, w, h, 13);
  fill(red * 0.62, green * 0.62, blue * 0.62);
  rect(x, y, w, h, 13);
  fill(red, green, blue);
  rect(x, y - 2, w - 8, h - 8, 10);
  stroke(255, 218, 154, 150);
  strokeWeight(2);
  noFill();
  rect(x, y - 2, w - 15, h - 15, 8);
  noStroke();
  fill(255, 230, 178);
  circle(x - w * 0.43, y, min(34, h * 0.5));
  fill(98, 64, 39);
  textSize(constrain(h * 0.27, 13, 19));
  text(number, x - w * 0.43, y);
  fill(255, 250, 229);
  const labelSize = constrain(min(w * 0.052, h * 0.25), 13, 20);
  drawWrappedText(label, x + w * 0.09, y, w * 0.72, labelSize);
}

function drawMatchCard(label, x, y, w, h, color) {
  roundedCard(x, y, w, h, color);
  fill(31, 66, 75);
  textSize(constrain(min(w * 0.048, h * 0.25), 13, 19));
  text(label, x, y, w - 24, h - 12);
}

function selectMatchLeft(index) {
  if (matchedPairs.includes(index) || gameState === "MATCH_DONE") return;
  matchLeft = index;
  matchMessage = "選擇右側最適合的答案";
  matchMessageUntil = millis() + 1200;
}

function selectMatchRight(index) {
  if (matchedPairs.includes(index) || gameState === "MATCH_DONE") return;
  if (matchLeft === -1) {
    matchMessage = "請先選擇左側情境";
    matchMessageUntil = millis() + 1500;
    return;
  }
  if (index === matchLeft) {
    matchedPairs.push(index);
    addScore("matching");
    matchMessage = "答對了！安全觀念 +10 分";
    matchMessageUntil = millis() + 1500;
    playSuccess();
    matchLeft = -1;
    if (matchedPairs.length === 4) {
      gameState = "MATCH_DONE";
      playVictory();
    }
  } else {
    wrongPair = [matchLeft, index];
    matchMessage = "再想一想，配對錯囉！";
    matchMessageUntil = millis() + 1500;
    playTone("warning", 210, 0.35, 0.08);
    matchLeft = -1;
    setTimeout(() => { wrongPair = null; }, 500);
  }
}

function startMatch() {
  matchedPairs = [];
  matchLeft = -1;
  matchRightOrder = shuffle([0, 1, 2, 3]);
  matchMessage = "";
  wrongPair = null;
  gameState = "MATCH";
}

function drawPuzzleGame() {
  const isCompact = width < 600 || height < 560;
  drawHeader(
    "🧩 自救大拼圖",
    gameState === "PUZZLE_DONE"
      ? "六塊拼圖都已完成"
      : `第 ${puzzleQuestionIndex + 1} / ${puzzleQuestions.length} 題　答對後拖曳拼圖完成圖片`
  );

  if (gameState === "PUZZLE_DONE") {
    const board = puzzleBoardLayout(isCompact, "complete");
    drawPuzzleBoard(board, true);
    drawPuzzleCompletion(isCompact);
    return;
  }

  if (puzzlePhase === "placement") {
    drawPuzzlePlacement(isCompact);
  } else {
    drawPuzzleQuestion(isCompact);
  }

  const replayW = min(130, width * 0.34);
  addButton("再玩一次", width - replayW / 2 - 12, height * 0.07, replayW, 42, startPuzzle, [45, 136, 109]);
}

function puzzleBoardLayout(isCompact, mode) {
  const aspectRatio = homeStillImage && homeStillImage.width > 0
    ? homeStillImage.height / homeStillImage.width
    : 768 / 1408;
  let boardW;
  let centerX = width / 2;
  let centerY;

  if (mode === "complete") {
    boardW = min(width * (isCompact ? 0.82 : 0.5), 620);
    centerY = isCompact ? height * 0.37 : height * 0.29;
  } else if (mode === "placement") {
    boardW = min(width * (isCompact ? 0.88 : 0.68), 760);
    centerY = isCompact ? height * 0.37 : height * 0.39;
  } else if (isCompact) {
    boardW = width * 0.7;
    centerY = height * 0.335;
  } else {
    boardW = min(width * 0.43, 520);
    centerX = width * 0.75;
    centerY = height * 0.5;
  }

  const boardH = boardW * aspectRatio;
  const cellW = boardW / puzzleColumns;
  const cellH = boardH / puzzleRows;
  return {
    x: centerX - boardW / 2,
    y: centerY - boardH / 2,
    w: boardW,
    h: boardH,
    cellW,
    cellH,
    isCompact,
    mode
  };
}

function drawPuzzleBoard(board, showAll = false) {
  imageMode(CORNER);
  for (let index = 0; index < puzzleQuestions.length; index++) {
    const column = index % puzzleColumns;
    const row = Math.floor(index / puzzleColumns);
    const x = board.x + column * board.cellW;
    const y = board.y + row * board.cellH;
    const isPlaced = showAll || puzzlePlaced[index];

    if (isPlaced && homeStillImage && homeStillImage.width > 0) {
      image(
        homeStillImage,
        x,
        y,
        board.cellW,
        board.cellH,
        column * homeStillImage.width / puzzleColumns,
        row * homeStillImage.height / puzzleRows,
        homeStillImage.width / puzzleColumns,
        homeStillImage.height / puzzleRows
      );
    } else {
      noStroke();
      fill(puzzleSolved[index] ? color(255, 230, 160, 225) : color(255, 255, 255, 110));
      rectMode(CORNER);
      rect(x, y, board.cellW, board.cellH);
      fill(79, 101, 109, 190);
      textSize(constrain(min(board.cellW, board.cellH) * 0.22, 12, 24));
      text(`${index + 1}`, x + board.cellW / 2, y + board.cellH / 2);
      if (puzzleSolved[index] && !isPlaced) {
        fill(88, 112, 99);
        textSize(constrain(min(board.cellW, board.cellH) * 0.11, 9, 15));
        text("待拼入", x + board.cellW / 2, y + board.cellH * 0.72);
      }
    }

    noFill();
    stroke(255, 247, 210);
    strokeWeight(max(2, min(board.cellW, board.cellH) * 0.025));
    rectMode(CORNER);
    rect(x, y, board.cellW, board.cellH);
  }
  noFill();
  stroke(116, 77, 43);
  strokeWeight(max(3, board.cellW * 0.035));
  rectMode(CORNER);
  rect(board.x, board.y, board.w, board.h);
  noStroke();
  imageMode(CENTER);
}

function puzzlePieceBounds(index, centerX, centerY, cellW, cellH) {
  const column = index % puzzleColumns;
  const row = Math.floor(index / puzzleColumns);
  return {
    x: centerX - cellW / 2,
    y: centerY - cellH / 2,
    w: cellW,
    h: cellH,
    column,
    row
  };
}

function drawPuzzlePiece(index, centerX, centerY, cellW, cellH) {
  const piece = puzzlePieceBounds(index, centerX, centerY, cellW, cellH);
  noStroke();
  fill(57, 48, 37, 100);
  rectMode(CORNER);
  rect(piece.x + 5, piece.y + 7, piece.w, piece.h, 8);
  if (homeStillImage && homeStillImage.width > 0) {
    imageMode(CORNER);
    image(
      homeStillImage,
      piece.x,
      piece.y,
      piece.w,
      piece.h,
      piece.column * homeStillImage.width / puzzleColumns,
      piece.row * homeStillImage.height / puzzleRows,
      homeStillImage.width / puzzleColumns,
      homeStillImage.height / puzzleRows
    );
    imageMode(CENTER);
  } else {
    fill(207, 165, 100);
    rect(piece.x, piece.y, piece.w, piece.h);
  }
  noFill();
  stroke(255, 222, 119);
  strokeWeight(max(3, min(cellW, cellH) * 0.06));
  rectMode(CORNER);
  rect(piece.x, piece.y, piece.w, piece.h, 8);
  noStroke();
  return piece;
}

function drawPuzzleQuestion(isCompact) {
  const question = puzzleQuestions[puzzleQuestionIndex];
  const board = puzzleBoardLayout(isCompact, "question");
  drawPuzzleBoard(board);

  if (isCompact) {
    const questionY = height * 0.515;
    const questionH = height * 0.145;
    const questionW = width * 0.9;
    roundedCard(width / 2, questionY, questionW, questionH, [255, 248, 226, 245]);
    fill(89, 55, 34);
    drawWrappedText(
      `第 ${puzzleQuestionIndex + 1} 題　${question.question}`,
      width / 2,
      questionY,
      questionW - 26,
      constrain(width * 0.047, 14, 18)
    );

    const optionW = width * 0.88;
    const optionH = min(height * 0.083, 61);
    const optionGap = height * 0.098;
    const optionTop = height * 0.685;
    drawPuzzleOptions(question, width / 2, optionTop, optionGap, optionW, optionH, true);
    fill(255, 246, 212);
    textSize(constrain(width * 0.034, 11, 14));
    text("答對後會解鎖圖片拼圖，拖到對應位置", width / 2, height * 0.965);
    return;
  }

  const questionX = width * 0.27;
  const questionW = width * 0.46;
  const questionY = height * 0.38;
  const questionH = height * 0.19;
  roundedCard(questionX, questionY, questionW, questionH, [255, 248, 226, 245]);
  fill(89, 55, 34);
  drawWrappedText(
    `第 ${puzzleQuestionIndex + 1} 題　${question.question}`,
    questionX,
    questionY,
    questionW - 34,
    constrain(width * 0.022, 17, 24)
  );
  drawPuzzleOptions(
    question,
    questionX,
    height * 0.56,
    height * 0.115,
    questionW,
    min(height * 0.095, 72),
    false
  );
}

function drawPuzzleOptions(question, centerX, firstY, gap, optionW, optionH, compact) {
  const letters = ["A", "B", "C"];
  for (let i = 0; i < question.options.length; i++) {
    const y = firstY + i * gap;
    const isSelectedWrong = puzzleFeedback && !puzzleFeedback.correct && puzzleFeedback.option === i;
    const optionColor = isSelectedWrong ? [163, 72, 56] : [131, 79, 43];
    drawWoodMatchCard(
      question.options[i],
      centerX,
      y,
      optionW,
      optionH,
      optionColor,
      letters[i]
    );
    buttons.push({
      x: centerX,
      y,
      w: optionW,
      h: optionH,
      action: () => answerPuzzleQuestion(i)
    });
  }

  if (puzzleFeedback && !puzzleFeedback.correct) {
    fill(255, 234, 212);
    textSize(constrain(width * (compact ? 0.034 : 0.017), 12, 17));
    text(`再試一次！正確答案是 ${letters[question.answer]}`, centerX, height * (compact ? 0.955 : 0.93));
  }
}

function drawPuzzlePlacement(isCompact) {
  const question = puzzleQuestions[puzzleQuestionIndex];
  const board = puzzleBoardLayout(isCompact, "placement");
  drawPuzzleBoard(board);

  const cellW = board.cellW;
  const cellH = board.cellH;
  const trayX = width / 2;
  const trayY = isCompact ? height * 0.64 : height * 0.77;
  const pieceCenter = draggingPuzzlePiece && puzzleDragPosition
    ? puzzleDragPosition
    : { x: trayX, y: trayY };
  drawPuzzlePiece(puzzleQuestionIndex, pieceCenter.x, pieceCenter.y, cellW, cellH);

  fill(255, 246, 212);
  const message = puzzlePlacementMessage && millis() < puzzlePlacementMessageUntil
    ? puzzlePlacementMessage
    : `答對了！拖曳第 ${puzzleQuestionIndex + 1} 塊圖片到上方相同位置`;
  textSize(constrain(width * (isCompact ? 0.038 : 0.019), 13, 18));
  drawWrappedText(
    message,
    width / 2,
    isCompact ? height * 0.765 : height * 0.885,
    width * 0.9,
    constrain(width * (isCompact ? 0.034 : 0.016), 12, 16)
  );
  fill(226, 245, 220);
  drawWrappedText(
    `${question.explanation} ${question.skill}`,
    width / 2,
    isCompact ? height * 0.84 : height * 0.94,
    width * 0.9,
    constrain(width * (isCompact ? 0.032 : 0.015), 11, 15)
  );

  const slot = puzzlePieceBounds(
    puzzleQuestionIndex,
    board.x + (puzzleQuestionIndex % puzzleColumns + 0.5) * cellW,
    board.y + (Math.floor(puzzleQuestionIndex / puzzleColumns) + 0.5) * cellH,
    cellW,
    cellH
  );
  if (draggingPuzzlePiece) {
    noFill();
    stroke(255, 230, 135, 220);
    strokeWeight(4);
    rectMode(CORNER);
    rect(slot.x, slot.y, slot.w, slot.h, 5);
    noStroke();
  }
}

function drawPuzzleCompletion(isCompact) {
  const panelW = min(width * 0.82, 620);
  const panelH = min(height * 0.28, 220);
  const panelY = height * (isCompact ? 0.73 : 0.72);
  roundedCard(width / 2, panelY, panelW, panelH, [255, 255, 255, 248]);
  fill(32, 111, 77);
  textSize(constrain(width * 0.034, 22, 34));
  text("🏅 安全知識拼圖完成！", width / 2, panelY - panelH * 0.27);
  fill(42, 74, 76);
  drawWrappedText(
    "六個安全觀念都解鎖了，戲水前記得先做好準備！",
    width / 2,
    panelY,
    panelW - 40,
    constrain(width * 0.018, 14, 18)
  );
  addButton("再挑戰", width / 2, panelY + panelH * 0.28, 140, 42, startPuzzle, [39, 147, 103]);
  addButton("回主畫面", width / 2, panelY + panelH * 0.58, 140, 40, goHome, [65, 119, 137]);
}

function answerPuzzleQuestion(option) {
  if (puzzlePhase !== "question" || puzzleSolved[puzzleQuestionIndex]) return;
  const question = puzzleQuestions[puzzleQuestionIndex];
  if (option === question.answer) {
    puzzleSolved[puzzleQuestionIndex] = true;
    puzzleFeedback = { correct: true, option };
    addScore("puzzle");
    playSuccess();
    puzzlePhase = "placement";
    puzzlePlacementMessage = "拼圖已解鎖！拖曳圖片到拼圖板上相同的位置。";
    puzzlePlacementMessageUntil = millis() + 3500;
  } else {
    puzzleFeedback = { correct: false, option };
    puzzlePlacementMessage = "";
    playTone("warning", 220, 0.3, 0.07);
  }
}

function placePuzzlePiece() {
  if (puzzlePhase !== "placement" || !puzzleSolved[puzzleQuestionIndex]) return;
  puzzlePlaced[puzzleQuestionIndex] = true;
  draggingPuzzlePiece = false;
  puzzleDragPosition = null;
  puzzlePlacementMessage = "拼圖放對位置了！";
  puzzlePlacementMessageUntil = millis() + 1200;
  playSuccess();

  if (puzzlePlaced.every(Boolean)) {
    gameState = "PUZZLE_DONE";
    playVictory();
    return;
  }
  puzzleQuestionIndex++;
  puzzleFeedback = null;
  puzzlePhase = "question";
}

function startPuzzle() {
  puzzleQuestionIndex = 0;
  puzzleSolved = Array(puzzleQuestions.length).fill(false);
  puzzlePlaced = Array(puzzleQuestions.length).fill(false);
  puzzleFeedback = null;
  puzzlePhase = "question";
  draggingPuzzlePiece = false;
  puzzleDragPosition = null;
  puzzlePlacementMessage = "";
  gameState = "PUZZLE";
}

function drawFindGame() {
  drawHeader("🔎 危機找找看", "60 秒內找出 3 個溪邊危機，點擊畫面中的危險圖示");
  const remaining = max(0, 60 - floor((millis() - findStartedAt) / 1000));
  fill(remaining <= 10 ? color(196, 59, 49) : color(21, 83, 96));
  textSize(20);
  text(`⏱ ${remaining} 秒　　找到 ${foundHazards.length} / 3`, width / 2, height * (width < 600 ? 0.265 : 0.2));
  drawFindScene();

  for (let i = 0; i < hazards.length; i++) {
    const hazard = hazards[i];
    const x = width * hazard.x;
    const y = height * hazard.y;
    const radius = min(width, height) * hazard.radius;
    if (foundHazards.includes(i)) {
      noFill();
      stroke(237, 61, 54, 220);
      strokeWeight(5);
      circle(x, y, radius * 2.2);
      noStroke();
      fill(192, 44, 39);
      textSize(constrain(width * 0.019, 12, 17));
      text(hazard.label, x, y + radius + 24);
    }
    if (hazardFlashIndex === i && millis() < hazardFlashUntil) {
      const progress = 1 - (hazardFlashUntil - millis()) / 900;
      noFill();
      stroke(255, 248, 198, 220 * (1 - progress));
      strokeWeight(5);
      circle(x, y, radius * (1.4 + progress * 1.5));
      noStroke();
      stroke(255, 255, 255, 210);
      strokeWeight(4);
      line(x + radius * 0.48, y + radius * 0.48, x + radius * 0.92, y + radius * 0.92);
      noStroke();
    }
    buttons.push({ x, y, w: radius * 2, h: radius * 2, action: () => findHazard(i) });
  }
  if (safeMessage && millis() < safeMessageUntil) {
    const warning = safeMessage.startsWith("⚠");
    roundedCard(width / 2, height * 0.89, min(width * 0.78, 620), 52,
      warning ? [255, 220, 209, 245] : [255, 255, 255, 240]);
    fill(warning ? color(153, 45, 37) : color(29, 100, 86));
    textSize(constrain(width * 0.017, 12, 16));
    drawWrappedText(safeMessage, width / 2, height * 0.89, min(width * 0.74, 580), constrain(width * 0.017, 12, 16));
  }
  if (foundHazards.length === 3 || remaining === 0) {
    drawCompletionCard(foundHazards.length === 3 ? "危機全部找到了！" : "時間到囉！",
      foundHazards.length === 3 ? "記住口訣：不去危險水域，注意天候，戲水不推擠。" : `你找到 ${foundHazards.length} 個危機，再挑戰一次吧！`,
      startFind);
  }
  const replayW = min(130, width * 0.34);
  addButton("再玩一次", width - replayW / 2 - 12, height * 0.07, replayW, 42, startFind, [45, 136, 109]);
}

function drawFindScene() {
  const left = width * 0.08;
  const top = height * (width < 600 ? 0.31 : 0.25);
  const sceneW = width * 0.84;
  const sceneH = height * (width < 600 ? 0.5 : 0.57);
  roundedCard(width / 2, top + sceneH / 2, sceneW, sceneH, [165, 219, 235, 230]);
  noStroke();
  fill(126, 188, 120);
  ellipse(width * 0.17, height * 0.62, width * 0.45, height * 0.43);
  fill(94, 172, 119);
  ellipse(width * 0.84, height * 0.63, width * 0.4, height * 0.46);
  fill(48, 159, 190);
  beginShape();
  vertex(left, height * 0.61);
  bezierVertex(width * 0.31, height * 0.54, width * 0.59, height * 0.77, width * 0.92, height * 0.59);
  vertex(width * 0.92, height * 0.79);
  bezierVertex(width * 0.6, height * 0.89, width * 0.33, height * 0.69, left, height * 0.82);
  endShape(CLOSE);
  fill(208, 235, 228, 180);
  for (let i = 0; i < 8; i++) {
    ellipse(width * (0.2 + i * 0.09), height * (0.68 + (i % 3) * 0.035), 38, 4);
  }

  drawStormCloud(width * hazards[1].x, height * hazards[1].y);
  drawWarningSign(width * hazards[0].x, height * hazards[0].y);
  drawPushingChildren(width * hazards[2].x, height * hazards[2].y);

  fill(255, 255, 255, 200);
  textSize(12);
  text("點一點，找出不安全的地方！", width / 2, height * 0.79);
}

function drawStormCloud(x, y) {
  noStroke();
  fill(89, 100, 122);
  circle(x - 20, y, 36);
  circle(x, y - 10, 48);
  circle(x + 23, y, 34);
  rect(x - 27, y - 2, 56, 19, 10);
  fill(255, 211, 69);
  triangle(x + 1, y + 8, x - 9, y + 28, x + 2, y + 25);
  triangle(x + 2, y + 23, x + 14, y + 23, x - 1, y + 43);
}

function drawWarningSign(x, y) {
  noStroke();
  fill(130, 94, 62);
  rect(x - 4, y - 2, 8, 52, 3);
  fill(255, 226, 114);
  triangle(x - 27, y - 25, x + 27, y - 25, x, y + 21);
  fill(126, 62, 35);
  textSize(22);
  text("!", x, y - 2);
  fill(20, 78, 96);
  textSize(11);
  text("水深危險", x, y + 36);
}

function drawPushingChildren(x, y) {
  for (let i = 0; i < 2; i++) {
    const px = x + (i === 0 ? -16 : 17);
    noStroke();
    fill(i === 0 ? color(255, 132, 100) : color(255, 219, 86));
    ellipse(px, y + 10, 22, 28);
    fill(255, 218, 180);
    circle(px, y - 9, 20);
    fill(75, 50, 37);
    arc(px, y - 12, 21, 15, PI, TWO_PI);
  }
  stroke(203, 54, 46);
  strokeWeight(3);
  line(x - 7, y + 8, x + 7, y + 8);
  noStroke();
}

function findHazard(index) {
  if (foundHazards.includes(index) || foundHazards.length === 3) return;
  if (millis() - findStartedAt >= 60000) return;
  foundHazards.push(index);
  addScore("hazards");
  hazardFlashIndex = index;
  hazardFlashUntil = millis() + 900;
  safeMessage = `⚠ ${hazards[index].label}：${hazards[index].tip}`;
  safeMessageUntil = millis() + 3500;
  playTone("warning", 660, 0.16, 0.1);
  setTimeout(() => playTone("warning", 500, 0.2, 0.08), 150);
  if (foundHazards.length === 3) playVictory();
}

function startFind() {
  foundHazards = [];
  hazardFlashIndex = -1;
  safeMessage = "";
  findStartedAt = millis();
  gameState = "FIND";
}

function drawCompletionCard(title, detail, action) {
  const cardW = min(width * 0.78, 620);
  const cardH = min(height * 0.31, 230);
  roundedCard(width / 2, height * 0.51, cardW, cardH, [255, 255, 255, 248]);
  fill(32, 111, 77);
  textSize(constrain(width * 0.035, 22, 34));
  text(`🏅 ${title}`, width / 2, height * 0.44);
  fill(42, 74, 76);
  textSize(constrain(width * 0.019, 14, 18));
  drawWrappedText(detail, width / 2, height * 0.5, cardW - 42, constrain(width * 0.019, 14, 18));
  addButton("再挑戰", width / 2, height * 0.57, 150, 44, action, [39, 147, 103]);
  addButton("回主畫面", width / 2, height * 0.64, 150, 40, goHome, [65, 119, 137]);
}

function playVictory() {
  if (!soundEnabled) return;
  playTone("success", 523, 0.2, 0.1);
  setTimeout(() => playTone("success", 659, 0.2, 0.1), 180);
  setTimeout(() => playTone("success", 784, 0.3, 0.1), 360);
}

function goHome() {
  gameState = "HOME";
}

function mousePressed() {
  if (!soundEnabled) {
    soundEnabled = true;
    userStartAudio();
    syncAmbient();
  }
  if (gameState === "PUZZLE" && puzzlePhase === "placement" && puzzleSolved[puzzleQuestionIndex]) {
    const isCompact = width < 600 || height < 560;
    const board = puzzleBoardLayout(isCompact, "placement");
    const trayCenter = {
      x: width / 2,
      y: isCompact ? height * 0.64 : height * 0.77
    };
    const trayPiece = puzzlePieceBounds(
      puzzleQuestionIndex,
      trayCenter.x,
      trayCenter.y,
      board.cellW,
      board.cellH
    );
    const pieceCenter = draggingPuzzlePiece && puzzleDragPosition ? puzzleDragPosition : trayCenter;
    const pieceBounds = puzzlePieceBounds(
      puzzleQuestionIndex,
      pieceCenter.x,
      pieceCenter.y,
      board.cellW,
      board.cellH
    );
    if (mouseX >= pieceBounds.x && mouseX <= pieceBounds.x + pieceBounds.w &&
        mouseY >= pieceBounds.y && mouseY <= pieceBounds.y + pieceBounds.h) {
      draggingPuzzlePiece = true;
      puzzleDragPosition = { x: mouseX, y: mouseY };
      return false;
    }
    if (!draggingPuzzlePiece) {
      puzzleDragPosition = { x: trayPiece.x + trayPiece.w / 2, y: trayPiece.y + trayPiece.h / 2 };
    }
  }
  for (let i = buttons.length - 1; i >= 0; i--) {
    const button = buttons[i];
    if (mouseX >= button.x - button.w / 2 && mouseX <= button.x + button.w / 2 &&
        mouseY >= button.y - button.h / 2 && mouseY <= button.y + button.h / 2) {
      button.action();
      return false;
    }
  }

  if (gameState === "FIND" && millis() - findStartedAt < 60000) {
    const hitHazard = hazards.some((hazard, index) => {
      const dx = mouseX - width * hazard.x;
      const dy = mouseY - height * hazard.y;
      const hit = dx * dx + dy * dy <= Math.pow(min(width, height) * hazard.radius, 2);
      if (hit && !foundHazards.includes(index)) findHazard(index);
      return hit;
    });
    if (!hitHazard) {
      safeMessage = "這裡很安全喔！繼續找找看其他危機。";
      safeMessageUntil = millis() + 1800;
      playTone("soft", 520, 0.2, 0.06);
    }
  }
  return false;
}

function mouseDragged() {
  if (!draggingPuzzlePiece || gameState !== "PUZZLE" || puzzlePhase !== "placement") return false;
  puzzleDragPosition = {
    x: constrain(mouseX, 0, width),
    y: constrain(mouseY, 0, height)
  };
  return false;
}

function mouseReleased() {
  if (!draggingPuzzlePiece || gameState !== "PUZZLE" || puzzlePhase !== "placement") return false;

  const isCompact = width < 600 || height < 560;
  const board = puzzleBoardLayout(isCompact, "placement");
  const cellW = board.cellW;
  const cellH = board.cellH;
  const target = puzzlePieceBounds(
    puzzleQuestionIndex,
    board.x + (puzzleQuestionIndex % puzzleColumns + 0.5) * cellW,
    board.y + (Math.floor(puzzleQuestionIndex / puzzleColumns) + 0.5) * cellH,
    cellW,
    cellH
  );
  const dropCenter = puzzleDragPosition || { x: mouseX, y: mouseY };
  const isCorrectSlot = dropCenter.x >= target.x && dropCenter.x <= target.x + target.w &&
    dropCenter.y >= target.y && dropCenter.y <= target.y + target.h;
  draggingPuzzlePiece = false;

  if (isCorrectSlot) {
    placePuzzlePiece();
  } else {
    puzzleDragPosition = null;
    puzzlePlacementMessage = "位置還不對，拼圖已回到原位，再找找看！";
    puzzlePlacementMessageUntil = millis() + 2200;
    playTone("warning", 220, 0.3, 0.07);
  }
  return false;
}
