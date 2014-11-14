/*jshint node:true */
"use strict";

var TestQueue = require('test-queue');
var assert = require('assert');
var Promise = require('promise-polyfill');

exports.tests = function(pass,fail) {
	var isTornDown = false;

	new TestQueue()
		.addTest( 'Test that will fail', function(pass,fail) {
			fail();
		} )
		.teardown( function() {
			isTornDown = true;
		} )
		.run()
			.then( 
				function(results) {
					fail( new Error('success function should not have been called') );
				},
				function(results) {
					try {
						assert.equal( isTornDown, true );
						assert.equal( results.passed, 0 );
						assert.equal( results.failed, 1 );
						assert.ok( typeof results.time === 'number' && results.time );
					} catch(e) {
						fail(e);
					}
					pass();
				} 
			);

};