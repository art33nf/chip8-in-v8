const memory = 4096;
const registers = 16;

class CPU {
    constructor(viewport, keyboard, speaker) {
        this.viewport = viewport;
        this.keyboard = keyboard;
        this.speaker = speaker;
        this.m = new Uint8Array(memory);
        this.r = new Uint8Array(registers);
        this.index = 0;
        this.pc = 0x200;
        this.stack = [];
        this.delayTimer = 0;
        this.soundTimer = 0;
        this.paused = false;
        this.speed = 10;
    }

    loadSprites() {
        const sprites = [
            0xF0, 0x90, 0x90, 0x90, 0xF0,
            0x20, 0x60, 0x20, 0x20, 0x70,
            0xF0, 0x10, 0xF0, 0x80, 0xF0,
            0xF0, 0x10, 0xF0, 0x10, 0xF0,
            0x90, 0x90, 0xF0, 0x10, 0x10,
            0xF0, 0x80, 0xF0, 0x10, 0xF0,
            0xF0, 0x80, 0xF0, 0x90, 0xF0,
            0xF0, 0x10, 0x20, 0x40, 0x40,
            0xF0, 0x90, 0xF0, 0x90, 0xF0,
            0xF0, 0x90, 0xF0, 0x10, 0xF0,
            0xF0, 0x90, 0xF0, 0x90, 0x90,
            0xE0, 0x90, 0xE0, 0x90, 0xE0,
            0xF0, 0x80, 0x80, 0x80, 0xF0,
            0xE0, 0x90, 0x90, 0x90, 0xE0,
            0xF0, 0x80, 0xF0, 0x80, 0xF0,
            0xF0, 0x80, 0xF0, 0x80, 0x80 
        ];
    
        for (let i = 0; i < sprites.length; i++) {
            this.m[i] = sprites[i];
        }
    }

    loadProgram(program) {
        for(let i = 0; i < program.length; i++) {
            this.m[0x200 + i] = program[i];
        }
    }

    cycle() {
        for(let i = 0; i < this.speed; i++) {
            if(!this.paused) {
                let opcode = (this.m[this.pc] << 8 | this.m[this.pc + 1]);                

                this.interpret(opcode);
            }
        }

        if(!this.paused) {
            this.updateTime();
        }
        this.sound();
        this.viewport.paint();
    }

    updateTime() {
        if(this.delayTimer > 0) {
            this.delayTimer -= 1;
        }
        if(this.soundTimer > 0) {
            this.soundTimer -= 1;
        }
    }

    sound() {
        if(this.soundTimer > 0) {
            this.speaker.play();
        }
        else {
            this.speaker.stop();
        }
    }

