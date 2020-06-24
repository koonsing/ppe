//**********************************************************************************************************
//* >>> API CONTROLLER FOR INSPECTION >>>
//*     This file contains all the Inspection functions
//**********************************************************************************************************

//=====================================
//* DEPENDENCIES
//=====================================
const tools = require("../tools.js")();
const path = require("path");
const fs = require("fs");
const schedule = require('node-schedule');
const sharp = require('sharp');

//=====================================
//* LOCAL VARIABLES
//=====================================
var config = tools.getConfig();
var scheduledJobs = {};
var RemoteCtrl;

var waitingLimit = config.trackingLimit; //non-detection for 5 mins = change of person
var inferencesBasePath = path.join(__dirname, '/../alerts/inferences/');
var dataBasePath = path.join(__dirname, '/../alerts/data/');
var tempBasePath = path.join(__dirname, '/../alerts/temp/');
var cropBasePath = path.join(__dirname, '/../alerts/cropped/');

//=====================================
//* MAIN FUNCTION EXPORTS
//=====================================
module.exports = function (rc) {
    RemoteCtrl = rc;
    return {
        queryHistory: queryHistory,
        setThreshold: setThreshold,
        getModels: getModels,
        getConfig: getConfig,
        updateConfig: updateConfig,
        initRtsp: initRtsp,
        initStationRtsp: initStationRtsp,
        stopRtsp: stopRtsp,
        createJob: createJob,
        deleteJob: deleteJob,
        inspect: inspect,
        queryStation: queryStation,
        queryIncident: queryIncident,
        queryAllStations: queryAllStations

    }
}

//===========================================
//* PROTOTYPE
//=========================================== 
// === PROTOTYPE TO ADD LEADING ZEROS TO NUMBER ===
Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
}

//===========================================
//* REQUEST HANDLING FUNCTIONS
//=========================================== 


function initStationRtsp(req, res) {
    var rtspHost = req.body.rtspHost;
    var stationId = req.body.stationId;
    var socketId = req.body.socketId;
    console.log("\n" + new Date().toLocaleString() + " >>> Initializing RTSP for Station " + stationId + "...")

    if (!(RemoteCtrl.getClient(stationId))) {
        // INIT RTSP TO VIDEO MICROSERVICE
        tools.initStationidRtsp(stationId,rtspHost)
            .then(function (rtspRes) {
                var taskId = rtspRes.taskId;
                console.log(new Date().toLocaleString() + " >>> RTSP initialized with task ID " + taskId + ". Setting up socket record...")
                var clientParams = {
                    "stationId": stationId,
                    "socketId": socketId,
                    "rtspHost": rtspHost,
                    "taskId": taskId
                }
                if (RemoteCtrl.setClient(clientParams)) {
                    console.log(new Date().toLocaleString() + " >>> Socket client has been setup for station " + stationId + ".\n")
                    res.status(200);
                    res.json(clientParams)
                } else {
                    console.log(new Date().toLocaleString() + " !!! Error setting up socket client for station " + stationId + ".\n")
                    res.status(500);
                    res.json({ "error": "Station " + stationId + " failed setting up socket." });
                };
            })
            .catch(function (rtspErr) {
                console.log(new Date().toLocaleString() + " !!! RTSP init error on station " + stationId + ": " + rtspErr + ".\n");
                res.status(500);
                res.json({ "error": "RTSP init error: " + rtspErr });
            })
    } else {
        res.status(500);
        res.json({ "error": "Client " + stationId + " exists!!! Please enter a different station Id" })
    }
}




function initRtsp(req, res) {
    var rtspHost = req.body.rtspHost;
    var stationId = req.body.stationId;
    var socketId = req.body.socketId;
    console.log("\n" + new Date().toLocaleString() + " >>> Initializing RTSP for Station " + stationId + "...")

    if (!(RemoteCtrl.getClient(stationId))) {
        // INIT RTSP TO VIDEO MICROSERVICE
        tools.initRtsp(rtspHost)
            .then(function (rtspRes) {
                var taskId = rtspRes.taskId;
                console.log(new Date().toLocaleString() + " >>> RTSP initialized with task ID " + taskId + ". Setting up socket record...")
                var clientParams = {
                    "stationId": stationId,
                    "socketId": socketId,
                    "rtspHost": rtspHost,
                    "taskId": taskId
                }
                if (RemoteCtrl.setClient(clientParams)) {
                    console.log(new Date().toLocaleString() + " >>> Socket client has been setup for station " + stationId + ".\n")
                    res.status(200);
                    res.json(clientParams)
                } else {
                    console.log(new Date().toLocaleString() + " !!! Error setting up socket client for station " + stationId + ".\n")
                    res.status(500);
                    res.json({ "error": "Station " + stationId + " failed setting up socket." });
                };
            })
            .catch(function (rtspErr) {
                console.log(new Date().toLocaleString() + " !!! RTSP init error on station " + stationId + ": " + rtspErr + ".\n");
                res.status(500);
                res.json({ "error": "RTSP init error: " + rtspErr });
            })
    } else {
        res.status(500);
        res.json({ "error": "Client " + stationId + " exists!!! Please enter a different station Id" })
    }
}

