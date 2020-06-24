//**********************************************************************************************************
//* >>> GENERAL TOOLS >>>
//*     This file contains general functions that can be used by any file
//**********************************************************************************************************

//=====================================
//* DEPENDENCIES
//=====================================
const fs = require("fs");
const path = require("path");
const request = require('request');


//=====================================
//* EXPORTED FUNCTIONS
//=====================================
module.exports = function () {
    return {
        evaluateImage: evaluateImage,
        getConfig: getConfig,
        getFrame: getFrame,
        initRtsp: initRtsp,
        stopRtsp: stopRtsp,
        inference: inference,
        classify:classify
    }
}

//=====================================
//* LOCAL VARIABLES
//=====================================
var tempBasePath = path.join(__dirname, './alerts/temp/');
var cropBasePath = path.join(__dirname, './alerts/cropped/');
var config = getConfig();

//=====================================
//* LOCAL FUNCTIONS
//=====================================
function evaluateImage(model, img) {

    let apiRes = new Promise((resolve, reject) => {
        config = getConfig();
        console.log("Evaluating image model img - tools.js " + config.paivUri[model]['url']);
        var options = {}
        if (config.paivUri[model]['program'] == "standalone") {
            options = {
                method: 'POST',
                uri: config.paivUri[model]['url'],
                header: { "content-type": "none" },
                formData: {
                    imagefile: fs.createReadStream(path.join(__dirname, '/../public/assets/images/objdetect/', img))
                }
            }
        } else {
            options = {
                method: 'POST',
                url: config.paivUri[model]['url'],
                headers: {
                    "content-type": "application/x-www-form-urlencoded",
                    "User-Agent": "request"
                },
                formData: {
                    files: fs.createReadStream(path.join(__dirname, '/../public/assets/images/objdetect/', img))
                },
                strictSSL: false
            }
        }

        var t0 = new Date()
        request(options, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                var t1 = new Date()
                console.log("UPLOAD TIME:" + (t1.getTime() - t0.getTime()) + " Miliseconds")
                console.log(JSON.stringify(body))
                let result = JSON.parse(body);
                resolve(result);
            }
        });
    })
    return apiRes
}


function getConfig() {
    var resConfig = {}
    var resJsonConfig = fs.readFileSync(path.join(__dirname, "./config/config.json"));
    var resParsedConfig = JSON.parse(resJsonConfig)
    for (var key in resParsedConfig) {
        resConfig[key] = resParsedConfig[key]
    }
    return resConfig
}



function initStationidRtsp(stationId,rtspHost) {
    let rtspRes = new Promise((resolve, reject) => {
        config = getConfig();
        console.log(new Date().toLocaleString() + " >>> >>> Initializing stationid / RTSP stream from Video Microservice...");
        var options = {
            method: 'POST',
            uri: config.videoMicroserviceHost + '/apis/v1/frame',
            headers: {
                "content-type": "application/json",
                "User-Agent": "request"
            },
            header: { "content-type": "none" },
            json: {
                "srcParams": {
                    "rtspHost": rtspHost,
                    "stationId" : stationId
                }
            }
        }
        request(options, (err, res, body) => {
            if (err) {
                console.log(new Date().toLocaleString() + " !!! !!! Error from Video Microservice: " + err)
                reject(err);
            } else {
                console.log(new Date().toLocaleString() + " >>> >>> Response from Video Microservice: " + JSON.stringify(body))
                let result = body;
                resolve(result);
            }
        });
    })
    return rtspRes
}



function initRtsp(rtspHost) {
    let rtspRes = new Promise((resolve, reject) => {
        config = getConfig();
        console.log(new Date().toLocaleString() + " >>> >>> Initializing RTSP stream from Video Microservice...");
        var options = {
            method: 'POST',
            uri: config.videoMicroserviceHost + '/apis/v1/frame',
            headers: {
                "content-type": "application/json",
                "User-Agent": "request"
            },
            header: { "content-type": "none" },
            json: {
                "srcParams": {
                    "rtspHost": rtspHost
                }
            }
        }
        request(options, (err, res, body) => {
            if (err) {
                console.log(new Date().toLocaleString() + " !!! !!! Error from Video Microservice: " + err)
                reject(err);
            } else {
                console.log(new Date().toLocaleString() + " >>> >>> Response from Video Microservice: " + JSON.stringify(body))
                let result = body;
                resolve(result);
            }
        });
    })
    return rtspRes
}

function getFrame(taskId, stationId) {
    let frameRes = new Promise((resolve, reject) => {
        config = getConfig();
        console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Getting Frame from Video Microservice...");
        var options = {
            method: 'GET',
            uri: config.videoMicroserviceHost + '/apis/v1/frame/' + taskId,
            headers: {
                "content-type": "application/json",
                "User-Agent": "request"
            }
        }
        request(options, (err, res, body) => {
            if (err) {
                reject(err);
            } else {                
                let result = JSON.parse(body);
                console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Video Microservice Response: " + result.task_id)
                resolve(result);
            }
        });
    })
    return frameRes
}

