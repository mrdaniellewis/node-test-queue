/*jshint node:true */
"use strict";

var path = require('path');
var TestQueue = require('test-queue');

var tests = TestQueue.testDirectory( __dirname );
TestQueue.toConsole(tests)
	.run()
		.catch( function() {
			process.exit(1);
		} );
