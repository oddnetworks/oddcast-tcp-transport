'use strict';

const Promise = require('bluebird');
const test = require('tape');
const sinon = require('sinon');
const oddcast = require('oddcast');
const tcpTransport = require('../lib/transport');

const payload = require('./payload.json');

(function requestOriginatedMessage() {
	const transport = tcpTransport.create();
	const channel = oddcast.requestChannel();

	const errorHandler = sinon.spy();

	const messageRespondHandler = sinon.spy(() => {
		return Promise.resolve({message: 'success'});
	});
	const messageRequestHandler = sinon.spy(() => {
		return Promise.resolve(true);
	});

	test('before all requestOriginatedMessage', t => {
		transport.on('error', errorHandler);

		transport.on('error', () => {
			t.end();
		});
		transport.on('message:received', () => {
			t.end();
		});

		channel.use({}, transport);

		// Setup the respond handler.
		channel.respond({role: 'test', cmd: 'command:message'}, messageRespondHandler);

		// Send the request.
		channel.request({role: 'test', cmd: 'command:message'}, payload).then(messageRequestHandler);
	});

	test('read error handler is not called', t => {
		t.plan(1);
		t.equal(errorHandler.callCount, 0);
	});

	test('got message payload', t => {
		t.plan(1);
		t.equal(messageRespondHandler.args[0][0].length, payload.length, 'payload is present');
	});

	test('got payload response', t => {
		t.plan(1);

		const args = messageRequestHandler.args[0][0];
		t.equal(args.message, 'success');
	});

	test('after all closeConnections', t => {
		transport.close();
		t.end();
	});
})();
