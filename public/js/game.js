const Game = (function() {
	/* Get the canvas and 2D context */
	const cv = $("canvas").get(0);
	const context = cv.getContext("2d");
	const cvRect = cv.getBoundingClientRect();

	/* Create the sounds */
	const sounds = {
		background: new Audio("./assets/background.mp3"),
		heal: new Audio("./assets/heal.mp3"),
		trap: new Audio("./assets/trap.mp3"),
		hurt: new Audio("./assets/hurt.mp3"),
		death: new Audio("./assets/death.mp3"),
		gameover: new Audio("./assets/gameover.mp3"),
		lightning: new Audio("./assets/lightning.mp3"),
		darkbolt: new Audio("./assets/dark_bolt.mp3"),
	};

	const showHeartTime = 5000;
	const addTrapTime = 20000;

	const totalGameTime = 180; // Total game time in seconds
	const heartMaxAge = showHeartTime / 2; // The maximum age of the hearts in milliseconds
	let gameStartTime = 0; // The timestamp when the game starts
	let collectedGems = 0; // The number of gems collected in the game
	let lastAttackTimeMs = 0;
	const attackCooldownMs = 500; // 1s
	const trapCooldownMs = 5000;

	/* Create the game area */
	const gameArea = BoundingBox(context, 150, 150, 520, 850);

	/* Create the sprites in the game */
	// The local player
	let localPlayer = {
		id: 0,
		sprite: Player(context, 200, 240, gameArea, 0),
		attack: null,
		attackCount: 0,
		hitCount: 0,
		heartCount: 0,
		trapCount: 0,
		key: 0,
		cheat: false,
		ready: false,
		rematch: false
	};
	// The online opponent
	let opponent = {
		id: 1,
		sprite: Player(context, 600, 240, gameArea, 1),
		attack: null,
		attackCount: 0,
		hitCount: 0,
		heartCount: 0,
		trapCount: 0,
		key: 0,
		cheat: false,
		ready: false,
		rematch: false
	}
	let heart = null;
	const fires = [
		Fire(context, 150, 150),
		Fire(context, 120, 535),
		Fire(context, 850, 150),
		Fire(context, 880, 535)
	]
	let traps = [];

	let heartCount = 0;
	let trapCount = 0;

	let endGameTime = null;

	/************************ WebSocket functions ************************/

	function playerId(id) {
		console.log(id);
		if (id == 1) {
			localPlayer.id = 1;
			localPlayer.sprite = Player(context, 600, 240, gameArea, 1);
			opponent.id = 0;
			opponent.sprite = Player(context, 200, 240, gameArea, 0);

			$("#you").attr("x", 700);
		} else {
			localPlayer.id = 0;
			localPlayer.sprite = Player(context, 200, 240, gameArea, 0);
			opponent.id = 1;
			opponent.sprite = Player(context, 600, 240, gameArea, 1);

			$("#you").attr("x", 300);
		}

		$(`#p${localPlayer.id}-image`).attr("cursor", "pointer");
		$(`#p${localPlayer.id}-image`).on("click", () => {
			$(`#p${localPlayer.id}-status`).text("READY!");
			$(`#p${localPlayer.id}-status`).attr("x", localPlayer.id == 0 ? 300 : 700);
			Socket.ready();
			localPlayer.ready = true;

			if (opponent.ready) {
				$("#start-countdown").text(startCountdown);
				startTimer = setInterval(countdown, 1000);
			}
		});
	}

	let startTimer;
	let startCountdown = 3;

	function countdown() {
		if (startCountdown > 0) {
			startCountdown--;
			$("#start-countdown").text(startCountdown);
		} else {
			startGame();
			clearInterval(startTimer);
			startCountdown = 3;
		}
	}

	function joinGame() {
		$("#home-page").hide();
		$("#game-container").css("visibility", "visible");
	}

	function opponentReady() {
		console.log("receive ready");
		$(`#p${opponent.id}-status`).text("READY!");
		$(`#p${opponent.id}-status`).attr("x", opponent.id == 0 ? 300 : 700);
		opponent.ready = true;

		if (localPlayer.ready) {
			$("#start-countdown").text(startCountdown);
			startTimer = setInterval(countdown, 1000);
		}
	}

	function opponentCheat(cheat) {
		if (localPlayer.id == 1) opponent.cheat = cheat;
	}

	/************************* Opponent movement ************************/

	function opponentAction(type, keyCode) {
		if (type == "move") opponent.key = keyCode;
		else if (type == "stop") {
			opponent.sprite.stop(keyToDirection(keyCode));
			opponent.key = 0;
		}
	}

	/************************** Opponent attack **************************/

	function opponentAttack(x, y) {
		opponent.attackCount++;
		const isLightning = !(localPlayer.id == 0);
		const sprite = Sprite(context, x, y, {
			type: "attack",
			isLightning
		});

		const timing = 60;
		const delayFrame = 6;

		attackSprite(sprite, isLightning, timing, opponent.cheat ? 4 : 2);

		opponent.attack = sprite;

		setTimeout(() => {
			if (localPlayer.sprite.getBoundingBox().intersect(sprite.getBoundingBox())) {
				console.log("HIT local player!!!");
				if (localPlayer.sprite.hurt()) {
					endGameTime = performance.now();
					localPlayer.key = 0;
				}
				opponent.hitCount++;
			}
		}, timing * delayFrame);
	}

	/****************** Heart & traps random positions ******************/

	function randomResult(type, x, y) {
		if (type == "heart") {
			heart = Heart(context, 427, 350);
			heart.randomize(gameArea, x, y);
		} else if (type == "trap") {
			const trap = Trap(context, 427, 350);
			trap.randomize(gameArea, x, y);
			traps.push({
				trap,
				lastTriggerTime: 0
			});
		}
	}

	function opponentRematch(rematch) {
		if (rematch) {
			$(`#p${opponent.id}-rematch`).text("REMATCH? YES");
			opponent.rematch = true;

			if (localPlayer.rematch) {
				$("#rematch").text("REMATCH!");
				setTimeout(resetGame, 2000);
			}
		} else {
			$(`#p${opponent.id}-rematch`).text("REMATCH? NO");
			opponent.rematch = false;
		}
	}



	/**************************** Functions ****************************/

	function keyToDirection(keyCode) {
		switch (keyCode) {
			case 87:
				return 2;
			case 65:
				return 1;
			case 83:
				return 4;
			case 68:
				return 3;
		}
	}

	function toggleCheat() {
		if (localPlayer.id == 1) return;
		localPlayer.cheat = !localPlayer.cheat;
		Socket.cheat(localPlayer.cheat)
	}

	function attackSprite(sprite, isLightning, timing, scale = 2) {
		if (isLightning) {
			// Lightning 
			sprite.setSequence({
					x: 0,
					y: 0,
					width: 64,
					height: 128,
					count: 10,
					timing: timing,
					loop: false
				})
				.setScale(scale)
				.setShadowScale({
					x: 0.55,
					y: 0.15
				})
				.useSheet("./assets/lightning.png");
		} else {
			// Dark bolt
			sprite.setSequence({
					x: 0,
					y: 0,
					width: 64,
					height: 88,
					count: 11,
					timing,
					loop: false
				})
				.setScale(scale)
				.setShadowScale({
					x: 0.55,
					y: 0.15
				})
				.useSheet("./assets/dark_bolt.png");
		}
	}

	function startGame() {
		console.log("START");
		// Wait for half a cooldown period after game starts
		lastAttackTimeMs = Date.now() - attackCooldownMs / 2;
		Socket.getRandomPos("trap");

		/* Hide the start screen */
		$("#game-start").hide();
		playAudio("background");

		/* Handle the keydown of arrow keys and spacebar */
		$(document).on("keydown", function(event) {
			if (endGameTime != null) return;

			if (
				event.keyCode == 87 ||
				event.keyCode == 65 ||
				event.keyCode == 83 ||
				event.keyCode == 68
			) {
				if (localPlayer.key != event.keyCode) {
					Socket.action("move", event.keyCode);
				}
				localPlayer.key = event.keyCode;
			}
		});

		/* Handle the keyup of arrow keys and spacebar */
		$(document).on("keyup", function(event) {
			if (endGameTime != null) return;

			// Toggle cheat
			if (event.keyCode == 32) toggleCheat();

			if (localPlayer.key != event.keyCode) return;
			localPlayer.sprite.stop(keyToDirection(event.keyCode));
			Socket.action("stop", event.keyCode);
			localPlayer.key = 0;
		});

		$("canvas").on("click", function(event) {
			if (endGameTime != null) return;
			if (lastAttackTimeMs + attackCooldownMs > Date.now()) return;
			lastAttackTimeMs = Date.now();
			localPlayer.attackCount++;

			// body element default 8px margin
			const x = event.clientX - cvRect.left + 8;
			const y = event.clientY - cvRect.top + 8;
			const isLightning = localPlayer.id == 0;
			Socket.attack(x, y);

			const timing = 60;
			const delayFrame = 6;

			const sprite = Sprite(context, x, y, {
				type: "attack",
				isLightning
			});
			attackSprite(sprite, isLightning, timing, localPlayer.cheat ? 4 : 2);
			localPlayer.attack = sprite;

			if (isLightning) playAudio("lightning")
			else playAudio("darkbolt");

			setTimeout(() => {
				if (opponent.sprite.getBoundingBox().intersect(sprite.getBoundingBox())) {
					console.log("HIT opponent!!!");
					const die = opponent.sprite.hurt();
					die ? playAudio("death") : playAudio("hurt");
					if (die) {
						endGameTime = performance.now();
						opponent.key = 0;
					}
					localPlayer.hitCount++;
				}
			}, timing * delayFrame);
		});

		/* Start the game */
		requestAnimationFrame(doFrame);
	}

	// Reset game-related vars before rematch/leave room
	function resetGame() {
		let startX = localPlayer.id == 0 ? 200 : 600;
		localPlayer.sprite = Player(context, startX, 240, gameArea, localPlayer.id);
		localPlayer.attack = null;
		localPlayer.attackCount = 0;
		localPlayer.hitCount = 0;
		localPlayer.heartCount = 0;
		localPlayer.trapCount = 0;
		localPlayer.key = 0;
		localPlayer.cheat = false;
		localPlayer.ready = false;
		localPlayer.rematch = false;

		startX = startX == 200 ? 600 : 200;
		opponent.sprite = Player(context, startX, 240, gameArea, opponent.id);
		opponent.attack = null;
		opponent.attackCount = 0;
		opponent.hitCount = 0;
		opponent.heartCount = 0;
		opponent.trapCount = 0;
		opponent.key = 0;
		opponent.cheat = false;
		opponent.ready = false;
		opponent.rematch = false;

		gameStartTime = 0;
		lastAttackTimeMs = 0;
		heart = null;
		traps = [];
		heartCount = 0;
		trapCount = 0;
		endGameTime = null;

		context.clearRect(0, 0, cv.width, cv.height);

		$("#start-countdown").text("");
		$("#rematch").text("");
		$("#p0-status").text("PREPARING...");
		$("#p0-status").attr("x", 315);
		$("#p1-status").text("PREPARING...");
		$("#p1-status").attr("x", 715);
		$(`#p0-rematch`).html("REMATCH? <tspan id='p0-rematch-yes'>YES</tspan> / <tspan id='p0-rematch-no'>NO");
		$(`#p1-rematch`).html("REMATCH? <tspan id='p1-rematch-yes'>YES</tspan> / <tspan id='p1-rematch-no'>NO");
		$("#time-remaining").text("180");

		// Clear event listeners and cursor styles
		$(document).off();
		$("canvas").off();
		$("#leave-game").off();
		$(`#p${localPlayer.id}-rematch-yes`).off();
		$(`#p${localPlayer.id}-rematch-no`).off();
		$(`#p${localPlayer.id}-rematch-yes`).attr("cursor", "auto");
		$(`#p${localPlayer.id}-rematch-no`).attr("cursor", "auto");

		$("#game-over").hide();
		$("#game-start").show();
	}

	// Display game statistics in game over page
	function writeStats(winnerId) {
		let id = localPlayer.id;
		$("#leave-game").on("click", () => {
			// Clear event listener and cursor style
			$(`#p${id}-image`).off();
			$(`#p${id}-image`).attr("cursor", "auto");

			Socket.leaveGame();
			$("#game-container").css("visibility", "hidden");
			resetGame();
			$("#home-page").show();
		});

		$(`#p${id}-attack-count`).text(localPlayer.attackCount);
		$(`#p${id}-hit-count`).text(localPlayer.hitCount);
		let accuracy = localPlayer.attackCount == 0 ?
			0 :
			localPlayer.hitCount * 100 / localPlayer.attackCount;
		$(`#p${id}-accuracy`).text(`${Math.round(accuracy * 10) / 10}%`);
		$(`#p${id}-heart-count`).text(localPlayer.heartCount);
		$(`#p${id}-trap-count`).text(localPlayer.trapCount);
		$(`#p${id}-rematch-yes`).attr("cursor", "pointer");
		$(`#p${id}-rematch-no`).attr("cursor", "pointer");

		$(`#p${id}-rematch-yes`).on("click", () => {
			$(`#p${localPlayer.id}-rematch`).text("REMATCH? YES");
			Socket.rematch(true);
			localPlayer.rematch = true;

			if (opponent.rematch) {
				$("#rematch").text("REMATCH!");
				setTimeout(resetGame, 2000);
			}
		});
		$(`#p${id}-rematch-no`).on("click", () => {
			$(`#p${localPlayer.id}-rematch`).text("REMATCH? NO");
			Socket.rematch(false);
			localPlayer.rematch = false;
		});

		if (id == 0) $("#game-over #you").attr("x", 140)
		else $("#game-over #you").attr("x", 586)

		id = opponent.id;
		$(`#p${id}-attack-count`).text(opponent.attackCount);
		$(`#p${id}-hit-count`).text(opponent.hitCount);
		accuracy = opponent.attackCount == 0 ?
			0 :
			opponent.hitCount * 100 / opponent.attackCount;
		$(`#p${id}-accuracy`).text(`${Math.round(accuracy * 10) / 10}%`);
		$(`#p${id}-heart-count`).text(opponent.heartCount);
		$(`#p${id}-trap-count`).text(opponent.trapCount);

		if (winnerId == 0) $("#crown").attr("x", 125);
		else if (winnerId == 1) $("#crown").attr("x", 571);
	}

	/* The main processing of the game */
	function doFrame(now) {
		if (gameStartTime == 0) gameStartTime = now;

		/* Update the time remaining */
		const gameTimeSoFar = now - gameStartTime;
		const timeRemaining = Math.ceil((totalGameTime * 1000 - gameTimeSoFar) / 1000);
		$("#time-remaining").text(timeRemaining);

		/* TODO */
		/* Handle the game over situation here */
		if (
			timeRemaining == 0 ||
			(
				endGameTime != null &&
				now > endGameTime + 1800
			)
		) {

			let title;
			let winnerId;
			if (localPlayer.sprite.getLives() > opponent.sprite.getLives()) {
				title = "YOU WIN!";
				winnerId = localPlayer.id;
			} else if (localPlayer.sprite.getLives() < opponent.sprite.getLives()) {
				title = "YOU LOSE...";
				winnerId = opponent.id;
			} else {
				title = "TIE!";
				winnerId = null;
			}

			$("#end-title").text(title);
			writeStats(winnerId);
			$("#game-over").show();

			pauseAudio();
			playAudio("gameover");
			return
		}

		/*********************** Add heart & trap ***********************/

		// One heart every minute
		if (gameTimeSoFar >= showHeartTime + showHeartTime * heartCount) {
			Socket.getRandomPos("heart");
			++heartCount;
		}

		// One trap every 30s
		if (gameTimeSoFar >= addTrapTime + addTrapTime * trapCount) {
			Socket.getRandomPos("trap");
			++trapCount;
		}

		/************************* Move players *************************/

		if (localPlayer.sprite.getHurtStatus() != 1 && localPlayer.key != 0)
			localPlayer.sprite.move(keyToDirection(localPlayer.key));

		if (opponent.sprite.getHurtStatus() != 1 && opponent.key != 0)
			opponent.sprite.move(keyToDirection(opponent.key));

		/************************ Update sprites ************************/

		if (endGameTime == null) {
			if (heart != null) heart.update(now);
			if (localPlayer.attack != null && localPlayer.attack.update(now))
				localPlayer.attack = null;
			if (opponent.attack != null && opponent.attack.update(now))
				opponent.attack = null;
			traps.forEach((trap, index) => {
				if (trap != null && trap.trap.update(now)) trap.trap.reset();
			});
		} else {
			// Play remaining animation before end game
			if (now < endGameTime + 260) {
				traps.forEach((trap, index) => {
					if (trap != null && trap.trap.update(now)) trap.trap.reset();
				});
			}

			if (now < endGameTime + 320) {
				if (localPlayer.attack != null && localPlayer.attack.update(now))
					localPlayer.attack = null;
				if (opponent.attack != null && opponent.attack.update(now))
					opponent.attack = null;
			}
		}

		fires.forEach(fire => fire.update(now));

		if (localPlayer.sprite.update(now) && localPlayer.sprite.getHurtStatus() == 1)
			localPlayer.sprite.endHurt();
		if (opponent.sprite.update(now) && opponent.sprite.getHurtStatus() == 1)
			opponent.sprite.endHurt();

		/***************** Check heart & trap collision *****************/

		if (heart != null) {
			if (heart.getAge(now) >= heartMaxAge) heart = null;
			else {
				const heartBox = heart.getBoundingBox();
				const localPlayerHit = localPlayer
					.sprite
					.getBoundingBox()
					.intersect(heartBox);
				const opponentHit = opponent
					.sprite
					.getBoundingBox()
					.intersect(heartBox);

				// Heal sound
				if (localPlayerHit || opponentHit) {
					playAudio("heal");
					heart = null;
				}

				if (localPlayerHit) {
					localPlayer.sprite.heal();
					localPlayer.heartCount++;
				}
				if (opponentHit) {
					opponent.sprite.heal();
					opponent.heartCount++;
				}
			}
		}

		if (endGameTime == null) {
			traps.forEach(trap => {
				if (trap != null) {
					const trapBox = trap.trap.getBoundingBox();
					const localPlayerHit = localPlayer
						.sprite
						.getBoundingBox()
						.intersect(trapBox, true);
					const opponentHit = opponent
						.sprite
						.getBoundingBox()
						.intersect(trapBox, true);

					// Trap trigger cooldown
					if (
						trap.lastTriggerTime != 0 &&
						trap.lastTriggerTime + trapCooldownMs > now
					) {
						return;
					}

					// Trap sound and animation
					if (localPlayerHit || opponentHit) {
						if (trap.trap.sequence.count == 1) {
							playAudio("trap");

							trap.trap.trigger();
							trap.lastTriggerTime = now;
						}
					}

					// Player damage animation
					if (localPlayerHit) {
						localPlayer.trapCount++;
						const die = localPlayer.sprite.hurt();
						die ? playAudio("death") : playAudio("hurt");

						if (die) {
							endGameTime = now;
							localPlayer.key = 0;
						}
					}
					if (opponentHit) {
						opponent.trapCount++;
						const die = opponent.sprite.hurt();
						die ? playAudio("death") : playAudio("hurt");

						if (opponent.sprite.hurt()) {
							endGameTime = now;
							opponent.key = 0;
						}
					}
				}
			});
		}

		/************************* Draw sprites *************************/

		/* Clear the screen */
		context.clearRect(0, 0, cv.width, cv.height);

		/* Draw the sprites */
		fires.forEach(fire => fire.draw());
		traps.forEach(trap => {
			if (trap != null) trap.trap.draw();
		});
		if (heart != null) heart.draw();
		localPlayer.sprite.draw();
		opponent.sprite.draw();
		if (localPlayer.attack != null) localPlayer.attack.draw();
		if (opponent.attack != null) opponent.attack.draw();

		/* Process the next frame */
		requestAnimationFrame(doFrame);
	}

	function playAudio(name) {
		let startTime = 0;

		if (name == "trap" || name == "heal") startTime = 0.1;
		else if (name == "background") sounds[name].loop = true;

		sounds[name].currentTime = startTime;
		sounds[name].play();
	}

	function pauseAudio() {
		for (const soundName in sounds) {
			if (soundName == "gameover") continue;
			sounds[soundName].pause();
		}
	}

	return {
		playerId,
		joinGame,
		opponentReady,
		opponentCheat,
		opponentAction,
		opponentAttack,
		randomResult,
		opponentRematch
	};
})();