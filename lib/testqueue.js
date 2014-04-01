/**
 *	Simple test framework
 */
var events = require('events');
var util = require('util');

if ( typeof Promise === 'undefined' ) {
	var Promise = require('promise');
}
var style = require('styleconsole');

function TestQueue(options) {
	
	options = options || {};

	events.EventEmitter.call(this);
	
	this.stopOnFail = options.stopOnFail !== false;

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
 *	Run the tests
 */
TestQueue.prototype.run = function() {
	
	this._testQueueCursor = 0;
	this.passed = 0;
	this.failed = 0;

	var ret = new Promise( function(pass,fail) {
		this._testQueuePass = pass;
		this._testQueueFail = fail;
	}.bind(this) );

	this._testQueueNext();

	return ret;

};

TestQueue.prototype._testQueueNext = function() {

	if ( this._testQueueCursor === this.tests.length ) {
		this._onFinish();
		return;
	}

	var test = this.tests[this._testQueueCursor];

	new Promise( test.fn )
		.then( this._onPass.bind(this, test.name), this._onError.bind(this, test.name) );

	++this._testQueueCursor;
};

TestQueue.prototype._onPass = function( name, value ) {
	
	++this.passed;
	this.emit( 'pass', name, value );
	this._testQueueNext();
};

TestQueue.prototype._onError = function(name, e) {


	++this.failed;
	this.emit( 'fail', name, e );

	if ( this.stopOnFail ) {
		this._onFinish();
	}

	this._testQueueNext();
};

TestQueue.prototype._onFinish = function() {

	var results = {
		total: this.tests.length,
		passed: this.passed,
		failed: this.failed,
	};

	if ( this.failed > 0 ) {
		this._testQueueFail(results);
	} else {
		this._testQueuePass(results);
	}

};

module.exports = TestQueue;

// *** Colourised console output ***

TestQueue.toConsole = function(options) {

	var testQueue = new TestQueue(options);
	testQueue
		.on( 'pass', function(name) {
			console.log( style.green( 'Pass: ' + name ) );
		} )
		.on( 'fail', function(name,e) {
			console.log( style.red( 'Fail: ' + name ) );
			console.log( style.bold.redBG( e.message ) );
			console.log( e.stack );
		} );

	testQueue.run = function() {

		return TestQueue.prototype.run.call(this)
			.then( 
				function(results) {
					console.log( 
						style.black.greenBG( 
							'Success: all ' + results.passed + ' tests passed '
						) 
					);
				},
				function(results) {
					var total = results.failed + results.passed;
					console.log( 
						style.bold.redBG( 
							'Failure: ' 
								+ total + ' of ' + results.total + ' test' + ( results.total === 1 ? '' : 's' )
								+ ' ran and ' + results.failed + ' test' + ( results.failed === 1 ? '' : 's' )
								+ ' failed '
						) 
					);
				}
			);
	};

	return testQueue;
};

