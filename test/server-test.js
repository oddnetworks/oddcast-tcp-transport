'use strict';
const net = require('net');
const Promise = require('bluebird');
const test = require('tape');
const sinon = require('sinon');
const msgpack = require('oddcast-msgpack');
const tcpTransport = require('../lib/transport');

const messagePattern = {pattern: 1};
const messagePayload = {payload: 1};
const message = Object.freeze({
	pattern: messagePattern,
	payload: messagePayload
});

(function messageReceivedAndHandled() {
	const client = new net.Socket();

	const subject = tcpTransport.create({server: {host: '127.0.0.1', port: 1544}});
	const handler = sinon.spy(function () {
		return Promise.resolve(msgpack.encodeHex({}));
	});
	subject.setHandler(handler);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();
	const errorHandler = sinon.spy();

	test('before messageReceivedAndHandled', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('error', errorHandler);

		subject.on('server:listening', function () {
			client.on('connect', function () {
				client.write(msgpack.encodeHex(message));

				Promise.delay(100).then(t.end);
			});
			client.connect(1544, '127.0.0.1');
		});

		subject.resume();
	});
	test('message:received is emitted', function (t) {
		t.plan(1);
		const arg = messageReceivedHandler.args[0][0];
		t.deepEqual(arg, message);
	});
	test('handler is called', function (t) {
		t.plan(2);
		const arg = handler.args[0][0];
		t.deepEqual(arg.pattern, message.pattern);
		t.deepEqual(arg.payload, message.payload);
	});
	test('message:ignored is not emitted', function (t) {
		t.plan(1);
		t.equal(messageIgnoredHandler.callCount, 0);
	});
	test('message:handled is emitted', function (t) {
		t.plan(1);
		const arg = messageHandledHandler.args[0][0];
		t.deepEqual(arg, message);
	});
	test('message:error is not emitted', function (t) {
		t.equal(messageErrorHandler.callCount, 0);
		t.end();
	});
	test('error is not emitted', function (t) {
		t.plan(1);
		t.equal(errorHandler.callCount, 0);
	});
	test('after all', function (t) {
		client.destroy();
		subject.server.close(t.end);
	});
})();

(function messageReceivedAndNotHandled() {
	const client = new net.Socket();

	const subject = tcpTransport.create({server: {host: '127.0.0.1', port: 1544}});
	subject.handler = sinon.spy(function () {
		return Promise.resolve(false);
	});
	// subject.setHandler(handler);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();
	const errorHandler = sinon.spy();

	test('before messageReceivedAndHandled', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('message:ignored', messageIgnoredHandler);
		subject.on('error', errorHandler);

		subject.on('server:listening', function () {
			client.on('connect', function () {
				client.write(msgpack.encodeHex(message));

				Promise.delay(100).then(t.end);
			});
			client.connect(1544, '127.0.0.1');
		});

		subject.resume();
	});
	test('message:received is emitted', function (t) {
		t.plan(1);
		const arg = messageReceivedHandler.args[0][0];
		t.deepEqual(arg, message);
	});
	test('handler is called', function (t) {
		t.plan(1);
		t.equal(subject.handler.callCount, 1);
	});
	test('message:ignored is emitted', function (t) {
		t.plan(1);
		const arg = messageIgnoredHandler.args[0][0];
		t.deepEqual(arg, message);
	});
	test('message:handled is not emitted', function (t) {
		t.plan(1);
		t.equal(messageHandledHandler.callCount, 0);
	});
	test('message:error is not emitted', function (t) {
		t.plan(1);
		t.equal(messageErrorHandler.callCount, 0);
	});
	test('error is not emitted', function (t) {
		t.plan(1);
		t.equal(errorHandler.callCount, 0);
	});
	test('after all', function (t) {
		client.destroy();
		subject.server.close(t.end);
	});
})();

(function messageReceivedAndRejected() {
	const client = new net.Socket();

	const error = new Error('TEST messageReceivedAndRejected');
	const handler = sinon.spy(function () {
		return Promise.reject(error);
	});
	const subject = tcpTransport.create({server: {host: '127.0.0.1', port: 1544}});
	subject.setHandler(handler);
	const messageReceivedHandler = sinon.spy();
	const messageHandledHandler = sinon.spy();
	const messageErrorHandler = sinon.spy();
	const messageIgnoredHandler = sinon.spy();
	const errorHandler = sinon.spy();

	test('before messageReceivedAndHandled', function (t) {
		subject.on('message:received', messageReceivedHandler);
		subject.on('message:handled', messageHandledHandler);
		subject.on('message:error', messageErrorHandler);
		subject.on('error', errorHandler);
		subject.on('message:ignored', messageIgnoredHandler);

		subject.on('server:listening', function () {
			client.on('connect', function () {
				client.write(msgpack.encodeHex(message));

				Promise.delay(100).then(t.end);
			});
			client.connect(1544, '127.0.0.1');
		});

		subject.resume();
	});
	test('message:received is emitted', function (t) {
		t.plan(1);
		const arg = messageReceivedHandler.args[0][0];
		t.deepEqual(arg, message);
	});
	test('handler is called', function (t) {
		t.plan(2);
		const arg = handler.args[0][0];
		t.deepEqual(arg.pattern, message.pattern);
		t.deepEqual(arg.payload, message.payload);
	});
	test('message:ignored is not emitted', function (t) {
		t.plan(1);
		t.equal(messageIgnoredHandler.callCount, 0);
	});
	test('message:handled is not emitted', function (t) {
		t.plan(1);
		t.equal(messageHandledHandler.callCount, 0);
	});
	test('message:error is emitted', function (t) {
		t.plan(1);
		const arg = messageErrorHandler.args[0][0];
		t.deepEqual(arg, error);
	});
	test('error is not emitted', function (t) {
		t.plan(1);
		t.equal(errorHandler.callCount, 0);
	});
	test('after all', function (t) {
		client.destroy();
		subject.server.close(t.end);
	});
})();
