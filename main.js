import kaplay from "kaplay";

const k = kaplay();

loadSprite("bed", "/assets/sprites/bed.png");
loadSprite("gdog", "/assets/sprites/gdog.png");

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
}

// Run once when loaded

// Run whenever window changes
onResize(() => {
  console.log("updated")
  updateSizes();
});