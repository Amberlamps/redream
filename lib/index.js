var Schema = require('./schema'),
	Model = require('./model'),
	DEFAULT_SERVICE = "redream",
	DEFAULT_PREFIX = "default",
	DEFAULT_CLIENT = null,
	DEFAULT_REDREAM = null;

var Redream = (function() {

	function Redream(options) {

		if (!options) {
			options = {};
		}

		this.service = (options.service) ? options.service : null;

		this.prefix = (options.prefix) ? options.prefix : null;

		this.client = (options.client) ? options.client : null;

		this.models = {};

	}

	Redream.prototype.setClient = function(client) {
		this.client = client;
	};

	Redream.prototype.isConnected = function() {
		return !!this.client;
	};

	return Redream;

})();

DEFAULT_REDREAM = new Redream();

var connect = function(options) {

	if (DEFAULT_REDREAM.isConnected()) {
		throw new Error("redream already connected");
	}

	if ((!options || !options.client) && !DEFAULT_CLIENT) {
		throw new Error("no client provided");
	}

	if (!DEFAULT_CLIENT) {
		DEFAULT_CLIENT = options.client;
	}

	DEFAULT_REDREAM.service = options.service || DEFAULT_SERVICE;
	DEFAULT_REDREAM.prefix = options.prefix || DEFAULT_PREFIX;
	DEFAULT_REDREAM.setClient(DEFAULT_CLIENT);

};

var model = function(name, schema) {

	name = name.toLowerCase();

	if (name[name.length-1] !== "s") {
		name += "s";
	}

	if (schema) {

		DEFAULT_REDREAM.models[name] = Model(name, schema, DEFAULT_REDREAM);

	} else if (DEFAULT_REDREAM.models.hasOwnProperty(name)) {

		return DEFAULT_REDREAM.models[name];

	} else {

		throw 'cannot find model!';

	}

};

module.exports = {
	connect: connect,
	model: model,
	Schema: Schema
};