// import { stat } from "fs";

//**********************************************************************************************************
//* MAIN MODULE
//*     This file serves the main client-side application. HTML is under views/index.ejs
//**********************************************************************************************************

console.log("PPE INSPECTION");

//------------------------------------------------------------
// CONSTANTS AND VARIABLES DECLARATION
//------------------------------------------------------------
var socket = null;
var connected = false;
var socketId = "";
var clientStationId = "";
// var stationarray = new Array("All Stations")

//------------------------------------------------------------
// MAIN ACTIONS UPON LOADING
//------------------------------------------------------------
//  ********** HTML Elements Initial States **********
initState();
initSocket();


//------------------------------------------------------------
// LOCAL FUNCTIONS
//------------------------------------------------------------
function initState() {
    document.getElementById("stationId").disabled = false;
    document.getElementById("rtspHost").disabled = false;
    document.getElementById("startbtn").disabled = false;
    document.getElementById("stopbtn").disabled = true;
  
}

function checkStationID() {
    var id = document.getElementById("stationId").value
    if (id.length != 6) {
        initState();
    } else {

        document.getElementById("rtspHost").disabled = false;
    }
}

function loadModels() {
    // Populate Initial Selections
    $.ajax({
        url: '/api/config/models/',
        type: 'GET',
        success: function (res, status) {
            // ===== AJAX fires success return
            console.log(">>> /api/config/models/ status: " + status);
            for (var key in res) {
                models.push({
                    'model': key,
                    'display': res[key].display,
                })
                modelsArray.push(res[key].display)

            }
            load_list("modelName", modelsArray);
            console.log(res);
        },
        error: function (err) {
            successmessage = 'Error';
            console.log('ERROR: ' + JSON.stringify(err));
        }
    });
}

function loadStations() {
    append_option('sel_station', "===SELECT STATION===", "all")
    $.ajax({
        url: '/api/inspection/stations/',
        type: 'GET',
        success: function (res, status) {
            // ===== AJAX fires success return
            console.log(">>> /api/remote/clientinfo/ status: " + status);
            res.stationsArray.forEach(function (station, idx) {
                append_option('sel_station', station, station)
            })
        },
        error: function (err) {
            successmessage = 'Error';
            console.log('ERROR: ' + JSON.stringify(err));
        }
    });
}

// adds the elements of the array
function load_list(select_id, option_array) {
    for (var i = 0; i < option_array.length; i++) {
        add_option(select_id, option_array[i]);
    }
}

// addition of an option
function add_option(select_id, text) {
    var select = document.getElementById(select_id);
    select.options[select.options.length] = new Option(text);
}

// addition of an option
function append_option(select_id, text, value) {
    var select = document.getElementById(select_id);
    var option = document.createElement("option");
    option.text = text;
    option.value = value;
    select.add(option);
}


function start() {
  
   //alert();
    var stationId = document.getElementById("stationId").value;
    var rtspHost = document.getElementById("rtspHost").value;
     
    //socketClientConnectStart(stationId, rtspHost);
}

function stop()
{
    document.getElementById("stationId").disabled = false;
    document.getElementById("rtspHost").disabled = false;
    var stationId = document.getElementById("stationId").value;
    //stopRtsp(stationId);


}

function startInspection() {
    document.getElementById("startdiv").style.display = "none";
    document.getElementById("stopdiv").style.display = "block";
    document.getElementById("stationId").disabled = true;
    document.getElementById("modelName").disabled = true;
    document.getElementById("threshold").disabled = true;
    document.getElementById("rtspHost").disabled = true;
    document.getElementById("intervalbtn").disabled = false;
    document.getElementById("interval").disabled = false;

    var stationId = document.getElementById("stationId").value;
    var rtspHost = document.getElementById("rtspHost").value;

    socketClientConnect(stationId, rtspHost);
}

function stopInspection() {
    document.getElementById("startdiv").style.display = "block";
    document.getElementById("stopdiv").style.display = "none"
    document.getElementById("stationId").disabled = false;
    document.getElementById("modelName").disabled = false;
    document.getElementById("threshold").disabled = false;
    document.getElementById("rtspHost").disabled = false;
    document.getElementById("intervalbtn").disabled = true;
    document.getElementById("interval").disabled = true;
    var stationId = document.getElementById("stationId").value;
    stopRtsp(stationId);
}



