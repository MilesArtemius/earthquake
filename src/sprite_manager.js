import { isVisible, tileSize, tSize } from './map_manager.js';

let image = new Image();
let sprites = [];
let imgLoaded = false;
let jsonLoaded = false;

export function init_sprites () {
    image = new Image();
    sprites = [];
    imgLoaded = false;
    jsonLoaded = false;
}

function loadImg (imgName) {
    image.onload = function () { imgLoaded = true; };
    image.src = "files/" + imgName
    image.id = imgName
}

export function loadAtlas (atlasJson, atlasImg) {
    const request = new XMLHttpRequest()
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) parseAtlas(request.responseText)
    }
    request.open('GET', "files/" + atlasJson, true)
    request.send()
    loadImg(atlasImg)
}

function parseAtlas (atlasJSON) {
    const atlas = JSON.parse(atlasJSON)
    for (const i in atlas) { // in => of
        const frame = atlas[i];
        sprites.push({
            name: frame.name,
            x: frame.x,
            y: frame.y,
            w: frame.width,
            h: frame.height
        });
    }

    jsonLoaded = true;
}

export function drawSprite (ctx, name, x, y, w, h, curFrame) {
    if (!imgLoaded || !jsonLoaded) {
        setTimeout(function () {
            drawSprite(ctx, name, x, y, w, h, curFrame)
        }, 100)
    } else {
        if (!isVisible(x, y, w, h)) return // не рисуем за пределами видимой зоны
        const sprite = getSprite(name) // получить спрайт по имени
        ctx.drawImage(image, sprite.x + curFrame * tSize.x, sprite.y, tSize.x, tSize.y,
            x, y, w, h);
    }
}

export function drawSpriteRotated (ctx, name, x, y, w, h, curFrame, angle) {
    if (!imgLoaded || !jsonLoaded) {
        setTimeout(function () {
            drawSpriteRotated(ctx, name, x, y, w, h, curFrame, angle)
        }, 100)
    } else {
        if (!isVisible(x, y, w, h)) return // не рисуем за пределами видимой зоны
        const sprite = getSprite(name) // получить спрайт по имени
        const tx = x + w / 2;
        const ty = y + h / 2;
        ctx.translate(tx, ty);
        ctx.rotate(angle);
        ctx.drawImage(image, sprite.x + curFrame * tSize.x, sprite.y, tSize.x, tSize.y * (h / tileSize),
            -w / 2, -h / 2, w, h);
        ctx.rotate(-angle);
        ctx.translate(-tx, -ty);
    }
}

function getSprite (name) {
    for (let i = 0; i < sprites.length; i++) {
        const s = sprites[i]
        if (s.name === name) return s;
    }
    return null;
}
