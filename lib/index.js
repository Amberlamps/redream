var Schema = require('./schema'),
	Model = require('./model');

var Redream = (function() {

	var DEFAULT_SERVICE = "redream",
		DEFAULT_PREFIX = "default";

	function Redream(options) {

		if (!options) {
			options = {};
		}

		this.service = (options.service) ? options.service : DEFAULT_SERVICE;

		this.prefix = (options.prefix) ? options.prefix : DEFAULT_PREFIX;

		this.client = (options.client) ? options.client : null;

		this.models = {};

	}

	Redream.prototype.setClient = function(client) {

		this.client = client;

	};

	Redream.prototype.model = function(name, schema) {

		name = name.toLowerCase();

		if (name[name.length-1] !== "s") {
			name += "s";
		}

		if (schema) {

			this.models[name] = new Model(name, schema, this);

		} else if (this.models.hasOwnProperty(name)) {

			return this.models[name];

		} else {

			throw 'cannot find model!';

		}

	};

	Redream.prototype.Schema = Schema;

	Redream.prototype.Model = Model;

	return Redream;

})();

module.exports = Redream;