function socketClientConnectStart(stationId, rtspHost){

       var rtsp = document.getElementById("rtspHost").value;
       console.log("socketClientConnectStart , rtsp :" + rtsp);
    
    
       var stationId = document.getElementById("stationId").value;
       console.log("socketClientConnectStart stationId :" + stationId);
    

       var postData = {
        "stationId": stationId,
        "rtspHost": rtspHost,
        "socketId": socketId
        
    }


    $.ajax({
        url: '/api/inspection/clientstationrtspinfo',
        type: 'POST',
        data: JSON.stringify(postData),
        contentType: 'application/json',
        processData: true,
        cache: false,
        beforeSend: function () {
            document.getElementById("startbtn").disabled = true;
            document.getElementById("stopbtn").disabled = false;
            console.log("Sending json data from push btn")
        },
        success: function (res, status) {
            // ===== AJAX fires success return
            
            console.log(">>> clientstationrtspinfo Init Status " + status);
            
            clientStationId = stationId

            console.log(">>> clientstationrtspinfo Socket IO ID  :" + socketId);
            
            document.getElementById("startbtn").disabled = false;

            document.getElementById("stopbtn").disabled = true;

            
     
        },
        error: function (err) {
            console.log('ERROR: ' + JSON.stringify(err));
            
            clientStationId = "";
            // stopInspection();
            
            document.getElementById("startbtn").disabled = false;
            
            document.getElementById("stopbtn").disabled = true;

            alert("Error clientstationrtspinfo Initializing Socket : " + err.responseJSON.error)

        }
    });





}



function socketClientConnect(stationId, rtspHost) {
    var postData = {
        "stationId": stationId,
        "rtspHost": rtspHost,
        "socketId": socketId
        
    }
    $.ajax({
        url: '/api/inspection/clientrtspinfo/',
        type: 'POST',
        data: JSON.stringify(postData),
        contentType: 'application/json',
        processData: true,
        cache: false,
        beforeSend: function () {
            document.getElementById("stopbtn").disabled = true;
            document.getElementById("interval").disabled = true;
            document.getElementById("intervalbtn").disabled = true;
            console.log("Initializing Socket Connection")
        },
        success: function (res, status) {
            // ===== AJAX fires success return
            console.log(">>> Socket IO Init Status " + status);
            clientStationId = stationId
            startRtsp(stationId);
        },
        error: function (err) {
            console.log('ERROR: ' + JSON.stringify(err));
            clientStationId = "";
            // stopInspection();
            document.getElementById("startdiv").style.display = "block";
            document.getElementById("stopdiv").style.display = "none"
            document.getElementById("stationId").disabled = false;
            document.getElementById("modelName").disabled = false;
            document.getElementById("threshold").disabled = false;
            document.getElementById("rtspHost").disabled = false;
            document.getElementById("intervalbtn").disabled = true;
            document.getElementById("interval").disabled = true;
            document.getElementById("startbtn").disabled = false;
            alert("Error Initializing Socket : " + err.responseJSON.error)
        }
    });

}

