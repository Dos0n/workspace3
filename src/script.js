let posX = 0, posY = 0;
const ALPHA = 0.15; 
let pointsLeft = 9;
const CLICKS_PER_POINT = 10;
let isCalibrated = false;

// Testing & Reward Logic
let wallet = 0;
let streakSeconds = 0;
const MULTIPLIER_INTERVAL = 30; 
let focusMultiplier = 1.0;
const MAX_MULTIPLIER = 3.0;

// Grace Period & Sensitivity Logic
let awayTimer = 0; 
const GRACE_PERIOD = 10; // Back to 10 seconds
let lastValidX = 0;
let lastValidY = 0;

window.onload = function() {
    webgazer.params.showVideoPreview = true;
    webgazer.params.showPredictionPoints = false;
};

async function startCalibration() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('calibration-group').style.display = 'block';
    document.getElementById('gaze-dot').style.opacity = '1';
    
    await webgazer.begin();
    webgazer.applyKalmanFilter(true); 

    webgazer.setGazeListener(function(data, elapsedTime) {
        if (!isCalibrated && !data) return;

        const box = document.getElementById('status-box');
        const text = document.getElementById('status-text');

        let isAway = false;

        if (!data) {
            isAway = true;
        } else {
            // Boundary + Jump Detection logic
            const padding = 80;
            const offScreen = data.x < padding || data.x > (window.innerWidth - padding) || 
                              data.y < padding || data.y > (window.innerHeight - padding);

            const jumpDist = Math.sqrt(Math.pow(data.x - lastValidX, 2) + Math.pow(data.y - lastValidY, 2));
            
            if (offScreen || (isCalibrated && jumpDist > 400)) {
                isAway = true;
            } else {
                lastValidX = data.x;
                lastValidY = data.y;
            }
        }

        if (isCalibrated) {
            if (isAway) {
                text.innerText = "AWAY";
                text.style.color = "#ef4444";
                box.style.borderColor = "#ef4444";
            } else {
                text.innerText = focusMultiplier >= MAX_MULTIPLIER ? "🔥 MAX FOCUS" : "ACTIVE";
                text.style.color = "#22c55e";
                box.style.borderColor = "#22c55e";
            }
        }

        if (data) {
            posX = (posX * (1 - ALPHA)) + (data.x * ALPHA);
            posY = (posY * (1 - ALPHA)) + (data.y * ALPHA);
            document.getElementById('gaze-dot').style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
        }
    });

    setInterval(tickRewardSystem, 1000);
}

function tickRewardSystem() {
    if (!isCalibrated) return;

    const statusText = document.getElementById('status-text').innerText;
    
    if (statusText === "AWAY") {
        awayTimer++;
        if (awayTimer >= GRACE_PERIOD) {
            streakSeconds = 0; 
            focusMultiplier = 1.0;
            updateUI();
        }
        updateUI(); 
        return; 
    } else {
        awayTimer = 0; 
    }

    streakSeconds++;
    
    if (streakSeconds % MULTIPLIER_INTERVAL === 0 && focusMultiplier < MAX_MULTIPLIER) {
        focusMultiplier += 0.5;
        if (focusMultiplier > MAX_MULTIPLIER) focusMultiplier = MAX_MULTIPLIER;
    }

    wallet += (0.05 * focusMultiplier);
    updateUI();
}

function updateUI() {
    const streakBar = document.getElementById('streak-bar');
    const moneyFormatted = `$${wallet.toFixed(2)}`;
    const multFormatted = `${focusMultiplier.toFixed(1)}x`;
    const statusLabel = document.getElementById('status-text').innerText;

    document.getElementById('money-text').innerText = moneyFormatted;
    document.getElementById('multiplier-tag').innerText = multFormatted + " Focus Multiplier";
    document.getElementById('multiplier-tag').style.color = focusMultiplier >= MAX_MULTIPLIER ? "#fbbf24" : "#22c55e";

    let progress = ((streakSeconds % MULTIPLIER_INTERVAL) / MULTIPLIER_INTERVAL) * 100;
    if (focusMultiplier >= MAX_MULTIPLIER) progress = 100; 
    streakBar.style.width = progress + "%";
    streakBar.style.background = focusMultiplier >= MAX_MULTIPLIER ? "#fbbf24" : "#3b82f6";

    // Tab Title Updates
    if (statusLabel === "AWAY") {
        const timeLeft = Math.max(0, GRACE_PERIOD - awayTimer);
        document.title = `⚠️ ${timeLeft}s LEFT!`;
    } else {
        const icon = focusMultiplier >= MAX_MULTIPLIER ? "🔥" : "💰";
        document.title = `${icon} ${moneyFormatted} (${multFormatted})`;
    }
}

document.querySelectorAll('.calib-point').forEach(el => {
    el.onclick = function() {
        const rect = this.getBoundingClientRect();
        const centerX = rect.left + (rect.width / 2);
        const centerY = rect.top + (rect.height / 2);
        webgazer.recordScreenPosition(centerX, centerY, 'click');
        let clicks = parseInt(this.getAttribute('data-clicks')) + 1;
        this.setAttribute('data-clicks', clicks);
        this.innerText = CLICKS_PER_POINT - clicks;
        if (clicks >= CLICKS_PER_POINT) {
            this.style.opacity = "0";
            this.style.pointerEvents = "none";
            pointsLeft--;
        }
        if (pointsLeft === 0) {
            finalizeCalibration();
        }
    };
});

function finalizeCalibration() {
    isCalibrated = true;
    webgazer.removeMouseEventListeners(); 
    document.getElementById('calibration-group').style.display = 'none';
    document.getElementById('status-container').style.display = 'block';
    document.getElementById('reward-ui').style.display = 'block';
}