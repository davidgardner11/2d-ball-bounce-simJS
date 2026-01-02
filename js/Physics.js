class Physics {
    // Handle ball-to-ball elastic collision
    static ballToBallCollision(ball1, ball2) {
        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if balls are actually overlapping (not just touching)
        if (distance >= ball1.radius + ball2.radius - 0.1) {
            return; // No significant collision
        }

        // Handle overlapping balls (distance near zero)
        if (distance < 0.001) {
            // Push balls apart in a random direction to unstick them
            const angle = Math.random() * Math.PI * 2;
            const pushDistance = (ball1.radius + ball2.radius) / 2 + 0.5;
            ball1.x -= Math.cos(angle) * pushDistance;
            ball1.y -= Math.sin(angle) * pushDistance;
            ball2.x += Math.cos(angle) * pushDistance;
            ball2.y += Math.sin(angle) * pushDistance;
            return;
        }

        // Normalize the collision normal
        const nx = dx / distance;
        const ny = dy / distance;

        // ALWAYS separate balls first to resolve overlap
        const overlap = (ball1.radius + ball2.radius) - distance;
        const minSeparation = 2.0; // Minimum separation distance
        const separationDistance = Math.max(overlap / 2 + 1.0, minSeparation / 2);
        const separationX = separationDistance * nx;
        const separationY = separationDistance * ny;

        ball1.x -= separationX;
        ball1.y -= separationY;
        ball2.x += separationX;
        ball2.y += separationY;

        // Relative velocity
        const dvx = ball1.vx - ball2.vx;
        const dvy = ball1.vy - ball2.vy;

        // Relative velocity along the collision normal
        const dvn = dvx * nx + dvy * ny;

        // Calculate impulse for elastic collision
        const impulse = 2 * dvn / (ball1.mass + ball2.mass);

        // Apply impulse to velocities (always apply, not just when approaching)
        ball1.vx -= impulse * ball2.mass * nx;
        ball1.vy -= impulse * ball2.mass * ny;
        ball2.vx += impulse * ball1.mass * nx;
        ball2.vy += impulse * ball1.mass * ny;
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

                if (dist < 0.001) continue; // Avoid division by zero

                // Normalized collision normal (pointing from wall to ball)
                const localNormalX = toBallX / dist;
                const localNormalY = toBallY / dist;

                // Transform normal to global coordinates
                const globalNormal = this.rotateVector(
                    { x: localNormalX, y: localNormalY },
                    container.rotation
                );

                // Calculate penetration depth
                const penetrationDepth = ball.radius - collision.distance;

                // Always push ball away from wall first to resolve penetration
                // Ensure minimum separation to prevent tunneling
                const minSeparation = 2.0;
                const totalSeparation = Math.max(penetrationDepth + 1.0, minSeparation);
                ball.x += globalNormal.x * totalSeparation;
                ball.y += globalNormal.y * totalSeparation;

                // Always reflect velocity for collision response
                const dotProduct = ball.vx * globalNormal.x + ball.vy * globalNormal.y;
                ball.vx -= 2 * dotProduct * globalNormal.x;
                ball.vy -= 2 * dotProduct * globalNormal.y;
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