function inspect(req, res) {
    var stationId = req.body.stationId;
    var interval = req.body.interval;
    var action = req.body.action;
    var threshold = req.body.threshold;
    var model = req.body.model;

    console.log("\n" + new Date().toLocaleString() + " >>> Received " + action + " request from station " + stationId + "...")
    if (action == "start") {
        createJob(stationId, interval, threshold, model)
            .then(function (jobRes) {
                console.log(new Date().toLocaleString() + " >>> " + jobRes + "\n");
                res.status(200);
                res.json({ "status": jobRes });
            })
            .catch(function (jobErr) {
                console.log(new Date().toLocaleString() + " !!! " + jobErr + "\n");
                res.status(500);
                res.json({ "error": jobErr });
            })
    } else if (action == "stop") {
        deleteJob(stationId)
            .then(function (jobRes) {
                console.log(new Date().toLocaleString() + " >>> " + jobRes + "\n");
                res.status(200);
                res.json({ "status": jobRes });
            })
            .catch(function (jobErr) {
                console.log(new Date().toLocaleString() + " !!! " + jobErr + "\n");
                res.status(500);
                res.json({ "error": jobErr });
            })
    } else if (action == "reset") {
        stopRtsp(stationId)
            .then(function (jobRes) {
                console.log(new Date().toLocaleString() + " >>> " + jobRes + "\n");
                res.status(200);
                res.json({ "status": jobRes });
            })
            .catch(function (jobErr) {
                console.log(new Date().toLocaleString() + " !!! " + jobErr + "\n");
                res.status(500);
                res.json({ "error": jobErr });
            })
    }
}

function queryIncident(req, res) {
    // TODO
    var trackingId = req.params.trackingId;
}

function queryHistory(req, res) {
    console.log('Query History');
    var imgFilePath = __dirname + '/../../public/assets/images/objdetect/';
    var fileList;
    var queryResult = {
        'imageFiles': [],
        'imageFileNames': [],
        'scoringResult': {}
    };
    var model = req.params.model
    fs.readdir(imgFilePath, function (err, files) {
        if (files) {
            var fileRegex = new RegExp(model + ".*.json", "g")
            console.log("REGEX: " + fileRegex)
            fileList = files.filter(function (e) {
                // return path.extname(e).toLowerCase() === '.json'
                return path.basename(e).match(fileRegex);
            });
            console.log("File List : " + fileList);
            fileList.forEach(function (fileName, idx) {
                fileNameNoExt = path.parse(fileName).name;
                timestampStr = new Date(parseInt(fileNameNoExt.replace(new RegExp('.*scoreimage_'), '')));
                var date = timestampStr.getFullYear() + '-' + (timestampStr.getMonth() + 1) + '-' + timestampStr.getDate();
                var time = timestampStr.getHours() + ":" + timestampStr.getMinutes() + ":" + timestampStr.getSeconds();
                var formattedDate = date + ' ' + time;
                queryResult['imageFiles'].push(fileNameNoExt + '.jpg');
                queryResult['imageFileNames'].push(fileNameNoExt);
                var jsonResult = fs.readFileSync(imgFilePath + fileNameNoExt + '.json');
                var jsonData = JSON.parse(jsonResult);
                queryResult['scoringResult'][fileNameNoExt] = jsonData;
                queryResult['scoringResult'][fileNameNoExt]['timestamp'] = formattedDate;
            })
        }

        console.log("QUERY RESULT: " + queryResult);
        res.status(200);
        res.json(queryResult);
    });
}

function setThreshold(req, res) {
    threshold = req.body.threshold;
    res.status(200);
    res.send("Threshold set!!");
}


