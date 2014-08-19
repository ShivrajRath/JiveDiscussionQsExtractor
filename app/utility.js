/**
 * UTILTY.JS
 * Houses all the common utlity methods
 */

var cheerio = require('cheerio');

module.exports = {
    // Get's text from a input (just a string or html)
    getHTMLText: function(input) {
        if (!!input) {
            $ = cheerio.load(input);
            return $.root().text();
        }
    },

    //Remove primitive data type elements within an array
    filterPrimitiveFromArray: function(arr) {
        var newArr = [];
        arr.forEach(function(item) {
            if (typeof item === "object") {
                newArr.push(item);
            }
        });

        return newArr;
    },

    //Split url into its constituents
    getLocation: function (href) {
        var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
        return match && {
            protocol: match[1],
            host: match[2],
            hostname: match[3],
            port: match[4],
            pathname: match[5],
            search: match[6],
            hash: match[7]
        }
    }
};
