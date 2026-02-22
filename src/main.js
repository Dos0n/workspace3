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
loadSprite("graydog", "/assets/sprites/graydog.png");
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
loadSprite("glassesbeigedog", "/assets/sprites/glassesbeigedog.png");
loadSprite("catglasses", "/assets/sprites/catglasses.png");
let currentPet = ["",""]

let accessoryDict = {
  "glassesgraydog" : 0,
  "heartgraydog" : 0,
  "toastgraydog" : 0,
  "stargraydog":0,
  "glassesbeigedog" : 0,
  "heartbeigedog" : 0,
  "toastbeigedog" : 0,
  "starbeigedog": 0,
  "catglasses" : 0,
  "heartcat" : 0,
  "toastcat" : 0,
  "starcat" : 0
}

/*
assume accessory = name of accessory got from button from shop
if(accessoryDict[accessory + currentPet[0]] == 0){
  if(state.money > 10){
    state.money -= 10
    accessoryDict[accessory + currentPet[0]] = 1
    currentPet[0] = accessoryDict[accessory + currentPet[0]]
  }
}
else{
  currentPet[0] = accessoryDict[accessory + currentPet[0]]
  }



*/
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
    earnRate: 10
};
const LOOK_AWAY_BUFFER = 2000;
let paused = 0
const FACE_LOSS_THRESHOLD = 2000; // ms to wait before declaring user gone

function screenToGamePos(screenX, screenY) {
    const canvas = k.canvas;
    const rect = canvas.getBoundingClientRect();

    let x = screenX - rect.left;
    let y = screenY - rect.top;

    x *= k.width() / rect.width;
    y *= k.height() / rect.height;

    return k.vec2(x, y);
}


