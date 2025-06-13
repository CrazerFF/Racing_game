const GRASS_FRICTION = 0.3;
const ROADS_FRICTION = {
    road: 1,
    ground: 0.5,
    sand: 0.4
}
export default class Map {
    constructor(scene) {
        this.scene = scene;
        this.init();
        this.create();
    }
    init() {
        this.tilemap = this.scene.make.tilemap({key: 'tilemap'});

        if (!this.scene.textures.exists('tileset')) {
            console.error('Tileset not loaded!');
            return;
        }
        this.tileset = this.tilemap.addTilesetImage('tileset', 'tileset', 64, 64, 0, 0);
    }
    create() {
        this.createLayers();
        this.createCollisions(); 
        this.createCheckpoints();
        this.createOils()
    }
    createLayers() {
        this.grassLayer = this.tilemap.createLayer('grass', this.tileset, 0, 0);
        this.roadLayer = this.tilemap.createLayer('road', this.tileset, 0, 0);
        this.sandLayer = this.tilemap.createLayer('sand', this.tileset, 0, 0);
        this.groundLayer = this.tilemap.createLayer('ground', this.tileset, 0, 0);
    }   
    createCollisions() {
        const collisionsLayer = this.tilemap.getObjectLayer('collisions');
        
        if (!collisionsLayer) {
            console.error('Collisions layer not found in Tiled map!');
            return;
        }

        collisionsLayer.objects.forEach(collision => {
            const sprite = this.scene.matter.add.sprite(
                collision.x + collision.width / 2,
                collision.y - collision.height / 2,
                'objects',
                collision.name
            );
            sprite.setStatic(true);
        });
    }
    createOils() {
        const oilLayer = this.tilemap.findObject('oils', oil => {
            const sprite = this.scene.matter.add.sprite(
                oil.x + oil.width / 2,
                oil.y - oil.height / 2,
                'objects',
                'oil'
            );
            sprite.setStatic(true);
            sprite.setSensor(true);
        });
    }
    createCheckpoints() {
        this.checkpoints = [];
        this.tilemap.findObject('checkpoints', checkpoint => {
            let rectangle = new Phaser.Geom.Rectangle(
                checkpoint.x, 
                checkpoint.y, 
                checkpoint.width, 
                checkpoint.height);
            rectangle.index = checkpoint.properties.find(property => property.name === 'value').value;
            this.checkpoints.push(rectangle);
        })
    }
    getPlayerPosition(positionName) {
        const playerLayer = this.tilemap.getObjectLayer(positionName);
        if (!playerLayer || !playerLayer.objects.length) {
            console.warn('Player layer not found or empty! Using default position');
            return {x: 100, y: 100};
        }
        return playerLayer.objects[0];
    } 
    getTileFriction(car) {
        for (let road in ROADS_FRICTION) {
            let tile = this.tilemap.getTileAtWorldXY(car.x, car.y, false, this.scene.cameras.main, road);
            if (tile) {
                return ROADS_FRICTION[road];
            }
        }

        return GRASS_FRICTION;
    }
    getCheckpoint(car) {
        const checkpoint = this.checkpoints.find(checkpoint => checkpoint.contains(car.x,car.y));
        return checkpoint ? parseInt(checkpoint.index) : false;
    }
    
}