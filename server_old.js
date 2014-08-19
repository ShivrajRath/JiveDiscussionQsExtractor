/**
 * Modules for this project
 */
var express = require('express'),
    path = require('path'),
    cheerio = require('cheerio');

var app = express();
var jive = require('./app/jiveCaller');
// Excel export utility
var nodeExcel = require('excel-export');

var config = require('./app/config.json')[app.get('env')];

var orc_resp = [];

jive.getResponse("http://t-mobile.jiveon.com/api/core/v3/contents/?filter=type(discussion)", function(resp) {
    if (!!resp.list) {
        resp.list.forEach(function(item) {
            if (item.question) {
                orc_resp.push({
                    subject: getHTMLText(item.subject),
                    description: getHTMLText(item.content.text),
                    replyCount: item.replyCount,
                    status: item.status,
                    resolved: item.resolved,
                    updatedDate: item.updated,
                    tags: item.tags.join(','),
                    questionAuthor: item.author.displayName,
                    answer: false
                });
            }

            // Getting the answer only if answer is present
            if (item.answer) {
                // IIFE to preserve the index
                (function(index) {
                    jive.getResponse(item.answer, function(ans) {
                        orc_resp[index].answer = {
                            description: getHTMLText(ans.content.text),
                            updatedDate: ans.updated,
                            answerAuthor: ans.author.displayName
                        }
                        // Final Response from here
                    })
                })(orc_resp.length - 1);
            }
        })
    }
});

// Get's text from a input (just a string or html)
function getHTMLText(input) {
    if(!!input){
        $ = cheerio.load(input);
        return $.root().text();
    }
}

//Remove primitive data type elements within an array
function filterPrimitiveFromArray(arr) {
    var newArr = [];
    arr.forEach(function(item) {
        if (typeof item === "object") {
            newArr.push(item);
        }
    });

    return newArr;
}

// Path for client side resources
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.sendFile('./public/index.html');
})

app.get('/getExcel', function(req, res) {
    /**
     * Excel Creation
     */
    var conf = {};

    // Excel Headers
    conf.cols = [{
        caption: 'Subject',
        type: 'string',
        beforeCellWrite: function(row, cellData) {
            return getHTMLText(cellData);
        },
        width: 40
    }, {
        caption: 'Description',
        type: 'string',
        beforeCellWrite: function(row, cellData) {
            return getHTMLText(cellData);
        }
    }, {
        caption: 'Reply Count',
        type: 'number'
    }, {
        caption: 'Status',
        type: 'string'
    }, {
        caption: 'Resolved',
        type: 'string'
    }, {
        caption: 'Updated Date',
        type: 'string',
        beforeCellWrite: function(row, cellData) {
            var date = new Date(cellData);
            return date.toLocaleDateString()
        }
    }, {
        caption: 'Tags',
        type: 'string',
        beforeCellWrite: function(row, cellData) {
            if (cellData) {
                return cellData;
            } else {
                return "";
            }
        }
    }, {
        caption: 'Question Author',
        type: 'string'
    }, {
        caption: 'Answer Description',
        type: 'string',
        beforeCellWrite: function(row, cellData) {
            if (cellData) {
                return getHTMLText(cellData);
            } else {
                return "";
            }
        }
    }, {
        caption: 'Answer Updated Date',
        type: 'string',
        beforeCellWrite: function(row, cellData) {
            if (cellData) {
                var date = new Date(cellData);
                return date.toLocaleDateString()
            } else {
                return "";
            }
        }
    }, {
        caption: 'Answer Author',
        type: 'string'
    }];

    // Excel Rows
    conf.rows = [];

    orc_resp.forEach(function(item) {
        if (item.answer) {
            conf.rows.push([item.subject, item.description, item.replyCount, item.status, item.resolved, item.updatedDate, item.tags, item.questionAuthor, item.answer.description, item.answer.updatedDate, item.answer.answerAuthor]);
        } else {
            conf.rows.push([item.subject, item.description, item.replyCount, item.status, item.resolved, item.updatedDate, item.tags, item.questionAuthor, "", "", ""]);
        }
    });

    conf.rows = filterPrimitiveFromArray(conf.rows);

    var result = nodeExcel.execute(conf);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats');
    res.setHeader("Content-Disposition", "attachment; filename=" + "Discusssions.xlsx");
    res.end(result, 'binary');

});

//START THE SERVER
// ===========================================================================================
var port = process.env.PORT || config.port;
app.listen(port);
console.log('Application started on port: ' + port);
