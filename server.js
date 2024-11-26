const express = require("express");

const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Use the session middleware to maintain sessions
const chatSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username, avatar, name, password } = req.body;

    //
    // D. Reading the users.json file
    //
    let users = JSON.parse(fs.readFileSync("data/users.json"));

    //
    // E. Checking for the user data correctness
    //
    if (!username) {
        res.json({ status: "error", error: "Empty username." });
        return;
    }
    if (!avatar) {
        res.json({ status: "error", error: "Empty avatar." });
        return;
    }
    if (!name) {
        res.json({ status: "error", error: "Empty name." });
        return;
    }
    if (!password) {
        res.json({ status: "error", error: "Empty password." });
        return;
    }

    if (!containWordCharsOnly(username)) {
        res.json({ status: "error", error: "Username contains characters other than underscores, letters or numbers." });
        return;
    }

    if (username in users) {
        res.json({ status: "error", error: "User already exists." });
        return;
    }

    //
    // G. Adding the new user account
    //
    const hash = bcrypt.hashSync(password, 10);
    

    //
    // H. Saving the users.json file
    //
    users[username] = { avatar, name, password: hash };
    fs.writeFileSync("data/users.json", JSON.stringify(users, null, " "));

    //
    // I. Sending a success response to the browser
    //
    res.json({ status: "success" });

    // Delete when appropriate
    // res.json({ status: "error", error: "This endpoint is not yet implemented." });
});

// Handle the /signin endpoint
app.post("/signin", (req, res) => {
    // Get the JSON data from the body
    const { username, password } = req.body;

    //
    // D. Reading the users.json file
    //
    const users = JSON.parse(fs.readFileSync("data/users.json"));

    //
    // E. Checking for username/password
    //
    if (!(username in users)) {
        res.json({ status: "error", error: "User does not exist." });
        return;
    }

    const user = users[username];
    if (!bcrypt.compareSync(password, user.password)) {
        res.json({ status: "error", error: "Wrong password." });
        return;
    }

    //
    // G. Sending a success response with the user account
    //
    const userAccount = { username, avatar: user.avatar, name: user.name };
    req.session.user = userAccount;
    res.json({ status: "success", user: userAccount });
 
    // Delete when appropriate
    // res.json({ status: "error", error: "This endpoint is not yet implemented." });
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {

    //
    // B. Getting req.session.user
    //
    const user = req.session.user;
    if (user == undefined) {
        res.json({ status: "error", error: "Not signed-in" });
        return;
    }

    //
    // D. Sending a success response with the user account
    //
    res.json({ status: "success", user });
 
    // Delete when appropriate
    // res.json({ status: "error", error: "This endpoint is not yet implemented." });
});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {

    //
    // Deleting req.session.user
    //
    req.session.user = undefined;

    //
    // Sending a success response
    //
    res.json({ status: "success" })
 
    // Delete when appropriate
    // res.json({ status: "error", error: "This endpoint is not yet implemented." });
});


//
// ***** Please insert your Lab 6 code here *****
//

const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer);

io.use((socket, next) => {
    chatSession(socket.request, {}, next);
});

// onlineUsers object:
//     socket.id: {
//         avatar: user.avatar,
//         name: user.name,
//         gameId: null (default) 
//     }
const onlineUsers = {};

// games object: 
//     gameId: {
//         0 (playerId - 0/1): socket.id
//         1 (playerId - 0/1): socket.id    
//     }
let globalGameId = 0;
let games = {};

// let playerId = 0;

function opponentSocketId(fromSocketId, fromPlayerId) {
    const opponentPlayerId = fromPlayerId == 0 ? 1 : 0;
    return games[onlineUsers[fromSocketId].gameId][opponentPlayerId];
}

io.on("connect", (socket) => {
    // const user = socket.request.session.user;
    // if (user) {
    //     onlineUsers[user.username] = { avatar: user.avatar, name: user.name, socketId: socket.id };
    //     io.emit("add user", JSON.stringify(user));
    // }

    onlineUsers[socket.id] = { name: socket.id, gameId: null };
    io.emit("add user", socket.id, onlineUsers[socket.id]);

    socket.on("disconnect", () => {
        // if (user) {
        //     delete onlineUsers[user.username];
        //     io.emit("remove user", JSON.stringify(user));
        // }
        // console.log(onlineUsers);

        io.emit("remove user", onlineUsers[socket.id]);

        const gameId = onlineUsers[socket.id].gameId;
        if (gameId != null) {
            const fromPlayerId = games[gameId][0] == socket.id ? 0 : 1;
            io.to(opponentSocketId(socket.id, fromPlayerId))
                .emit("opponent rematch", false);
            delete games[gameId][fromPlayerId];
        }
        delete onlineUsers[socket.id];
    })

    socket.on("create game", opponentSocketId => {
        onlineUsers[socket.id].gameId = globalGameId;
        onlineUsers[opponentSocketId].gameId = globalGameId;
        games[globalGameId] = { "0": socket.id, "1": opponentSocketId };
        globalGameId++;

        socket.emit("playerId", 0);
        io.to(opponentSocketId).emit("playerId", 1);
        io.to(opponentSocketId).emit("join game");
    });

    socket.on("ready", fromPlayerId => {
        io.to(opponentSocketId(socket.id, fromPlayerId))
            .emit("opponent ready");
    });

    socket.on("cheat", (fromPlayerId, cheat) => {
        io.to(opponentSocketId(socket.id, fromPlayerId))
            .emit("opponent cheat", cheat);
    });

    socket.on("move", (fromPlayerId, keyCode) => {
        io.to(opponentSocketId(socket.id, fromPlayerId))
            .emit("opponent action", "move", keyCode);
    });

    socket.on("stop", (fromPlayerId, keyCode) => {
        io.to(opponentSocketId(socket.id, fromPlayerId))
            .emit("opponent action", "stop", keyCode);
    });

    socket.on("send attack", (fromPlayerId, x, y) => {
        io.to(opponentSocketId(socket.id, fromPlayerId))
            .emit("opponent attack", x, y);
    });

    socket.on("request random", (type) => {
        const x = Math.random();
        const y = Math.random();
        const gameId = onlineUsers[socket.id].gameId;
        io.to(games[gameId][0])
            .emit("random result", type, x, y);
        io.to(games[gameId][1])
            .emit("random result", type, x, y);
    });

    socket.on("rematch", (fromPlayerId, rematch) => {
        io.to(opponentSocketId(socket.id, fromPlayerId))
            .emit("opponent rematch", rematch);
    });

    socket.on("leave game", (fromPlayerId) => {
        io.to(opponentSocketId(socket.id, fromPlayerId))
            .emit("opponent rematch", false);

        const gameId = onlineUsers[socket.id].gameId;
        delete games[gameId][fromPlayerId];
        if (Object.keys(games[gameId]).length == 0) 
            delete games[gameId];
        onlineUsers[socket.id].gameId = null;
        console.log("games: ", games);
    });

    socket.on("get users", () => {
        socket.emit("users", onlineUsers);
    })
});


// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The chat server has started...");
});