async function startWebGazer() {
  await webgazer.setGazeListener((data) => {
    const now = Date.now();

    if (!data) {
        if (now - state.lastDataTime > FACE_LOSS_THRESHOLD) {
            handleLookAway(true);
        }
        return;
    }

    state.lastDataTime = now;

    state.posX = (state.posX * (1 - state.ALPHA)) + (data.x * state.ALPHA);
    state.posY = (state.posY * (1 - state.ALPHA)) + (data.y * state.ALPHA);

    const gamePos = screenToGamePos(state.posX, state.posY);
    state.gameX = gamePos.x;
    state.gameY = gamePos.y;

    const dot = document.getElementById("gaze-dot");
    if (dot) {
        dot.style.transform = `translate3d(${state.posX}px, ${state.posY}px, 0)`;
        dot.style.opacity = "1";
    }

    const isOffScreen = 
    data.x < state.PADDING || 
    data.x > (window.innerWidth - state.PADDING) ||
    data.y < state.PADDING || 
    data.y > (window.innerHeight - state.PADDING);

  handleLookAway(isOffScreen);
  }).begin();

  webgazer.showVideoPreview(true)
          .showFaceFeedbackBox(true)
          .showPredictionPoints(false);
  const videoContainer = document.getElementById("webgazerVideoContainer");
    if (videoContainer) {
        videoContainer.style.opacity = "1";
    }
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
        if (el) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
        }
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
  add([pos(width()/10.4,height()/4),
    text("FUZZY WUZZY STUDY BUDDYS",{
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
    name = "graydog",
    p = vec2(200, 100),
    s = 1,
    f = () => debug.log("hello"),
  ){
    const btn = add([
      sprite(name),
      pos(p.x,p.y),
      scale(s),
      anchor("center"),
      area(),
    ])
    btn.onHoverUpdate(() => {
        const t = time() * 10;
        btn.scale = vec2(s * 1.2);
        setCursor("pointer");
    });
    btn.onHoverEnd(() => {
        btn.scale = vec2(s);
    });
    btn.onClick(f);
    return btn;
}

// Adds the buttons with the function we added
addButton("graydog", vec2(width()/5, height()/1.5),.5, () =>{//CHANGE BACK TO CALIBRATE LATER
  currentPet[0] = "graydog";
  currentPet[1] = "sadgraydog";
  go("calibrate")
}); 
addButton("beigedog", vec2(width()/2, height()/1.5),.5, () => {
  currentPet[0] = "beigedog";
  currentPet[1] = "crybeigedog";
  go("calibrate")
}); //CHANGE BACK TO CALIBRATE LATER
addButton("cat", vec2(width()/1.3, height()/1.5),.5, () => {
  currentPet[0] = "cat"
  currentPet[1] = "crycat"
  go("calibrate")
}); //CHANGE BACK TO CALIBRATE LATER
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
  let pet = add([
    sprite(currentPet[0]),
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
// Keep track of the current "active" message version
let messageCounter = 0;
let activeLabel = null;

async function showtext(message, speed = 0.05) {
    // 1. Increment the counter so old loops know to stop
    messageCounter++;
    const myId = messageCounter;

    // 2. Clean up the previous label if it exists
    if (activeLabel) {
        destroy(activeLabel);
        activeLabel = null;
    }

    // 3. Create the new label
    activeLabel = add([
        text("", { 
            size: 24, 
            width: width() - 150, 
            align: "center" 
        }),
        pos(width() / 2, (height() / 2) + 180),
        anchor("center"),
        color(255, 255, 255),
        z(10),
    ]);

    // 4. Typing Loop
    for (let i = 0; i < message.length; i++) {
        // CHECK: If a newer call has started (myId is no longer current),
        // stop this specific loop immediately.
        if (myId !== messageCounter) return;
        
        // CHECK: Safety check to ensure the label still exists
        if (!activeLabel.exists()) return;

        activeLabel.text += message[i];
        await wait(speed);
    }
}

//shoppe
scene("shop",()=>{
  
  const wall = add([
    sprite("bed"),
  ]);
  //addButton("return",vec2(100,height()/2),vec2(100,100),()=>{go("main")})
  wall.scale = vec2(
    width() / scenary.width,
    height() / scenary.height
  )
  const shopwall = add([
    rect(width()*2,height()*2),
    opacity(0.5),
    anchor("center"),
    color(rgb(255, 213, 85))
  ])
  let pet = add([
    sprite("hamster"),
    scale(.3,.3),
    pos(width()/2,(height()/2)-78),
    anchor("center"),
    opacity(1), // <-- FIX: Add the opacity component
  ])
  let shelf = add([
    sprite("shelves"),
    scale(.3,.3),
    pos(width()-250,(height()/2)-78),
    anchor("center"),
    opacity(1),
  ])
  let heart = add ([
    sprite("heart"),
    scale(.1,.1),
    pos(width()-175,(height()/2)-78),
    anchor("center"),
    opacity(1),
    area()
  ])
  let glasses = add ([
    sprite("glasses"),
    scale(.3,.3),
    pos(width()-350,(height()/2)-78),
    anchor("center"),
    opacity(1),
    area()
  ])
  let star = add ([
    sprite("star"),
    scale(.1,.1),
    pos(width()-250,(height()/2)-200),
    anchor("center"),
    opacity(1),
    area()
  ])
  let toast = add ([
    sprite("toast"),
    scale(.08,.08),
    pos(width()-350,(height()/2)-200),
    anchor("center"),
    opacity(1),
    area()
  ])
  const textbox = add([
    rect(width()-90, (height() / 2)-100, {radius: 20}), // Shape: Full width, half height
    pos(45, (height() / 2)+68),        // Position: Starts halfway down
    color(255, 100, 100),
    outline(5,BLACK)
  ])
  showtext("Hello, I'm the shopkeeper, welcome to the shop\nHover over an item to see its cost!");
  const retbut = add([
    rect(100, 100, { radius: 8 }),
    pos(20,height()/2),
    area(),
    color(255, 100, 100),
    outline(5,BLACK),
    
  ])
  retbut.add([
    text("return", {
        size: 26,
    }),
    anchor("center"),
    pos(50,50),
    color(0,0,0)
  ])
  // --- Hover logic for Shop Items ---

// Example for the Heart
heart.onHover(() => {
    showtext("Heart: Costs $500. Increases pet happiness!", 0.02);
});
heart.onHoverEnd(() => {
    showtext("Select an item to purchase.",100);
});

// Example for the Glasses
glasses.onHover(() => {
    showtext("Glasses: Costs $300. Look stylish!", 0.02);
});
glasses.onHoverEnd(() => {
    showtext("Select an item to purchase.",100);
});

// Example for the Star
star.onHover(() => {
    showtext("Star: Costs $700. Pure magic!", 0.02);
});
star.onHoverEnd(() => {
    showtext("Select an item to purchase.",100);
});

// Example for the Toast
toast.onHover(() => {
    showtext("Toast: Costs $1. A crunchy snack.", 0.02);
});
toast.onHoverEnd(() => {
    showtext("Select an item to purchase.",100);
});
 function whenclick(sprite) {

    retbut.onClick(() => go("main"));

    heart.onClick(() => {
        console.log("heart clicked")
        if (state.money > 500) {
            // Check if currentPet[0] is ANY of the gray dog variations
            console.log("can afford")
            if (["graydog", "heartgraydog", "stargraydog", "glassesgraydog", "toastgraydog", "sadgraydog"].includes(currentPet[0])) {
                currentPet[0] = "heartgraydog";
                state.money -= 500;
                go("main");
            } 
            else if (["beigedog", "starbeigedog", "toastbeigedog", "beigedogglasses", "heartbeigedog", "crybeigedog"].includes(currentPet[0])) {
                currentPet[0] = "heartbeigedog";
                state.money -= 500;
                go("main");
            } 
            else if (["cat", "heartcat", "starcat", "toastcat", "catglasses", "crycat"].includes(currentPet[0])) {
                currentPet[0] = "heartcat";
                state.money -= 500;
                go("main");
            }
        } else {
            showtext("Sorry, you don't have enough for the heart");
        }
    });

    glasses.onClick(() => {
        console.log("glasses clicked")
        if (state.money > 300) {
            console.log("can afford")
            if (["graydog", "heartgraydog", "stargraydog", "glassesgraydog", "toastgraydog", "sadgraydog"].includes(currentPet[0])) {
                currentPet[0] = "glassesgraydog";
                state.money -= 300;
                go("main");
            } 
            else if (["beigedog", "starbeigedog", "heartbeigedog", "toastbeigedog", "beigedogglasses", "crybeigedog"].includes(currentPet[0])) {
                currentPet[0] = "beigedogglasses";
                state.money -= 300;
                go("main");
            } 
            else if (["cat", "heartcat", "starcat", "catglasses", "toastcat", "crycat"].includes(currentPet[0])) {
                currentPet[0] = "catglasses";
                state.money -= 300;
                go("main");
            }
        } else {
            showtext("Sorry, you don't have enough for the glasses");
        }
    });

    toast.onClick(() => {
        console.log("toast")
        if (state.money > 1) {
            console.log("can afford")
            if (["graydog", "heartgraydog", "stargraydog", "glassesgraydog", "toastgraydog", "sadgraydog"].includes(currentPet[0])) {
                currentPet[0] = "toastgraydog";
                state.money -= 1;
                go("main");
            } 
            else if (["beigedog", "starbeigedog", "heartbeigedog", "beigedogglasses", "toastbeigedog", "crybeigedog"].includes(currentPet[0])) {
                currentPet[0] = "toastbeigedog";
                state.money -= 1;
                go("main");
            } 
            else if (["cat", "heartcat", "starcat", "catglasses", "toastcat", "crycat"].includes(currentPet[0])) {
                currentPet[0] = "toastcat";
                state.money -= 1;
                go("main");
            }
        } else {
            showtext("Sorry, you don't have enough for the toast");
        }
    });

    star.onClick(() => {
        if (state.money > 700) {
            if (["graydog", "heartgraydog", "stargraydog", "glassesgraydog", "toastgraydog", "sadgraydog"].includes(currentPet[0])) {
                currentPet[0] = "stargraydog";
                state.money -= 700;
                go("main");
            } 
            else if (["beigedog", "heartbeigedog", "toastbeigedog", "beigedogglasses", "starbeigedog", "crybeigedog"].includes(currentPet[0])) {
                currentPet[0] = "starbeigedog";
                state.money -= 700;
                go("main");
            } 
            else if (["cat", "heartcat", "starcat", "catglasses", "toastcat", "crycat"].includes(currentPet[0])) {
                currentPet[0] = "starcat";
                state.money -= 700;
                go("main");
            }
        } else {
            showtext("Sorry, you don't have enough for the star");
        }
    });
} // <-- FIX: End of whenclick function
whenclick(); // <-- FIX: Call it here instead of inside itself

}); // <-- FIX: Added missing bracket/parenthesis to close scene("shop")


const moneyUI = add([
  text(`$${Math.floor(state.money)}`, { size: 48 }),
  pos(24, 24),
  color(0, 0, 0),
  fixed(), // Keeps the UI anchored to the screen if you add a camera later
  z(100),  // Forces it to draw on top of everything else
]);

// Local state to track transitions and prevent spamming debug logs
let wasLookingAway = false;

// FIX: Use Kaplay's idiomatic game loop to poll the WebGazer state
onUpdate(() => {
    // Trigger: User just looked away
    pet.use(sprite(currentPet[0]));
    if (!paused && state.isUserLookingAway && !wasLookingAway) {
        pet.use(sprite(currentPet[1])); // <-- FIX: Use .use(sprite())
        wasLookingAway = true;
    } 
    // Trigger: User just returned
    else if (!state.isUserLookingAway && wasLookingAway) {
        pet.use(sprite(currentPet[0])); // <-- FIX: Use .use(sprite())
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