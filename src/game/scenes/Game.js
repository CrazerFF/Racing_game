import { Scene } from 'phaser';
import Map from '../objects/Map';
import Player from '../objects/PlayerCopy';
import Stats from '../objects/Stats';
import StatsPanel from '../objects/StatsPanel';
import StatsPopup from '../objects/StatsPopup';

const LAPS = 1;
const CARS = {
    BLUE: {
        sprite: 'car_blue_1',
        position: 'player'
    },
    RED: {
        sprite: 'car_red_1',
        position: 'enemy'
    }
}

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }
    init(data) {
        if (data.client) {
            this.client = data.client;
        }
        this.cursors = this.input.keyboard.createCursorKeys();
    }
    getCarsConfig() {
        let config = {player: CARS.BLUE, enemy: CARS.RED};
        if (this.client && !this.client.master) {
            // игрок второй
            config = {player: CARS.RED, enemy: CARS.BLUE};
        } 
        return config;
    }
    create ()
    {
        this.map = new Map(this);
        const car = this.getCarsConfig();

        this.player = new Player(this, this.map, car.player);

    
        if (this.client) {
            this.enemy = new Player(this, this.map, car.enemy);

           // this.enemy.car.setIgnoreGravity(true);  // Добавьте эту строку
           // this.enemy.car.setMass(Infinity);       // И эту
            
            this.client.on('data', data => {
                this.enemy.car.setX(data.x);
                this.enemy.car.setY(data.y);
                this.enemy.car.setAngle(data.angle);
            })
        }
        this.cameras.main.setBounds(0, 0, this.map.tilemap.widthInPixels, this.map.tilemap.heightInPixels)
        this.cameras.main.startFollow(this.player.car);
        this.player.car.on('lap', this.onLapComplete, this);
        this.stats = new Stats(this, LAPS);
        this.statsPanel = new StatsPanel(this, this.stats);
       
        this.matter.world.on('collisionactive', (event) => {
            const { pairs } = event;
            pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                if ((bodyA.gameObject === this.player.car && bodyB.gameObject?.frame?.name === 'oil') ||
                    (bodyB.gameObject === this.player.car && bodyA.gameObject?.frame?.name === 'oil')) {
                    this.player.slide();
                }
            });
        });
    }
    onLapComplete(lap) {
        this.stats.onLapComplete();
        if (this.stats.complete) {
            this.statsPopup = new StatsPopup(this, this.stats);
        }
    }
    update(time, dt) {
        this.stats.update(dt);
        this.player.move();
        this.statsPanel.render();
        this.sync();
    }
    sync() {
        if (this.client) {
            this.client.send({
                x: this.player.car.x,
                y: this.player.car.y,
                angle: this.player.car.angle
            });

        }
    }
}
