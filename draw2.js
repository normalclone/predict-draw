var timers = 0, lastTimestamp = 0, lastTimestamp_check = 0, idx_guess = 0;
var ink = [];

paper.install(window);

window.onload = function() {
	paper.setup('canvas');
	var tool = new Tool();

	tool.onMouseDown = function(event) {
    // New Paper Path and Settings
    path = new Path();          
    path.strokeColor = 'blue'; 
    path.strokeWidth = 4;

    theInk = [[],[],[]];

    // Get Time [ms] for each Guess (needed for accurate Google AI Guessing)
    var thisTimestamp = event.event.timeStamp;
    if(timers === 0){
    	timers = 1;
    	var time = 0;
    }else{
    	var timeDelta = thisTimestamp - lastTimestamp;
    	var time = ink[ink.length - 1][2][ ink[ink.length - 1][2].length - 1] + timeDelta;
      //var time = ink[2][ink[2].length-1] + timeDelta;
  }


    // Draw XY point to Paper Path
    let tempPoint = event.point;
    tempPoint.y = tempPoint.y - 60; 
    path.add(tempPoint);

    // Get XY point from event w/ time [ms] to update Ink Array
    //updateInk(tempPoint, time);
    theInk[0].push(tempPoint.x);
    theInk[1].push(tempPoint.y);
    theInk[2].push(time);
    ink.push(theInk);

    // Reset Timestamps
    lastTimestamp = thisTimestamp;
}

  // Paper Tool Mouse Drag Event
  tool.onMouseDrag = function(event) {
    // Get Event Timestamp and Timestamp Delta
    var thisTimestamp = event.event.timeStamp ;
    var timeDelta = thisTimestamp - lastTimestamp;
    // Get new Time for Ink Array

    var time = ink[ink.length - 1][2][ ink[ink.length - 1][2].length - 1] + timeDelta;
    // Get XY point from event w/ time [ms] to update Ink Array
    let tempPoint = event.point;
    tempPoint.y = tempPoint.y - 60; 

    ink[ink.length - 1][0].push(tempPoint.x);
    ink[ink.length - 1][1].push(tempPoint.y);
    ink[ink.length - 1][2].push(time);
    // Draw XY point to Paper Path
    
    path.add(tempPoint);
    
    // Reset Timestamps
    lastTimestamp = thisTimestamp;

    // Check Google AI Quickdraw every 250 m/s 
    if(thisTimestamp - lastTimestamp_check > 250){
    	lastTimestamp_check = thisTimestamp;
    }
}
tool.onMouseUp = function(event){
  	// /console.log(ink)
  	setTimeout(()=>{
  		checkQuickDraw();
  		checkText();
  	},200);
  } 
}
// Check Quickdraw Google AI API
function checkQuickDraw(){

  // Get Paper Canvas Weight/Height
  var c_dims = getCanvasDimensions();

  // Set Base URL for Quickdraw Google AI API
  var url = 'https://inputtools.google.com/request?ime=handwriting&app=quickdraw&dbg=1&cs=1&oe=UTF-8';
  
  // Set HTTP Headers
  var headers = {
  	'Accept': '*/*',
  	'Content-Type': 'application/json'
  };

  // Init HTTP Request
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  Object.keys(headers).forEach(function(key,index) {
  	xhr.setRequestHeader(key, headers[key]); 
  });

  // HTTP Request On Load
  xhr.onload = function() {
  	if (xhr.status === 200) {
      res = xhr.responseText; // HTTP Response Text
      parseResponseDraw(res);     // Parse Response
      idx_guess += 1;         // Iterate Guess Index
  }
  else if (xhr.status !== 200) {
  	console.log('Request failed.  Returned status of ' + xhr.status);
  }
};

  // Create New Data Payload for Quickdraw Google AI API
  var data = {
  	"input_type":0,
  	"requests":[
  	{
  		"language":"quickdraw",
  		"writing_guide":{"width": c_dims.width, "height":c_dims.height},
  		"ink": ink
  	}
  	]
  };

  // Convert Data Payload to JSON String
  var request_data = JSON.stringify(data);
  
  // Send HTTP Request w/ Data Payload
  xhr.send(request_data);

}

