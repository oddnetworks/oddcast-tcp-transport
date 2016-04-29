'use strict';

var net = require('net');
var util = require('util');
var EventEmitter = require('events');

var utils = require('./utils');

function Transport(options) {
	var self = this;
	this.options = options;

	if (this.options.server) {
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
	}

	if (this.options.client) {
		this.client = new net.Socket();
		this.client.connected = false;
		this.client.on('error', function (err) {
			self.emit('client:error', err);
		});
		this.client.on('connect', function () {
			self.client.connected = true;
			self.emit('client:connect');
		});
	}

	return this;
}

util.inherits(Transport, EventEmitter);

module.exports = Transport;

utils.extend(Transport.prototype, {
	resume: function () {
		if ((this.options.server && this.server.listening) || (this.options.client && this.client.connected)) {
			return this;
		}

		if (this.options.server && !this.server.listening) {
			this.server.listen(this.options.server.port, this.options.server.host);
		}

		if (this.options.client && !this.client.connected) {
			this.client.connect(this.options.client.port, this.options.client.host);
		}
	},

	close: function () {
		if (this.options.server) {
			this.server.close();
		}

		if (this.options.client) {
			this.client.destroy();
		}
	},

	setHandler: function (handler) {
		this.handler = handler;
	},

	write: function (message) {
		var self = this;
		var pattern = message.pattern;
		var payload = JSON.parse(JSON.stringify(message.payload));

		var promise = new Promise(function (resolve) {
			self.client.on('data', function (data) {
				resolve({
					pattern: pattern,
					payload: JSON.parse(data)
				});
			});
		});

		this.client.write(JSON.stringify({pattern: pattern, payload: payload}));
		self.emit('message:sent', {pattern: pattern, payload: payload});

		return promise;
	}
});

Transport.create = function (options) {
	options = options || {};

	if (!options.server && !options.client) {
		options.server = {host: '127.0.0.1', port: 1544};
		options.client = {host: '127.0.0.1', port: 1544};
	}

	return new Transport(options);
};
