# Test queue

Simple test framework that allows you to queue up a sequence async of tests.

## Usage

```javascript
var TestQueue = require('testqueue');

new TestQueue()
	.addTest( function( pass, fail ) {
		// Async task
	} )
	.addTest( function( pass, fail ) {
		// Async task
	} )
	.on( 'pass', function(name) {
		console.log( name, ' has passed' );
	} )
	.on( 'fail', function(name) {
		console.log( name, ' has failed' );
	} )
	.run()
		.then( 
			function(stats) {
				console.log( 'All tests passed')
			},
			function(stats) {
				console.log( 'Some tests did\'t pass ');
			}
		);
```

### Constructor

```javascript
var testQueue = new TestQueue(options) 
```

`options.stopOnFail` - Boolean, optional, default = `true`.  Stop running tests if a test fails.

testQueue is an event emitter.

### Events

`pass` A test has passed.  The name of the test is passed as the first argument

`fail` A test has failed.  The name of the test is passed as the first argument and the error message as the second.

### Methods

```javascript
testQueue.addTest( name, function(pass,fail){} )
```

`name` - String - The name of the test

`function(pass,fail){}` - Function - The test.  Use the callbacks pass and fail to return the outcome of the test.  Pass an error to fail.

If the function throws an uncaught error this will be caught and the test will be failed.

Returns `testQueue`.

```javascript
testQueue.run()
```

Run the queued tests.

Returns a promise.

The promise will resolve or reject with a object with the properties

* `total`: total number of tests
* `passed`: number of tests passed
* `failed`: number of tests failed

### Static methods

```javascript
TestQueue.toConsole(options)
```

Returns an instance of TestQueue with events and returned promise setup to output messages to the console.



