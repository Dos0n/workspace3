import kaplay from "kaplay";

const k = kaplay({
  background: [212, 110, 179]
});

//LOAD ALL ASSETS HERE
loadSprite("bed", "/assets/sprites/bed.png");
loadSprite("gdog", "/assets/sprites/gdog.png");
loadFont("font", "/assets/fonts/menufont.ttf");

console.log("starting")

scene("calibrate",()=>{


  
})

scene("menu",()=>{
  add([pos(width()/4,height()/4),
    text("PLACE HOLDER TITLE",{
      font:"font",
      size: width() / 25,
      letterSpacing: 15,
      allign: "center",
      transform: (idx, ch) => ({
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
addButton("Start", vec2(width()/2, height()/1.5), () => go("calibrate"));
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
    pos(center()),
    anchor("center"), // Centers the dog perfectly
  ]);

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


