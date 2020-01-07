//import { Phaser } from "./phaser.min.js";

class Scene2 extends Phaser.Scene {
    constructor(){
        super("playGame");
    }

    create(){
        
        this.background = this.add.tileSprite(0, 0, 256, 272,"background");
        this.background.setOrigin(0,0);

        //Blackbar
        var Blackbar = this.add.graphics();
        Blackbar.fillStyle("Black");
        Blackbar.fillRect(0, 0, 256, 20);

        //Enemies
        this.ship = this.add.sprite((256 / 2) - 50, (272 / 2), "ship");
        this.ship2 = this.add.sprite((256 / 2), (272 / 2), "ship2");
        this.ship3 = this.add.sprite((256 / 2) + 50, (272 / 2), "ship3");

        this.ship.play("ship_anim");
        this.ship2.play("ship2_anim");
        this.ship3.play("ship3_anim");

        this.ship.setInteractive();
        this.ship2.setInteractive();
        this.ship3.setInteractive();

        this.enemies = this.physics.add.group();
        this.enemies.add(this.ship);
        this.enemies.add(this.ship2);
        this.enemies.add(this.ship3);

        //Clickable ship
        this.input.on('gameobjectdown', this.destroyShip, this);

        // this.add.text(20, 20, "Playing Game.", {
        //     font: "25px Arial",
        //     fill: "yellow"
        // });

        //Score definition
        this.score = 0;
        this.lives = 3;
        var scoreLabelFormatted = this.zeroPad(this.score, 6);        
        this.scoreLabel = this.add.bitmapText(10, 5, "pixelFont", "SCORE " + scoreLabelFormatted, 16);
        this.livesLabel = this.add.bitmapText(256 - 50, 5, "pixelFont", "LIVES " + this.lives, 16);

        //Create physics group with powerUps name
        this.powerUps = this.physics.add.group();

        var maxObject = 1;

        for(var i = 0; i <= maxObject; i++) {
            var powerUp = this.physics.add.sprite(16, 16, "power-up");
            this.powerUps.add(powerUp);
            powerUp.setRandomPosition(0, 0, 256, 272);

            if(Math.random() > 0.5){
                powerUp.play("red");
            }else{
                powerUp.play("gray");
            }

            powerUp.setVelocity(100, 100);
            powerUp.setCollideWorldBounds(true);
            powerUp.setBounce(1);
        }

        //Create player and binding it to phaser physics
        this.player = this.physics.add.sprite((256/2) - 8, 272 - 64, "player");
        this.player.play("player_thrust");
        this.cursorKeys = this.input.keyboard.createCursorKeys();
        this.player.setCollideWorldBounds(true);

        //Create keyboard listener
        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        //Create projectiles group and group it into physics group
        this.projectiles = this.add.group();

        //Create colliding function        
        this.physics.add.collider(this.projectiles, this.powerUps, function(projectile, powerUp){
            projectile.destroy();
        });
        this.physics.add.overlap(this.player, this.powerUps, this.pickPowerUp, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hurtPlayer, null, this);
        this.physics.add.overlap(this.projectiles, this.enemies, this.hurtEnemy, null, this);

        //Sound
        this.beamSFX = this.sound.add("audio_beam");
        this.explosionSFX = this.sound.add("audio_explosion");
        this.pickupSFX = this.sound.add("audio_pickup");
        this.music = this.sound.add("music");

        var musicConfig = {
            mute: false,
            volume: 1,
            rate: 1,
            detune: 0,
            seek: 0,
            loop: false,
            delay: 0
        }

        this.music.play(musicConfig);
    }

    update(){
        this.background.tilePositionY -= 0.8;

        this.moveShip(this.ship, 1.7);
        this.moveShip(this.ship2, 1.2);
        this.moveShip(this.ship3, 0.7);

        this.movePlayer();

        if (Phaser.Input.Keyboard.JustDown(this.spacebar) && this.player.active) {
            this.shootBeam();
        }

        for(var i = 0; i < this.projectiles.getChildren().length; i++){
            var beam = this.projectiles.getChildren()[i];
            beam.update();
        }

    }

    moveShip(ship, speed){
        ship.y += speed;

        if (ship.y > 272)  {
            this.resetPosShip(ship);
        }
    }

    resetPosShip(ship){
        ship.y = 0;
        var RandomX = Phaser.Math.Between(0, 256);
        ship.x = RandomX;
    }

    destroyShip(pointer, gameObject){
        gameObject.setTexture("explosion");
        gameObject.play("explode");
    }

    movePlayer(){
        if(this.cursorKeys.left.isDown){
            this.player.setVelocityX(-200);
        }else if(this.cursorKeys.right.isDown){
            this.player.setVelocityX(200);
        }else{
            this.player.setVelocityX(0);
        }

        if(this.cursorKeys.up.isDown){
            this.player.setVelocityY(-200);
        }else if(this.cursorKeys.down.isDown){
            this.player.setVelocityY(200);
        }else{
            this.player.setVelocityY(0);
        }
    }

    shootBeam(){
        var beam = new Beam(this);
        this.beamSFX.play();
    }

    pickPowerUp(player, powerUp){
        powerUp.disableBody(true, true);
        this.pickupSFX.play();
    }

    hurtPlayer(player, enemy){

        if(this.player.alpha < 1)
            return;

        this.resetPosShip(enemy);

        var explosion = new Explosion(this, player.x, player.y);
        this.explosionSFX.play();
        this.lives -= 1;
        this.livesLabel.text = "LIVES " + this.lives;
        player.disableBody(true, true);

        //Wait for 1 second
        this.time.addEvent({
            delay: 1000,
            callback: this.playerResetPos,
            callbackScope: this,
            loop: false
        });

        if (this.lives <= 0){
            this.music.stop();
            this.gameOver();
        }

    }

    hurtEnemy(projectile, enemy){
        projectile.destroy();

        var explosion = new Explosion(this, enemy.x, enemy.y);
        this.explosionSFX.play();
        this.resetPosShip(enemy);

        this.score += 15;
        var scoreLabelFormatted = this.zeroPad(this.score, 6);
        this.scoreLabel.text = "SCORE " + scoreLabelFormatted;
    }

    zeroPad(number, size){
        var stringNumber = String(number);
        while(stringNumber.length < (size || 2)){
            stringNumber = "0" + stringNumber;
        }

        return stringNumber;
    }

    playerResetPos(){
        var xPos = (256/2) - 8;
        var yPos = 272 + 64;
        this.player.enableBody(true, xPos, yPos, true, true);
        this.player.alpha = 0.5;

        var tween = this.tweens.add({
            targets: this.player,
            y: 272 - 64,
            ease: 'Power1',
            duration: 1500,
            repeat: 0,
            onComplete: function(){
                this.player.alpha = 1;
            },
            callbackScope: this
        });
    }

    gameOver(){
        this.scene.start("bootGame");
    }

}