function initSocket() {
    socket = io();

    socket.on('socketid', function (id) {
        socketId = id;
        console.log("SOCKET ID: " + socketId);
    })

    socket.on('imagedata', function (imageData) {
        var stationId = clientStationId
        if (stationId != "" && imageData.stationId == stationId) {
            console.log(">>>>> SOCKET: imagedata" + imageData)
            drawCanvas("liveCanvas", "liveTblheader", "liveTblbody", imageData)
        };

        if (imageData.alert) {
            if (sel_station.value == imageData.stationId) {
                document.getElementById("alertsthumb").insertAdjacentHTML('afterbegin',
                    '<div class="responsive">' +
                    '<div class="gallery">' +
                    '<li><a href=\"#\" onclick=\"drawThumb(\'alertCanvas\',\'thumbtblheader\',\'thumbtblbody\',\'' + imageData.fileId + '\')\">' +
                    '<img src=\"' + "\\alerts\\inferences\\" + imageData.fileId + ".jpg" +
                    '\" id=\"' + imageData.fileId + '\" width=\"300em\" class=\"img-thumbnail ' + 'bkgd_red' + '\"></img></a><br>' +
                    imageData.fileId + '</li>' +
                    '</div>' +
                    '</div>'
                );
            }
        }
    })

    socket.on('newclient', function (client) {
        var stations = []
        for (i = 0; i < sel_station.options.length; i++) {
            stations.push(sel_station.options[i].value);
        }
        console.log(JSON.stringify(stations));
        if (!stations.includes(client)) {
            append_option("sel_station", client, client);
        }

    })


    var flag = 'false';

    socket.on('dumsocket', function (client) {
        
        console.log("SOCKET ID inside main.js: " + client[1].confidence);
        console.log("Array Length: " + client.length);
        console.log("rtsp: " + client[5].rtsp);
        

        document.getElementById("rtspHost").value= client[5].rtsp;
     
        if (flag == 'false')
        {
            if (client[6].flag == 'true' )
            {
                flag = client[6].flag ;
                document.getElementById("rtcstart").click();
        
            }
        
        }   

        
        if (client[6].flag == 'false' )
        {
            flag = 'false'; 
            document.getElementById("rtcstop").click();
    
        }
        var x;
        //document.getElementById("mytable").rows[0].cells[0].innerHTML
        for(i=0;i<client.length-2;i++)
        {
             //document.getElementById("mytable").rows[1].cells[0].innerHTML=((client[i].confidence)*100).toFixed(2)+"%";
             x=document.getElementById('mytable').rows[parseInt(1,10)].cells;
            x[Math.floor(i)].innerHTML="<h4>"+((client[i].confidence)*100).toFixed(2)+"%</h4>";
            console.log("inside :" +i)
        }

        
        
     
    })  
    
    socket.on('resultsocket', function (client) {
        
        console.log("SOCKET ID inside main.js: " + client[1].confidence);
        console.log("Array Length: " + client.length);
        console.log("rtsp: " + client[3].rtsp);
        

        document.getElementById("rtspHost").value= client[3].rtsp;
     
        if (flag == 'false')
        {
            if (client[4].flag == 'true' )
            {
                flag = client[5].flag ;
                document.getElementById("rtcstart").click();
        
            }
        
        }   

        
        if (client[5].flag == 'false' )
        {
            flag = 'false'; 
            document.getElementById("rtcstop").click();
    
        }
        var x;
        //document.getElementById("mytable").rows[0].cells[0].innerHTML
        for(i=0;i<client.length-2;i++)
        {
             //document.getElementById("mytable").rows[1].cells[0].innerHTML=((client[i].confidence)*100).toFixed(2)+"%";
             x=document.getElementById('mytable').rows[parseInt(1,10)].cells;
            //x[Math.floor(i)].innerHTML="<h4>"+((client[i].confidence)*100).toFixed(2)+"%</h4>";
            x[Math.floor(i)].innerHTML="<h4>"+((client[i].confidence)).toFixed(2)+"%</h4>";
            console.log("inside :" +i)
        }

        
        
     
    })  


}

function startRtsp(stationId) {
    var postData = {
        "stationId": stationId,
        "interval": document.getElementById("interval").value,
        "threshold": tslider.value,
        "action": "start",
        "model": model_value
    }
    $.ajax({
        url: '/api/inspection/job/',
        type: 'POST',
        data: JSON.stringify(postData),
        contentType: 'application/json',
        processData: true,
        cache: false,
        beforeSend: function () {
            document.getElementById("stopbtn").disabled = true;
            console.log("Starting RTSP Inspection")
        },
        success: function (res, status) {
            // ===== AJAX fires success return
            console.log(">>> RTSP Stream " + status);
            document.getElementById("stopbtn").disabled = false;
            document.getElementById("interval").disabled = false;
            document.getElementById("intervalbtn").disabled = false;
            connected = true;
        },
        error: function (err) {
            console.log('ERROR: ' + JSON.stringify(err));
            stopInspection();
            alert("Error starting RTSP Stream: " + err.responseJSON.error)
        }
    });
}

function stopRtsp(stationId) {
    var postData = {
        "stationId": stationId,
        "interval": document.getElementById("interval").value,
        "threshold": tslider.value,
        "action": "stop",
        "model": model_value
    }
    $.ajax({
        url: '/api/inspection/job/',
        type: 'POST',
        data: JSON.stringify(postData),
        contentType: 'application/json',
        processData: true,
        cache: false,
        beforeSend: function () {
            document.getElementById("startbtn").disabled = true;
            console.log("Stopping RTSP Inspection")
        },
        success: function (res, status) {
            // ===== AJAX fires success return
            console.log(">>> RTSP Stream " + status);
            document.getElementById("startbtn").disabled = false;
            // socket.disconnect();
        },
        error: function (err) {
            console.log('ERROR: ' + JSON.stringify(err));
            alert("Error stopping RTSP Stream: " + err.responseJSON.error)
        }
    });
}

