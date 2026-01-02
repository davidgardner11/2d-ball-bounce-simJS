// Game state
let canvas;
let renderer;
let container;
let balls = [];
let lastTime = 0;

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
    const initialBall = new Ball(SCREEN_CENTER_X, SCREEN_CENTER_Y, initialVelocity.vx, initialVelocity.vy);
    balls.push(initialBall);

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
    renderer.drawAll(balls, container);

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
}

// Check if any balls should respawn
function checkRespawns() {
    // Process one ball at a time to avoid overlapping spawns
    for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        const distance = ball.distanceFrom(SCREEN_CENTER_X, SCREEN_CENTER_Y);

        if (distance > CORNER_DISTANCE) {
            respawnBall(i);
            return; // Only respawn one ball per frame
        }
    }
}

// Respawn a ball (replace with 2 new balls)
function respawnBall(index) {
    // Remove the old ball
    balls.splice(index, 1);

    // Spawn 2 new balls near the center, offset to avoid overlap
    // Calculate offset positions (balls are 20px diameter, so use 25px offset)
    const offset = 25; // Slightly more than ball diameter to ensure no overlap

    for (let i = 0; i < 2; i++) {
        const velocity = Physics.randomVelocity(200, 400);

        // Position balls on opposite sides of center
        const xOffset = (i === 0) ? -offset : offset;
        const x = SCREEN_CENTER_X + xOffset;
        const y = SCREEN_CENTER_Y;

        const newBall = new Ball(x, y, velocity.vx, velocity.vy);
        balls.push(newBall);
    }
}

// Start the simulation when page loads
window.addEventListener('load', init);
