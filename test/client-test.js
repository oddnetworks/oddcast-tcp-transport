'use strict';
const net = require('net');
const Promise = require('bluebird');
const test = require('tape');
const sinon = require('sinon');
const msgpack = require('oddcast-msgpack');
const tcpTransport = require('../lib/transport').create({client: {host: '127.0.0.1', port: 1544}});

const payload = {first: 1};
const pattern = {role: 'test'};
const response = {val: 'TCP-Response'};

(function sendWithNoError() {
	const server = net.createServer(socket => {
		socket.write(msgpack.encodeHex(response));
	});

	server.listen(1544, '127.0.0.1');

	const subject = tcpTransport;

	const messageSentHandler = sinon.spy();
	const responseHandler = sinon.spy();
	const errorHandler = sinon.spy();

	test('before all sendWithNoError', function (t) {
		subject.on('message:sent', messageSentHandler);
		subject.on('error', errorHandler);

		subject.on('client:connect', function () {
			subject.write({
				pattern: pattern,
				payload: payload
			}).then(responseHandler);

			Promise.delay(500).then(t.end);
		});

		subject.resume();
	});

	test('write() is called', function (t) {
		t.plan(4);
		const options = messageSentHandler.args[0][0];
		t.deepEqual(options.pattern, pattern, 'pattern is set');
		t.deepEqual(options.payload, payload, 'payload is set');
		t.deepEqual(responseHandler.args[0][0], response, 'response received from server');
		t.equal(errorHandler.callCount, 0, 'error is not emitted');
		t.end();
	});

	test('after all', function (t) {
		subject.client.destroy();
		server.close(t.end);
	});
})();
