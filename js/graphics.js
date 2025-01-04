const cols = 64;
const rows = 32;
const scale = 12;

class graphics {
    reset() {
        this.display = new Array(cols * rows);
    }

    constructor(canvas) {
        this.reset();

        this.canvas = canvas;
        this.canvas.width = cols * scale;
        this.canvas.height = rows * scale;
        
        this.canvasCtx = this.canvas.getContext('2d');
    }

    setPixel(x, y) {
        if(x > cols) {
            x -= cols;
        }
        else if(x < 0) {
            x += cols;
        }
        if(y > rows) {
            y -= rows;
        }
        else if(y < 0) {
            y += rows;
        }

        this.display[x + (y * cols)] ^= 1;
        return this.display[x + (y * cols)] != 1;
    }

    paint() {
        this.canvasCtx.fillStyle = '#000';
        this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        for(let i = 0; i < cols*rows; i++) {
            let x = (i % cols) * scale;
            let y = Math.floor(i/cols) * scale;

            if(this.display[i] == 1) {
                this.canvasCtx.fillStyle = '#FFF';
                this.canvasCtx.fillRect(x, y, scale, scale);
            }
        }
    }

    testRender() {
        // Draw a simple test pattern
        this.reset();
        this.setPixel(0, 0);
        this.setPixel(63, 0);
        this.setPixel(0, 31);
        this.setPixel(63, 31);
        this.paint();
    }
}

export default graphics;