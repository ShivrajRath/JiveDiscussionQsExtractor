var request = require('request');
var cred = require('./cred');

var jive = {

    getResponse: function(url, callback) {
        // URL with timestamp to avoid caching
        url = url + ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime();

        request.get(url, {
            'auth': {
                'user': cred.uname,
                'pass': cred.password
            },
            'timeout': 8000
        }, function(error, response, body) {
            if (error) {
                console.log("ERROR: " + error);
                throw error;
            }
            var formattedBody = body.replace("throw 'allowIllegalResourceCall is false.';", "");
            callback(JSON.parse(formattedBody));
        });
    }
}

module.exports = jive;
