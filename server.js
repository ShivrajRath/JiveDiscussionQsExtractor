/**
 * Modules for this project
 */
var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    cred = require('./app/cred');

var app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}));

// parse application/json
app.use(bodyParser.json());

var createExcel = require('./app/createExcel');

var config = require('./app/config.json')[app.get('env')];

// Path for client side resources
app.use(express.static(path.join(__dirname, 'public')));

app.get('/getExcel', function(req, res) {
    try {
        createExcel.getJiveData(req, res);
    } catch (ex) {
        console.log(ex);
        res.send("Something went wrong!!! Please verify the form inputs otherwise contact admin");
    }
});

app.post('/excelSubmit', function(req, res) {
    if (req.body && req.body.uname && req.body.password && req.body.placeurl) {
        cred.uname = req.body.uname.replace(/\s/g, '');
        cred.password = req.body.password;
        cred.placeurl = req.body.placeurl.replace(/\s/g, '');

        res.redirect("/getExcel");

    } else {
        res.redirect("/");
    }
});

// For handling page not found scenarios
app.get('*', function(req, res) {
    res.redirect('/');
});

//START THE SERVER
// ===========================================================================================
var port = process.env.PORT || config.port;
app.listen(port);
console.log('Application started on port: ' + port);
