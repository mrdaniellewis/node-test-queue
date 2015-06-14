/*jshint node:true */
"use strict";

var TestQueue = require('../');
var assert = require('assert');

exports.tests = function(pass,fail) { 

	var progress = 0;

	new TestQueue( { stopOnFail: false })
		.addTest( 'Test that will fail', function(pass,fail) {
			progress = 1;
			fail( 'Deliberate fail' );
		} )
		.addTest( 'Test that will pass', function(pass,fail) {
			progress = 2;
			pass();
		} )
		.addTest( 'Test that will pass', function(pass,fail) {
			progress = 3;
			fail( 'Deliberate fail' );
		} )
		.addTest( 'Test that will pass', function(pass,fail) {
			progress = 4;
			pass();
		} )
		.on( 'pass', function(name) {
			if ( progress !== 2 && progress !== 4 ) {
				fail( new Error('pass event called incorrectly') );
			}
		} )
		.on( 'fail', function(name,e) {
			if ( progress !== 1 && progress !== 3 ) {
				fail( new Error('pass event called incorrectly') );
			}
		} )
		.run()
			.then(
				function(results) {
					fail( new Error('success function should not have been called') );
				},
				function(results) {
					try {
						assert.equal( results.passed, 2 );
						assert.equal( results.failed, 2 );
						assert.ok( typeof results.time === 'number' && results.time );
					} catch(e) {
						fail(e);
					}
					pass();
				}
			);

};