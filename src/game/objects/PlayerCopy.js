const CAR_CONFIG = Object.freeze({
    MAX_SPEED: 5,
    ACCELERATION: 0.1,
    DECELERATION: 0.2,
    REVERSE_MAX: 2,
    STEER_FORCE: 0.02,
    DRIFT_FACTOR: 0.95,
    BODY_FRICTION: 0.2,
    WHEEL_FRICTION: 0.8
});

export default class Player {
    constructor(scene, map, config) {
        this.scene = scene;
        this.map = map;
        this.checkpoint = 0;
        
        const position = this.map.getPlayerPosition(config.position);
        this.createCar(position, config.sprite);
        this.setupControls();
        this.setupCamera();
        
        // Создаем временный вектор для вычислений
        this.tempVec = new Phaser.Math.Vector2();
    }

    createCar(position, spriteKey) {
        this.car = this.scene.matter.add.sprite(
            position.x, 
            position.y, 
            'objects', 
            spriteKey,
            {
                shape: {
                    type: 'rectangle',
                    width: 60,
                    height: 100,
                    chamfer: { radius: 10 }
                },
                friction: CAR_CONFIG.BODY_FRICTION,
                frictionStatic: 0.5,
                frictionAir: 0.05,
                mass: 20,
                label: 'playerCar'
            }
        );
        this.car.setFixedRotation(false);
    }

    setupControls() {
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        const { keyboard } = this.scene.input;
        
        keyboard.on('keydown-W', () => this.controls.forward = true);
        keyboard.on('keyup-W', () => this.controls.forward = false);
        keyboard.on('keydown-S', () => this.controls.backward = true);
        keyboard.on('keyup-S', () => this.controls.backward = false);
        keyboard.on('keydown-A', () => this.controls.left = true);
        keyboard.on('keyup-A', () => this.controls.left = false);
        keyboard.on('keydown-D', () => this.controls.right = true);
        keyboard.on('keyup-D', () => this.controls.right = false);
    }

    setupCamera() {
        if (this.scene.cameras && this.scene.cameras.main && this.car) {
            this.scene.cameras.main.startFollow(this.car, true, 0.1, 0.1);
            this.scene.cameras.main.setZoom(1.5);
            this.scene.cameras.main.setDeadzone(100, 100);
        }
    }

    update() {
        if (!this.car || !this.car.body) return;
        if (this.scene.statsPopup) {
            this.applyBraking(1.0);
            return;
        }

        this.handleMovement();
        this.handleSteering();
        this.checkPosition();
    }

    handleMovement() {
        const velocity = this.car.body.velocity;
        // Используем временный вектор для вычисления скорости
        this.tempVec.set(velocity.x, velocity.y);
        const speed = this.tempVec.length();
        
        if (this.controls.forward) {
            const force = this.getForwardForce(speed);
            this.car.applyForce(force);
        }
        
        if (this.controls.backward) {
            if (speed > 0.1) {
                this.applyBraking(CAR_CONFIG.DECELERATION * 2);
            } else {
                const reverseForce = this.getReverseForce();
                this.car.applyForce(reverseForce);
            }
        }
        
        if (!this.controls.forward && !this.controls.backward && speed > 0) {
            this.applyBraking(CAR_CONFIG.DECELERATION);
        }
    }

    handleSteering() {
        const velocity = this.car.body.velocity;
        this.tempVec.set(velocity.x, velocity.y);
        const speed = this.tempVec.length();
        
        if (speed < 0.1) return;
        
        const steerForce = speed * CAR_CONFIG.STEER_FORCE;
        
        if (this.controls.left) {
            this.car.setAngularVelocity(-steerForce);
        } else if (this.controls.right) {
            this.car.setAngularVelocity(steerForce);
        }
        
        if (speed > 1.5 && (this.controls.left || this.controls.right)) {
            this.car.setVelocity(
                velocity.x * CAR_CONFIG.DRIFT_FACTOR,
                velocity.y * CAR_CONFIG.DRIFT_FACTOR
            );
        }
    }

    getForwardForce(speed) {
        const angle = this.car.rotation - Math.PI / 2;
        const maxSpeed = CAR_CONFIG.MAX_SPEED * this.map.getTileFriction(this.car);
        const accelerationFactor = 1 - Phaser.Math.Clamp(speed / maxSpeed, 0, 1);
        const forceMagnitude = CAR_CONFIG.ACCELERATION * accelerationFactor * this.car.body.mass;
        
        this.tempVec.set(
            Math.cos(angle) * forceMagnitude,
            Math.sin(angle) * forceMagnitude
        );
        return this.tempVec;
    }

    getReverseForce() {
        const angle = this.car.rotation + Math.PI / 2;
        this.tempVec.set(
            Math.cos(angle) * CAR_CONFIG.ACCELERATION * this.car.body.mass * 0.5,
            Math.sin(angle) * CAR_CONFIG.ACCELERATION * this.car.body.mass * 0.5
        );
        return this.tempVec;
    }

    applyBraking(factor) {
        this.car.setVelocity(
            this.car.body.velocity.x * (1 - factor),
            this.car.body.velocity.y * (1 - factor)
        );
        this.car.setAngularVelocity(this.car.body.angularVelocity * (1 - factor));
    }

    checkPosition() {
        const checkpoint = this.map.getCheckpoint(this.car);
        if (checkpoint) {
            this.onCheckpoint(checkpoint);
        }
    }

    onCheckpoint(checkpoint) {
        if (checkpoint === 1 && this.checkpoint === this.map.checkpoints.length) {
            this.checkpoint = 1;
            this.car.emit('lap');
        } else if (checkpoint === this.checkpoint + 1) {
            ++this.checkpoint;
        }
    }
}