function stopRtsp(taskId) {
    let frameRes = new Promise((resolve, reject) => {
        config = getConfig();
        console.log(new Date().toLocaleString() + " >>> >>> Killing rtsp task from Video Microservice...");
        var options = {
            method: 'DELETE',
            uri: config.videoMicroserviceHost + '/apis/v1/frame/' + taskId,
            headers: {
                "content-type": "application/json",
                "User-Agent": "request"
            }
        }
        request(options, (err, res, body) => {
            if (err) {
                reject(err);
            } else {
                console.log(new Date().toLocaleString() + " >>> >>> Video Microservice Response: " + JSON.stringify(body))
                let result = JSON.parse(body);
                resolve(result);
            }
        });
    })
    return frameRes
}

function inference(model, img, stationId) {
    console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Preparing inference task...");

    let apiRes = new Promise((resolve, reject) => {       
        try {
            config = getConfig()
            console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Saving to temp image...");
            var buffer = Buffer.from(img, 'base64');

            fs.writeFile(path.join(tempBasePath, stationId + '_temp.jpg'), buffer, function (err) {
                if (err) {
                    console.log(new Date().toLocaleString() + " !!! !!! [JOB " + stationId + "] Error saving temp image: " + err)
                    reject(err);
                } else {
                    console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] Temp image saved. Sending inference request to VI...")
                    var sizeOf = require('image-size');
                    var dimensions = sizeOf(path.join(tempBasePath, stationId + '_temp.jpg'));
                    console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] IMAGE DIMENSIONS: " + dimensions.width + " x "  + dimensions.height);
                    var options = {}
                    if (model['program'] == "standalone") {
                        options = {
                            method: 'POST',
                            uri: model.url,
                            header: { "content-type": "multipart/form-data" },
                            formData: {
                                imagefile: fs.createReadStream(path.join(tempBasePath, stationId + '_temp.jpg'))
                            }
                        }
                    } else {
                        options = {
                            method: 'POST',
                            uri: model.url,
                            header: { "content-type": "multipart/form-data" },
                            formData: {
                                files: fs.createReadStream(path.join(tempBasePath, stationId + '_temp.jpg'))
                            },
                            strictSSL: false
                        }
                    }
                    var t0 = new Date()
                    request(options, (err, res, body) => {
                        if (err) {
                            reject(err);
                        } else {
                            var t1 = new Date()
                            console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] VI Inference completed in " +  (t1.getTime() - t0.getTime()) + " Miliseconds")                            
                            let result = JSON.parse(body)
                            result.imgWidth = dimensions.width ;
                            result.imgHeight = dimensions.height;
                            console.log(new Date().toLocaleString() + " >>> >>> [JOB " + stationId + "] INFERENCE RESULT: " + JSON.stringify(result))
                            resolve(result);
                        }
                    });
                }
            });
        }
        catch (saveErr) {
            console.log(new Date().toLocaleString() + " !!! !!! [JOB " + stationId + "] Inference task error: " + saveErr);
            reject(saveErr);
        }
    })
    return apiRes
}

function classify(model, buffer, stationId) {
    console.log(new Date().toLocaleString() + " >>> >>> >>> >>> [JOB " + stationId + "] Classify 2nd step to VI");

    let apiRes = new Promise((resolve, reject) => {
        try {
            config = getConfig()
            console.log(new Date().toLocaleString() + " >>> >>> >>> >>> [JOB " + stationId + "] Saving cropped image");
            let cropped = path.join(cropBasePath, stationId + "_cropped.jpg" )
            fs.writeFile(cropped, buffer, function (err) {
                if (err) {
                    console.log(new Date().toLocaleString() + " !!! !!! !!! !!! [JOB " + stationId + "] Error saving cropped image: " + err)
                    reject(err);
                } else {
                    console.log(new Date().toLocaleString() + " >>> >>> >>> >>> [JOB " + stationId + "] Cropped image saved - Inferencing...")                    
                    var options = {}
                    if (model['program_classification'] == "standalone") {
                        options = {
                            method: 'POST',
                            uri: model.url_classification,
                            header: { "content-type": "multipart/form-data" },
                            formData: {
                                imagefile: fs.createReadStream(path.join(cropBasePath, stationId + "_cropped.jpg" ))
                            }
                        }
                    } else {
                        options = {
                            method: 'POST',
                            uri: model.url_classification,
                            header: { "content-type": "multipart/form-data" },
                            formData: {
                                files: fs.createReadStream(path.join(cropBasePath, stationId + "_cropped.jpg" ))
                            },
                            strictSSL: false
                        }
                    }
                    var t0 = new Date()
                    request(options, (err, res, body) => {
                        if (err) {
                            reject(err);
                        } else {
                            var t1 = new Date()
                            console.log(new Date().toLocaleString() + " >>> >>> >>> >>> [JOB " + stationId + "] Inferencing done in " + (t1.getTime() - t0.getTime()) + " Miliseconds")                            
                            let result = JSON.parse(body)
                            console.log(new Date().toLocaleString() + " >>> >>> >>> >>> [JOB " + stationId + "] Inference Result : " + result.classified)
                            resolve(result);
                        }
                    });
                }
            });
        }
        catch (saveErr) {
            console.log("FAILED SAVING TO FILE: " + saveErr);
            reject(saveErr);
        }

    })
    return apiRes
}

