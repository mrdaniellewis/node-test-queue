/*jshint node:true */
"use strict";

var TestQueue = require('test-queue');
var assert = require('assert');

exports.tests = function(pass,fail) { 
	new TestQueue()
		.addTest( 'Test that will pass', function(pass) {
			pass();
		} )
		.addTest( 'Test that will pass', function(pass) {
			pass();
		} )
		.on( 'pass', function(name) {
			try {
				assert.equal( 'Test that will pass', name );
			} catch(e) {
				fail(e);
			}	
		} )
		.on( 'fail', function(name,e){
			fail(e);	
		})
		.run()
			.then(
				function(results) {

					try {
						assert.equal( results.passed, 2 );
						assert.equal( results.failed, 0 );
						assert.ok( typeof results.time === 'number' && results.time );
					} catch(e) {
						fail(e);
					}
					pass();
				},
				function(results) {
					fail( new Error('failure function should not have been called') );
				}
			);	
};