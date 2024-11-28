const OnlineUsersPanel = (function() {
    const show = function() {
        $(".auth-container").fadeIn(500);
    };

    const hide = function() {
        $("#authSignInForm").get(0).reset();
        $("#signin-message").text("");
        $("#register-message").text("");
        $(".auth-container").fadeOut(500);
    };

    // This function initializes the UI
    const initialize = function() {
        $(".auth-container").hide();

        // Handle when registration form is submitted
        $("#authSignUpForm").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#authSignUpUsername").val().trim();
            const name = $("#authSignUpName").val().trim();
            const password = $("#authSignUpPassword").val().trim();
            const confirmPassword = $("#authSignUpConfirmPassword").val().trim();

            console.log(password)

            // Password and confirmation does not match
            if (password != confirmPassword) {
                $("#register-message").text("Passwords do not match.");
                return;
            }

            // Send a register request
            const data = JSON.stringify({
                username,
                name,
                password
            });

            // Sending the AJAX request to the server
            // Processing any error returned by the server
            // Handling the success response from the server
            fetch("/register", {
                    method: "POST",
                    headers: {
                        "Content-type": "application/json"
                    },
                    body: data
                })
                .then((res) => res.json())
                .then((json) => {
                    if (json.status == "success") {
                        $("#register-message").text("You can sign in now!");
                    } else {
                        $("#register-message").text(json.error);
                    }
                })
                .catch((err) => {
                    console.log("Error!");
                });

        });

        // Handle when sign in form is submitted
        $("#authSignInForm").on("submit", (e) => {

            e.preventDefault();

            // Get the input fields
            const username = $("#authSignInUsername").val().trim();
            const password = $("#authSignInPassword").val().trim();

            // Send a signin request
            const data = JSON.stringify({
                username,
                password
            });

            // Sending the AJAX request to the server
            // Processing any error returned by the server
            // Handling the success response from the server
            fetch("/signin", {
                    method: "POST",
                    headers: {
                        "Content-type": "application/json"
                    },
                    body: data
                })
                .then((res) => res.json())
                .then((json) => {
                    if (json.status == "success") {
                        user = json.user;
                        $(".auth-container").hide();
                        document.getElementById("home-page").style.visibility = "visible";
                        Socket.connect();
                    } else {
                        $("#signin-message").text("Username or password incorrect!");
                    }
                })
                .catch((err) => {
                    console.log("Error!");
                });



            //UserPanel.update(Authentication.getUser());
            //UserPanel.show();
            //Socket.connect();



        });
    };

    const validate = function(onSuccess, onError) {
        fetch("/validate", {
                method: "GET"
            })
            .then((res) => res.json())
            .then((json) => {
                console.log("Successful!");

                if (json.status == "success") {
                    user = json.user;
                    $(".auth-container").hide();
                    document.getElementById("home-page").style.visibility = "visible";
                    Socket.connect();
                } else { $(".auth-container").show(); };
            })
            .catch((err) => {
                console.log("Error!");
            });
    }

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

    return {
        initialize,
        validate,
        update,
        addUser,
        removeUser
    };
})();

const UI = (function() {
    // This function gets the user display
    const getUserDisplay = function(user) {
        return $("<div class='field-content row shadow'></div>")
            // .append($("<span class='user-avatar'>" +
            //         Avatar.getCode(user.avatar) + "</span>"))
            .append($("<span class='user-name'>" + user.name + "</span>"));
    };

    return {
        getUserDisplay
    };
})();