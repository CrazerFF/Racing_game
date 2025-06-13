const HOST = 'http://localhost:3000';

import Phaser from 'phaser';
import io from 'socket.io-client';

export default class Client extends Phaser.Events.EventEmitter {
    constructor() {
        super();
        this.socket = null;
    }

    init() {
        this.sent = {};
        this.master = false;
        this.socket = io(HOST, {
            transports: ['websocket'], // используйте только websocket
            reconnectionAttempts: 5, // количество попыток переподключения
            reconnectionDelay: 1000, // задержка между попытками
        });

        this.socket.on('connect', () => {
            console.log('Connected to server with socket id:', this.socket.id);
        });
        this.socket.on('disconnect', () => {
            console.log('Disonnected to server with socket id:', this.socket.id);
        });

        this.socket.on('connect_error', (err) => {
            console.error('Connection error:', err);
        });
        this.socket.on('gameStart', data => {
            if (data && data.master) {
                this.master = data.master;
            }
            this.emit('game')
        })
        this.socket.on('enemyMove', data => {
            this.emit('data', data);
        })
    }
    send(data) {
        data.timestamp = Date.now(); // временная метка к данным
        if (JSON.stringify(data) !== JSON.stringify(this.sent)) {
            this.sent = data;
            this.socket.emit('playerMove', data);
        }
       
    }
} 