function queryAllStations(req, res) {
    console.log("\n" + new Date().toLocaleString() + " >>> Getting stations with alerts and connected stations...")
    var result = { 'stationsArray': [] };
    fs.readdir(dataBasePath, function (err, files) {
        if (files) {
            files.forEach(function (fileName, idx) {
                result.stationsArray.push(fileName.split('.json')[0])
            })
        }
        localClients = RemoteCtrl.getAllClients();
        Object.keys(localClients).forEach(function (client, idx) {
            if (!result.stationsArray.includes(client)) {
                result.stationsArray.push(client)
            }
        })
        console.log(new Date().toLocaleString() + " >>> Obtained all stations.\n")
        res.status(200);
        res.json(result);
    })

}

function queryStation(req, res) {
    var stationId = req.params.stationId;
    console.log("\n" + new Date().toLocaleString() + " >>> Getting info for station " + stationId + "...")
    var result = { 'fileIndexArray': [] }
    if (stationId == "all") {
        fs.readdir(dataBasePath, function (err, files) {
            if (files) {
                console.log(files);
                files.forEach(function (fileName, idx) {
                    var dataFile = path.join(dataBasePath, fileName);
                    var jsonResult = fs.readFileSync(dataFile);
                    var jsonData = JSON.parse(jsonResult);
                    Object.keys(jsonData).forEach(function (stationItem, idx) {
                        Object.keys(jsonData[stationItem]).forEach(function (item, idx) {
                            jsonData[stationItem][item].alertFileIndex.forEach(function (fileIdx, idx) {
                                result.fileIndexArray.push(fileIdx);
                            })
                        })
                    })
                })
            }
            console.log(new Date().toLocaleString() + " >>> Obtained info for station " + stationId + ".\n")
            res.status(200);
            res.json(result);
        })
    } else {
        var dataFile = path.join(dataBasePath, stationId + ".json");
        var jsonResult = fs.readFileSync(dataFile);
        var jsonData = JSON.parse(jsonResult);
        Object.keys(jsonData[stationId]).forEach(function (item, idx) {
            jsonData[stationId][item].alertFileIndex.forEach(function (fileIdx, idx) {
                result.fileIndexArray.push(fileIdx);
            })
        })
        console.log(new Date().toLocaleString() + " >>> Obtained info for station " + stationId + ".\n")
        res.status(200);
        res.json(result);
    }

}

function getModels(req, res) {
    console.log("\n" + new Date().toLocaleString() + " >>> Getting registered models...")
    config = tools.getConfig();
    var models = {}
    for (var key in config.paivUri) {
        // console.log(key);
        if (config.paivUri[key].active) {
            // console.log(config.paivUri[key]);
            models[key] = config.paivUri[key]
        }
    }
    console.log(new Date().toLocaleString() + " >>> Obtained models.\n")
    res.status(200);
    res.json(models);
}

function getConfig(req, res) {
    console.log("GETTING CONFIG: " + path.join(__dirname, "../config/config.json"))
    var rawConfig = fs.readFileSync(path.join(__dirname, "../config/config.json"));
    var currConfig = JSON.parse(rawConfig)
    // console.log(currConfig);
    res.status(200);
    res.json(currConfig);
}

function updateConfig(req, res) {
    console.log("UPDATE CONFIG");
    // console.log(JSON.stringify(req.body));
    for (var key in req.body) {
        config[key] = req.body[key]
    }
    console.log(JSON.stringify(config))
    try {
        fs.writeFileSync(path.join(__dirname, "../config/config.json"), JSON.stringify(req.body));
        res.status(200);
        res.end();
    } catch (error) {
        res.status(501);
        res.send(error)
    }


}

//===========================================
//* LOCAL FUNCTIONS
//=========================================== 


