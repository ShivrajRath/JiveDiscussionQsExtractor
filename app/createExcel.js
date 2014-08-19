/**
 * CREATEEXCEL.JS
 * All logic for excel generation with the questions
 */

var util = require('./utility'),
    jive = require('./jiveCaller'),
    cred = require('./cred'),
    nodeExcel = require('excel-export');

// Orchestrated response for excel creation
var orc_resp = [];

module.exports = {
    /**
     * Excel creation logic
     */
    generateExcel: function(req, res) {
        /**
         * Excel Creation
         */
        var conf = {};

        // Excel Headers
        conf.cols = [{
            caption: 'Subject',
            type: 'string',
            beforeCellWrite: function(row, cellData) {
                return util.getHTMLText(cellData);
            },
            width: 40
        }, {
            caption: 'Description',
            type: 'string',
            beforeCellWrite: function(row, cellData) {
                return util.getHTMLText(cellData);
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
                    return util.getHTMLText(cellData);
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

        conf.rows = util.filterPrimitiveFromArray(conf.rows);

        var result = nodeExcel.execute(conf);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "Discusssions.xlsx");
        res.end(result, 'binary');
    },

    /**
     * Get's the jive data and calls the excel utility
     */
    getJiveData: function(req, res) {

        // Reset
        orc_resp = [];
        // Get the jive community URL from the place URL
        var jiveLoc = util.getLocation(cred.placeurl);
        var jiveURL = jiveLoc.protocol + "//" + jiveLoc.hostname;
        var url = jiveURL + "/api/core/v3/contents/?filter=type(discussion)&count=25&startIndex=0";

        this.paginateRequests(url, req, res);

    },

    // Paginate through the requests to get the entire result set
    paginateRequests: function(url, req, res) {
        var self = this;

        jive.getResponse(url, function(resp) {
            // If response is not 200 code, then it returns a message
            if (resp.message) {
                res.send(resp.message + " Please try again!!!");
                return;
            }
            if (!!resp.list) {
                resp.list.forEach(function(item) {
                    if (item.question && item.parentPlace && (item.parentPlace.html === cred.placeurl)) {
                        orc_resp.push({
                            subject: util.getHTMLText(item.subject),
                            description: util.getHTMLText(item.content.text),
                            replyCount: item.replyCount,
                            status: item.status,
                            resolved: item.resolved,
                            updatedDate: item.updated,
                            tags: item.tags.join(','),
                            questionAuthor: item.author.displayName,
                            answer: item.answer
                        });
                    }
                });

                var next = resp.links.next;

                // If no next url is present
                if (orc_resp.length && !next) {
                    self.getAnswerDetails(req, res);
                } else if (next) {
                    self.paginateRequests(next, req, res);
                } else {
                    res.send("No discussion questions available at this place yet!!!");
                }
            } else {
                res.send("No discussion questions available at this place yet!!!");
            }
        });
    },

    // Get answers for 
    getAnswerDetails: function(req, res) {
        var self = this;
        var totalRecords = orc_resp.length;

        var totalRecordsCheckedForAnswer = 0;

        orc_resp.forEach(function(item, index) {
            // Getting the answer only if answer is present
            if (item.answer) {
                // IIFE to preserve the index
                (function(index) {
                    jive.getResponse(item.answer, function(ans) {
                        orc_resp[index].answer = {
                            description: util.getHTMLText(ans.content.text),
                            updatedDate: ans.updated,
                            answerAuthor: ans.author.displayName
                        }

                        // Increment the records handled, once done call for generating excel
                        ++totalRecordsCheckedForAnswer;
                        if (totalRecordsCheckedForAnswer === totalRecords) {
                            // Final Response from here
                            self.generateExcel(req, res);
                        }
                    })
                })(index);
            } else {
                // Increment the records handled, once done call for generating excel
                ++totalRecordsCheckedForAnswer;
                if (totalRecordsCheckedForAnswer === totalRecords) {
                    // Final Response from here
                    self.generateExcel(req, res);
                }
            }
        })
    }
}
