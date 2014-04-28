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

	var cast = function(fields, documents) {

		var ret;

		if (Object.prototype.toString.call(documents) !== "[object Array]") {
			documents = [documents];
			ret = function(docs) {
				return docs[0];
			};
		} else {
			ret = function(docs) {
				return docs;
			}
		}

		for (var i = 0; i < documents.length; i++) {
			for (var key in documents[i]) {
				if (fields.hasOwnProperty(key)) {
					documents[i][key] = fields[key].type(documents[i][key]);
				}
			}
		}

		return ret(documents);

	};

	Schema.prototype.cast = function(documents) {

		return cast(this.fields, documents);

	};

	return Schema;

})();

module.exports = Schema;