// Check Quickdraw Google AI API
function checkText(){

  // Get Paper Canvas Weight/Height
  var c_dims = getCanvasDimensions();

  // Set Base URL for Quickdraw Google AI API
  var url = 'https://inputtools.google.com/request?itc=mul-t-i0-handwrit&app=translate';
  
  // Set HTTP Headers
  var headers = {
  	'Accept': '*/*',
  	'Content-Type': 'application/json'
  };

  // Init HTTP Request
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  Object.keys(headers).forEach(function(key,index) {
  	xhr.setRequestHeader(key, headers[key]); 
  });

  // HTTP Request On Load
  xhr.onload = function() {
  	if (xhr.status === 200) {
      res = xhr.responseText; // HTTP Response Text
      parseResponseText(res);     // Parse Response
      idx_guess += 1;         // Iterate Guess Index
  }
  else if (xhr.status !== 200) {
  	console.log('Request failed.  Returned status of ' + xhr.status);
  }
};

  // Create New Data Payload for Quickdraw Google AI API
  var data = {
  	"itc": "mul-t-i0-handwrit",
  	"app_version": 0.4,
  	"api_level": "537.36",
  	"device": "5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/89.0.124 Chrome/83.0.4103.124 Safari/537.36",
  	"input_type": "0",
  	"options": "enable_pre_space",
  	"requests":[
  	{
  		"language": "vi", 
  		"pre_context": "",
  		"writing_guide":{"width": c_dims.width, "height":c_dims.height},
  		"max_num_results": 10,
  		"max_completions": 0,
  		"ink": ink
  	}]
  };

  // Convert Data Payload to JSON String
  var request_data = JSON.stringify(data);
  
  // Send HTTP Request w/ Data Payload
  xhr.send(request_data);
}
// Parse Quickdraw Google AI API Response
function parseResponseText(res){
  // Convert Response String to JSON
  var res_j = JSON.parse(res);
  var rs = "<h3>Text Result</h3>";

  for(let i = 0; i < res_j[1][0][1].length; i++){
  	let lang = (res_j[1][0][3].language != undefined) ? "("+res_j[1][0][3].language[i]+")" : ""
  	rs+= "<p>"+res_j[1][0][1][i]+lang+"</p>"
  }
  
  // Extract Guess Score String from Response and Convert to JSON

  // scores = JSON.parse(res_j[1][0][3].debug_info.match(/SCORESINKS: (.+) Combiner:/)[1]);
  // let rs = "<h3>Draw Result</h3>";
  // scores.forEach(function(i){
  // 		rs += "<p>"+i[0]+":"+i[1]+"</p>"
  // })
  document.getElementById("textResult").innerHTML = rs;
}

// Parse Quickdraw Google AI API Response
function parseResponseDraw(res){
  // Convert Response String to JSON
  var res_j = JSON.parse(res);
  // Extract Guess Score String from Response and Convert to JSON
  scores = JSON.parse(res_j[1][0][3].debug_info.match(/SCORESINKS: (.+) Combiner:/)[1]);
  let rs = "<h3>Draw Result</h3>";
  scores.forEach(function(i){
  	rs += "<p>"+i[0]+":"+i[1]+"</p>"
  })
  document.getElementById("drawResult").innerHTML = rs;
}

function getCanvasDimensions(){
	var w = document.getElementById('canvas').offsetWidth;
	var h = document.getElementById('canvas').offsetHeight;
	return {height: h, width: w};
}
function clearDrawing() {

  // Remove Paper Path Layer
  paper.project.activeLayer.removeChildren();
  paper.view.draw();

  // Init Ink Array
  ink = [];
  
  // Resert Variables
  timers = 0;
  idx_guess = 0;
  document.getElementById("drawResult").innerHTML = '';
  document.getElementById("textResult").innerHTML = '';

}