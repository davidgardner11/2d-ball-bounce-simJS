class Container {
    constructor(centerX, centerY, size) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.size = size; // Side length of the square
        this.rotation = 0; // Current rotation in radians
        this.rotationSpeed = (2 * Math.PI) / 10; // 1 revolution every 10 seconds = 0.628 rad/s

        // Gap is 1/3 of edge length, centered on top edge
        this.gapLength = size / 3;
        this.gapEdge = 'top'; // Gap is on the top edge initially
    }

    update(dt) {
        // Update rotation
        this.rotation += this.rotationSpeed * dt;
        // Keep rotation within 0 to 2π
        if (this.rotation >= 2 * Math.PI) {
            this.rotation -= 2 * Math.PI;
        }
    }

    // Transform a point from global coordinates to container's local (rotated) coordinates
    transformToLocal(x, y) {
        // Translate to origin
        const dx = x - this.centerX;
        const dy = y - this.centerY;

        // Rotate by negative rotation angle
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);

        return {
            x: dx * cos - dy * sin,
            y: dx * sin + dy * cos
        };
    }

    // Transform a point from local coordinates to global coordinates
    transformToGlobal(localX, localY) {
        // Rotate by positive rotation angle
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);

        const rotatedX = localX * cos - localY * sin;
        const rotatedY = localX * sin + localY * cos;

        // Translate back
        return {
            x: rotatedX + this.centerX,
            y: rotatedY + this.centerY
        };
    }

    // Get the four edges of the square in local coordinates
    // Each edge is represented as {p1: {x, y}, p2: {x, y}, normal: {x, y}}
    getEdges() {
        const half = this.size / 2;

        return [
            // Top edge (where the gap is)
            {
                name: 'top',
                p1: { x: -half, y: -half },
                p2: { x: half, y: -half },
                normal: { x: 0, y: -1 } // Points inward (downward in local frame)
            },
            // Right edge
            {
                name: 'right',
                p1: { x: half, y: -half },
                p2: { x: half, y: half },
                normal: { x: -1, y: 0 } // Points inward (leftward in local frame)
            },
            // Bottom edge
            {
                name: 'bottom',
                p1: { x: half, y: half },
                p2: { x: -half, y: half },
                normal: { x: 0, y: 1 } // Points inward (upward in local frame)
            },
            // Left edge
            {
                name: 'left',
                p1: { x: -half, y: half },
                p2: { x: -half, y: -half },
                normal: { x: 1, y: 0 } // Points inward (rightward in local frame)
            }
        ];
    }

    // Check if a point on an edge is within the gap
    // Point should be in local coordinates
    isPointInGap(edge, localPoint) {
        if (edge.name !== 'top') {
            return false; // Gap is only on top edge
        }

        // Gap is centered, so it spans from -gapLength/2 to +gapLength/2 on the x-axis
        const gapStart = -this.gapLength / 2;
        const gapEnd = this.gapLength / 2;

        return localPoint.x >= gapStart && localPoint.x <= gapEnd;
    }

    // Get the corners of the container in global coordinates
    getCorners() {
        const half = this.size / 2;
        const corners = [
            { x: -half, y: -half },
            { x: half, y: -half },
            { x: half, y: half },
            { x: -half, y: half }
        ];

        return corners.map(corner => this.transformToGlobal(corner.x, corner.y));
    }
}
