'use strict';

const test = require('tape');
const sinon = require('sinon');
const oddcast = require('oddcast');
const tcpTransport = require('../lib/transport').create();

(function commandOriginatedMessage() {
	const payload = {
		id: 'command_success'
	};

	const channel = oddcast.requestChannel();

	const errorHandler = sinon.spy();

	const messageRespondHandler = sinon.spy(function () {
		return Promise.resolve({message: 'success'});
	});
	const messageRequestHandler = sinon.spy();

	test('before all requestOriginatedMessage', function (t) {
		tcpTransport.on('error', errorHandler);

		tcpTransport.on('error', function () {
			t.end();
		});
		tcpTransport.on('message:received', function () {
			t.end();
		});

		channel.use({}, tcpTransport);

		// Setup the receive handler.
		channel.respond({role: 'test', cmd: 'command:message'}, messageRespondHandler);

		// Send the request.
		channel.request({role: 'test', cmd: 'command:message'}, payload).then(messageRequestHandler);
	});

	test('read error handler is not called', function (t) {
		t.plan(1);
		t.equal(errorHandler.callCount, 0);
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
		tcpTransport.close();
		t.end();
	});
})();
