/*jshint node:true */
"use strict";

var TestQueue = require('test-queue');
var assert = require('assert');

exports.tests = function(pass,fail) { 
	
	var isSetup = false;
	var isTornDown = false;

	var testQueue = new TestQueue()
		.addTest( 'Test that will pass', function(pass) {
			pass();
		} )
		.setup( function() {
			isSetup = true;
			
		} )
		.teardown( function() {
			isTornDown = true;
		} )
		.on( 'pass', function(name) {
			try {
				assert.equal( isSetup, true );
			} catch(e) {
				fail(e);
			}	
		} )
		.on( 'fail', function(name,e){
			fail(e);	
		} )
		.run()
			.then(
				function(results) {

					try {
						assert.equal( isTornDown, true );
						assert.equal( results.passed, 1 );
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