const OnlineUsersPanel = (function() {
    let user = null;

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
                        $("#authSignUpForm").get(0).reset();
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
                        $("#landing-page").hide();
                        document.getElementById("home-page").style.visibility = "visible";
                        document.getElementById("users-name").innerText = user.name;
                        Socket.connect();
                    } else {
                        $("#signin-message").text("Username or password incorrect!");
                    }
                })
                .catch((err) => {
                    console.log("Error!", err);
                });

            //UserPanel.update(Authentication.getUser());
            //UserPanel.show();
            //Socket.connect();

        });

        $("#sign-out-btn").on("click", (e) => {
            fetch("/signout", {
                    method: "GET"
                })
                .then((res) => res.json())
                .then((json) => {
                    if (json.status == "success") {
                        user = null;
                        // Hide the home page
                        document.getElementById("home-page").style.visibility = "hidden";
                        $("#landing-page").show();
                        // Disconnect socket
                        Socket.disconnect();
                    }
                })
                .catch((err) => {
                    console.log("Error!");
                });
        });

        $("#play-btn").on("click", () => {
            if (user != null) {
                $("#landing-page").hide();
                document.getElementById("home-page").style.visibility = "visible";
            } else {
                // Show the auth container
                $(".auth-container").show();
                // Reset the sign-in form
                $("#authSignInForm").get(0).reset();
                // Clear any messages
                $("#signin-message").text("");
                $("#register-message").text("");
            }
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
                    // $(".auth-container").hide();
                    // document.getElementById("home-page").style.visibility = "visible";
                    document.getElementById("users-name").innerText = user.name;
                    Socket.connect();
                }
                // else { $(".auth-container").show(); };
            })
            .catch((err) => {
                console.log("Error!", err);
            });
    }

    // This function updates the online users panel
    const update = function(onlineUsers) {
        const onlineUsersArea = $("#online-users-area");
        onlineUsersArea.empty();

        const currentSocketId = Socket.getSocket().id;

        for (const socketId in onlineUsers) {
            if (socketId != currentSocketId) {
                const userDiv = $("<div id='username-" + onlineUsers[socketId].username + "'></div>")
                    .append(UI.getUserDisplay(onlineUsers[socketId]));

                onlineUsersArea.append(userDiv);

                // Use the new initializeUserClick instead of direct game creation
                if (onlineUsers[socketId].gameId === null) {
                    UI.initializeUserClick(socketId, onlineUsers[socketId]);
                }
            }
        }
    };

    // This function adds a user in the panel
    const addUser = function(userSocketId, user) {
        const onlineUsersArea = $("#online-users-area");
        const userDiv = onlineUsersArea.find("#username-" + user.username);

        if (userDiv.length == 0) {
            const newUserDiv = $("<div id='username-" + user.username + "'></div>")
                .append(UI.getUserDisplay(user));

            onlineUsersArea.append(newUserDiv);

            // Use the new initializeUserClick instead of direct game creation
            if (user.gameId === null) {
                UI.initializeUserClick(userSocketId, user);
            }
        }
    };


    // This function removes a user from the panel
    const removeUser = function(user) {
        const onlineUsersArea = $("#online-users-area");

        // Find the user
        const userDiv = onlineUsersArea.find("#username-" + user.username);

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
        const status = user.gameId === null ?
            "<span class='status-online'>Online</span>" :
            "<span class='status-ingame'>In Game, Cannot pair up</span>";

        return $("<div class='field-content row shadow' style='cursor: pointer;'></div>")
            .append($("<span class='user-name'>" + user.username + "</span>"))
            .append($("<span class='user-status'>" + status + "</span>"))
            .on('click', function() {
                $(this).parent().trigger('click');
            });
    };

    const invitationModal = {
        show: function(userData) {
            $('.inviter-name').text(userData.username);

            $('#accept-invite-btn').off().on('click', () => {
                Socket.acceptInvitation(userData.socketId);
                this.hide();
            });

            $('#decline-invite-btn').off().on('click', () => {
                Socket.declineInvitation(userData.socketId);
                this.hide();
            });

            $('#invitation-modal').css('display', 'flex');
        },

        hide: function() {
            $('#invitation-modal').hide();
        }
    };

    // Modify the click handler in OnlineUsersPanel.addUser
    const initializeUserClick = function(userSocketId, user) {
        $(document).on('click', `#username-${user.username}`, function() {
            if (user.gameId === null) {
                Socket.sendInvitation(userSocketId);
                notificationModal.show(user);
            }
        });
    };

    const notificationModal = {
        show: function(userData) {
            $('.inviter-name').text(userData.username);
            $('#notification-modal').css('display', 'flex');
        },

        hide: function(userData) {
            $("#notification-content h3").text("Invitation declined.");
            setTimeout(() => {
                $('#notification-modal').hide();
                $('.inviter-name').text("");
                $("#notification-content").html(`<h3>Inviting <span class="inviter-name"></span>...</h3>`);
            }, 1500);
        }
    }

    return {
        getUserDisplay,
        invitationModal,
        initializeUserClick,
        notificationModal
    };
})();