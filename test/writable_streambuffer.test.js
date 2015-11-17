var vows = require("vows"),
	assert = require("assert"),
	streamBuffer = require("../lib/streambuffer.js"),
	fixtures = require("./fixtures"),
	helpers = require("./helpers");

vows.describe("WritableStreamBuffer").addBatch({
	"A simple WritableStreamBuffer": {
		topic: function() {
			return new streamBuffer.WritableStreamBuffer();
		},

		"calling *getContents()* false when empty": function(aStreamBuffer) {
			assert.isFalse(aStreamBuffer.getContents());
		},

		"calling *getContentsAsString()* returns false when empty": function(aStreamBuffer) {
			assert.isFalse(aStreamBuffer.getContentsAsString());
		},

		"backing buffer should be default size": function(aStreamBuffer) {
			assert.equal(aStreamBuffer.maxSize(), streamBuffer.DEFAULT_INITIAL_SIZE);
		}
	},

	"Writing a simple string": {
		topic: function() {
			var aStreamBuffer = new streamBuffer.WritableStreamBuffer();
			aStreamBuffer.write(fixtures.simpleString);
			return aStreamBuffer;
		},

		"backing buffer should be correct length": function(aStreamBuffer) {
			assert.equal(aStreamBuffer.size(), fixtures.simpleString.length);
		},

		"max size should be default size": function(aStreamBuffer) {
			assert.equal(aStreamBuffer.maxSize(), streamBuffer.DEFAULT_INITIAL_SIZE);
		},

		"contents should be correct": function(aStreamBuffer) {
			assert.equal(aStreamBuffer.getContentsAsString(), fixtures.simpleString);
		}
	},

	"When writing a large binary blob": {
		topic: function() {
			var aStreamBuffer = new streamBuffer.WritableStreamBuffer();
			aStreamBuffer.write(fixtures.largeBinaryData);
			return aStreamBuffer;
		},

		"backing buffer should be correct size": function(aStreamBuffer) {
			assert.equal(aStreamBuffer.size(), fixtures.largeBinaryData.length);
		},

		"backing buffer size should have incremented": function(aStreamBuffer) {
			assert.equal(aStreamBuffer.maxSize(), streamBuffer.DEFAULT_INITIAL_SIZE + streamBuffer.DEFAULT_INCREMENT_AMOUNT);
		},

		"contents are valid": function(aStreamBuffer) {
			helpers.assertBuffersEqual(aStreamBuffer.getContents(), fixtures.largeBinaryData);
		}
	},

	"When writing some simple data to the stream": {
		topic: function() {
			var aStreamBuffer = new streamBuffer.WritableStreamBuffer();
			aStreamBuffer.write(fixtures.simpleString);
			return aStreamBuffer;
		},

		"and retrieving half of it": {
			topic: function(aStreamBuffer) {
				var str = aStreamBuffer.getContentsAsString("utf8", Math.floor(fixtures.simpleString.length / 2));
				aStreamBuffer.testStr = str;
				return aStreamBuffer;
			},

			// No clue why, but first param is a null value...
			"we get correct data": function(wtf, aStreamBuffer) {
				assert.equal(aStreamBuffer.testStr, fixtures.simpleString.substring(0, Math.floor(fixtures.simpleString.length / 2)));
			},

			// Same deal again. Nested contexes are weird yo.
			"and there is still correct amount of data remaining in stream buffer": function(wtf, aStreamBuffer) {
				assert.equal(aStreamBuffer.size(), Math.ceil(fixtures.simpleString.length / 2));
			},

			// Not very well documented (IMO), but sub contexts *can* execute asynchronously. So I put this context here to make sure it executes after
			// the first half of data is read.
			"and then retrieving the other half of it": {
				topic: function(aStreamBuffer) {
					var str = aStreamBuffer.getContentsAsString("utf8", Math.ceil(fixtures.simpleString.length / 2));
					aStreamBuffer.testStr = str;
					return aStreamBuffer;
				},

				"we get correct data": function(wtf, aStreamBuffer) {
					assert.equal(aStreamBuffer.testStr, fixtures.simpleString.substring(Math.floor(fixtures.simpleString.length / 2)));
				},

				"and stream buffer is now empty": function(wtf, aStreamBuffer) {
					assert.equal(aStreamBuffer.size(), 0);
				}
			}
		}
	},

	"StreamBuffer with a different initial size and increment amount": {
		topic: function() {
			var aStreamBuffer = new streamBuffer.WritableStreamBuffer({
				initialSize: 62,
				incrementAmount: 321
			});
			return aStreamBuffer;
		},

		"has the correct initial size": function(aStreamBuffer) {
			assert.equal(aStreamBuffer.maxSize(), 62);
		},

		"after data is written": {
			topic: function(aStreamBuffer) {
				aStreamBuffer.write(fixtures.binaryData);
				return aStreamBuffer;
			},

			"has correct initial size + custom increment amount": function(aStreamBuffer) {
				assert.equal(aStreamBuffer.maxSize(), 321 + 62);
			}
		}
	},

	"When stream is written in two chunks": {
		topic: function() {
			var aStreamBuffer = new streamBuffer.WritableStreamBuffer();
			aStreamBuffer.write(fixtures.simpleString);
			aStreamBuffer.write(fixtures.simpleString);
			return aStreamBuffer;
		},

		"buffer contents are correct": function(aStreamBuffer) {
			assert.equal(aStreamBuffer.getContentsAsString(), fixtures.simpleString + fixtures.simpleString);
		}
	},

	"When stream is *end()*'ed with final buffer": {
		topic: function() {
			var aStreamBuffer = new streamBuffer.WritableStreamBuffer();
			aStreamBuffer.write(fixtures.simpleString);
			aStreamBuffer.end(fixtures.simpleString);
			return aStreamBuffer;
		},

		"buffer contents are correct": function(aStreamBuffer) {
			assert.equal(aStreamBuffer.getContentsAsString(), fixtures.simpleString + fixtures.simpleString);
		}
	}
}).export(module);
