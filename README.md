# ppe
git clone
npm install
change directory to public folder , do bower install
node server/app.js 

API end point for spinning container
http://localhost:5008/api/inspection/def 


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
  
 
