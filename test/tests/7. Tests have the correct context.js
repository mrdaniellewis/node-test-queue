/*jshint node:true */
"use strict";

var TestQueue = require('test-queue');
var assert = require('assert');

var testQueue = new TestQueue()
	.addTest( 'Tests have correct context', function(pass,fail) {
		
		var testQueue = new TestQueue();
		testQueue.foo = 'bar';
		testQueue.addTest( 
			'Tests have correct context', 
			function(pass,fail) {
				assert.equal( this.foo, 'bar' );
				pass();
			}
		);
		testQueue.run().then( pass, fail );
	} )
	.addTest( 'setup has correct context', function(pass,fail) {
		
		var testQueue = new TestQueue();
		testQueue.foo = 'bar';
		testQueue.setup = function() {
			assert.equal( this.foo, 'bar' );
		};
		testQueue.run().then( pass, fail );
	} )
	.addTest( 'teardown has correct context', function(pass,fail) {

		var testQueue = new TestQueue();
		testQueue.foo = 'bar';
		testQueue.teardown = function() {
			assert.equal( this.foo, 'bar' );
		};
		testQueue.run().then( pass, fail );		
	} );


exports.tests = testQueue;