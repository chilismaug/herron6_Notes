var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var util    = require('util');
var url     = require('url');
var jade     = require('jade');
var routes = require('./routes/index');
var users = require('./routes/users');
var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.use(favicon("public/images/favicon.ico"));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded(
    {extended: true}
    ));
app.use(cookieParser());

//app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));// var nmDbEngine = 'sqlite3';
var nmDbEngine = 'mongoose';
var notesdb = require('./notesdb-'+nmDbEngine);
app.set('view engine', 'jade');
app.set('views', __dirname + '/views-'+nmDbEngine);


//app.engine('html', require('ejs').renderFile);
//app.register('.html', require('ejs'));
//app.set('view engine', 'ejs');



/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


var parseUrlParams = function(req, res, next) {
    req.urlP = url.parse(req.url, true);
    next();
}

//var checkAccess = function(req, res, next) {
//    if (!req.cookies 
//     || !req.cookies.notesaccess 
//     || req.cookies.notesaccess !== "AOK") {
//        res.redirect('/login');
//    } else {
//        next();
//    }
//}

// app.error(function(err, req, res) {
//    res.render('500.html', { 
//        title: "Notes ("+nmDbEngine+") ERROR", error: err
//    });
// });
notesdb.connect(function(error) {
    if (error) throw error;
});
app.on('close', function(errno) {
    notesdb.disconnect(function(err) { });
});

app.get('/', /*checkAccess,*/ function(req, res) { res.redirect('/view'); });
app.get('/view', /*checkAccess,*/ function(req, res) {
    notesdb.allNotes(function(err, notes) {
        if (err) {
            util.log('ERROR ' + err);
            throw err;
        } else
            res.render('viewnotes.html', {
                title: "Notes ("+nmDbEngine+")", notes: notes
            });
    });
});
app.get('/add', /*checkAccess,*/ function(req, res) {
    res.render('addedit.html', {
        title: "Notes ("+nmDbEngine+")",
        postpath: '/add',
        note: notesdb.emptyNote  // use a dummy Note so the template works
    });
});
app.post('/add', /*checkAccess,*/ function(req, res) {
    notesdb.add(req.body.author, req.body.note, 
        function(error) {
            if (error) throw error;
            res.redirect('/view');
        });
});
app.get('/del', /*checkAccess,*/ parseUrlParams, function(req, res) {
      //  var notAllowed = null;
      //  notAllowed.delete();
    notesdb.delete(req.urlP.query.id, 
        function(error) {
            if (error) throw error;
            res.redirect('/view');
        });
});
app.get('/edit', /*checkAccess,*/ parseUrlParams, function(req, res) {
    notesdb.findNoteById(req.urlP.query.id, function(error, note) {
        if (error) throw error;
        res.render('addedit.html', {
            title: "Notes ("+nmDbEngine+")",
            postpath: '/edit',
            note: note
        });
    });
});
app.post('/edit', /*checkAccess,*/ function(req, res) {
    notesdb.edit(req.body.id, req.body.author, req.body.note,
        function(error) {
            if (error) throw error;
            res.redirect('/view');
        });
});

// app.get('/login', function(req, res) {
//    res.render('login.html', {
//        title: "Notes LOGIN ("+nmDbEngine+")",
//    });
// });
// app.post('/login', function(req, res) {
//    // TBD check credentials entered in form
//    res.cookie('notesaccess', 'AOK');
//    res.redirect('/view');
// });

// app.use(express.errorHandler({ dumpExceptions: true }));
// app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
app.listen(3000);