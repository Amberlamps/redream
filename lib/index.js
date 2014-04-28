var redis = require('redis'),
	client = null,
	prefix = null,
	uuid = require('node-uuid'),
	Schema = require('./schema'),
	SERVICE = "redream",
	DEFAULT_DB = "default",
	DEFAULT_PORT = 6379,
	DEFAULT_HOST = "127.0.0.1",
	DELIMITER = ":";


var models = {};

var connect = function(options) {

	if (!options) {
		options = {};
	}

	prefix = (options.prefix) ? options.prefix : DEFAULT_DB;

	var port = (options.port) ? options.port : DEFAULT_PORT;
	var host = (options.host) ? options.host : DEFAULT_HOST;

	delete options.port;
	delete options.host;

	client = redis.createClient(port, host, options);

};

var Model = (function() {

	function Model(name, schema) {

		this.schema = schema;
		this.key = [ SERVICE, prefix, name ];

	}

	var set = function(article, key, schema, callback) {

		if (!client) {
			throw 'not connected';
		}

		if (!article) {
			throw 'no article to create';
		}

		if (!key) {
			throw 'no key provided';
		}

		if (!schema) {
			throw 'no schema provided';
		}

		if (!callback) {
			callback = function() {};
		}

		for (var i = 0; i < schema.required.length; i++) {
			if (!article.hasOwnProperty(schema.required[i])) {
				throw 'cannot create! required field is not found!'
			}
		}

		var articleId = uuid.v1();

		for (var field in article) {
			client.hset(key.concat(articleId).join(":"), field, article[field]);
			client.sadd(key.join(":"), articleId);
			client.sadd(key.concat([field, article[field]]).join(":"), articleId);
		}

		article._id = articleId;

		callback(null, article);

	};

	var findOneById = function(key, schema, articleId, callback) {

		if (!client) {
			throw 'not connected';
		}

		if (!key) {
			throw 'no key provided';
		}

		if (!schema) {
			throw 'no schema provided';
		}

		if (!articleId) {
			throw 'no article id provided';
		}

		if (!callback) {
			callback = function() {};
		}

		client.hgetall(key.concat(articleId).join(":"), function(err, article) {
			if (article) {
				article._id = articleId;
			}
			callback(err, schema.cast(article));
		});

	};

	var findByArray = function(key, schema, array, callback) {

		if (!client) {
			throw 'not connected';
		}

		if (!key) {
			throw 'no key provided';
		}

		if (!schema) {
			throw 'no schema provided';
		}

		if (!array) {
			throw 'no array provided';
		}

		if (!callback) {
			callback = function() {};
		}

		var itemsCount = array.length,
			items = [];
		counter = 0;

		for (var i = 0; i < array.length; i++) {
			findOneById(key, schema, array[i], function(err, item) {
				if (!err) {
					items.push(item);
				}
				counter++;
				if (counter === itemsCount) {
					callback(null, schema.cast(items));
				}
			});
		}

	};

	var findAll = function(key, schema, callback) {

		if (!client) {
			throw 'not connected';
		}

		if (!key) {
			throw 'no key provided';
		}

		if (!schema) {
			throw 'no schema provided';
		}

		if (!callback) {
			callback = function() {};
		}

		client.smembers(key.join(":"), function(err, results) {
			findByArray(key, schema, results, function(err, items) {
				callback(err, schema.cast(items));
			})
		});

	};

	var findByKeyValue = function(key, schema, _key, _value, callback) {

		if (!client) {
			throw 'not connected';
		}

		if (!key) {
			throw 'no key provided';
		}

		if (!schema) {
			throw 'no schema provided';
		}

		if (!_key) {
			throw 'no _key provided';
		}

		if (!_value) {
			throw 'no _value provided';
		}

		if (!callback) {
			callback = function() {};
		}

		client.smembers(key.concat([_key, _value]).join(":"), function(err, results) {
			callback(err, schema.cast(results));
		});

	};

	var find = function(key, schema, query, callback) {

		if (!client) {
			throw 'not connected';
		}

		if (!key) {
			throw 'no key provided';
		}

		if (!schema) {
			throw 'no schema provided';
		}

		if (!query) {
			throw 'no query provided';
		}

		if (!callback) {
			callback = function() {};
		}

		var queryItemsCount = Object.keys(query).length,
			counter = 0,
			result = [];

		if (queryItemsCount === 0) {

			findAll(key, schema, callback);

		} else {

			for (var field in query) {

				if (query.hasOwnProperty(field)) {

					findByKeyValue(key, schema, field, query[field], function(err, results) {

						if (result.length === 0) {

							result = results;

						} else {

							var newResult = [];

							for (var i = 0; i < results.length; i++) {
								if (result.indexOf(results[i]) > -1) {
									newResult.push(results[i]);
								}
							}

							result = newResult;

						}

						counter++;

						if (counter === queryItemsCount) {

							findByArray(key, schema, result, function(err, items) {

								callback(err, schema.cast(items));

							});

						}

					});
				}
			}

		}

	};

	var findOne = function(key, schema, query, callback) {

		if (!client) {
			throw 'not connected';
		}

		if (!key) {
			throw 'no key provided';
		}

		if (!schema) {
			throw 'no schema provided';
		}

		if (!query) {
			throw 'no query provided';
		}

		if (!callback) {
			callback = function() {};
		}

		if (query && query._id) {

			findOneById(key, schema, query._id, function(err, item) {
				callback(err, schema.cast(item));
			});

		} else {

			find(key, schema, query, function(err, results) {
				if (results.length > 0) {
					callback(err, schema.cast(results[0]));
				} else {
					callback(err, []);
				}
			});

		}

	};

	Model.prototype.set = function(article, callback) {

		set(article, this.key, this.schema, callback);

	};

	Model.prototype.findOneById = function(articleId, callback) {

		findOneById(this.key, this.schema, articleId, callback);

	};

	Model.prototype.findByArray = function(array, callback) {

		findByArray(this.key, this.schema, array, callback);

	};

	Model.prototype.findAll = function(callback) {

		findAll(this.key, this.schema, callback);

	};

	Model.prototype.findByKeyValue = function(key, value, callback) {

		findByKeyValue(this.key, this.schema, key, value, callback);

	};

	Model.prototype.find = function(query, callback) {

		find(this.key, this.schema, query, callback);

	};

	Model.prototype.findOne = function(query, callback) {

		findOne(this.key, this.schema, query, callback);

	};

	return Model;

})();



var model = function(name, schema) {

	name = name.toLowerCase();

	if (name[name.length-1] !== "s") {
		name += "s";
	}

	if (schema) {

		models[name] = new Model(name, schema);

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