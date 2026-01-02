class Physics {
    // Handle ball-to-ball elastic collision
    static ballToBallCollision(ball1, ball2) {
        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if balls are colliding
        if (distance >= ball1.radius + ball2.radius) {
            return; // No collision
        }

        // Normalize the collision normal
        const nx = dx / distance;
        const ny = dy / distance;

        // Relative velocity
        const dvx = ball1.vx - ball2.vx;
        const dvy = ball1.vy - ball2.vy;

        // Relative velocity along the collision normal
        const dvn = dvx * nx + dvy * ny;

        // Do not resolve if velocities are separating
        if (dvn > 0) {
            return;
        }

        // Calculate impulse (for equal mass, simplified formula)
        const impulse = 2 * dvn / (ball1.mass + ball2.mass);

        // Apply impulse to velocities
        ball1.vx -= impulse * ball2.mass * nx;
        ball1.vy -= impulse * ball2.mass * ny;
        ball2.vx += impulse * ball1.mass * nx;
        ball2.vy += impulse * ball1.mass * ny;

        // Separate balls to prevent overlap
        const overlap = (ball1.radius + ball2.radius) - distance;
        const separationX = (overlap / 2) * nx;
        const separationY = (overlap / 2) * ny;

        ball1.x -= separationX;
        ball1.y -= separationY;
        ball2.x += separationX;
        ball2.y += separationY;
    }

    // Handle ball-to-container collision
    static ballToContainerCollision(ball, container) {
        // Transform ball position to container's local coordinates
        const localPos = container.transformToLocal(ball.x, ball.y);
        const edges = container.getEdges();

        for (let edge of edges) {
            // Calculate distance from ball center to edge line segment
            const collision = this.pointToLineSegmentDistance(
                localPos,
                edge.p1,
                edge.p2,
                ball.radius
            );

            if (collision.colliding) {
                // Check if collision point is in the gap
                if (container.isPointInGap(edge, collision.closestPoint)) {
                    continue; // No collision in gap area
                }

                // Calculate vector from closest point to ball center (in local coords)
                const toBallX = localPos.x - collision.closestPoint.x;
                const toBallY = localPos.y - collision.closestPoint.y;
                const dist = Math.sqrt(toBallX * toBallX + toBallY * toBallY);

                if (dist === 0) continue; // Avoid division by zero

                // Normalized collision normal (pointing from wall to ball)
                const localNormalX = toBallX / dist;
                const localNormalY = toBallY / dist;

                // Transform normal to global coordinates
                const globalNormal = this.rotateVector(
                    { x: localNormalX, y: localNormalY },
                    container.rotation
                );

                // Check if ball is moving toward the wall
                const dotProduct = ball.vx * globalNormal.x + ball.vy * globalNormal.y;

                // Only reflect if moving toward the wall (negative dot product)
                if (dotProduct < 0) {
                    // Reflect velocity
                    ball.vx -= 2 * dotProduct * globalNormal.x;
                    ball.vy -= 2 * dotProduct * globalNormal.y;

                    // Push ball away from wall to prevent sticking/tunneling
                    const penetrationDepth = ball.radius - collision.distance;
                    ball.x += globalNormal.x * (penetrationDepth + 0.1);
                    ball.y += globalNormal.y * (penetrationDepth + 0.1);
                }
            }
        }
    }

    // Calculate distance from point to line segment
    static pointToLineSegmentDistance(point, p1, p2, radius) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lengthSquared = dx * dx + dy * dy;

        // Calculate projection parameter t
        let t = ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        // Find closest point on line segment
        const closestPoint = {
            x: p1.x + t * dx,
            y: p1.y + t * dy
        };

        // Calculate distance
        const distX = point.x - closestPoint.x;
        const distY = point.y - closestPoint.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        return {
            distance: distance,
            colliding: distance < radius,
            closestPoint: closestPoint
        };
    }

    // Rotate a vector by an angle
    static rotateVector(vector, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: vector.x * cos - vector.y * sin,
            y: vector.x * sin + vector.y * cos
        };
    }

    // Check if a ball would overlap with any existing balls
    static checkBallOverlap(x, y, radius, balls) {
        for (let ball of balls) {
            const dx = x - ball.x;
            const dy = y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < radius + ball.radius) {
                return true;
            }
        }
        return false;
    }

    // Find a valid spawn position for a ball
    static findSpawnPosition(balls, container, radius, screenWidth, screenHeight, maxAttempts = 100) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Random position within screen bounds
            const x = Math.random() * screenWidth;
            const y = Math.random() * screenHeight;

            // Check if position doesn't overlap with existing balls
            if (!this.checkBallOverlap(x, y, radius, balls)) {
                return { x, y };
            }
        }

        // If no position found, return null
        return null;
    }

    // Create random velocity for a ball
    static randomVelocity(minSpeed = 100, maxSpeed = 400) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        return {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        };
    }
}
