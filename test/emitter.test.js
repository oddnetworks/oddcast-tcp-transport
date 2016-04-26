'use strict';
const net = require('net');
const Promise = require('bluebird');
const test = require('tape');
const sinon = require('sinon');
const Emitter = require('../lib/emitter');

const payload = {first: 1};
const pattern = {role: 'test'};
const response = {val: 'TCP-Response'};

(function sendWithNoError() {
	const server = net.createServer(function (socket) {
		socket.write(JSON.stringify(response));
	});
	server.listen(1544, '127.0.0.1');

	const subject = Emitter.create();

	const messageSentHandler = sinon.spy();
	const responseHandler = sinon.spy();
	const errorHandler = sinon.spy();

	test('before all sendWithNoError', function (t) {
		subject.on('message:sent', messageSentHandler);
		subject.on('error', errorHandler);
		subject.setHandler(responseHandler);

		subject.on('client:connect', function () {
			subject.write({
				pattern: pattern,
				payload: payload
			});

			Promise.delay(500).then(t.end);
		});

		subject.resume();
	});

	test('write() is called', function (t) {
		t.plan(4);
		const options = messageSentHandler.args[0][0];
		t.deepEqual(options.pattern, pattern, 'pattern is set');
		t.deepEqual(options.payload, payload, 'payload is set');
		t.deepEqual(responseHandler.args[0][1], response.payload, 'response received from server');
		t.equal(errorHandler.callCount, 0, 'error is not emitted');
		t.end();
	});

	test('after all', function (t) {
		subject.client.destroy();
		server.close(t.end);
	});
})();
