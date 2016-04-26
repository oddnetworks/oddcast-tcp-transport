'use strict';
var net = require('net');
var util = require('util');
var EventEmitter = require('events');
var utils = require('./utils');

function Listener(options) {
	var self = this;

	this.options = options;

	this.handler = null;

	this.server = net.createServer(function (socket) {
		socket.on('data', function (message) {
			message = JSON.parse(message);
			self.emit('message:received', message);

			var result = Promise.resolve(false);

			if (self.handler) {
				result = self.handler({
					pattern: message.pattern,
					payload: message.payload
				});
			}

			result
				.then(function (result) {
					if (result) {
						self.emit('message:handled', message);
						socket.write(JSON.stringify(result));
					} else {
						self.emit('message:ignored', message);
					}
				})
				.catch(function (err) {
					self.emit('message:error', err);
				});
		});
	});
	this.server.on('listening', function () {
		self.emit('server:listening');
	});
	this.server.on('close', function () {
		self.emit('close');
	});

	return this;
}

util.inherits(Listener, EventEmitter);

module.exports = Listener;

utils.extend(Listener.prototype, {
	resume: function () {
		if (this.server.listening) {
			return this;
		}

		this.server.listen(this.options.port, this.options.host);
	},

	close: function () {
		this.server.close();
	},

	setHandler: function (handler) {
		this.handler = handler;
	}
});

Listener.create = function (options) {
	options = options || {host: '127.0.0.1', port: 1544};

	return new Listener(options);
};
