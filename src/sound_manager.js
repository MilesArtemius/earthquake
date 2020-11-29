let clips = {};
let audio = null;

export function init_audio () {
    clips = {};
    audio = null;
}

function load (path) {
    clips[path] = new Audio("files/" + path);
}

export function loadArray (array) {
    for (let i = 0; i < array.length; i++) load(array[i]);
}

export function play (sound, repet, volume) {
    if (audio) audio.pause();
    audio = clips[sound];
    audio.play().catch(_ => {});
    audio.onended = function () { if (repet) play(sound, repet, volume); };
}

export function stop () {
    if (audio) audio.pause();
}
