import { Entity, Player, Wall } from './unit_manager.js';
import {
    draw_map,
    floor,
    loadMap,
    map_init,
    parseEntities,
    tileSize,
    view,
    world_offset,
    world_run
} from './map_manager.js';
import { push_score } from './results.js';
import { init_sprites, loadAtlas } from './sprite_manager.js';
import { escaped, finish, init_events } from './event_manager.js';
import { count_offset, entityAtXY, get_text_by_size, inColumn, init_physics, update_world } from './physics_manager.js';
import { init_audio, loadArray, play } from './sound_manager.js';

export let factory = {};
export let entities = [];
let walls_rem = 8;
export let level = 0;
let proc = null;
let context = null;

const primes = [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109];



function loadAll () {
    factory = {};
    entities = [];
    walls_rem = 8;
    proc = undefined;

    triple = { l: 0, h: 0 };
    duple = { l: 0, h: 0 };

    init_audio();
    map_init();
    init_sprites();

    let track;
    if (level === 1) {
        track = 'cave_track.mp3';
        loadMap('cave.json');
        loadAtlas('cave_sprites.json', 'cave_sprites.png');
    } else {
        track = 'pass_track.mp3';
        loadMap('pass.json');
        loadAtlas('pass_sprites.json', 'pass_sprites.png');
    }
    loadArray(['loss.mp3', track]);

    factory.Player = Player;
    factory.Wall1 = Wall;
    factory.Wall2 = Wall;
    if (level === 1) factory.Wall3 = Wall;

    parseEntities();
    init_events();
    init_physics();
}

export function initPlayer (obj) {
    entities.push(new obj());
}

export function init (lvl, ctx) {
    level = lvl;
    context = ctx;
    loadAll();
    if (level === 1) play('cave_track.mp3', true, 0.75);
    else play('pass_track.mp3', true, 0.75);
    draw_map(context);
    proc = setInterval(update, 15);
}



let triple = { l: 0, h: 0 };
let duple = { l: 0, h: 0 };

export function fix_offsets (diff) {
    triple.l -= diff;
    triple.h -= diff;
    duple.l -= diff;
    duple.h -= diff;
}

const add_wall = (cre, x, lower) => {
    let wall_class = Entity;
    if (cre < 10 && (level !== 2)) {
        if (((world_offset - triple.l < tileSize * 10) || (world_offset - duple.l < tileSize * 7)) && !lower) return false;
        if (((world_offset - triple.h < tileSize * 10) || (world_offset - duple.h < tileSize * 7)) && lower) return false;
        wall_class = factory.Wall3;
        if (lower) triple.l = world_offset;
        else triple.h = world_offset;
    } else if (cre < 30) {
        if (((world_offset - duple.l < tileSize * 5) || (world_offset - triple.l < tileSize * 7)) && !lower) return false;
        if (((world_offset - duple.h < tileSize * 5) || (world_offset - triple.h < tileSize * 7)) && lower) return false;
        wall_class = factory.Wall2;
        if (lower) duple.l = world_offset;
        else duple.h = world_offset;
    } else {
        wall_class = factory.Wall1;
    }
    const wall = new wall_class();
    if (!lower) wall.turned = Math.PI;
    wall.screen_offset = x;
    wall.pos_y = lower ? (floor.l - wall.size_y) : (floor.h);
    wall.update();

    if (!entityAtXY(wall, wall.pos_x, wall.pos_y, true) && (!(level === 2) || !inColumn(wall))) {
        entities.push(wall);
        return true;
    } else return false;
}

function emit_wall () {
    const index = primes.length - 1 - Math.round(world_run / 5)

    const random = Math.round(Math.random() * view.w);
    if ((random % primes[index >= 0 ? index : 0] === 0) && walls_rem > 0) {
        const pos_x = view.w + view.x + tileSize;
        const creator = Math.round(Math.random() * 100);
        if (add_wall(creator, pos_x, creator % 2 === 0)) walls_rem--;
    }
}



export function kill (obj) {
    const idx = entities.indexOf(obj)
    if (idx > -1) {
        entities.splice(idx, 1);
        walls_rem++;
    }
}

function update () {
    update_world(context);
    entities.forEach(function (e) {
        try { e.update() }
        catch (ex) { console.log(e.name + ' ' + JSON.stringify(ex)) }
    });

    if (escaped) {
        end_game(context);
        return;
    }

    emit_wall();

    draw_map(context)
    draw(context)

    context.fillStyle = "white";
    const text = "Score " + count_offset().toFixed(3);
    context.font = get_text_by_size("small") + "px serif";
    context.fillText(text, view.x + view.w / 2, tileSize / 2);
    const prompt = "Use 'W', 'S' to change gravity and 'Esc' to quit";
    context.fillText(prompt, view.x + view.w / 2, floor.l + tileSize / 2);
}

function draw () {
    for (const entity of entities) entity.draw(context);
}

function end_game () {
    finish();
    clearInterval(proc);
    proc = null;

    const score = Math.round(count_offset() * 1000) / 1000;
    const text = "Alas! You reached only " + score.toFixed(3) + " meters!";

    context.fillStyle = "rgba(175, 175, 175, 0.5)";
    context.fillRect(view.x, view.y, view.w, view.h);
    context.font = get_text_by_size("average") + "px serif";
    context.fillStyle = "black";
    context.fillText(text, view.x + view.w / 2, view.h / 2);

    push_score(level === 1 ? 'Dwarf' : 'Gargoyle', score);
    play('loss.mp3', false, 0.75);
}
