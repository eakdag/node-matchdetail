var http = require("http"),
	url = require("url"),
	util = require("util"),
	events = require("events"),
	LOGGER = require('./logger.js').LOGGER,
	matchfetcher = require("./match-fetcher"),
	logger = new LOGGER('matchdetail.log');


http.createServer(function(request, response){
	var sendMessage = function(reqObject) {
		clearTimeout(request.timeout);
		response.writeHead(200, {"Content-Type": "application/x-javascript"});
		response.write('_p({"s":' + JSON.stringify(reqObject) + '});');
		response.end();
	}	
	if (request.url === '/favicon.ico') {
    	response.writeHead(200, {'Content-Type': 'image/x-icon'} );
	    response.end();		
	    return;
	}
	if (request.url === '/robots.txt') {
	    response.end();		
	    return;
	}
	
	var urlParsed = url.parse(request.url, true);
	var requestData = urlParsed.query;
	if(!request.method || request.method !== 'GET' || !requestData.id || !requestData.s) {
		response.writeHead(404);
		response.end();
		return;
	}		
	request.timeout = null;

	//console.log(urlParsed);

	
	//console.log(matchfetcher.matchList[requestData.id]);
	if(!matchfetcher.matchList[requestData.id]) {			
		var msg = '_p({"s":-1});'
		response.writeHead(200, {"Content-Type": "application/x-javascript"});
		response.write(msg);
		response.end();
		return;
	}

	if(requestData.s != matchfetcher.matchList[requestData.id].seqObject.seq) {
		var msg = '_p({"s":' + JSON.stringify(matchfetcher.matchList[requestData.id].seqObject) + '});'

		response.writeHead(200, {"Content-Type": "application/x-javascript"});
		response.write(msg);
		response.end();		
	} else {
		matchfetcher.matchList[requestData.id].eventEmitter.once("send", sendMessage);
	}

	// set 2 min. time-out for request
	(function(mId, listener) {
		request.timeout = setTimeout(function() {
			try {
				matchfetcher.matchList[mId].eventEmitter.removeListener("send", listener);
				//console.log('Timeout: %d', fId);
				response.end();
				return;
			} catch(ex) {
				logger.alert("TimeoutError: (" + mId + ") "  + ex);
			}
		}, 1000*60*2);
	})(requestData.id, sendMessage);

}).listen(8080);
logger.info('Server started at 8080');
matchfetcher.getMatches();
Match = function(matchId) {
	var eventEmitter = new events.EventEmitter();
	eventEmitter.setMaxListeners(0);
	return {
		id : matchId,
		eventEmitter : eventEmitter,
		seq : 0,
		seqObject : {},
		subscribersCount : function() {	
			return this.eventEmitter.listeners("send").length;
		},
		maxSubscribers : 0,
		maxSubsDate : new Date(),
		counter : 0		
	}
}
setInterval( function() {
	try {
		var totalCount = 0;
		for (matchId in matchfetcher.matchList) {
			var match = matchfetcher.matchList[matchId];
			//console.log("[stat-match] id:" + match.id + ", subsCount:" + match.subscribersCount() + ", maxSubs:" + match.maxSubscribers + ", maxSubDate:" + match.maxSubsDate);
			totalCount+= match.subscribersCount() ;
		}
	//console.log("[" + new Date().toTimeString() + "] - [stat-total] totalforum %d ", count);
		logger.info("[stat-total] totalSubs:" + totalCount);
	} catch(ex) {
		logger.error(ex);
	}
}, 10000 );
