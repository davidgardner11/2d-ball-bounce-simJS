// Game state
let canvas;
let renderer;
let container;
let balls = [];
let lastTime = 0;
let respawnQueue = 0; // Number of balls waiting to respawn
// Shared ball radius (in px) controlled by slider
let BALL_RADIUS = 10;

// Dynamic screen dimensions
let SCREEN_WIDTH;
let SCREEN_HEIGHT;
let SCREEN_CENTER_X;
let SCREEN_CENTER_Y;
let CORNER_DISTANCE;

// Set canvas size to viewport size
function setCanvasSize() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    SCREEN_CENTER_X = SCREEN_WIDTH / 2;
    SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;
    CORNER_DISTANCE = Math.sqrt(SCREEN_CENTER_X * SCREEN_CENTER_X + SCREEN_CENTER_Y * SCREEN_CENTER_Y);

    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
}

// Initialize the simulation
function init() {
    canvas = document.getElementById('simulationCanvas');

    // Set canvas to fill viewport
    setCanvasSize();

    renderer = new Renderer(canvas);

    // Create container (400px square, centered on screen)
    container = new Container(SCREEN_CENTER_X, SCREEN_CENTER_Y, 400);

    // Create initial ball at center with random velocity
    const initialVelocity = Physics.randomVelocity(200, 400);
    const initialBall = new Ball(SCREEN_CENTER_X, SCREEN_CENTER_Y, initialVelocity.vx, initialVelocity.vy, BALL_RADIUS);
    balls.push(initialBall);

    // Hook up ball size, container size, hole size, and spin rate slider UI
    const slider = document.getElementById('ballSizeSlider');
    const valueDisplay = document.getElementById('ballSizeValue');
    const containerSlider = document.getElementById('containerSizeSlider');
    const containerDisplay = document.getElementById('containerSizeValue');
    const holeSlider = document.getElementById('holeSizeSlider');
    const holeDisplay = document.getElementById('holeSizeValue');

    if (slider && valueDisplay) {
        slider.value = BALL_RADIUS;
        valueDisplay.textContent = BALL_RADIUS;

        slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            BALL_RADIUS = val;
            valueDisplay.textContent = val;

            // Update existing balls to new radius and mass (mass ∝ area)
            for (let b of balls) {
                b.radius = BALL_RADIUS;
                b.mass = Math.PI * b.radius * b.radius;
            }
        });
    }

    // Initialize container and hole sliders
    if (containerSlider && containerDisplay) {
        containerSlider.value = container.size;
        containerDisplay.textContent = container.size;

        // Ensure hole slider max equals container size
        if (holeSlider) {
            holeSlider.max = container.size;
            // If hole slider value is larger than container size, clamp it
            if (parseInt(holeSlider.value, 10) > container.size) {
                holeSlider.value = container.size;
            }
            holeDisplay.textContent = holeSlider.value;
            container.gapLength = parseInt(holeSlider.value, 10);
        }

        containerSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            const oldSize = container.size;
            const scaleFactor = val / oldSize;
            container.size = val;
            containerDisplay.textContent = val;

            // Scale the gap length proportionally with the container size
            container.gapLength *= scaleFactor;

            // Update hole slider max and scale its value proportionally
            if (holeSlider) {
                holeSlider.max = val;
                const scaledHoleValue = Math.min(container.gapLength, val);
                holeSlider.value = Math.round(scaledHoleValue);
                holeDisplay.textContent = holeSlider.value;
            }
        });
    }

    if (holeSlider && holeDisplay) {
        // Initialize display if not already set
        holeDisplay.textContent = holeSlider.value;

        holeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            holeDisplay.textContent = val;
            container.gapLength = val;
        });
    }

    // Hook up spin rate slider UI
    const spinRateSlider = document.getElementById('spinRateSlider');
    const spinRateDisplay = document.getElementById('spinRateValue');

    if (spinRateSlider && spinRateDisplay) {
        // Initialize with current rotation speed
        spinRateSlider.value = container.rotationSpeed;
        spinRateDisplay.textContent = container.rotationSpeed.toFixed(2);

        spinRateSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            spinRateDisplay.textContent = val.toFixed(2);
            container.rotationSpeed = val;
        });
    }

    // Handle window resize
    window.addEventListener('resize', handleResize);

    // Start animation loop
    requestAnimationFrame(gameLoop);
}

