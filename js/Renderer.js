class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    clear() {
        this.ctx.fillStyle = '#2a2a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawContainer(container) {
        const ctx = this.ctx;
        const corners = container.getCorners();

        ctx.save();

        // Draw the square container
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 3;
        ctx.beginPath();

        // Get edges to draw with gap
        const edges = container.getEdges();
        const half = container.size / 2;

        for (let edge of edges) {
            if (edge.name === 'top') {
                // Draw top edge with gap
                const gapStart = -container.gapLength / 2;
                const gapEnd = container.gapLength / 2;

                // Left part of top edge
                const leftStart = container.transformToGlobal(-half, -half);
                const leftEnd = container.transformToGlobal(gapStart, -half);

                ctx.moveTo(leftStart.x, leftStart.y);
                ctx.lineTo(leftEnd.x, leftEnd.y);

                // Right part of top edge
                const rightStart = container.transformToGlobal(gapEnd, -half);
                const rightEnd = container.transformToGlobal(half, -half);

                ctx.moveTo(rightStart.x, rightStart.y);
                ctx.lineTo(rightEnd.x, rightEnd.y);
            } else {
                // Draw complete edge
                const p1Global = container.transformToGlobal(edge.p1.x, edge.p1.y);
                const p2Global = container.transformToGlobal(edge.p2.x, edge.p2.y);

                ctx.moveTo(p1Global.x, p1Global.y);
                ctx.lineTo(p2Global.x, p2Global.y);
            }
        }

        ctx.stroke();

        // Draw gap indicators (small markers at gap edges)
        ctx.strokeStyle = '#ff4a4a';
        ctx.lineWidth = 2;

        const gapStart = -container.gapLength / 2;
        const gapEnd = container.gapLength / 2;

        const gapStartGlobal = container.transformToGlobal(gapStart, -half);
        const gapEndGlobal = container.transformToGlobal(gapEnd, -half);

        // Draw small perpendicular lines at gap edges
        const markerLength = 10;
        const angle = container.rotation;
        const perpX = Math.sin(angle) * markerLength;
        const perpY = -Math.cos(angle) * markerLength;

        ctx.beginPath();
        ctx.moveTo(gapStartGlobal.x - perpX, gapStartGlobal.y - perpY);
        ctx.lineTo(gapStartGlobal.x + perpX, gapStartGlobal.y + perpY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(gapEndGlobal.x - perpX, gapEndGlobal.y - perpY);
        ctx.lineTo(gapEndGlobal.x + perpX, gapEndGlobal.y + perpY);
        ctx.stroke();

        ctx.restore();
    }

    drawBall(ball) {
        const ctx = this.ctx;

        ctx.save();
        ctx.fillStyle = '#ffcc00';
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    drawAll(balls, container) {
        this.clear();
        this.drawContainer(container);

        for (let ball of balls) {
            this.drawBall(ball);
        }

        // Draw info text
        this.drawInfo(balls);
    }

    drawInfo(balls) {
        const ctx = this.ctx;

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.fillText(`Balls: ${balls.length}`, 20, 30);
        ctx.restore();
    }
}
