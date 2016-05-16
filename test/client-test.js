'use strict';
const net = require('net');
const Promise = require('bluebird');
const test = require('tape');
const sinon = require('sinon');
const msgpack = require('oddcast-msgpack');
const oddcastTCPTransport = require('../lib/transport');

const payload = {first: 1};
const pattern = {role: 'test'};
const response = {val: 'TCP-Response'};

(function sendWithNoError() {
	const server = net.createServer(socket => {
		socket.write(msgpack.encodeHex(response));
	});

	server.listen(1544, '127.0.0.1');

	const subject = oddcastTCPTransport.create({client: {host: '127.0.0.1', port: 1544}});

	const messageSentHandler = sinon.spy();
	const responseHandler = sinon.spy();
	const errorHandler = sinon.spy();

	test('before all sendWithNoError', t => {
		subject.on('message:sent', messageSentHandler);
		subject.on('error', errorHandler);

		subject.on('client:connect', () => {
			subject.write({
				pattern: pattern,
				payload: payload
			}).then(responseHandler);

			Promise.delay(500).then(t.end);
		});

		subject.resume();
	});

	test('write() is called', t => {
		t.plan(5);
		t.equal(messageSentHandler.callCount, 1, 'transport emitted "message:sent" once');
		const sentMessage = messageSentHandler.args[0][0];
		t.deepEqual(sentMessage.pattern, pattern, 'pattern is set');
		t.deepEqual(sentMessage.payload, payload, 'payload is set');
		t.deepEqual(responseHandler.args[0][0], response, 'response received from server');
		t.equal(errorHandler.callCount, 0, 'transport did not emit "error"');
	});

	test('after all', t => {
		subject.close();
		server.close(t.end);
	});
})();

(function sendWithError() {
	const server = net.createServer();

	server.listen(1545, '127.0.0.1');

	const subject = oddcastTCPTransport.create({client: {host: '127.0.0.1', port: 1545}});

	const messageSentHandler = sinon.spy();
	const responseHandler = sinon.spy();
	const errorHandler = sinon.spy();
	const clientErrorListener = sinon.spy();

	test('before all sendWithNoError', t => {
		subject.on('message:sent', messageSentHandler);
		subject.on('error', errorHandler);
		subject.client.on('error', clientErrorListener);

		subject.on('client:connect', () => {
			subject.write('{{}}').then(responseHandler);

			Promise.delay(500).then(t.end);
		});

		subject.resume();
	});

	test('write() is called', t => {
		t.plan(3);
		t.equal(messageSentHandler.callCount, 0, 'transport did not emit "message:sent"');
		t.equal(clientErrorListener.callCount, 1, 'client emitted "error"');
		t.equal(errorHandler.callCount, 1, 'transport emitted "error"');
	});

	test('after all', t => {
		subject.close();
		server.close(t.end);
	});
})();
