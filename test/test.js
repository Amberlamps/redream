var redis = require('redis'),
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

Article.set({

	url: '1',
	price: 2

}, function(err, article) {

	console.log(article);

});


// var assert = require("assert");

// describe('Array', function(){
//   describe('#indexOf()', function(){
//     it('should return -1 when the value is not present', function(){
//       assert.equal(-1, [1,2,3].indexOf(5));
//       assert.equal(-1, [1,2,3].indexOf(0));
//     });
//   });
// });