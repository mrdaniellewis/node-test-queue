/* jshint node:true */
"use strict";

/**
 *	Simple test framework
 */
var events = require('events');
var util = require('util');
var Promise = require('promise-polyfill');
var style = require('console-style');
var fs = require('fs');
var path = require('path');

function TestQueue(options) {
	
	options = options || {};

	events.EventEmitter.call(this);
	
	this.stopOnFail = options.stopOnFail !== false;
	this.setupFn = function(){};
	this.teardownFn = function(){};

	this.tests = [];
}

util.inherits( TestQueue, events.EventEmitter );

/**
 *	Adds a tests
 */
TestQueue.prototype.addTest = function( name, fn ) {
	this.tests.push( { name: name, fn: fn } );
	return this;
};

/**
 *	Adds a setup function
 */
TestQueue.prototype.setup = function( fn ) {
	this.setupFn = fn;
	return this;
};

/**
 *	Adds a teardown function
 */
TestQueue.prototype.teardown = function( fn ) {
	this.teardownFn = fn;
	return this;
};

/**
 *	Run the tests
 */
TestQueue.prototype.run = function() {
	
	this._start = process.hrtime();

	this._testQueueCursor = 0;
	this.passed = 0;
	this.failed = 0;

	var ret = new Promise( function(pass,fail) {
			this._testQueuePass = pass;
			this._testQueueFail = fail;
		}.bind(this) );

	this.emit( 'start' );

	Promise.resolve(this.setupFn())
		.then( function() {
			
		}.bind(this) )
		.then( this._testQueueNext.bind(this) );

	return ret;

};

TestQueue.prototype._testQueueNext = function() {

	if ( this._testQueueCursor === this.tests.length ) {
		this._onFinish();
		return;
	}

	var test = this.tests[this._testQueueCursor];

	if ( test.fn instanceof TestQueue ) {
		
		test.fn.on( 'pass', this.emit.bind( this, 'pass') );
		test.fn.on( 'fail', this.emit.bind( this, 'fail') );
		test.fn.on( 'info', this.emit.bind( this, 'info') );
		test.fn.on( 'start', function(name) {
			this.emit( 'start', name || test.name );
		}.bind(this) );
		test.fn.on( 'finish', function(results) {
			this.emit( 'finish', results, test.name );
		}.bind(this) );

		test.fn.run()
			.then( 
				this._onPassQueue.bind(this, test.name), 
				this._onErrorQueue.bind(this, test.name) 
			);

	} else {
		new Promise( test.fn.bind(this) )
			.then( 
				this._onPass.bind(this, test.name), 
				this._onError.bind(this, test.name) 
			);
	}	

	++this._testQueueCursor;
};

TestQueue.prototype._onPassQueue = function( name, results ) {
	this.passed += results.passed;
	this._testQueueNext();
};


TestQueue.prototype._onPass = function( name, value ) {
	++this.passed;
	this.emit( 'pass', name, value );
	this._testQueueNext();
};

TestQueue.prototype._onErrorQueue = function( name, results ) {
	
	console.log( name, results ); 

	this.failed += results.failed;
	this.passed += results.passed;

	if ( this.stopOnFail ) {
		this._onFinish();
		return;
	}

	this._testQueueNext();
};

TestQueue.prototype._onError = function(name, e) {

	++this.failed;
	this.emit( 'fail', name, e );

	if ( this.stopOnFail ) {
		this._onFinish();
		return;
	}

	this._testQueueNext();
};

TestQueue.prototype._onFinish = function() {

	Promise.resolve(this.teardownFn())
		.then( function() {
			var time = process.hrtime(this._start);

			var results = {
				passed: this.passed,
				failed: this.failed,
				time: time[0] * 1000 + time[1]/1e6
			};

			this.emit( 'finish', results );

			if ( this.failed > 0 ) {
				this._testQueueFail(results);
			} else {
				this._testQueuePass(results);
			}

		}.bind(this) );

};

module.exports = TestQueue;

/**
 *	Modify an existing test queue so it outputs to the console
 *	using some pretty colours
 */
TestQueue.toConsole = function(testQueue) {

	var indent = '';

	testQueue
		.on( 'pass', function(name) {
			console.log( style.green( indent + 'Pass: ' + name ) );
		} )
		.on( 'fail', function(name,e) {
			console.error( style.red( indent + 'Fail: ' + name ) );
			if ( e instanceof Error ) {
				console.error( style.bold.redBG( e.message ) );
				console.error( e.stack );
			}
			
		} )
		.on( 'start', function(name) {
			console.log( indent + 'Start', name || '' );
			indent += '  ';
		} )
		.on( 'finish', function(results, name) {	
			indent = indent.slice(0,-2);
		} )
		.on( 'info', function() {	
			console.log( indent + util.inspect.apply(util, arguments) );
		} );


	testQueue.run = function() {
		
		return TestQueue.prototype.run.call(this)
			.then( 
				function(results) {
					console.log( 
						style.black.greenBG( 
							'Success: all ' + results.passed + ' tests passed  (' + results.time + ' ms)'
						) 
					);
				},
				function(results) {
					var total = results.failed + results.passed;
					console.error( 
						style.bold.redBG( 
							'Failure: ' 
								+ total + ' test' + (total === 1 ? '' : 's' )
								+ ' ran and ' + results.passed + ' test'+ ( results.passed === 1 ? '' : 's' )
								+ ' passed and ' + results.failed + ' test' + ( results.failed === 1 ? '' : 's' )
								+ ' failed (' + results.time + ' ms)'
						) 
					);
				}
			);
	};

	return testQueue;
};

/**
 *	Tests all tests in a directory
 *	Each file in the directory should return a test
 *	@param {String} dir Full path to the directory
 */
TestQueue.testDirectory = function( dir, options ) {
	options = options || {};
	options.stripNumber = options.stripNumber === undefined ? true : options.stripNumber;

	var testQueue = new TestQueue();
	var files = fs.readdirSync(dir);
	files.forEach( function(name) {
		var extension = path.extname(name);
		if ( /^\.(?:js|node)$/.test( extension ) ) {
			var module = require( path.resolve( dir, name ) );
			var tests = module.tests;
			if ( !tests || ( typeof tests != 'function' && !(tests instanceof TestQueue) ) ) {
				console.warn( 'module', path.resolve( dir, name ), 'does not contain any tests' );
				return;
			}
			var testName = name.slice(0,-extension.length);
			if ( options.stripNumber ) {
				testName = testName.replace( /^\d+\. /, '' );
			}
			testQueue.addTest( 
				testName, 
				tests
			);
		}
	} );

	return testQueue;

};

