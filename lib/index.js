var redis = require('redis'),
	client = null,
	prefix = null,
	uuid = require('node-uuid'),
	Schema = require('./schema');

var models = {};



var connect = function(options) {

	if (!options) {
		options = {};
	}

	prefix = options.prefix;

	var port = (options.port) ? options.port : 6379;
	var host = (options.host) ? options.host : '127.0.0.1';

	delete options.port;
	delete options.host;

	client = redis.createClient(port, host, options);

	for (var key in models) {
		models[key].setClient(client);
	}

};



var model = function(name, schema) {

	name = name.toLowerCase();

	if (name[name.length-1] !== "s") {
		name += "s";
	}

	if (schema) {

		console.log('SET TABLE KEY');
		schema.setClient(client);
		schema.tableKey = [ prefix, name ];
		models[name] = schema;

	} else if (models.hasOwnProperty(name)) {

		return models[name];

	} else {

		throw 'cannot find model!';

	}

};


module.exports = {

	Schema: Schema,

	model: model,

	connect: connect

};