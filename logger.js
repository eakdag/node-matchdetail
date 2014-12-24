var fs = require('fs');

var Logger = function(path) {
	this.mode = 'DEBUG'; // DEBUG or PROD
	this.path = '/var/log/node/' + path;
	this.stream = fs.createWriteStream(this.path, 
									{ flags: 'a+',
										encoding: 'ut8',
										mode: 0666 });
}

Logger.prototype = {
	log: function(level, msg, start, end) {
		var self = this;
		if(self.mode == 'DEBUG' || level == 'ALERT' ) {	
			self.stream.write(
			 '[' + new Date().toUTCString() + ']'
        + ' ' + level
        + ' ' + msg
        + '\n'
			);
		}
	},

	info: function(msg) {
		this.log('INFO', msg);
	},

	alert: function(msg) {
		this.log('ALERT', msg);
	}	
} 
exports.LOGGER = Logger;
