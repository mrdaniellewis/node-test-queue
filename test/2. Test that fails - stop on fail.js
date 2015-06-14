/*jshint node:true */
"use strict";

var TestQueue = require('../');
var assert = require('assert');

exports.tests = function(pass,fail) { 

	new TestQueue()
		.addTest( 'Test that will fail', function(pass,fail) {
			fail( 'Deliberate fail' );
		} )
		.addTest( 'Test that will not be run', function(pass,fail) {
			fail( 'Unreachable' );
		} )
		.on( 'pass', function(name) {
			fail( new Error('pass event should not have been called') );
		} )
		.on( 'fail', function(name,e) {
			try {
				assert.equal( 'Test that will fail', name );
				assert.equal( 'Deliberate fail', e );
			} catch(e2) {
				fail(e2);
			}
		} )
		.run()
			.then(
				function(results) {
					fail( new Error('success function should not have been called') );
				},
				function(results) {
					try {
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