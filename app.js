/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();


var async = require('async');
var oracledb = require('oracledb');
var dbConfig = require('./dbconfig.js');

var doconnect = function (cb) {
    oracledb.getConnection({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: 'https://ora1234-caibmtrial.db.us2.oraclecloudapps.com/apex/' //dbConfig.connectString
        },
        cb);
};

var dorelease = function (conn) {
    conn.close(function (err) {
        if (err)
            console.error(err.message);
    });
};

var dodrop = function (conn, cb) {
    conn.execute(
        "BEGIN " + "  EXECUTE IMMEDIATE 'DROP TABLE test'; " + "  EXCEPTION WHEN OTHERS THEN " + "  IF SQLCODE <> -942 THEN " + "    RAISE; " + "  END IF; " + "END;",
        function (err) {
            if (err) {
                return cb(err, conn);
            } else {
                console.log("Table dropped");
                return cb(null, conn);
            }
        });
};

var docreate = function (conn, cb) {
    conn.execute(
        "CREATE TABLE test (id NUMBER, name VARCHAR2(20))",
        function (err) {
            if (err) {
                return cb(err, conn);
            } else {
                console.log("Table created");
                return cb(null, conn);
            }
        });
};

var doinsert1 = function (conn, cb) {
    conn.execute(
        "INSERT INTO test VALUES (:id, :nm)", [1, 'Chris'], // Bind values
        function (err, result) {
            if (err) {
                return cb(err, conn);
            } else {
                console.log("Rows inserted: " + result.rowsAffected); // 1
                return cb(null, conn);
            }
        });
};

var doinsert2 = function (conn, cb) {
    conn.execute(
        "INSERT INTO test VALUES (:id, :nm)", [2, 'Alison'], // Bind values
        function (err, result) {
            if (err) {
                return cb(err, conn);
            } else {
                console.log("Rows inserted: " + result.rowsAffected); // 1
                return cb(null, conn);
            }
        });
};

var doupdate = function (conn, cb) {
    conn.execute(
        "UPDATE test SET name = 'Bambi'",
        function (err, result) {
            if (err) {
                return cb(err, conn);
            } else {
                console.log("Rows updated: " + result.rowsAffected); // 2
                return cb(null, conn);
            }
        });
};

async.waterfall(
  [
    doconnect,
    dodrop,
    docreate,
    doinsert1,
    doinsert2,
    doupdate,
    dodrop
  ],
    function (err, conn) {
        if (err) {
            console.error("In waterfall error cb: ==>", err, "<==");
        }
        if (conn)
            dorelease(conn);
    });


// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function () {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});