// Draw Box
function drawbox(canvas, x, y, width, height, color) {
    var cbox = canvas.getContext('2d');
    cbox.beginPath();
    cbox.rect(x, y, width, height);
    cbox.lineWidth = 4;
    cbox.strokeStyle = color;
    cbox.stroke();
}
// Draw Label
function drawlbl(canvas, x, y, width, height, color, text, txtcolor, txt_x, txt_y) {
    var cbox = canvas.getContext('2d');
    cbox.beginPath();
    // cbox.rect(x, y, width, height);
    // cbox.fillStyle = color;
    // cbox.fill();
    // cbox.lineWidth = 4;
    // cbox.strokeStyle = color;
    // cbox.stroke();
    cbox.font = "50px Arial";
    cbox.fillStyle = txtcolor;
    cbox.fillText(text, txt_x, txt_y);
}

function drawThumb(canvasId, tblHeaderId, tblBodyId, fileId) {
    $.ajax({
        url: '/alerts/inferences/' + fileId + '.json',
        type: 'GET',
        success: function (res, status) {
            // ===== AJAX fires success return
            console.log(">>> /api/alerts/inferences/ status: " + status);
            console.log(res);
            drawCanvas(canvasId, tblHeaderId, tblBodyId, res);
        },
        error: function (err) {
            successmessage = 'Error';
            console.log('ERROR: ' + JSON.stringify(err));
        }
    });
}

function drawCanvas(canvasId, tblHeaderId, tblBodyId, imageData) {
    var canvas = document.getElementById(canvasId);
    var ctx = canvas.getContext("2d");
    ctx.canvas.width = imageData.imgWidth;
    ctx.canvas.height = imageData.imgHeight;
    var image = new Image();
    image.onload = function () {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        var tableheader = document.getElementById(tblHeaderId);
        var tablebody = document.getElementById(tblBodyId);
        tableheader.innerHTML = "";
        tablebody.innerHTML = "";
        tablebody.insertAdjacentHTML('beforeend',
            "<thead align=\"center\">" +
            "<tr><th>Classify</th>" +
            "<th>Label</th>" +
            "<th>Confidence</th>" +
            "</tr></thead>"
        )
        imageData.good.forEach(function (good, idx) {
            console.log("GOOD: " + JSON.stringify(good))
            drawbox(canvas, good.xmin, good.ymin, (good.xmax - good.xmin), (good.ymax - good.ymin), 'blue');
            drawlbl(canvas, good.xmin, good.ymin - 20, (good.xmax - good.xmin), 20, 'blue', good.label, 'blue', good.xmin + 10, good.ymin - 3)
            var goodConfidence = good.confidence * 100;
            tablebody.insertAdjacentHTML('beforeend',
                "<tbody align=\"center\">" +
                "<tr><td>GOOD</td>" +
                "<td>" + good.label + "</td>" +
                "<td>" + goodConfidence.toFixed(2) + "%</td>" +
                "</tr></thead>"
            )
        })
        imageData.bad.forEach(function (bad, idx) {
            console.log("BAD: " + JSON.stringify(bad))
            drawbox(canvas, bad.xmin, bad.ymin, (bad.xmax - bad.xmin), (bad.ymax - bad.ymin), 'red');
            drawlbl(canvas, bad.xmin, bad.ymin - 20, (bad.xmax - bad.xmin), 20, 'orangered', bad.label, 'orangered', bad.xmin + 10, bad.ymin - 3)
            var badConfidence = bad.confidence * 100;
            tablebody.insertAdjacentHTML('beforeend',
                "<tbody align=\"center\">" +
                "<tr><td>BAD</td>" +
                "<td>" + bad.label + "</td>" +
                "<td>" + badConfidence.toFixed(2) + "%</td>" +
                "</tr></thead>"
            )
        })
    }
    if (imageData.alert) {
        image.src = "\\alerts\\inferences\\" + imageData.fileId + ".jpg"
    } else {
        image.src = "data:image/jpg;base64," + imageData.img;
    }
}

/*function setInterval() {
//    var stationId = document.getElementById("stationId").value;
  //  startRtsp(stationId);
}*/