// Handle window resize
function handleResize() {
    const oldCenterX = SCREEN_CENTER_X;
    const oldCenterY = SCREEN_CENTER_Y;

    setCanvasSize();

    // Adjust container position to new center
    container.centerX = SCREEN_CENTER_X;
    container.centerY = SCREEN_CENTER_Y;

    // Adjust ball positions relative to new center
    const deltaX = SCREEN_CENTER_X - oldCenterX;
    const deltaY = SCREEN_CENTER_Y - oldCenterY;

    for (let ball of balls) {
        ball.x += deltaX;
        ball.y += deltaY;
    }
}

// Main game loop
function gameLoop(currentTime) {
    // Calculate delta time in seconds
    const dt = lastTime === 0 ? 0 : (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Cap delta time to prevent large jumps
    const cappedDt = Math.min(dt, 0.033); // Max 33ms (30 FPS minimum)

    // Update simulation
    update(cappedDt);

    // Render frame
    renderer.drawAll(balls, container, respawnQueue);

    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Update simulation
function update(dt) {
    if (dt === 0) return;

    // Update container rotation
    container.update(dt);

    // Update balls
    for (let ball of balls) {
        // Apply gravity
        ball.applyGravity(dt);

        // Update position
        ball.update(dt);
    }

    // Handle ball-to-ball collisions
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            Physics.ballToBallCollision(balls[i], balls[j]);
        }
    }

    // Handle ball-to-container collisions
    for (let ball of balls) {
        Physics.ballToContainerCollision(ball, container);
    }

    // Check for respawn conditions
    checkRespawns();

    // Process respawn queue
    processRespawnQueue();
}

// Check if any balls should respawn
function checkRespawns() {
    // Check all balls to see if they should be added to respawn queue
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        const distance = ball.distanceFrom(SCREEN_CENTER_X, SCREEN_CENTER_Y);

        if (distance > CORNER_DISTANCE) {
            // Remove the ball and add to respawn queue (each ball spawns 2 new balls)
            balls.splice(i, 1);
            respawnQueue += 2;
        }
    }
}

// Process respawn queue - try to spawn balls when there's space
function processRespawnQueue() {
    if (respawnQueue === 0) return;

    // Calculate spawn positions
    const offset = 25; // Offset from center to avoid overlap
    const spawnPositions = [
        { x: SCREEN_CENTER_X - offset, y: SCREEN_CENTER_Y },
        { x: SCREEN_CENTER_X + offset, y: SCREEN_CENTER_Y }
    ];

    // Try to spawn up to 2 balls per frame (one pair)
    let spawned = 0;
    for (let i = 0; i < spawnPositions.length && spawned < 2 && respawnQueue > 0; i++) {
        const pos = spawnPositions[i];

        // Check if this position is safe (no collisions with existing balls)
        if (canSpawnAt(pos.x, pos.y)) {
            const velocity = Physics.randomVelocity(200, 400);
            const newBall = new Ball(pos.x, pos.y, velocity.vx, velocity.vy, BALL_RADIUS);
            balls.push(newBall);
            respawnQueue--;
            spawned++;
        }
    }
}

// Check if a ball can safely spawn at the given position
function canSpawnAt(x, y) {
    const spawnRadius = BALL_RADIUS; // Ball radius
    const safetyMargin = 5; // Extra space to ensure no immediate collision
    const checkRadius = spawnRadius + safetyMargin;

    // Check against all existing balls
    for (let ball of balls) {
        const dx = x - ball.x;
        const dy = y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If too close to another ball, can't spawn here
        if (distance < checkRadius + ball.radius) {
            return false;
        }
    }

    return true;
}

// Start the simulation when page loads
window.addEventListener('load', init);