function createJob(stationId, interval, threshold, model) {
    let jobRes = new Promise(function (resolve, reject) {
        console.log(new Date().toLocaleString() + " >>> >>> Checking Job for station " + stationId + "...")
        console.log(new Date().toLocaleString() + " >>> >>> Current Scheduled Jobs : " + Object.keys(scheduledJobs))
        var msgData = {
            'stationId': stationId,
            'model': model
        }
        try {
            if ((stationId) in scheduledJobs) {
                console.log(new Date().toLocaleString() + " >>> >>> Scheduled Job exists for station " + stationId + ". Recreating Job...")
                scheduledJobs[stationId].cancel();
                delete (scheduledJobs[stationId]);
                scheduledJobs[stationId] = schedule.scheduleJob('*/' + interval + ' * * * * *', function () {
                    rtspInspect(msgData);
                });
                scheduledJobs[stationId].tracking = false;
                scheduledJobs[stationId].waiting = false;
                scheduledJobs[stationId].threshold = threshold;
                scheduledJobs[stationId].trackingNonCompliance = [];
                scheduledJobs[stationId].allNonCompliance = {};
                scheduledJobs[stationId].trackingCounter = 0;
                scheduledJobs[stationId].trackingId = '';
                scheduledJobs[stationId].trackingStart = '';
                scheduledJobs[stationId].waitingStart = '';
                scheduledJobs[stationId].currGood = [];
                scheduledJobs[stationId].currBad = [];
                scheduledJobs[stationId].alert = false;
                scheduledJobs[stationId].imageData = {};
                console.log(new Date().toLocaleString() + " >>> >>> Job Updated: " + stationId)
                resolve("Scheduled Job for " + stationId + " has been updated with " + interval + " secs interval")
            } else {
                console.log(new Date().toLocaleString() + " >>> >>> Creating New Job for station " + stationId + "...")
                scheduledJobs[stationId] = schedule.scheduleJob('*/' + interval + ' * * * * *', function () {
                    rtspInspect(msgData);
                });
                scheduledJobs[stationId].tracking = false;
                scheduledJobs[stationId].waiting = false;
                scheduledJobs[stationId].threshold = threshold;
                scheduledJobs[stationId].trackingNonCompliance = [];
                scheduledJobs[stationId].allNonCompliance = {};
                scheduledJobs[stationId].trackingCounter = 0;
                scheduledJobs[stationId].trackingId = '';
                scheduledJobs[stationId].trackingStart = '';
                scheduledJobs[stationId].waitingStart = '';
                scheduledJobs[stationId].currGood = [];
                scheduledJobs[stationId].currBad = [];
                scheduledJobs[stationId].alert = false;
                scheduledJobs[stationId].imageData = {};
                console.log(new Date().toLocaleString() + " >>> >>> Job Created: " + stationId)
                resolve("Scheduled Job for " + stationId + " has been created with " + interval + " secs interval")
            }
        }
        catch (jobErr) {
            console.log(new Date().toLocaleString() + " !!! !!! Job error: " + jobErr)
            reject("Error setting Job for station " + stationId + " : " + jobErr);
        }
    })
    return jobRes;
}

function deleteJob(stationId) {
    let jobRes = new Promise(function (resolve, reject) {
        console.log(new Date().toLocaleString() + " >>> >>> Scheduled Jobs : " + Object.keys(scheduledJobs))
        try {
            var client = RemoteCtrl.getClient(stationId);
            if (client) {
                if (stationId in scheduledJobs) {
                    console.log(new Date().toLocaleString() + " >>> >>> Found Job " + stationId + ". Stopping Job...");
                    scheduledJobs[stationId].cancel();
                    delete (scheduledJobs[stationId]);
                    console.log(new Date().toLocaleString() + " >>> >>> Job " + stationId + " stopped")
                } else {
                    console.log(new Date().toLocaleString() + " >>> >>> Job " + stationId + " DOESN'T EXIST");
                }
                tools.stopRtsp(client.taskId)
                    .then(function (rtspRes) {
                        console.log("RTSP STOP: " + JSON.stringify(rtspRes));
                        RemoteCtrl.removeConnection(RemoteCtrl.getClientSocket(stationId));
                        resolve(rtspRes);
                    })
                    .catch(function (rtspErr) {
                        console.log("RTSP STOP ERROR: " + rtspErr);
                        reject(rtspErr)
                    })
            }
        }
        catch (jobErr) {
            console.log("StopJob Err: " + jobErr);
            reject(jobErr);
        }
    })
    return jobRes
}

function stopRtsp(stationId) {
    let jobRes = new Promise(function (resolve, reject) {
        console.log("Job From " + stationId);
        var client = RemoteCtrl.getClient(stationId);
        if (client) {
            tools.stopRtsp(client.taskId)
                .then(function (rtspRes) {
                    console.log("RTSP STOP: " + JSON.stringify(rtspRes));
                    resolve(rtspRes);
                })
                .catch(function (rtspErr) {
                    console.log("RTSP STOP ERROR: " + rtspErr);
                    reject(rtspErr)
                })
        }
    })
    return jobRes
}

