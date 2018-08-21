var server = "https://passwordserver-xmtkvyqaxa.now.sh";
var pages = ["login", "register", "content", "vault", "form"];
var url = "";
var curView = 0;

$(document).ready(function() {
    //begin on login page
    M.updateTextFields();
    loadPage(curView);

    chrome.storage.sync.get(['password', 'username'], function(items) {
        if (items.username && items.password) {
            login(items, false);
        }
    });

    //switch been login and register
    $(".switcher").click(function() {
        if (curView == 0) {
            curView = 1;
        } else {
            curView = 0;
        }

        loadPage(curView);
    });

    $(document).on("click", ".remove", function() {
        var id = $(this).data("id");
        removeAuth(id).then(function() {
            $("#vault").click();
        })
    })

    //vault page
    $("#vault").click(function() {
        curView = 3;
        loadPage(curView);
        $(".vault-list").empty();
        getVault().then(function(data) {
            for (var i = 0; i < data.length; i++) {
                $(".vault-list").append(`
      <tr>
      <td>${data[i].url}</td>
      <td>${data[i].username}</td>
      <td>${data[i].password}</td>
      <td> <a class="btn-floating waves-effect waves-light red remove" data-id="${data[i].id}"><i class="material-icons">delete</i></a></td>
      </tr>`);

            }

        }).catch(function(e) {
            $(".vault-list").append("<p class='error'>Something went wrong. Try logging in again</p>");
        })
    })

    //new auth pa ge
    $("#detect").click(function() {
        curView = 4;
        loadPage(curView);
        chrome.tabs.query({
            currentWindow: true,
            active: true
        }, function(tabs) {
            var activeTab = tabs[0];

            url = activeTab.url;
            $(".url").html("<h6> URL: " + url + "</h6>");


        });
    })

    //logout button
    $(".logout").click(function() {
        logout();
    })

    //return to home
    $(".home").click(function() {
        chrome.storage.sync.get("username", function(userResult) {
            if (userResult.username) {
                loadUser(userResult);
            } else {
                curView = 0;
                loadPage(curView);
            }
        });
    })

    //new auth
    $(".new").submit(function(e) {
        e.preventDefault();
        var data = getFormData($(this));
        chrome.storage.sync.get('username', function(userResult) {

            chrome.storage.sync.get('password', function(passResult) {

                var newAuth = Object.assign({}, data, {
                    username: userResult.username,
                    password: passResult.password,
                    url: url
                });

                $.post({
                    url: server + "/query/add",
                    data: newAuth
                }).done(function(data) {
                    $(".info").html(data).css("color", "green")
                }).fail(function(err) {
                    $(".info").html("Empty Values?").css("color", "red")
                });

            });

        });


        $(".new").css("position", "relative").css("z-index", "200000");

    });

    //register
    $(".register").submit(function(e) {
        e.preventDefault();
        $(".error").html(`<div class="progress">
    <div class="indeterminate"></div>
  </div>`)
        var data = getFormData($(this));
        $.post({
            url: server + "/register",
            data: data
        }).done(function(data) {
            loadUser(data);
        }).fail(function(err) {
            $(".error").html("")
            $(".error").html(err.responseText)
        })
    });

    //login
    $(".login").submit(function(e) {
        e.preventDefault();
        $(".error").html(`<div class="progress">
    <div class="indeterminate"></div>
     </div>`)
        var data = getFormData($(this));
        login(data, true);
        chrome.storage.sync.set({
            username: data.username
        }, function() {
            chrome.storage.sync.set({
                password: data.password
            }, function() {});
        });

    });

    //auxiliary


    function login(data, dispErr) {
        $.post({
            url: server + "/login",
            data: data
        }).done(function(res) {
            chrome.storage.sync.set({
                loginStatus: true
            }, function() {});
            loadUser(res);
        }).fail(function(err) {
            M.updateTextFields();

            if (dispErr) {
                $(".error").html(err.responseText);
            }

        })
    }

    function logout() {
        chrome.storage.sync.remove(["username", "password"], function() {
            curView = 0;
            loadPage(curView);
        });
    }

    function getFormData($form) {
        var unindexed_array = $form.serializeArray();
        var indexed_array = {};

        $.map(unindexed_array, function(n, i) {
            indexed_array[n['name']] = n['value'];
        });

        return indexed_array;
    }

    function loadPage(num) {
        $(".page").addClass("hidden");
        $(".error").html("");
        if (num == 0) {
            $(".reg-text").removeClass("hidden");
            $(".log-text").addClass("hidden");
        } else if (num == 1) {
            $(".reg-text").addClass("hidden");
            $(".log-text").removeClass("hidden");
        } else {
            $(".reg-text").addClass("hidden");
            $(".log-text").addClass("hidden");
        }
        $("." + pages[num] + "-wrapper").removeClass("hidden");
    }


    function loadUser(data) {
        curView = 2;
        loadPage(curView);
        $(".user-name").html("User: " + data.username);

        chrome.tabs.query({
            currentWindow: true,
            active: true
        }, function(tabs) {
            var activeTab = tabs[0];
            var arr = data.auth;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].url == activeTab.url) {
                    $(".authDetected").html(`
            <h5>Authentication Detected:</h5>
            <ul class="collection" style="font-size: 20px;">
                <li class="collection-item">Username: ${arr[i].username}</li>
                <li class="collection-item">Password: ${arr[i].password}</li>

              </ul>
            `)
                }
            }

        });
    }

    function getVault() {
        return new Promise(function(resolve, reject) {
            chrome.storage.sync.get("username", function(userResult) {
                chrome.storage.sync.get("password", function(passResult) {

                    $.post({
                        url: server + "/query/all",
                        data: {
                            username: userResult.username,
                            password: passResult.password
                        }
                    }).done(function(res) {
                        resolve(res);
                    }).fail(function(err) {
                        reject(err);
                    });

                });
            });
        });
    } //get vault


    function removeAuth(id) {
        return new Promise(function(resolve, reject) {
            chrome.storage.sync.get("username", function(userResult) {
                chrome.storage.sync.get("password", function(passResult) {
                    $.post({
                        url: server + "/query/remove",
                        data: {
                            username: userResult.username,
                            password: passResult.password,
                            id: id
                        }
                    }).done(function(res) {
                        resolve(res);
                    }).fail(function(err) {
                        reject(err);
                    });
                });
            });
        });

    }



});
