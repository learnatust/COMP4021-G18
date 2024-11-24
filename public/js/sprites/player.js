// This function defines the Player module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
// - `gameArea` - The bounding box of the game area
const Player = function(ctx, x, y, gameArea, id) {

    // This is the sprite sequences of the player facing different directions.
    // It contains the idling sprite sequences `idleLeft`, `idleUp`, `idleRight` and `idleDown`,
    // and the moving sprite sequences `moveLeft`, `moveUp`, `moveRight` and `moveDown`.
    const sequences = {
        /* Idling sprite sequences for facing different directions */
        idleLeft:  { x: 0 + id * 480, y: 146, width: 48, height: 49.1, count: 1, timing: 1, loop: false },
        idleUp:    { x: 0 + id * 480, y: 245.5, width: 48, height: 49.1, count: 1, timing: 1, loop: false },
        idleRight: { x: 0 + id * 480, y: 196.4, width: 48, height: 49.1, count: 1, timing: 1, loop: false },
        idleDown:  { x: 0 + id * 480, y:  96, width: 48, height: 49.1, count: 1, timing: 1, loop: false },

        /* Moving sprite sequences for facing different directions */
        moveLeft:  { x: 0 + id * 480, y: 146, width: 48, height: 49.1, count: 6, timing: 40, loop: true },
        moveUp:    { x: 0 + id * 480, y: 245.5, width: 48, height: 49.1, count: 6, timing: 40, loop: true },
        moveRight: { x: 0 + id * 480, y: 196.4, width: 48, height: 49.1, count: 6, timing: 40, loop: true },
        moveDown:  { x: 0 + id * 480, y: 96, width: 48, height: 49.1, count: 6, timing: 40, loop: true },

        hurt: { x: 0 + id * 480, y: 295, width: 48, height: 49.1, count: 5, timing: 30, loop: false },
        death: { x: 0 + id * 480, y: 0, width: 48, height: 49.1, count: 10, timing: 80, loop: false }
    };

    // This is the sprite object of the player created from the Sprite module.
    const sprite = Sprite(ctx, x, y, { type: "player" });

    // The sprite object is configured for the player sprite here.
    sprite.setSequence(sequences.idleDown)
          .setScale(2.1)
          .setShadowScale({ x: 0.5, y: 0.15 })
          .useSheet("../../assets/player.png");

    // This is the moving direction, which can be a number from 0 to 4:
    // - `0` - not moving
    // - `1` - moving to the left
    // - `2` - moving up
    // - `3` - moving to the right
    // - `4` - moving down
    let direction = 0;

    // This is the moving speed (pixels per second) of the player
    let speed = 200;

    // 0 - not hurt
    // 1 - being hurt, i.e. ongoing animation
    // 2 - hurted, i.e. hurt animation ended
    let hurtStatus = 0;

    let lives = 3;

    // This function sets the player's moving direction.
    // - `dir` - the moving direction (1: Left, 2: Up, 3: Right, 4: Down)
    const move = function(dir) {
        if (dir >= 1 && dir <= 4 && (dir != direction || hurtStatus == 2)) {
            switch (dir) {
                case 1: sprite.setSequence(sequences.moveLeft); break;
                case 2: sprite.setSequence(sequences.moveUp); break;
                case 3: sprite.setSequence(sequences.moveRight); break;
                case 4: sprite.setSequence(sequences.moveDown); break;
            }
            direction = dir;
            hurtStatus = 0;
        }
    };

    // This function stops the player from moving.
    // - `dir` - the moving direction when the player is stopped (1: Left, 2: Up, 3: Right, 4: Down)
    const stop = function(dir) {
        if (direction == dir) {
            switch (dir) {
                case 1: sprite.setSequence(sequences.idleLeft); break;
                case 2: sprite.setSequence(sequences.idleUp); break;
                case 3: sprite.setSequence(sequences.idleRight); break;
                case 4: sprite.setSequence(sequences.idleDown); break;
            }
            direction = 0;
            hurtStatus = 0;
        }
    };

    // // This function speeds up the player.
    // const speedUp = function() {
    //     speed = 250;
    // };

    // // This function slows down the player.
    // const slowDown = function() {
    //     speed = 150;
    // };

    const getHurtStatus = function() {
        return hurtStatus;
    }

    const hurt = function() {
        hurtStatus = 1;
        lives--;
        if(lives == 0) {
            stop(direction);
            sprite.setSequence(sequences.death);
        } else {
            sprite.setSequence(sequences.hurt);
        }

        return lives == 0;
    }

    const endHurt = function() {
        hurtStatus = 2;
    }

    const heal = function() {
        lives++;
    }

    const getLives = function() {
        return lives;
    }

    // This function updates the player depending on his movement.
    // - `time` - The timestamp when this function is called
    const update = function(time) {
        /* Update the player if the player is moving */
        if (direction != 0) {
            let { x, y } = sprite.getXY();

            /* Move the player */
            switch (direction) {
                case 1: x -= speed / 60; break;
                case 2: y -= speed / 60; break;
                case 3: x += speed / 60; break;
                case 4: y += speed / 60; break;
            }

            /* Set the new position if it is within the game area */
            if (gameArea.isPointInBox(x, y))
                sprite.setXY(x, y);
        }

        /* Update the sprite object */
        return sprite.update(time);
    };

    // The methods are returned as an object here.
    return {
        move: move,
        stop: stop,
        hurt: hurt,
        endHurt: endHurt,
        getHurtStatus: getHurtStatus,
        heal: heal,
        getLives: getLives,
        // speedUp: speedUp,
        // slowDown: slowDown,
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: update,
        getXY: sprite.getXY
    };
};
