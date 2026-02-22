import kaplay from "kaplay";

// --- KAPLAY Initialization ---
const k = kaplay({
    background: [255,240,219],
    letterbox: true, // Crucial for maintaining aspect ratio
    width: 1280,
    height: 720,
});

// --- Load Assets ---
loadSprite("bed", "/assets/sprites/bed.png");
loadFont("font","/assets/fonts/menufont.ttf")
loadSprite("shop","/assets/icons/shop.png")
loadSprite("glasses", "/assets/icons/glasses.png");
loadSprite("heart", "/assets/icons/heart.png");
loadSprite("money", "/assets/icons/money.png");
loadSprite("shelves", "/assets/icons/shelves.png");
loadSprite("shop", "/assets/icons/shop.png"); 
loadSprite("star", "/assets/icons/star.png");
loadSprite("toast", "/assets/icons/toast.png");
//PETS
loadSprite("bed", "/assets/sprites/bed.png");
loadSprite("beigedog", "/assets/sprites/beigedog.png");
loadSprite("cat", "/assets/sprites/cat.png");
loadSprite("crybeigedog", "/assets/sprites/crybeigedog.png");
loadSprite("crycat", "/assets/sprites/crycat.png");
loadSprite("gdog", "/assets/sprites/gdog.png");
loadSprite("glassesgraydog", "/assets/sprites/glassesgraydog.png");
loadSprite("hamster", "/assets/sprites/hamster.png");
loadSprite("heartbeigedog", "/assets/sprites/heartbeigedog.png");
loadSprite("heartcat", "/assets/sprites/heartcat.png");
loadSprite("heartgraydog", "/assets/sprites/heartgraydog.png");
loadSprite("sadgraydog", "/assets/sprites/sadgraydog.png");
loadSprite("starbeigedog", "/assets/sprites/starbeigedog.png");
loadSprite("starcat", "/assets/sprites/starcat.png");
loadSprite("stargraydog", "/assets/sprites/stargraydog.png");
loadSprite("toastbeigedog", "/assets/sprites/toastbeigedog.png");
loadSprite("toastcat", "/assets/sprites/toastcat.png");
loadSprite("toastgraydog", "/assets/sprites/toastgraydog.png");




// --- Global Tracking State ---
const state = {
    posX: 0,              // Smoothed Screen X (Pixels)
    posY: 0,              // Smoothed Screen Y (Pixels)
    gameX: 0,             // Converted Game X (KAPLAY Units)
    gameY: 0,             // Converted Game Y (KAPLAY Units)
    isUserLookingAway: false,
    ALPHA: 0.15,          // Smoothing factor (0.1 - 0.2 is usually best)
    PADDING: 0,          // Boundary buffer
    lastDataTime: Date.now(),
    lookAwayStartTime: null,
    isUserLookingAway: false,
    money: 0,           
    earnRate: 1
};
const LOOK_AWAY_BUFFER = 2000;
let paused = 0
const FACE_LOSS_THRESHOLD = 2000; // ms to wait before declaring user "gone"

// --- Helper: Coordinate Mapping ---
// Converts raw browser pixels to KAPLAY scene coordinates
function screenToGamePos(screenX, screenY) {
    const canvas = k.canvas;
    const rect = canvas.getBoundingClientRect();

    // 1. Position relative to canvas element
    let x = screenX - rect.left;
    let y = screenY - rect.top;

    // 2. Scale based on internal resolution vs CSS size
    x *= k.width() / rect.width;
    y *= k.height() / rect.height;

    return k.vec2(x, y);
}

// --- WebGazer Logic ---
async function startWebGazer() {
    await webgazer.setGazeListener((data) => {
        const now = Date.now();

        // 1. Handle Lost Face (Null Data)
        if (!data) {
            if (now - state.lastDataTime > FACE_LOSS_THRESHOLD) {
                handleLookAway(true);
            }
            return;
        }

        // We have data, reset the heartbeat
        state.lastDataTime = now;

        // 2. Exponential Moving Average Smoothing
        state.posX = (state.posX * (1 - state.ALPHA)) + (data.x * state.ALPHA);
        state.posY = (state.posY * (1 - state.ALPHA)) + (data.y * state.ALPHA);

        // 3. Map to Game World
        const gamePos = screenToGamePos(state.posX, state.posY);
        state.gameX = gamePos.x;
        state.gameY = gamePos.y;
        // 4. Update the visual dot (DOM side)
        const dot = document.getElementById("gaze-dot");
        if (dot) {
            dot.style.transform = `translate3d(${state.posX}px, ${state.posY}px, 0)`;
            dot.style.opacity = "1";
        }

        // 5. Detection Logic (Check if gaze is out of game bounds)
        const isOffScreen = 
        data.x < state.PADDING || 
        data.x > (window.innerWidth - state.PADDING) ||
        data.y < state.PADDING || 
        data.y > (window.innerHeight - state.PADDING);
    
    handleLookAway(isOffScreen);
    }).begin();

    // Standard Setup
    webgazer.showVideoPreview(false)
            .showFaceFeedbackBox(false)
            .showPredictionPoints(false);
}

