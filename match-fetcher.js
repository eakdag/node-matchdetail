var http = require('http'),
	LOGGER = require('./logger.js').LOGGER,
	logger = new LOGGER('matchdetail.log');

var startTime, sequenceText = '';
var matchList = {};

function getMatches() {
	startTime = new Date();
	var newSequenceText = '';
	var options = {
		port:80, 
		host:'source768.mackolik.com', 
		path:'/Match/MatchStatusHandler.ashx'
	};
	var request = http.get(options, function(response) {
		response.setEncoding('utf8');
		if(response.statusCode != 200) {
			logger.alert('Error on Request - Status Code: ' + response.statusCode);
			setTimer(2)
		} else {
			response.on('data', function (chunk) {
				newSequenceText += chunk;
			});	
			response.on('end', function(){
				if(sequenceText == newSequenceText) {
					//logger.info('Same sequence list fetched', startTime, new Date());				
				} else {
					logger.info('New sequence list fetched', startTime, new Date());
					sequenceText = newSequenceText;
					parseSequenceList(); 
				}
				setTimer(1);
			});	
		}
	});
	request.on('error', function(e) {
		logger.alert('Error on Request: ' + e.message);
		setTimer(1)
	});	
}
function parseSequenceList() {
	var newList = JSON.parse(sequenceText);
	
	for(var i in newList) {
		if (!matchList[i]) {
			matchList[i] = new Match(i);
			matchList[i].seqObject = newList[i];
		}
		else if (matchList[i].seqObject.seq < newList[i].seq || matchList[i].seqObject.st != newList[i].st) {
			matchList[i].seqObject = newList[i];
			matchList[i].eventEmitter.emit("send", matchList[i].seqObject);	
			if (matchList[i].subscribersCount() > matchList[i].maxSubscribers) {
				matchList[i].maxSubscribers = matchList[i].subscribersCount();
				matchList[i].maxSubsDate = new Date();
			}
			//logger.info('emit(' + JSON.stringify(matchList[i].seqObject) +')'); // emit (i)
		}
	}
	for(var i in matchList) {
		if (!newList[i]) {
			delete matchList[i];
			logger.info('delete('+i+')');
		}
	}
}

function setTimer(interval){
	setTimeout(function() {getMatches();}, 1000 * interval);
}

exports.getMatches = getMatches;
exports.matchList = matchList;

