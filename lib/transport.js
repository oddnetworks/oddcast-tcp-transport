'use strict';

const net = require('net');
const util = require('util');
const EventEmitter = require('events');
const msgpack = require('oddcast-msgpack');
const errors = require('./errors');

const utils = require('./utils');

function Transport(options) {
	const self = this;
	this.options = options;

	if (this.options.server) {
		this.server = net.createServer(socket => {
			socket.setEncoding('utf8');
			socket.on('data', data => {
				const message = msgpack.decodeHex(data);
				self.emit('message:received', message);

				let result = Promise.resolve(false);

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
							socket.write(msgpack.encodeHex(result));
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
		this.client.response = new Promise((resolve, reject) => {
			self.client.on('data', function (data) {
				try {
					const message = msgpack.decodeHex(data.toString('utf8'));
					resolve(message);
				} catch (e) {
					reject(new errors.MessageDecodeError(`Unable to decode message: ${e}`));
				}
			});
			self.client.on('error', function (err) {
				reject(err);
			});
		});
		this.client.on('error', function (err) {
			self.emit('error', err);
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
		try {
			var payload = JSON.parse(JSON.stringify(message.payload));
			const msg = {pattern: pattern, payload: payload};
			const encoded = msgpack.encodeHex(msg);

			this.client.write(encoded, function () {
				self.emit('message:sent', msg);
			});
		} catch (err) {
			this.client.emit('error', err);
		}

		return this.client.response;
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
