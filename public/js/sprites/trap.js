// This function defines the Gem module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the gem
// - `y` - The initial y position of the gem
// - `color` - The colour of the gem
const Trap = function(ctx, x, y) {

    let sequence = { x: 0, y: 0, width: 32, height: 32, count: 1, timing: 27, loop: true }

    // This is the sprite object of the gem created from the Sprite module.
    const sprite = Sprite(ctx, x, y, { type: "trap" });

    // The sprite object is configured for the gem sprite here.
    sprite.setSequence(sequence)
          .setScale(1.4)
          .setShadowScale({ x: 0, y: 0 })
          .useSheet("../../assets/spike_trap.png");

    // This function randomizes the heart position.
    // - `area` - The area that the heart should be located in.
    const randomize = function(area, randX = null, randY = null) {
        /* Randomize the position */
        const {x, y} = area.randomPoint(randX, randY);
        sprite.setXY(x, y);
    };

    const trigger = function() {
        sequence.count = 8;
        sequence.loop = false;
        sprite.setSequence(sequence);
    }

    const reset = function() {
        sequence.count = 1;
        sequence.loop = true;
        sprite.setSequence(sequence);
    }
 
    // The methods are returned as an object here.
    return {
        sequence,
        getXY: sprite.getXY,
        getBoundingBox: sprite.getBoundingBox,
        randomize: randomize,
        trigger: trigger,
        reset: reset,
        draw: sprite.draw,
        update: sprite.update
    };
};