function handleLookAway(away) {
  if (away && !state.isUserLookingAway) {
      state.isUserLookingAway = true;
  } else if (!away && state.isUserLookingAway) {
      state.isUserLookingAway = false;
  }
}

function hideCameraFeed() {
    const elementsToHide = ["webgazerVideoContainer", "webgazerVideoFeed", "webgazerFaceFeedbackBox"];
    elementsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

// --- Scene: Calibration ---
scene("calibrate", () => {
    const overlay = document.getElementById("calib-overlay");
    const beginBtn = document.getElementById("begin-btn");
    const pointsGroup = document.getElementById("points-group");
    const points = document.querySelectorAll(".calib-point");
    
    let pointsLeft = points.length;
    const CLICKS_PER_POINT = 10;

    overlay.style.display = "flex";

    beginBtn.onclick = async () => {
        document.getElementById("start-btn-container").style.display = "none";
        pointsGroup.style.display = "block";
        await startWebGazer();
    };

    points.forEach(pt => {
        pt.setAttribute("data-clicks", 0);
        pt.innerText = CLICKS_PER_POINT;

        pt.onclick = (e) => {
            webgazer.recordScreenPosition(e.clientX, e.clientY, 'click');

            let clicks = parseInt(pt.getAttribute("data-clicks")) + 1;
            pt.setAttribute("data-clicks", clicks);
            pt.innerText = CLICKS_PER_POINT - clicks;

            if (clicks >= CLICKS_PER_POINT) {
                pt.style.visibility = "hidden";
                pointsLeft--;
            }

            if (pointsLeft <= 0) {
                hideCameraFeed();
                go("main");
            }
        };
    });

    onSceneLeave(() => {
        overlay.style.display = "none";
    });
});

scene("menu",()=>{
  add([pos(width()/4.4,height()/4),
    text("PLACE HOLDER TITLE",{
      font:"font",
      size: width() / 25,
      letterSpacing: 15,
      allign: "center",
      transform: (idx, ch) => ({
        color: rgb(0,0,0),
        pos: vec2(0, wave(-4, 4, time() * 4 + idx * 0.5)),
        scale: wave(1, 1.2, time() * 3 + idx),
        angle: wave(-9, 9, time() * 3 + idx),
    })
    })
  ]);
  function addButton(
    txt = "start game",
    p = vec2(200, 100),
    f = () => debug.log("hello"),
) {
    // add a parent background object
    const btn = add([
        rect(240, 80, { radius: 8 }),
        pos(p),
        area(),
        scale(1),
        anchor("center"),
        outline(4),
        color(255, 255, 255),
    ]);

    // add a child object that displays the text
    btn.add([
        text(txt),
        anchor("center"),
        color(0, 0, 0),
    ]);

    // onHoverUpdate() comes from area() component
    // it runs every frame when the object is being hovered
    btn.onHoverUpdate(() => {
        const t = time() * 10;
        btn.scale = vec2(1.2);
        setCursor("pointer");
    });
    // onHoverEnd() comes from area() component
    // it runs once when the object stopped being hovered
    btn.onHoverEnd(() => {
        btn.scale = vec2(1);
    });
    // onClick() comes from area() component
    // it runs once when the object is clicked
    btn.onClick(f);
    return btn;
}

// Adds the buttons with the function we added
addButton("Start", vec2(width()/2, height()/1.5), () => go("main")); //CHANGE BACK TO CALIBRATE LATER
addButton("Start", vec2(width()/2, height()/1.5), () => go("main")); //CHANGE BACK TO CALIBRATE LATER
addButton("Start", vec2(width()/2, height()/1.5), () => go("main")); //CHANGE BACK TO CALIBRATE LATER
addButton("Start", vec2(width()/2, height()/1.5), () => go("main")); //CHANGE BACK TO CALIBRATE LATER
})
go("menu")

scene("main",()=>{
  stay()
  // 1. White Background (No scaling needed, just update size)
  const background = add([
    rect(width(), height()),
    color(255, 255, 255),
  ]);

  // 2. Scenary Sprite
  const scenary = add([
    sprite("bed"),
  ]);

  onLoad(() => {
  scenary.scale = vec2(
    width() / scenary.width,
    height() / scenary.height
  );
  });

  // 3. Pet Sprite (Added last so it stays on top)
  const pet = add([
    sprite("gdog"),
    scale(.5,.5),
    pos(center()),
    anchor("center"),
    opacity(1), // <-- FIX: Add the opacity component
]);

function addButton(
  txt = "Pause",
  p = vec2(200, 100),
  s = vec2(240,80),
  f = () => debug.log("hello"),
) {
  // add a parent background object
  const btn = add([
      rect(s.x, s.y, { radius: 8 }),
      pos(p),
      area(),
      scale(1),
      anchor("center"),
      outline(4),
      color(255, 161, 161),
  ]);

  // add a child object that displays the text
  btn.add([
      text(txt),
      anchor("center"),
      color(0, 0, 0),
  ]);

  // onHoverUpdate() comes from area() component
  // it runs every frame when the object is being hovered
  btn.onHoverUpdate(() => {
      const t = time() * 10;
      btn.scale = vec2(1.2);
      setCursor("pointer");
  });
  // onHoverEnd() comes from area() component
  // it runs once when the object stopped being hovered
  btn.onHoverEnd(() => {
      btn.scale = vec2(1);
  });
  // onClick() comes from area() component
  // it runs once when the object is clicked
  btn.onClick(f);

  return btn;
}

// Adds the buttons with the function we added
const pauseButton = addButton("Pause", vec2(width()/2, height()/1.1),vec2(240,80),() => {
  if(paused == 0){
    paused = 1;
    pauseButton.color = rgb(210, 245, 128)
  }
  else{
    paused = 0;
    pauseButton.color = rgb(255, 161, 161)
  }
}); //THIS WILL PAUSE THE TRACKING
// shop button

addButton("",vec2(100,height()/2),vec2(150,150),()=>{go("shop")}).add([
  sprite("shop"),
  scale(.2,.2),
  pos(-85,-85)
])

async function typeWriter(message, speed = 0.05) {
    // 1. Create an empty text object
    const label = add([
        text(""),
        pos(center()),
        anchor("center"),
        color(255, 255, 255),
    ]);

    // 2. Loop through each character
    for (let i = 0; i < message.length; i++) {
        label.text += message[i];
        
        // Play a "blip" sound here if you have one!
        // play("blip", { detune: rand(-100, 100) });

        await wait(speed); // Wait 0.05 seconds before the next letter
    }
}



scene("shop",()=>{
  const textbox = add([
    rect(width()-90, (height() / 2)-100, {radius: 20}), // Shape: Full width, half height
    pos(45, (height() / 2)+68),        // Position: Starts halfway down
    color(255, 100, 100),
    outline(5,BLACK)
  ])
})
function showtext(text){
  textbox.add([
    anchor("center"),
    text(text, {
        size: 26,
    }),
    color(BLACK), 
]);
}
const moneyUI = add([
  text(`$${Math.floor(state.money)}`, { size: 48 }),
  pos(24, 24),
  color(0, 0, 0),
  fixed(), // Keeps the UI anchored to the screen if you add a camera later
  z(100),  // Forces it to draw on top of everything else
]);







// Local state to track transitions and prevent spamming debug logs
let wasLookingAway = false;

// FIX: Use Kaplay's idiomatic game loop to poll the WebGazer state
onUpdate(() => {
    // Trigger: User just looked away
    if (!paused && state.isUserLookingAway && !wasLookingAway) {
        pet.opacity = 0.5; // <-- FIX: Use 'pet', not 'dog'
        debug.log("Where did you go?");
        console.log("AWAY");
        wasLookingAway = true;
    } 
    // Trigger: User just returned
    else if (!state.isUserLookingAway && wasLookingAway) {
        pet.opacity = 1;
        debug.log("Welcome back!");
        console.log("RETURNED");
        wasLookingAway = false;
    }

    if (!state.isUserLookingAway && !paused) {
            
      // dt() is the fraction of a second since the last frame.
      // Multiplying by dt() ensures they earn exactly 'earnRate' per second.
      state.money += state.earnRate * dt(); 

      // Update the text visually (Math.floor hides the messy decimals)
      moneyUI.text = `$${Math.floor(state.money)}`;
  }
});
  function updateSizes() {
    // Update white background
    background.width = width();
    background.height = height();

    // Update stretched sprite
    if (scenary.width > 0) {
        scenary.scale = vec2(
            width() / scenary.width,
            height() / scenary.height
        );
    }
    //centers dog
    pet.pos = center()
}

  onResize(() => {
    console.log("updated")
    updateSizes();
  });
})


