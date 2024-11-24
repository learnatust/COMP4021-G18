const OnlineUsersPanel = (function() {
    // This function initializes the UI
    const initialize = function() {};

    // This function updates the online users panel
    const update = function(onlineUsers) {
        const onlineUsersArea = $("#online-users-area");

        // Clear the online users area
        onlineUsersArea.empty();

		// Get the current user
        const currentSocketId = Socket.getSocket().id;

        // Add the user one-by-one
        for (const socketId in onlineUsers) {
            if (socketId != currentSocketId) {
                onlineUsersArea.append(
                    $("<div id='username-" + onlineUsers[socketId].name + "'></div>")
                        .append(UI.getUserDisplay(onlineUsers[socketId]))
                );

                $(`#username-${onlineUsers[socketId].name}`).on("click", () => {
                    Socket.createGame(socketId);
                    $("#home-page").hide();
                    $("#game-container").css("visibility", "visible");
                });
            }
        }
    };

    // This function adds a user in the panel
	const addUser = function(userSocketId, user) {
        const onlineUsersArea = $("#online-users-area");
		
		// Find the user
		const userDiv = onlineUsersArea.find("#username-" + user.name);
		
		// Add the user
		if (userDiv.length == 0) {
			onlineUsersArea.append(
				$("<div id='username-" + user.name + "'></div>")
					.append(UI.getUserDisplay(user))
			);

            $(`#username-${user.name}`).on("click", () => {
                Socket.createGame(userSocketId);
                $("#home-page").hide();
                $("#game-container").css("visibility", "visible");
            });
		}
	};

    // This function removes a user from the panel
	const removeUser = function(user) {
        const onlineUsersArea = $("#online-users-area");
		
		// Find the user
		const userDiv = onlineUsersArea.find("#username-" + user.name);
		
		// Remove the user
		if (userDiv.length > 0) userDiv.remove();
	};

    return { initialize, update, addUser, removeUser };
})();

const UI = (function() {
    // This function gets the user display
    const getUserDisplay = function(user) {
        return $("<div class='field-content row shadow'></div>")
            // .append($("<span class='user-avatar'>" +
			//         Avatar.getCode(user.avatar) + "</span>"))
            .append($("<span class='user-name'>" + user.name + "</span>"));
    };

    return { getUserDisplay };
})();
