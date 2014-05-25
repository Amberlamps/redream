var redis = require('fakeredis'),
	client = redis.createClient(6379, '127.0.0.1'),
	Redream = require('../lib'),
	redream = new Redream({
		prefix: 'test',
		client: client
	}),
	Schema = redream.Schema;

var schema = new Schema({

	url: {
		type: String,
		required: true
	},

	price: {
		type: Number,
		required: true
	}

});

redream.model('Article', schema);
var Article = redream.model('Article');





var assert = require("assert");

describe('Article', function(){

	var article;

	before(function() {

		article = new Article({
			url: 'http://www.google.de',
			price: 2
		});

	});

  describe('#save()', function() {

    it('should save without an error', function(done) {
			article.save(function(err, article) {
				if (err) {
					throw err;
				}
				done();
			});
    });
  });

  describe('#save()', function() {
    it('should save values as entered', function(done) {
			article.save(function(err, article) {
				if (err) {
					throw err;
				}
				assert.equal('http://www.google.de', article.url);
				assert.equal(2, article.price);
				done();
			});
    });
  });



});