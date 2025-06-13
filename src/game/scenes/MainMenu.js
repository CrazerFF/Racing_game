import { Scene } from 'phaser';
import Client from '../objects/Client';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        this.add.image(0, 0, 'background').setOrigin(0);
        this.createButtons();
        this.setEvents();
    }

    createButtons() {
        this.button1 = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 50,
            `One player`,
            { font: 'bold 46px Arial', fill: '#FAFAD2' }
        )
            .setOrigin(0.5)
            .setInteractive();

        this.button2 = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 50,
            `Two player`,
            { font: 'bold 46px Arial', fill: '#FAFAD2' }
        )
            .setOrigin(0.5)
            .setInteractive();
    }

    setEvents() {
        // Обработка наведения на кнопки
        this.button1
            .on('pointerover', () => this.scaleButton(this.button1, 1.1)) // Увеличить на 10%
            .on('pointerout', () => this.scaleButton(this.button1, 1))    // Вернуть исходный размер
            .on('pointerdown', this.startGame, this);

        this.button2
            .on('pointerover', () => this.scaleButton(this.button2, 1.1)) // Увеличить на 10%
            .on('pointerout', () => this.scaleButton(this.button2, 1))    // Вернуть исходный размер
            .on('pointerdown', this.requestGame, this);
    }

    // Метод для плавного масштабирования кнопки
    scaleButton(button, scale) {
        this.tweens.add({
            targets: button,
            scaleX: scale,
            scaleY: scale,
            duration: 100, // Плавное изменение за 100 мс
            ease: 'Power2'
        });
    }

    startGame() {
        this.scene.start('Game', {client: this.client});
    }

    requestGame() {
        // Инициализировать клиент 
       this.client = new Client();
       // отправить запрос игры на сервер
       this.client.init();
       // по факту получения противника начать игру
       this.client.on('game', this.startGame, this)
    }
}