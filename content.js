$(document).ready(function() {
    var server = "https://passwordserver-xmtkvyqaxa.now.sh";

    chrome.storage.sync.get(['password', 'username'], function(items) {
        if (items.username && items.password) {
            login(items).then(function(data) {
                var arr = data.auth;
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].url == window.location.href) {
                        chrome.runtime.sendMessage({
                            "newIconPath": "lock1.png"
                        });
                    }
                }

            })
        }
    });


    function login(data) {
        return new Promise(function(resolve, reject) {
            $.post({
                url: server + "/login",
                data: data
            }).done(function(res) {
                chrome.storage.sync.set({
                    loginStatus: true
                }, function() {});
                resolve(res)
            })
        })

    }
})
