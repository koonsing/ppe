//**********************************************************************************************************
//* >>> API CONTROLLER FOR REMOTE CLIENT DEVICES CONNECTION >>>
//*     This file handles connectivities to Client Devices
//**********************************************************************************************************


//=====================================
//* DEPENDENCIES
//=====================================
const tools = require("../tools.js")();
const path = require("path");
const { exec } = require("child_process");
var Docker = require('dockerode');
var docker1 = new Docker();
//=====================================
//* LOCAL VARIABLES
//=====================================
var config = tools.getConfig();
var clients = {};
var sockets = {};

//=====================================
//* MAIN FUNCTION EXPORTS
//=====================================
module.exports = function (io) {

    // =======================================
    //      SOCKET IO HANDLING
    // =======================================
    io.on('connection', function (socket) {
        console.log("\n" + new Date().toLocaleString() + " >>> Socket IO connected..." + socket.id + "\n");
        io.to(socket.id).emit('socketid', socket.id);

        socket.on('disconnect', function () {
            console.log("\n" + new Date().toLocaleString() + " >>> Socket disconnected : " + socket.id + ". Cleaning up RTSP task...")
            if (socket.id in sockets) {
                tools.stopRtsp(clients[getStationId(socket.id)].taskId)
                    .then(function (rtspRes) {
                        console.log(new Date().toLocaleString() + " >>> RTSP task cleaned. Removing Socket entry...");
                        removeConnection(socket.id);
                        console.log(new Date().toLocaleString() + " >>> " + disconnectMsg + " has been removed. \n");
                    })
                    .catch(function (rtspErr) {
                        removeConnection(socket.id);
                        console.log(new Date().toLocaleString() + " !!! Socket disconnect error: " + rtspErr + "\n");
                    })

                // TODO: STOP SCHEDULED JOBS FROM INSPECTION MODULE

            } else {
                console.log(new Date().toLocaleString() + " >>> No RTSP task. Socket "+ socket.id + " has been disconnected. \n");
            }
        })
    })

    // =======================================
    //      EXPOSED FUNCTIONS
    // =======================================
    return {
        getAllClientsReq: getAllClientsReq,
        getClientSocket: getClientSocket,
        updateClients: updateClients,
        removeConnection: removeConnection,
        getControllerSocket: getControllerSocket,
        getStationId: getStationId,
        setClient: setClient,
        getClient: getClient,
        getClientReq: getClientReq,
        pushImage: pushImage,
        getAllClients: getAllClients,
        postvalidate: postvalidate,
        postresult: postresult,
        dockercall: dockercall
    }

    //===========================================
    //* REQUEST HANDLING FUNCTIONS
    //===========================================
    function getClientReq(req, res) {
        var stationId = req.params.stationId;
        var clientRes = getClient(stationId);
        if (clientRes) {
            res.status(200);
            res.json(clientRes);
        } else {
            res.status(500);
            res.json({ "error": "Client " + stationId + " is not registered" });
        }
    }

    function getAllClientsReq(req, res) {
        console.log("Getting All Clients : " + JSON.stringify(clients))
        res.status(200);
        res.json(clients);
    }


    //===========================================
    //* LOCAL FUNCTIONS
    //===========================================

    function dockercall(req, res){
        
  
    var auxContainer;
    docker1.createContainer({
    name : 'container1',
    Image: 'nginx',
    AttachStdin: false,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    Cmd: ['/bin/bash', '-c', 'tail','-f','/dev/null'],
    ExposedPorts: {
        '80/tcp': {}
      },
    HostConfig: {
        AutoRemove: true,
        Binds: ["/var/run/docker.sock:/var/run/docker.sock"],
        PortBindings: {
            '80/tcp': [{
              HostPort: '8080',
            }],
          },   
        
    },
    OpenStdin: false,
    StdinOnce: false
    }).then(function(container) {
    
      
        auxContainer = container;
        console.log('Start Container');
        auxContainer.start();
        return dockerContainer();
        
    }).then(function(container) {
      
      res.status(200);  
      res.json(container);
        
    })
    .catch(function(err) {
    
    error = {'error' : err};
    
    res.status(500);
    //res.end();
    //res.send();
    res.json(error);
    
    });



        var dockertop1 = function () {
            return new Promise(function(resolve, reject) {
                 
                console.log("helo dockertop1");
                exec("docker  top container1  | wc -l", (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    reject(error.message);
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    reject(stderr); 
                    
                }
                resolve(stdout);
                
            });
        

        })
     };



    var dockertop2 = function (data) {
        return new Promise(function(resolve, reject) {
            console.log("helo dockertop2");
 
        exec("docker  top container2 | wc -l", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                reject(error.message);
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                reject(stderr); 
                
            }
            
            var returnVal;
            returnVal = {
                'container1': data,
                'container2': stdout
            };
            console.log("checking container 2 ");
            console.log('Result container 2: ', stdout);
            
            resolve(returnVal);
        
        })  
        
    })
    };       



    var dockerContainer = function (data) {

        return new Promise(function(resolve, reject) {
            dockertop1()
            .then(function (result) {
                 
                 console.log("checking container 1");
                 console.log('Result container 1: ', result);
                 
               
                 var returnVal;
                 returnVal = {
                     'container1': result,
                   
                 };
                 console.log(returnVal);
                 resolve(returnVal);
             })
            .catch(function (error) {
                     console.log(error.message);
                     reject(error);
             });
     
        
        })    
    }
        
    
    }//end dockercall    
    
    function postvalidate(req, res){
        
            var rtsp = req.body.rtsp;
            var socketId = req.body.socketId;
            
   
        var clientParams1 = [];
        for (i = 0; i <req.body.classified.length; i++) {
            product = {
            
                "confidence":  req.body.classified[i].confidence,
                "label": req.body.classified[i].label


            }
            clientParams1.push(product);
        }

            product = {
            "rtsp": req.body.rtsp,

            
            }


            clientParams1.push(product);


            product = {
                "flag": req.body.flag,
            
            }


            clientParams1.push(product);


           console.log(clientParams1)



            res.status(200);
            res.json(clientParams1);
            console.log("Sending data to browser . . .  , for SocketID :" + socketId );
            io.to(socketId).emit('dumsocket',clientParams1);
            
            
        
    }

    
    function postresult(req, res){
        
        var rtsp = req.body.rtsp;
        var socketId = req.body.socketId;
        

    var clientParams1 = [];
    for (i = 0; i <req.body.objects.length; i++) {
        product = {
        
            "confidence":  req.body.objects[i].confidence,
            "label": req.body.objects[i].label,
            "status": req.body.objects[i].status


        }
        clientParams1.push(product);
    }

        product = {
        "rtsp": req.body.rtsp,

        
        }


        clientParams1.push(product);


        product = {
            "flag": req.body.flag,
        
        }


        clientParams1.push(product);


       console.log(clientParams1)



        res.status(200);
        res.json(clientParams1);
        console.log("Sending data to browser . . .  , for SocketID :" + socketId );
        io.to(socketId).emit('resultsocket',clientParams1);
        
        
    
}



    function getClientSocket(clientId) {
        return clients[clientId].socketId;
    }

    function getControllerSocket(controllerId) {
        return controllers[controllerId].socketId;
    }

    function getStationId(socketId) {
        return sockets[socketId].stationId;
    }

    function getAllClients() {
        return clients;
    }

    function getClient(stationId) {
        if (stationId in clients) {
            return clients[stationId]
        } else {
            return null
        }
    }

    function setClient(clientInfo) {

        console.log(new Date().toLocaleString() + " >>> >>> Storing client: " + JSON.stringify(clientInfo));
        if (clientInfo.stationId in clients) {
            console.log(new Date().toLocaleString() + " !!! !!! CLIENT EXISTS: " + clientInfo.stationId);
            return false;
        } else {
            clients[clientInfo.stationId] = clientInfo
            sockets[clientInfo.socketId] = {
                stationId: clientInfo.stationId
            }
            console.log(new Date().toLocaleString() + " >>> >>> CLIENTS: " + Object.keys(clients))
            console.log(new Date().toLocaleString() + " >>> >>> SOCKETS: " + Object.keys(sockets))
            console.log(new Date().toLocaleString() + " >>> >>> Emitting Socket...")
            io.emit('newclient', clientInfo.stationId)
            return true;
        }
    }

    function updateClients(clientInfo) {
        if (clientInfo.stationId in clients) {
            console.log("CLIENT EXISTS: " + clientInfo.stationId)
            clients[clientInfo.stationId].rtspHost = clientInfo.rtspHost
            clients[clientInfo.stationId].taskId = clientInfo.taskId
            return true;
        } else {
            console.log("CLIENT DOESN'T EXIST!!! " + clientInfo.stationId);
            return false;
        }
    }

    function removeConnection(remSocketId) {
        if (remSocketId in sockets) {
            var socketstationId = sockets[remSocketId].stationId;
            console.log(new Date().toLocaleString() + " >>> >>> Removing client: " + socketstationId)
            delete (clients[socketstationId]);
            delete (sockets[remSocketId])
            console.log(new Date().toLocaleString() + " >>> >>> CLIENTS: " + Object.keys(clients))
            console.log(new Date().toLocaleString() + " >>> >>> SOCKETS: " + Object.keys(sockets))
            return ("Client: " + socketstationId)
        } else {
            return ("NA")
        }
    }

    function pushImage(imageData) {
        console.log(new Date().toLocaleString() + " >>> >>> >>> [JOB " + imageData.stationId + "] Pushing Image to Client...");
        io.emit('imagedata', imageData);
    }

}