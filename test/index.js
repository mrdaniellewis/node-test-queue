/*jshint node:true */
"use strict";

var path = require('path');
var TestQueue = require('test-queue');

var tests = TestQueue.testDirectory( path.resolve( __dirname, 'tests' ) );
TestQueue.toConsole(tests)
	.run()
		.catch( function() {
			process.exit(1);
		} );
