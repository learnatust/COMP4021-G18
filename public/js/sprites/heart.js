// This function defines the Heart module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the gem
// - `y` - The initial y position of the gem
const Heart = function(ctx, x, y) {

    const sequence = { x: 0, y:  16, width: 16, height: 16, count: 8, timing: 100, loop: true };

    // This is the sprite object of the heart created from the Sprite module.
    const sprite = Sprite(ctx, x, y, { type: "heart" });

    // The sprite object is configured for the gem sprite here.
    sprite.setSequence(sequence)
          .setScale(2.5)
          .setShadowScale({ x: 0, y: 0 })
          .useSheet("../../assets/object_sprites.png");

    // This is the birth time of the gem for finding its age.
    let birthTime = performance.now();

    // This function gets the age (in millisecond) of the gem.
    // - `now` - The current timestamp
    const getAge = function(now) {
        return now - birthTime;
    };

    // This function randomizes the heart position.
    // - `area` - The area that the heart should be located in.
    const randomize = function(area, randX = null, randY = null) {
        birthTime = performance.now();
        /* Randomize the position */
        const {x, y} = area.randomPoint(randX, randY);
        sprite.setXY(x, y);
    };

    // The methods are returned as an object here.
    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        getAge: getAge,
        getBoundingBox: sprite.getBoundingBox,
        randomize: randomize,
        draw: sprite.draw,
        update: sprite.update
    };
};