function rtspInspect(msgData) {
    // OBTAIN RTSP FROM MICROSERVICE
    var config = tools.getConfig();
    console.log("\n" + new Date().toLocaleString() + " >>> [JOB " + msgData.stationId + "] JOB START...");
    var client = RemoteCtrl.getClient(msgData.stationId);
    var img = '';
    if (client) {
        var taskId = client.taskId;
        console.log('\n' + new Date().toLocaleString() + " >>> [JOB " + msgData.stationId + "] >>>>>>> RTSP FRAME >>>>>>>\n")
        tools.getFrame(taskId, msgData.stationId)
            .then(function (frameRes) {
                console.log(new Date().toLocaleString() + " >>> [JOB " + msgData.stationId + "] Obtained RTSP Frame. Inferencing Frame... ");
                console.log('\n' + new Date().toLocaleString() + " >>> [JOB " + msgData.stationId + "] >>>>>>> INFERENCING >>>>>>>\n")

                var model = config.paivUri[msgData.model];
                img = frameRes.meta.imgData
                return tools.inference(model, img, msgData.stationId)
            })
            .then(function (inferenceRes) {
                console.log(new Date().toLocaleString() + " >>> [JOB " + msgData.stationId + "] Frame inferencing completed. Running business logic... ");
                return ppeLogic(inferenceRes, msgData.stationId, img, msgData.model);
            })
            .then(function () {
                console.log(new Date().toLocaleString() + " >>> [JOB " + msgData.stationId + "] Job Completed !!!!!!\n")
            })
            .catch(function (frameErr) {
                console.log(new Date().toLocaleString() + " !!! [JOB " + msgData.stationId + "] Frame Job Error: " + JSON.stringify(frameErr));
            })
    }
}

