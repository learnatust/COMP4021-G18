// Sprite hitbox width and height before scale
const hitboxes = {
    attack: { width: 11, height: 15 },
    player: { width: 10, height: 22 },
    trap: { width: 12, height: 9 },
    heart: { width: 7, height: 7 }
}

// This function defines a Sprite module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the sprite
// - `y` - The initial y position of the sprite
// - `_attack` - Whether it is a attack sprite and whether the attack is lightning, { isLightning: true/false }
const Sprite = function(ctx, x, y, _notes = null) {

    // This is the image object for the sprite sheet.
    const sheet = new Image();

    // This is an object containing the sprite sequence information used by the sprite containing:
    // - `x` - The starting x position of the sprite sequence in the sprite sheet
    // - `y` - The starting y position of the sprite sequence in the sprite sheet
    // - `width` - The width of each sprite image
    // - `height` - The height of each sprite image
    // - `count` - The total number of sprite images in the sequence
    // - `timing` - The timing for each sprite image
    // - `loop` - `true` if the sprite sequence is looped
    let sequence = { x: 0, y: 0, width: 20, height: 20, count: 1, timing: 0, loop: false };

    // This is the index indicating the current sprite image used in the sprite sequence.
    let index = 0;

    // This is the scaling factor for drawing the sprite.
    let scale = 1;

    // This is the scaling factor to determine the size of the shadow, relative to the scaled sprite image size.
    // - `x` - The x scaling factor
    // - `y` - The y scaling factor
    let shadowScale = { x: 1, y: 0.25 };

    // This is the updated time of the current sprite image.
    // It is used to determine the timing to switch to the next sprite image.
    let lastUpdate = 0;

    const notes = _notes;

    // This function uses a new sprite sheet in the image object.
    // - `spriteSheet` - The source of the sprite sheet (URL)
    const useSheet = function(spriteSheet) {
        sheet.src = spriteSheet;
        return this;
    };

    // This function returns the readiness of the sprite sheet image.
    const isReady = function() {
        return sheet.complete && sheet.naturalHeight != 0;
    };

    // This function gets the current sprite position.
    const getXY = function() {
        return {x, y};
    };

    // This function sets the sprite position.
    // - `xvalue` - The new x position
    // - `yvalue` - The new y position
    const setXY = function(xvalue, yvalue) {
        [x, y] = [xvalue, yvalue];
        return this;
    };

    // This function sets the sprite sequence.
    // - `newSequence` - The new sprite sequence to be used by the sprite
    const setSequence = function(newSequence) {
        sequence = newSequence;
        index = 0;
        lastUpdate = 0;
        return this;
    };

    // This function sets the scaling factor of the sprite.
    // - `value` - The new scaling factor
    const setScale = function(value) {
        scale = value;
        return this;
    };

    // This function sets the scaling factor of the sprite shadow.
    // - `value` - The new scaling factor as an object
    //   - `value.x` - The x scaling factor
    //   - `value.y` - The y scaling factor
    const setShadowScale = function(value) {
        shadowScale = value;
        return this;
    };

    // This function gets the display size of the sprite.
    const getDisplaySize = function() {
        /* Find the scaled width and height of the sprite */
        const scaledWidth  = sequence.width * scale;
        const scaledHeight = sequence.height * scale;
        return {width: scaledWidth, height: scaledHeight};
    };

    const getHitboxSize = function() {
        /* Find the scaled width and height of the sprite */
        const width = 
            (
                notes.type == "attack" || 
                notes.type == "player" ||
                notes.type == "trap" ||
                notes.type == "heart"
            )
                ? hitboxes[notes.type].width 
                : sequence.width;

        const height = 
            (
                notes.type == "attack" || 
                notes.type == "player" ||
                notes.type == "trap" ||
                notes.type == "heart"
            )
                ? hitboxes[notes.type].height 
                : sequence.height;

        let scaledWidth  = width * scale * 1.2;
        let scaledHeight = height * scale * 1.2;
        if (notes.type == "attack" && !notes.isLightning) scaledWidth *= 1.15;
        return {width: scaledWidth, height: scaledHeight};
    };

    // This function gets the bounding box of the sprite.
    const getBoundingBox = function() {
        /* Get the display size of the sprite */
        const size = getHitboxSize();

        /* Find the box coordinates */
        let top = y - size.height / 2;
        const left = x - size.width / 2;
        let bottom = y + size.height / 2;
        const right = x + size.width / 2;

        if (notes.type == "player") {
            const yStart = y + size.height * 0.18;
            top = yStart;
            bottom = yStart + size.height * 0.5;
        }

        return BoundingBox(ctx, top, left, bottom, right);
    };

    // This function draws shadow underneath the sprite.
    const drawShadow = function() {
        /* Save the settings */
        ctx.save();

        /* Get the display size of the sprite */
        const size = getDisplaySize();

        /* Find the scaled width and height of the shadow */
        const shadowWidth  = size.width * shadowScale.x;
        const shadowHeight = size.height * shadowScale.y;

        /* Draw a semi-transparent oval */
        ctx.fillStyle = "black";
        ctx.globalAlpha = 0.6;
        ctx.beginPath();

        let factor = notes.type == "player" 
            ? 0.7 
            : notes.type == "attack" 
                ? notes.isLightning ? 0.1 : 0.17
                : 1;
        ctx.ellipse(x, y + size.height * factor / 2,
                    shadowWidth / 2, shadowHeight / 2, 0, 0, 2 * Math.PI);
        ctx.fill();

        /* Restore saved settings */
        ctx.restore();
    };

    // This function draws the sprite.
    const drawSprite = function() {
        /* Save the settings */
        ctx.save();

        /* Get the display size of the sprite */
        const size = getDisplaySize();

        let factor = notes.type == "attack" && notes.isLightning ? 0.92 : 0.85;

        /* TODO */
        /* Replace the following code to draw the sprite correctly */
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
            sheet, 
            sequence.x + index * sequence.width, 
            sequence.y, 
            sequence.width, 
            sequence.height,
            parseInt(x - size.width / 2),
            notes.type == "attack" 
                ? parseInt(y - size.height * factor) 
                : parseInt(y - size.height / 2),
            sequence.width * scale,
            sequence.height * scale
        );

        if (notes.type != "fire") {
            const box = getBoundingBox();
            ctx.strokeStyle = "red";
            ctx.strokeRect(
                parseInt(x - (box.getRight() - box.getLeft()) / 2),
                notes.type == "player" ? parseInt(box.getTop()) : parseInt(y - (box.getBottom() - box.getTop()) / 2),
                (box.getRight() - box.getLeft()),
                (box.getBottom() - box.getTop())
            );
        }

        /* Restore saved settings */
        ctx.restore();
    };
     
    // This function draws the shadow and the sprite.
    const draw = function() {
        if (isReady()) {
            drawShadow();
            drawSprite();
        }
        return this;
    };

    // This function updates the sprite by moving to the next sprite
    // at appropriate time.
    // - `time` - The timestamp when this function is called
    const update = function(time) {
        if (lastUpdate == 0) lastUpdate = time;


        /* TODO */
        /* Move to the next sprite when the timing is right */
        if (time - lastUpdate >= sequence.timing) {
            index++;
            if (index >= sequence.count) {
                if (sequence.loop) index = 0;
                else {
                    index--;
                    return true
                }
            }
            lastUpdate = time;
        }


        return false;
    };

    // The methods are returned as an object here.
    return {
        useSheet: useSheet,
        getXY: getXY,
        setXY: setXY,
        setSequence: setSequence,
        setScale: setScale,
        setShadowScale: setShadowScale,
        getDisplaySize: getDisplaySize,
        getBoundingBox: getBoundingBox,
        isReady: isReady,
        draw: draw,
        update: update
    };
};
