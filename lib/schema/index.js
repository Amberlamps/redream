var redream = require('redream'),
	uuid = require('node-uuid');

var Schema = (function() {

	function Schema(fields) {

		this.fields = fields;

		this.required = (function() {

			var keys = [];

			for (var key in fields) {
				if (fields.hasOwnProperty(key)) {
					keys.push(key);
				}
			}

			return keys;

		})();

	}


	var set = function(article) {

		if (!article) {
			throw 'no article to create';
		}

		for (var i = 0; i < this.required.length; i++) {
			if (!article.hasOwnProperty(this.required[i])) {
				throw 'cannot create! required field is not found!'
			}
		}

		var articleId = uuid.v1();

		for (var field in article) {
			this.client.hset(this.tableKey.concat(articleId).join(":"), field, article[field]);
			this.client.sadd(this.tableKey.join(":"), articleId);
			this.client.sadd(this.tableKey.concat([field, article[field]]).join(":"), articleId);
		}

		article._id = articleId;

		return article;

	};

	var findOneById = function(articleId, callback) {

		this.client.hgetall(this.tableKey.concat(articleId).join(":"), function(err, article) {
			if (article) {
				article._id = articleId;
			}
			callback(err, article);
		});

	};

	var findByArray = function(array, callback) {

		var itemsCount = array.length,
			items = [];
		counter = 0;

		for (var i = 0; i < array.length; i++) {
			findOneById.call(this, array[i], function(err, item) {
				if (!err) {
					items.push(item);
				}
				counter++;
				if (counter === itemsCount) {
					callback(null, items);
				}
			});
		}

	};

	var findAll = function(callback) {

		var model = this;

		this.client.smembers(this.tableKey.join(":"), function(err, results) {
			findByArray.call(model, results, function(err, items) {
				callback(err, items);
			})
		});

	};

	var findByKeyValue = function(key, value, callback) {

		this.client.smembers(this.tableKey.concat([key, value]).join(":"), function(err, results) {
			callback(err, results);
		});

	};

	var find = function(query, callback) {

		var model = this;

		var queryItemsCount = Object.keys(query).length,
			counter = 0,
			result = [];

		if (queryItemsCount === 0) {

			findAll.call(model, callback);

		} else {

			for (var field in query) {

				if (query.hasOwnProperty(field)) {

					findByKeyValue.call(model, field, query[field], function(err, results) {

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

							findByArray.call(model, result, function(err, items) {

								callback(err, items);

							});

						}

					});
				}
			}

		}

	};

	var findOne = function(query, callback) {

		if (query && query._id) {
			findOneById.call(this, query._id, function(err, item) {
				callback(err, item);
			})
		} else {

			find.call(this, query, function(err, results) {
				if (results.length > 0) {
					callback(err, results[0]);
				} else {
					callback(err, []);
				}
			});

		}

	};

	Schema.prototype.setClient = function(client) {

		this.client = client;

	};

	Schema.prototype.set = set;

	Schema.prototype.findOneById = findOneById;

	Schema.prototype.findByArray = findByArray;

	Schema.prototype.findAll = findAll;

	Schema.prototype.findByKeyValue = findByKeyValue;

	Schema.prototype.find = find;

	Schema.prototype.findOne = findOne;

	return Schema;

})();

module.exports = Schema;