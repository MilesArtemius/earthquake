import { factory, fix_offsets, initPlayer, level } from './game_manager.js';

let mapData = null;
let tLayer = null;
let imgLoadCount = 0;
let imgLoaded = false;
let jsonLoaded = false;
let tilesets = [];

let xCount = 0;
let yCount = 0;

export let view = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };

export let tSize = { x: 32, y: 32 };
let mSize = { x: 8, y: 16 };

export let tileSize = 135;
let mapSize = { x: 1080, y: 2160 };
export let floor = { l: 945, h: 135 };

export let world_speed = 32;
export let world_speedup = 0.001;
export let world_run = 0;
export let world_offset = 0;



export function map_init () {
    mapData = null;
    tLayer = null;
    imgLoadCount = 0;
    imgLoaded = false;
    jsonLoaded = false;
    tilesets = [];

    view = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };

    xCount = 0;
    yCount = 0;

    tSize = { x: 32, y: 32 };
    mSize = { x: 8, y: 16 };

    tileSize = 135;
    mapSize = { x: 1080, y: 2160 };
    floor = { l: 945, h: 135 };

    world_speed = 32;
    world_speedup = 0.001;
    world_run = 0;
    world_offset = 0;
}

export function loadMap (path) {
    const request = new XMLHttpRequest()
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            parseMap(request.responseText)
        }
    }
    request.open('GET', "files/" + path, true)
    request.send()
}

export function parseMap (tilesJSON) {
    mapData = JSON.parse(tilesJSON)
    xCount = mapData.width;
    yCount = mapData.height;
    tSize.x = mapData.tilewidth;
    tSize.y = mapData.tileheight;
    tileSize = Math.ceil(window.innerHeight / yCount)
    mSize.x = xCount * tSize.x
    mSize.y = yCount * tSize.y

    mapSize.x = xCount * tileSize
    mapSize.y = yCount * tileSize

    floor.l = mapSize.y - tileSize;
    floor.h = tileSize;

    for (let i = 0; i < mapData.tilesets.length; i++) {
        let img = new Image()
        img.onload = function () {
            imgLoadCount++
            if (imgLoadCount === mapData.tilesets.length) imgLoaded = true;
        }
        img.src = "files/" + mapData.tilesets[i].image
        const t = mapData.tilesets[i]
        const ts = {
            firstgid: t.firstgid,
            image: img,
            name: t.name,
            xCount: Math.floor(t.imagewidth / mapData.tilewidth),
            yCount: Math.floor(t.imageheight / mapData.tileheight)
        }
        tilesets.push(ts)
    }
    jsonLoaded = true
}

export function draw_map (ctx) {
    if (!imgLoaded || !jsonLoaded) {
        setTimeout(function () {
            draw_map(ctx)
        }, 100)
    } else {
        if (tLayer === null) {
            for (let id = 0; id < mapData.layers.length; id++) {
                const layer = mapData.layers[id]
                if (layer.type === 'tilelayer') {
                    tLayer = layer
                    break;
                }
            }
        }
        for (let i = 0; i < tLayer.data.length; i++) {
            if (tLayer.data[i] !== 0) {
                const tile = getTile(tLayer.data[i])
                let pX = (i % xCount) * tileSize
                let pY = Math.floor(i / xCount) * tileSize
                if (!isVisible(pX, pY, tileSize, tileSize)) continue;
                ctx.drawImage(
                    tile.img,
                    tile.px,
                    tile.py,
                    tSize.x,
                    tSize.y,
                    pX,
                    pY,
                    tileSize,
                    tileSize
                );
            }
        }
    }
}

function getTile (tileIndex) {
    const tile = { img: null, px: 0, py: 0 };
    const tileset = getTileset(tileIndex)
    tile.img = tileset.image
    const id = tileIndex - tileset.firstgid
    const x = id % tileset.xCount
    const y = Math.floor(id / tileset.xCount)
    tile.px = x * tSize.x
    tile.py = y * tSize.y
    return tile;
}

function getTileset (tileIndex) {
    for (let i = tilesets.length - 1; i >= 0; i--) if (tilesets[i].firstgid <= tileIndex) return tilesets[i];
    return null;
}

export function isVisible (x, y, width, height) {
    return !(
        x + width < view.x ||
        y + height < view.y ||
        x > view.x + view.w ||
        y > view.y + view.h
    );
}

export function step (addition) {
    world_run += addition;
}

export function speedup (addition) {
    world_speed += addition;
}

export function spread (x, ctx) {
    view.x += x;
    world_offset += x;
    ctx.translate(-x, 0);
    if (view.x > mapSize.x / 2) {
        const limit = view.x - mapSize.x / 2;
        ctx.translate(view.x, 0);
        fix_offsets(view.x);
        view.x = 0;
        spread(limit, ctx);
    }
}

export function parseEntities () {
    if (!imgLoaded || !jsonLoaded) {
        setTimeout(function () {
            parseEntities()
        }, 100)
    } else {
        for (let j = 0; j < mapData.layers.length; j++) {
            if (mapData.layers[j].type === 'objectgroup') {
                const entities = mapData.layers[j]
                for (let i = 0; i < entities.objects.length; i++) {
                    const e = entities.objects[i]
                    try {
                        if (e.name === 'player') {
                            factory[e.type] = class extends factory[e.type] {
                                constructor() {
                                    super(e.name,
                                        tileSize, level === 2 ? (floor.h + floor.l - tileSize) / 2 : floor.l - tileSize,
                                        tileSize, tileSize);
                                }
                            }
                            initPlayer(factory[e.type]);
                        } else {
                            factory[e.type] = class extends factory[e.type] {
                                constructor() {
                                    super(e.name, e.width / tSize.x * tileSize, e.height / tSize.y * tileSize);
                                }
                            }
                        }
                    } catch (ex) { console.log('Ошибка создания: [' + e.type + ']' + e.type + ',' + ex); }
                }
            }
        }
    }
}
