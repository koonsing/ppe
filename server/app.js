// SERVER-SIDE STARTUP FILE
// 'use strict';

// =======================================
//      DEPENDENCIES
// =======================================
const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const fs = require("fs");
const tools = require('./tools.js')();

// =======================================
//      MIDDLEWARES
// =======================================
var app = express();
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// =======================================
//      LOCAL VARIABLES
// =======================================
var config = tools.getConfig();

// =======================================
//      SOCKET IO INIT AND HANDLING
// =======================================
const https = require('http')
var options = {
    key: fs.readFileSync(__dirname + '/cert/key.pem'),
    cert: fs.readFileSync(__dirname + '/cert/cert.pem')
};
var server = https.createServer(options, app);
const io = require('socket.io')(server);

//=====================================
//* >>> IMPORT CONTROLLERS >>>
//=====================================
const RemoteCtrl = require("./api/remote.js")(io);
const InspectionCtrl = require("./api/inspection.js")(RemoteCtrl);

//=====================================
//* >>> API END POINT CONSTANTS >>>
//=====================================
const API_INSPECTION_URI = "/api/inspection";
const API_REMOTE_URI = "/api/remote";
const API_CONFIG_URI = "/api/config";

// =======================================
//      EXPRESS ROUTES
// =======================================
app.set('view engine', 'ejs');
app.use(express.static(__dirname));
app.use(express.static('public'));
app.use('/scripts', express.static(__dirname + '/../node_modules/'));
app.use('/alerts', express.static(__dirname + 'alerts/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//======================================
//* >>> API END POINTS AND CALLBACKS >>>
//======================================

app.post("/api/inspection/abc/", RemoteCtrl.postvalidate);
app.get("/api/inspection/def/", RemoteCtrl.dockercall);
app.post(API_INSPECTION_URI + "/clientstationrtspinfo/", InspectionCtrl.initStationRtsp);
app.post(API_INSPECTION_URI + "/clientrtspinfo/", InspectionCtrl.initRtsp);
app.post(API_INSPECTION_URI + "/job/", InspectionCtrl.inspect);
app.get(API_INSPECTION_URI  + "/stations/:stationId", InspectionCtrl.queryStation);
app.get(API_INSPECTION_URI  + "/stations/", InspectionCtrl.queryAllStations);
app.get(API_INSPECTION_URI  + "/incidents/:trackingId", InspectionCtrl.queryIncident);

app.get(API_REMOTE_URI + "/clientinfo/:stationId", RemoteCtrl.getClientReq);
app.get(API_REMOTE_URI + "/clientinfo/", RemoteCtrl.getAllClientsReq);

app.get(API_CONFIG_URI + "/models", InspectionCtrl.getModels)
app.post(API_CONFIG_URI + "/threshold", InspectionCtrl.setThreshold)
app.get(API_CONFIG_URI, InspectionCtrl.getConfig)
app.post(API_CONFIG_URI, InspectionCtrl.updateConfig)

// Allow Cross Origin Request
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS, DELETE, GET');
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', function(req, res) {
    res.render('index');
    console.log('>> web client initialised!');
});


// =======================================
//      ERROR HANDLER (404 - page not found; 501 - server error)
// =======================================
app.use(function(req, res) {
    res.status(404).sendFile(path.join(__dirname + '/../public/assets/msg/404.html'));
});
app.use(function(err, req, res, next) {
    res.status(501).sendFile(path.join(__dirname, '/../public/assets/msg/501.html'));
});

// =======================================
//      SERVER CONFIG
// =======================================
// ********** SERVER PORT SETUP
app.enable("trust proxy");
const port = process.env.PORT || 5008;

// Secured HTTPS
server.listen(port, function() {
    console.log(`%s \nNode App listening at port:${port}`, new Date());
    //console.log(`Server running at http://${hostname}:${port}/`);

    
})


