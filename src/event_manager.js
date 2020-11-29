import { stop } from './sound_manager.js';

const immediates = ['ArrowUp', 'ArrowDown', 'w', 's'];
export let callback = null;
export let escaped = false;

export function init_events () {
    callback = undefined;
    escaped = false;
    document.body.addEventListener("keydown", onKeyDown);
}

export function set_callback(func) {
    callback = func;
}

export function escape () {
    escaped = true;
}

function onKeyDown (event) {
    if (event.key === 'Escape') escaped = true;
    else if (immediates.includes(event.key) && (callback)) callback(event.key);
}

function onEnd (event) {
    if (event.key === 'Escape') {
        stop();
        document.getElementById("game").style.display = "none";
        document.getElementById("menu").style.display = "block";
        document.body.removeEventListener("keydown", onEnd);
    }
}

export function finish () {
    document.body.removeEventListener("keydown", onKeyDown);
    document.body.addEventListener("keydown", onEnd);
}