// ================== BUSINESS LOGIC LIBRARY ====================
function ppeLogic(objects, stationId, img, model) {
    console.log("\n" + new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "]  >>>>>>> PPE LOGIC >>>>>>>\n")
    let ppeRes = new Promise(async function (resolve, reject) {
        try {
            var config = tools.getConfig();
            var trackingObjLabels = config.trackingObjects[model];
            var goodLabels = config.goodObjects[model];
            var badLabels = config.badObjects[model];
            var twoStepsObjects = config.twoStepsObjects[model];

            scheduledJobs[stationId].currGood = [];
            scheduledJobs[stationId].currBad = [];
            scheduledJobs[stationId].alert = false;
            scheduledJobs[stationId].imageData = {};
            var t0 = new Date()

            var eventTS = new Date();
            var tzoffset = (new Date()).getTimezoneOffset() * 60000;
            eventTS.setTime(t0.getTime() - tzoffset);


            if (objects.classified.length > 0) {
                console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Objects detected. Checking threshold...")
                var threshObj = checkThreshold(objects, scheduledJobs[stationId].threshold, stationId);


                var objLabels = []
                threshObj.classified.forEach(function (obj, idx) {
                    objLabels.push(obj.label);
                })
                console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Threshold-filtered Objects: " + objLabels);
                var trackingDetected = false;
                trackingObjLabels.forEach(function (track, idx) {
                    if (objLabels.includes(track)) {
                        trackingDetected = true;
                    }
                })

                // CHECK IF TRACKABLE OBJECT IS DETECTED                
                if (trackingDetected) {
                    console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Tracking Objects detected.");
                    scheduledJobs[stationId].waitingStart = '';
                    scheduledJobs[stationId].waiting = false;
                    // NEW TRACKING
                    if (!scheduledJobs[stationId].tracking) {
                        scheduledJobs[stationId].tracking = true;
                        scheduledJobs[stationId].waiting = false;
                        scheduledJobs[stationId].trackingNonCompliance = [];
                        scheduledJobs[stationId].trackingId = stationId + "_" + t0.getTime();
                        console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] >>>>>>>> NEW TRACKING ID:" + t0.getTime());
                        scheduledJobs[stationId].trackingStart = t0;
                    }

                    // ITERATE THROUGH DETECTED OBJECTS
                    console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Analyzing objects...");
                    for (var obj of threshObj.classified) {
                        await analyzeObj(obj, trackingObjLabels, goodLabels, badLabels, twoStepsObjects, stationId, model)
                    }

                } else {
                    if (scheduledJobs[stationId].tracking) {
                        // TRACKING OBJECT IS NOT DETECTED. START WAITING FOR 5 MINS
                        if (!scheduledJobs[stationId].waiting) {
                            console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] >>>>>>>> TRACKING OBJECT MISSING. START WAITING FOR 5 MINS.....")
                            scheduledJobs[stationId].waiting = true;
                            scheduledJobs[stationId].waitingStart = t0;
                        } else {
                            console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] >>>>>>>> TRACKING OBJECT MISSING. WAITING.... ");

                            var timeDiff = t0.getTime() - scheduledJobs[stationId].waitingStart.getTime(); // IN MILISECONDS
                            if (timeDiff >= waitingLimit * 60000) {
                                console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] >>>>>>>> TIME'S UP. RESETTING TRACKING.... ");

                                scheduledJobs[stationId].waiting = false;
                                scheduledJobs[stationId].tracking = false;
                                scheduledJobs[stationId].waitingStart = '';
                                scheduledJobs[stationId].trackingId = '';
                                scheduledJobs[stationId].trackingCounter = 0;
                            }
                        }
                    }
                }
            } else {
                if (scheduledJobs[stationId].tracking) {
                    // TRACKING OBJECT IS NOT DETECTED. START WAITING FOR 5 MINS
                    if (!scheduledJobs[stationId].waiting) {
                        console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] >>>>>>>> NO OBJECT DETECTED. START WAITING FOR 5 MINS.....")
                        scheduledJobs[stationId].waiting = true;
                        scheduledJobs[stationId].waitingStart = t0;
                    } else {
                        console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] >>>>>>>> NO OBJECT DETECTED. WAITING.... ");

                        var timeDiff = t0.getTime() - scheduledJobs[stationId].waitingStart.getTime(); // IN MILISECONDS
                        if (timeDiff >= waitingLimit * 60000) {
                            console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] >>>>>>>> TIME'S UP. RESETTING TRACKING.... ");

                            scheduledJobs[stationId].waiting = false;
                            scheduledJobs[stationId].tracking = false;
                            scheduledJobs[stationId].waitingStart = '';
                            scheduledJobs[stationId].trackingId = '';
                            scheduledJobs[stationId].trackingCounter = 0;
                        }
                    }
                }
            }

            if (scheduledJobs[stationId].alert) {
                console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Saving Alert...")
                scheduledJobs[stationId].trackingCounter++;
                scheduledJobs[stationId].imageData = {
                    "stationId": stationId,
                    "trackingId": scheduledJobs[stationId].trackingId,
                    "fileId": scheduledJobs[stationId].trackingId + "_" + (scheduledJobs[stationId].trackingCounter).pad(4),
                    "timestamp": eventTS,
                    "counter": scheduledJobs[stationId].trackingCounter,
                    "good": scheduledJobs[stationId].currGood,
                    "bad": scheduledJobs[stationId].currBad,
                    "nonCompliance": scheduledJobs[stationId].trackingNonCompliance,
                    "alert": scheduledJobs[stationId].alert,
                    "imgWidth": objects.imgWidth,
                    "imgHeight": objects.imgHeight
                }

                storeAlert(scheduledJobs[stationId].imageData, img)
                    .then(function (storeRes) {
                        console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Saving Alert Done");
                        console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Pushing Image with Result...")
                        RemoteCtrl.pushImage(scheduledJobs[stationId].imageData)
                        resolve()

                    })
                    .catch(function (storeErr) {
                        console.log(new Date().toLocaleString() + " !!! !!! [JOB " + stationId + "] Saving Alert Error: " + storeErr);
                        reject(storeErr);
                    })
            } else {
                scheduledJobs[stationId].imageData = {
                    "stationId": stationId,
                    "trackingId": scheduledJobs[stationId].trackingId,
                    "fileId": scheduledJobs[stationId].trackingId + "_" + (scheduledJobs[stationId].trackingCounter).pad(4),
                    "timestamp": eventTS,
                    "counter": scheduledJobs[stationId].trackingCounter,
                    "good": scheduledJobs[stationId].currGood,
                    "bad": scheduledJobs[stationId].currBad,
                    "nonCompliance": scheduledJobs[stationId].trackingNonCompliance,
                    "alert": scheduledJobs[stationId].alert,
                    "img": img,
                    "imgWidth": objects.imgWidth,
                    "imgHeight": objects.imgHeight
                }
                RemoteCtrl.pushImage(scheduledJobs[stationId].imageData);
                resolve();
            }

        }
        catch (ppeErr) {
            console.log(new Date().toLocaleString() + " !!! !!! [JOB " + stationId + "] PPE LOGIC TRY CATCH ERROR : " + ppeErr);
            reject(ppeErr)
        }

        // TODO: CONVERT TIMESTAMP - SEE REF
        // timestampStr = new Date(parseInt(fileNameNoExt.replace(new RegExp('.*scoreimage_'), '')));
        // var date = timestampStr.getFullYear() + '-' + (timestampStr.getMonth() + 1) + '-' + timestampStr.getDate();
        // var time = timestampStr.getHours() + ":" + timestampStr.getMinutes() + ":" + timestampStr.getSeconds();
        // var formattedDate = date + ' ' + time;
        // queryResult['imageFiles'].push(fileNameNoExt + '.jpg');
        // queryResult['imageFileNames'].push(fileNameNoExt);
        // var jsonResult = fs.readFileSync(imgFilePath + fileNameNoExt + '.json');
        // var jsonData = JSON.parse(jsonResult);
        // queryResult['scoringResult'][fileNameNoExt] = jsonData;
        // queryResult['scoringResult'][fileNameNoExt]['timestamp'] = formattedDate;

        // SOCKET IO PUSH IMAGE
        // https://gist.github.com/companje/b95e735650f1cd2e2a41

    })
    return ppeRes
}

