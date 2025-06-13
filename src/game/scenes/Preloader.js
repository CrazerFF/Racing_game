import { Scene } from 'phaser';
export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        this.add.image(0, 0, 'background').setOrigin(0);
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        this.load.on('progress', (progress) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload ()
    {
        //this.load.setPath('assets');
        this.load.spritesheet('tileset', 'assets/tileset.png', {
            frameWidth: 64, 
            frameHeight: 64
        });
        this.load.tilemapTiledJSON('tilemap', 'assets/tilemap.json');
        this.load.atlas('objects', 'assets/objects.png', 'assets/objects.json')
    }

    create ()
    {
        this.scene.start('MainMenu');
    }
}
