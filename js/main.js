import graphics from './graphics.js';
import CPU from './CPU.js';
import Keyboard from './keyboard.js';
import Speaker from './speaker.js';

const visuals = new graphics(document.getElementById('screen'));
const keyboard = new Keyboard()
const speaker = new Speaker();
const cpu = new CPU(visuals, keyboard, speaker);

const FPS = 60;
let loop, fpsInterval, now, then, elapsed;

function loadRom(romName) {
    function step() {
        now = Date.now();
        elapsed = now - then;

        if(elapsed > fpsInterval) {
            cpu.cycle();
        }

        loop = requestAnimationFrame(step);
    }

    const url = `/roms/${romName}`;
    fetch(url)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Failed to load ROM: ${res.statusText}`);
            }
            console.log('ROM loaded successfully');
            return res.arrayBuffer();
        })
        .then(buffer => {
            console.log('ROM converted to array buffer');
            const program = new Uint8Array(buffer);
            fpsInterval = 1000 / FPS;
            then = Date.now();
            cpu.loadSprites();
            console.log('Sprites loaded');
            cpu.loadProgram(program);
            console.log('Program loaded');
            loop = requestAnimationFrame(step);
        })
        .catch(error => {
            console.error('Error loading ROM:', error);
        });
}

loadRom('INVADERS');