function analyzeObj(obj, trackingObjLabels, goodLabels, badLabels, twoStepsObjects, stationId, model) {
    let analyzeRes = new Promise(async function (resolve, reject) {

        console.log("\n" + new Date().toLocaleString() + " >>> >>> >>> [JOB " + stationId + "] Analyzing Object: " + obj.label);
        if (trackingObjLabels.includes(obj.label)) {
            resolve();
        }
        else if (goodLabels.includes(obj.label)) {
            scheduledJobs[stationId].currGood.push(obj)
            resolve();
        }
        else if (badLabels.includes(obj.label)) {
            scheduledJobs[stationId].currBad.push(obj)
            // IF THERE'S NEW NON-COMPLIANCE - TRIGGER NEW ALERT
            if (!scheduledJobs[stationId].trackingNonCompliance.includes(obj.label)) {
                // if (true) {
                console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + stationId + "] >>>>>>>> NEW NON-COMPLIANCE");

                scheduledJobs[stationId].trackingNonCompliance.push(obj.label);
                scheduledJobs[stationId].alert = true;
            } else {
                console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + stationId + "] No new non-compliance");
            }
            resolve();
        }
        else if (twoStepsObjects.includes(obj.label)) {
            console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + stationId + "] Two steps object. Cropping object: " + obj.label + "...")
            let cropped = path.join(cropBasePath, stationId + "_cropped.jpg")
            sharp.cache(false);
            await sharp(path.join(tempBasePath, stationId + '_temp.jpg'))
                .extract({ width: obj.xmax - obj.xmin, height: obj.ymax - obj.ymin, left: obj.xmin, top: obj.ymin })
                .toBuffer(function (err, buffer) {
                    if (err) {
                        reject(err)
                    } else {
                        console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + stationId + "] Object " + obj.label + " cropped. Classifying object...");
                        tools.classify(config.paivUri[model], buffer, stationId)
                            .then(function (classRes) {
                                console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + stationId + "] Classification done. Analyzing result...");
                                var classLabel = classRes.classified[0][0]
                                var classConfidence = classRes.classified[0][1]
                                obj.label = classLabel;
                                obj.confidence = classConfidence;
                                if (goodLabels.includes(classLabel)) {
                                    scheduledJobs[stationId].currGood.push(obj)
                                }
                                if (badLabels.includes(classLabel)) {
                                    scheduledJobs[stationId].currBad.push(obj)
                                    // IF THERE'S NEW NON-COMPLIANCE - TRIGGER NEW ALERT
                                    if (!scheduledJobs[stationId].trackingNonCompliance.includes(obj.label)) {
                                        // if (true) {
                                        console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + stationId + "] >>>>>>>> NEW NON COMPLIANCE !!!!");

                                        scheduledJobs[stationId].trackingNonCompliance.push(obj.label);
                                        scheduledJobs[stationId].alert = true;
                                    } else {
                                        console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + stationId + "] No new non-compliance");
                                    }
                                }
                                console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + stationId + "] Good Objects : " + JSON.stringify(scheduledJobs[stationId].currGood));
                                console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + stationId + "] Bad Objects : " + JSON.stringify(scheduledJobs[stationId].currBad));
                                resolve();
                            })
                            .catch(function (classErr) {
                                console.log(new Date().toLocaleString() + " !!! !!! !!! [JOB " + stationId + "] Classification error: " + JSON.stringify(classErr))
                                reject(classErr);
                            })
                    }
                })
        }
    })
    return analyzeRes;
}

