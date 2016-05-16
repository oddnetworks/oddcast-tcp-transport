var util = require('util');

// A superclass for all other Operational Errors and used by itself
// as a general operational exception indicator.
function OperationalError(message) {
	Error.call(this);
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
}
util.inherits(OperationalError, Error);
exports.OperationalError = OperationalError;

function MessageDecodeError(message) {
	Error.call(this);
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
}
util.inherits(MessageDecodeError, OperationalError);
exports.MessageDecodeError = MessageDecodeError;

function InvalidMessageError(message) {
	Error.call(this);
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
}
util.inherits(InvalidMessageError, OperationalError);
exports.InvalidMessageError = InvalidMessageError;
