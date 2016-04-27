'use strict';

const test = require('tape');
const sinon = require('sinon');
const oddcast = require('oddcast');
const tcpTransport = require('../lib/oddcast-tcp-transport');

(function commandOriginatedMessage() {
	const payload = {
		id: 'command_success'
	};

	const readTransport = tcpTransport.listener();
	const writeTransport = tcpTransport.emitter();

	const receiveChannel = oddcast.requestChannel();
	const sendChannel = oddcast.requestChannel();

	const readErrorHandler = sinon.spy();
	const writeErrorHandler = sinon.spy();

	const messageRespondHandler = sinon.spy(function () {
		return Promise.resolve({message: 'success'});
	});
	const messageRequestHandler = sinon.spy();

	test('before all requestOriginatedMessage', function (t) {
		readTransport.on('error', readErrorHandler);
		writeTransport.on('error', writeErrorHandler);

		readTransport.on('error', function () {
			t.end();
		});
		writeTransport.on('error', function () {
			t.end();
		});
		readTransport.on('message:received', function () {
			t.end();
		});

		receiveChannel.use({}, readTransport);
		sendChannel.use({}, writeTransport);

		// Setup the receive handler.
		receiveChannel.respond({role: 'test', cmd: 'command:message'}, messageRespondHandler);

		// Send the request.
		sendChannel.request({role: 'test', cmd: 'command:message'}, payload).then(messageRequestHandler);
	});

	test('read error handler is not called', function (t) {
		t.plan(1);
		t.equal(readErrorHandler.callCount, 0);
	});

	test('write error handler is not called', function (t) {
		t.plan(1);
		t.equal(writeErrorHandler.callCount, 0);
	});

	test('got message payload', function (t) {
		t.plan(2);
		const args = messageRespondHandler.args[0][0];
		t.ok(typeof payload.id !== 'undefined', 'payload is present');
		t.equal(args.id, payload.id);
	});

	test('got payload response', function (t) {
		t.plan(1);
		const args = messageRequestHandler.args[0][0];
		t.equal(args.payload.message, 'success');
	});

	test('after all closeConnections', function (t) {
		readTransport.close();
		writeTransport.close();
		t.end();
	});
})();
