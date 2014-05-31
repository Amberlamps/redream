var uuid = require('node-uuid');


var save = function(article, key, schema, client, callback) {

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

var findOneById = function(key, schema, client, articleId, callback) {

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

var findByArray = function(key, schema, client, array, callback) {

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

	if (array.length === 0) {
		callback(null, []);
	} else {

		var itemsCount = array.length,
			items = [];
		counter = 0;

		for (var i = 0; i < array.length; i++) {
			findOneById(key, schema, client, array[i], function(err, item) {
				if (!err) {
					items.push(item);
				}
				counter++;
				if (counter === itemsCount) {
					callback(null, schema.cast(items));
				}
			});
		}

	}

};

var findAll = function(key, schema, client, callback) {

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
		if (err) {
			callback(err, null);
		} else {
			findByArray(key, schema, client, results, function(err, items) {
				callback(err, schema.cast(items));
			});
		}
	});

};

var findByKeyValue = function(key, schema, client, _key, _value, callback) {

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

var find = function(key, schema, client, query, callback) {

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

		findAll(key, schema, client, callback);

	} else {

		for (var field in query) {

			if (query.hasOwnProperty(field)) {

				findByKeyValue(key, schema, client, field, query[field], function(err, results) {

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

						findByArray(key, schema, client, result, function(err, items) {

							callback(err, schema.cast(items));

						});

					}

				});
			}
		}

	}

};

var findOne = function(key, schema, client, query, callback) {

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

		findOneById(key, schema, client, query._id, function(err, item) {
			callback(err, schema.cast(item));
		});

	} else {

		find(key, schema, client, query, function(err, results) {
			if (results.length > 0) {
				callback(err, schema.cast(results[0]));
			} else {
				callback(err, []);
			}
		});

	}

};


var Model = function(name, schema, redream) {

	return (function() {

		var _key = [ redream.service, redream.prefix, name ],
			_name = name,
			_schema = schema,
			_redream = redream;

		function Document(fields) {
			this.fields = fields;
		}

		Document.prototype.save = function(callback) {

			save(this.fields, _key, _schema, _redream.client, callback);

		};

		Document.findOneById = function(articleId, callback) {

			findOneById(_key, _schema, _redream.client, articleId, callback);

		};

		Document.findByArray = function(array, callback) {

			findByArray(_key, _schema, _redream.client, array, callback);

		};

		Document.findAll = function(callback) {

			findAll(_key, _schema, _redream.client, callback);

		};

		Document.findByKeyValue = function(key, value, callback) {

			findByKeyValue(_key, _schema, _redream.client, key, value, callback);

		};

		Document.find = function(query, callback) {

			find(_key, _schema, _redream.client, query, callback);

		};

		Document.findOne = function(query, callback) {

			findOne(_key, _schema, _redream.client, query, callback);

		};

		return Document;

	})();

};

module.exports = Model;