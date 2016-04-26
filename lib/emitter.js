'use strict';

var net = require('net');
var util = require('util');
var EventEmitter = require('events');
var utils = require('./utils');

function Emitter(options) {
	var self = this;

	this.options = options;

	this.connected = false;

	this.client = new net.Socket();
	this.client.on('error', function (err) {
		self.emit('client:error', err);
	});
	this.client.on('connect', function () {
		this.connected = true;
		self.emit('client:connect');
	});

	return this;
}

util.inherits(Emitter, EventEmitter);

module.exports = Emitter;

utils.extend(Emitter.prototype, {
	resume: function () {
		if (this.connected) {
			return this;
		}

		this.client.connect(this.options.port, this.options.host);
	},

	close: function () {
		this.client.destroy();
	},

	write: function (message) {
		var self = this;
		var pattern = message.pattern;
		var payload = JSON.parse(JSON.stringify(message.payload));

		if (this.handler) {
			this.client.on('data', function (data) {
				self.handler({pattern: pattern, payload: JSON.parse(data)});
			});
		}

		this.client.write(JSON.stringify({pattern: pattern, payload: payload}));
		self.emit('message:sent', {pattern: pattern, payload: payload});

		return this;
	},

	setHandler: function (handler) {
		this.handler = handler;
	}
});

Emitter.create = function (options) {
	options = options || {host: '127.0.0.1', port: 1544};

	return new Emitter(options);
};