function storeAlert(imageData, img) {
    let storeRes = new Promise(function (resolve, reject) {
        // STORE ALERT IMAGE + INFERENCE DATA
        var buffer = Buffer.from(img, 'base64');
        var alertFile = path.join(inferencesBasePath, imageData.fileId);
        var indexFile = path.join(dataBasePath, imageData.stationId)
        try {
            console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + imageData.stationId + "] Saving alert image " + alertFile + ".jpg ...");
            fs.writeFile(alertFile + ".jpg", buffer, function (err) {
                if (err) {
                    console.log(new Date().toLocaleString() + " !!! !!! !!! [JOB " + imageData.stationId + "] Error saving alert image: " + err)
                    reject(err);
                } else {
                    console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + imageData.stationId + "] Saving alert image successful. Writing metadata...");
                    var jsonData = {
                        "stationId": imageData.stationId,
                        "trackingId": imageData.trackingId,
                        "fileId": imageData.fileId,
                        "timestamp": imageData.timestamp,
                        "counter": imageData.counter,
                        "good": imageData.good,
                        "bad": imageData.bad,
                        "alert": imageData.alert,
                        "imgWidth": imageData.imgWidth,
                        "imgHeight": imageData.imgHeight
                    }
                    fs.writeFile(alertFile + ".json", JSON.stringify(jsonData), function (err) {
                        if (err) {
                            console.log(new Date().toLocaleString() + " !!! !!! !!! [JOB " + imageData.stationId + "] Error saving alert metadata: " + err)
                            reject(err);
                        } else {
                            console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + imageData.stationId + "] Saving alert metadata successful: " + alertFile + ".json. Writing index data...");
                            var data = {}
                            if (fs.existsSync(indexFile + ".json")) {
                                var rawData = fs.readFileSync(indexFile + ".json", 'utf8');
                                data = JSON.parse(rawData);
                            }
                            if (!(imageData.stationId in data)) {
                                data[imageData.stationId] = {}
                            }
                            if (!(imageData.trackingId in data[imageData.stationId])) {
                                data[imageData.stationId][imageData.trackingId] = {
                                    "nonCompliance": imageData.nonCompliance,
                                    "alertFileIndex": [imageData.fileId]
                                }
                            } else {
                                data[imageData.stationId][imageData.trackingId].nonCompliance = imageData.nonCompliance;
                                data[imageData.stationId][imageData.trackingId].alertFileIndex.push(imageData.fileId);
                            }

                            fs.writeFile(indexFile + '.json', JSON.stringify(data), function (err) {
                                if (err) {
                                    console.log(new Date().toLocaleString() + " !!! !!! !!! [JOB " + imageData.stationId + "] Error saving summary data: " + err)

                                } else {
                                    console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + imageData.stationId + "] Saving index file successful: " + indexFile + ".json");
                                    resolve([alertFile + '.jpg', alertFile + '.json', indexFile + '.json'])
                                }
                            })
                        }
                    });
                }
            });
        }
        catch (alertErr) {
            console.log(new Date().toLocaleString() + " !!! !!! !!! [JOB " + imageData.stationId + "] STORE ALERT TRY CATCH ERROR : " + alertErr);
            reject(alertErr);
        }
    })
    return storeRes;
}


function checkThreshold(result, detectThreshold, stationId) {
    var thresRes = { "classified": [], "result": "success" }
    console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Detect Threshold : " + (detectThreshold / 100))
    result['classified'].forEach(function (resEl, idx) {
        if (resEl['confidence'] >= (detectThreshold / 100)) {
            thresRes['classified'].push(resEl)
        }
    })
    return thresRes;
}


//===========================================
//* REFERENCES
//=========================================== 
// var RESULT = {
//     "classified": [
//         {
//             "confidence": 0.99954,
//             "ymax": 2221,
//             "label": "disconnected",
//             "xmax": 3039,
//             "xmin": 963,
//             "ymin": 1177,
//             "attr": [{}]
//         },
//         {
//             "confidence": 0.99983,
//             "ymax": 2306,
//             "label": "loose",
//             "xmax": 3748,
//             "xmin": 1889,
//             "ymin": 706,
//             "attr": [{}]
//         }
//     ],
//     "result": "success"
// }


// {
//     "classified": [
//         [
//             "_negative_",
//             "0.78399"
//         ]
//     ],
//     "result": "success"
// }