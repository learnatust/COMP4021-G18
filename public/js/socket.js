const Socket = (function() {
    // This stores the current Socket.IO socket
    let socket = null;

    let playerId = null;

    // This function gets the socket from the module
    const getSocket = function() {
        return socket;
    };

    const setPlayerId = function (id) {
        playerId = id;
    }

    // This function connects the server and initializes the socket
    const connect = function() {
        socket = io();

        // Wait for the socket to connect successfully
        socket.on("connect", () => {
            // Get the online user list
            socket.emit("get users");
        });

        socket.on("users", (onlineUsers) => {
            // Show the online users
            OnlineUsersPanel.update(onlineUsers);
        });

        socket.on("add user", (userSocketId, user) => {
            OnlineUsersPanel.addUser(userSocketId, user);
        });

        socket.on("remove user", (user) => {
            OnlineUsersPanel.removeUser(user);
        });

        socket.on("playerId", id => {
            setPlayerId(id);
            Game.playerId(id);
        });

        socket.on("receive invitation", (userData) => {
            UI.invitationModal.show(userData);
        });

        socket.on("invitation declined", (userData) => {
            // For now, no message saying that the invitation was declined
        });

        socket.on("join game", () => {
            Game.joinGame();
        });

        socket.on("opponent ready", () => {
            Game.opponentReady();
        });

        socket.on("opponent cheat", cheat => {
            Game.opponentCheat(cheat);
        });

        socket.on("opponent action", (type, keyCode) => {
            Game.opponentAction(type, keyCode);
        });

        socket.on("opponent attack", (x, y) => {
            Game.opponentAttack(x, y);
        });

        socket.on("random result", (type, x, y) => {
            Game.randomResult(type, x, y);
        });

        socket.on("opponent rematch", rematch => {
            Game.opponentRematch(rematch);
        });
    };

    // This function disconnects the socket from the server
    const disconnect = function() {
        socket.disconnect();
        socket = null;
        playerId = null;
    };

    const createGame = function (opponentSocketId) {
        if (socket && socket.connected) {
            playerId = 0;
            socket.emit("create game", opponentSocketId);
            // Update local users panel immediately
            socket.emit("get users");
        }
    }

    const sendInvitation = function(targetSocketId) {
        if (socket && socket.connected) {
            socket.emit("send invitation", targetSocketId);
        }
    };

    const acceptInvitation = function(inviterSocketId) {
        if (socket && socket.connected) {
            socket.emit("accept invitation", inviterSocketId);
        }
    };

    const declineInvitation = function(inviterSocketId) {
        if (socket && socket.connected) {
            socket.emit("decline invitation", inviterSocketId);
        }
    };

    const ready = function () {
        if (socket && socket.connected)
            socket.emit("ready", playerId);
    }

    const cheat = function (cheat) {
        if (socket && socket.connected)
            socket.emit("cheat", playerId, cheat);
    }

    const action = function (type, keyCode) {
        if (type != "move" && type != "stop") return;

        if (socket && socket.connected) {
            switch (keyCode) {
                case 37: keyCode = 65; break;
                case 38: keyCode = 87; break;
                case 39: keyCode = 68; break;
                case 40: keyCode = 83; break;
            }

            socket.emit(type, playerId, keyCode);
        }
    }

    const attack = function (x, y) {
        if (socket && socket.connected)
            socket.emit("send attack", playerId, x, y);
    }

    const getRandomPos = function (type) {
        if (socket && socket.connected) {
            // Only one player in a game requests for random position,
            //   which will then be used by both players
            if (playerId == 0)
                socket.emit("request random", type);
        }
    }

    const rematch = function (rematch) {
        if (socket && socket.connected)
            socket.emit("rematch", playerId, rematch);
    }

    const leaveGame = function() {
        if (socket && socket.connected) {
            socket.emit("leave game", playerId);
            // Update local users panel immediately
            socket.emit("get users");
        }
    }

    return {
        getSocket, setPlayerId,
        connect, disconnect,
        sendInvitation, acceptInvitation, declineInvitation,
        createGame, ready, cheat, action, attack, getRandomPos, rematch, leaveGame
    };
})();
