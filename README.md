# ppe
git clone 
npm install 
change directory to public folder , do bower install 
node server/app.js  

API end point for spinning container
http://localhost:5008/api/inspection/def 

Dockerfile for first container is Dockerfile_container1


API end point for push data and trigger webrtc
http://localhost:5008/api/inspection/abc

  {"imageUrl":"http://9.127.37.86:9080/powerai-vision/uploads/temp/6c44f2cf-d3cf-4228-ba02-3e03761e8015/fe1889d8-15f5-44c5-b485-84860a52c551.jpg",
  "imageMd5":"b02c307c0ec66e4d87b03435f70cf9dc",
  "classified":[
  {"confidence":0.9922794151306,"ymax":251,"label":"helmet","xmax":53,"xmin":33,"ymin":231,"attr":[]},
  {"confidence":0.882008,"ymax":352,"label":"goggle","xmax":101,"xmin":80,"ymin":332,"attr":[]},
  {"confidence":0.77268582487106323,"ymax":352,"label":"vest","xmax":101,"xmin":80,"ymin":332,"attr":[]},
  {"confidence":0.6638622794151306,"ymax":251,"label":"helmet","xmax":53,"xmin":33,"ymin":231,"attr":[]},
  {"confidence":0.338582487106323,"ymax":352,"label":"goggle","xmax":101,"xmin":80,"ymin":332,"attr":[]}
  ],
  "result":"success",
   "socketId":"k5yPkdJKrIFmDeepAAAB",
  "rtsp" : "rtsp://admin:admin@point.sg.ibm.com:8565/cam/realmonitor?channel=0&subtype=0",
  "flag" : "true"
  }
  
  
  flag : false  --> stop video
  flag : true  --> video play
  

  //for spinning container 
  http://localhost:5008/api/inspection/def


 //for sending data to webpage
 http://localhost:5008/api/inspection/result

 {
"timestamp":"2020-06-25 11:18:00.0000",
"trackId": 2,
"objects": [
  {
  "label": "helmet",
  "status": "detecting",
  "confidence": 20.3
 },
 {
  "label": "gloves",
  "status": "detected",
  "confidence": 99.3
},
{
"label": "goggles",
"status": "not_detected",
"confidence": 10.3
}
],
"imageFileName": "id_01_0000.jpg",
 "socketId":"Sya2pjUzBJd-zhQhAAAB",
  "rtsp" : "rtsp://admin:admin@point.sg.ibm.com:8565/cam/realmonitor?channel=0&subtype=0",
  "flag" : "true"

}
 
//for reset the field on webpage
 http://localhost:5008/api/inspection/reset

{
 "socketId":"Sya2pjUzBJd-zhQhAAAB",
 "flag":"false"

}
 
 

 
