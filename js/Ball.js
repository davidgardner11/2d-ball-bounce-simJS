class Ball {
    constructor(x, y, vx, vy, radius = 10) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius; // radius in pixels
        // Mass proportional to area (density = 1)
        this.mass = Math.PI * this.radius * this.radius;
    }

    update(dt) {
        // Update position based on velocity
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    applyGravity(dt) {
        // Gravity: 9.8 m/s² = 980 px/s² (using 100px = 1m scale)
        const gravity = 980;
        this.vy += gravity * dt;
    }

    // Get distance from a point
    distanceFrom(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Check if this ball overlaps with another ball
    overlaps(otherBall) {
        const dx = this.x - otherBall.x;
        const dy = this.y - otherBall.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + otherBall.radius);
    }

    // Create a copy of this ball
    clone() {
        return new Ball(this.x, this.y, this.vx, this.vy, this.radius);
    }
}