    interpret(instruction) {
        this.pc += 2;
        
        const x = (instruction & 0x0F00) >> 8;
        const y = (instruction & 0x00F0) >> 4;
        
        switch(instruction & 0xF000) {
            case 0x0000:
                switch(instruction) {
                    case 0x00E0:
                        this.viewport.reset();
                        break;
                    case 0x00EE:
                        this.pc = this.stack.pop();
                        break;
                }
                break;
            case 0x1000:
                this.pc = instruction & 0xFFF;
                break;
            case 0x2000:
                this.stack.push(this.pc);
                this.pc = (instruction & 0xFFF)
                break;
            case 0x3000:
                if(this.r[x] === (instruction & 0xFF)) {
                    this.pc += 2;
                }
                break;
            case 0x4000:
                if(this.r[x] != (instruction & 0xFF)) {
                    this.pc += 2;
                }
                break;
            case 0x5000:
                if(this.r[x] === this.r[y]) {
                    this.pc += 2;
                }
                break;
            case 0x6000:
                this.r[x] = (instruction & 0xFF);
                break;
            case 0x7000:
                this.r[x] += (instruction & 0xFF);
                break;
            case 0x8000:
                switch(instruction & 0xF) {
                    case 0x0:
                        this.r[x] = this.r[y];
                        break;
                    case 0x1:
                        this.r[x] |= this.r[y];
                        break;
                    case 0x2:
                        this.r[x] &= this.r[y];
                        break;
                    case 0x3:
                        this.r[x] ^= this.r[y];
                        break;
                    case 0x4:
                        let sum = (this.r[x] += this.r[y]);

                        this.r[0xF] = 0;

                        if(sum > 0xFF) {
                            this.r[0xF] = 1;
                        }
                        
                        this.r[x] = sum;
                        break;
                    case 0x5:
                        this.r[0xF] = 0;            
                        if(this.r[x] > this.r[y])
                            this.r[0xF] = 1;
                        
                        this.r[x] -= this.r[y];
                        break;
                    case 0x6:
                        this.r[0xF] = this.r[x] & 0x1;
                        this.r[x] >>= 1;
                        break;
                    case 0x7:
                        this.r[0xF] = 0;       
                        if(this.r[y] > this.r[x]) {
                            this.r[0xF] = 1;
                        }
                        this.r[x] = this.r[y] - this.r[x];
                        break;
                }
                break;
            case 0x9000:
                if(this.r[x] != this.r[y]) {
                    this.pc += 2;
                }
                break;
            case 0xA000:
                this.index = instruction & 0xFFF;
                break;
            case 0xB000:
                this.pc = (instruction & 0xFFF) + this.r[0];
                break;
            case 0xC000:
                let rand = Math.floor(Math.random() * 0xFF);
                this.r[x] = rand & (instruction & 0xFF);
                break;
            case 0xD000:
                let width = 8;
                let height = (instruction & 0xF);

                this.r[0xF] = 0;

                for(let row = 0; row < height; row++) {
                    let sprite = this.m[this.index + row];

                    for(let col = 0; col < width; col++) {
                        if((sprite & 0x80) > 0) {
                            if(this.viewport.setPixel(this.r[x] + col, this.r[y] + row)) {
                                this.r[0xF] = 1;
                            }
                        }
                        sprite <<= 1;
                    }
                }

                break;
            case 0xE000:
                switch(instruction & 0xFF) {
                    case 0x9E:
                        if(this.keyboard.isKeyPressed(this.r[x])) {
                            this.pc += 2;
                        }
                        break;
                    case 0xA1:
                        if(!this.keyboard.isKeyPressed(this.r[x])) {
                            this.pc += 2;
                        }
                        break;
                    default:
                        throw new Error('opcode error');
                }
                break;
            case 0xF000:
                switch(instruction & 0xFF) {
                    case 0x07:
                        this.r[x] = this.delayTimer;
                        break;
                    case 0x0A:
                        this.paused = true;

                        let nextKeyPress = (key) => {
                            this.r[x] = key;
                            this.paused = false;
                        }

                        this.keyboard.onNextKeyPress = nextKeyPress.bind(this);
                        break;
                    case 0x15:
                        this.delayTimer = this.r[x];
                        break;
                    case 0x18:
                        this.soundTimer = this.r[x];
                        break;
                    case 0x1E:
                        this.index += this.r[x];
                        break;
                    case 0x29:
                        this.index = this.r[x] * 5;
                        break;
                    case 0x33:
                        this.m[this.index] = parseInt(this.r[x] / 100);
                        this.m[this.index + 1] = parseInt((this.r[x]%100)/10);
                        this.m[this.index + 2] = parseInt(this.r[x]%10);
                        break;
                    case 0x55:
                        for(let ri = 0; ri <= x; ri++) {
                            this.m[this.index + ri] = this.r[ri];
                        }
                        break;
                    case 0x65:
                        for(let ri = 0; ri <= x; ri++) {
                            this.r[ri] = this.m[this.index + ri];
                        }
                        break;
                    default:
                        console.error(`Unknown opcode: 0x${instruction.toString(16).toUpperCase()}`);
                        throw new Error('opcode error' + instruction);
                }
                break;
            default:
                throw new Error('opcode error');
        }
    }
}

export default CPU;