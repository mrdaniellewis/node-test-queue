/*jshint node:true */
"use strict";

var TestQueue = require('test-queue');

var testQueue1 = new TestQueue()
	.addTest( 'sub test 1', function( pass, fail ) {
		pass();
	} )
	.addTest( 'sub test 2', function( pass, fail ) {
		pass();
	} );

var testQueue2 = new TestQueue()
	.addTest( 'sub test 3', function( pass, fail ) {
		pass();
	} )
	.addTest( 'sub test 4', function( pass, fail ) {
		pass();
	} );

testQueue1.addTest( 'sub sub test queue', testQueue2 );

exports.tests = testQueue1;