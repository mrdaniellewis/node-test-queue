/**
 *	Test framework tests
 */

var assert = require('assert');

var TestQueue = require('test-queue');

if ( typeof Promise === 'undefined' ) {
	var Promise = require('promise-polyfill');
}

var quiet = process.argv.slice(-2).some( function(arg) {
	return arg === '-q' || arg === '--quiet';
} );

var testQueue = new TestQueue()
	.addTest( '2 tests that will pass', function(pass,fail) { 

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
			
	} )
	.addTest( 'Test that fails - stop on fail', function(pass,fail) { 

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
	} )
	.addTest( 'Test that fails - no stop on fail', function(pass,fail) { 

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

	} )
	.addTest( 'Test with setup and teardown', function(pass,fail) { 
	
		var isSetup = false;
		var isTornDown = false;

		new TestQueue()
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

	} )
	.addTest( 'Test with setup and teardown as promises', function(pass,fail) { 

		var isSetup = false;
		var isTornDown = false;

		new TestQueue()
			.addTest( 'Test that will pass', function(pass) {
				pass();
			} )
			.setup( function() {
				return new Promise( function(resolve) {
					setTimeout( function() {
						isSetup = true;
						resolve();
					}, 500 );
				} );
			} )
			.teardown( function() {
				return new Promise( function(resolve) {
					setTimeout( function() {
						isTornDown = true;
						resolve();
					}, 500 );
				} );
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

	} )
	.addTest( 'Teardown always runs', function(pass,fail) {
		var isTornDown = false;

		new TestQueue()
			.addTest( 'Test that will fail', function(pass,fail) {
				fail();
			} )
			.teardown( function() {
				isTornDown = true;
			} )
			.run()
				.then( 
					function(results) {
						fail( new Error('success function should not have been called') );
					},
					function(results) {
						try {
							assert.equal( isTornDown, true );
							assert.equal( results.passed, 0 );
							assert.equal( results.failed, 1 );
							assert.ok( typeof results.time === 'number' && results.time );
						} catch(e) {
							fail(e);
						}
						pass();
					} 
				);

	} )
	.addTest( 'Tests have correct context', function(pass,fail) {
		
		var testQueue = new TestQueue();
		testQueue.foo = 'bar';
		testQueue.addTest( 
			'Tests have correct context', 
			function(pass,fail) {
				assert.equal( this.foo, 'bar' );
				pass();
			}
		);
		testQueue.run().then( pass, fail );
	} )
	.addTest( 'setup has correct context', function(pass,fail) {
		
		var testQueue = new TestQueue();
		testQueue.foo = 'bar';
		testQueue.setup = function() {
			assert.equal( this.foo, 'bar' );
		};
		testQueue.run().then( pass, fail );
	} )
	.addTest( 'teardown has correct context', function(pass,fail) {

		var testQueue = new TestQueue();
		testQueue.foo = 'bar';
		testQueue.teardown = function() {
			assert.equal( this.foo, 'bar' );
		};
		testQueue.run().then( pass, fail );		
	} );

var testQueue2 = new TestQueue()
	.addTest( 'sub test 1', function( pass, fail ) {
		pass();
	} )
	.addTest( 'sub test 2', function( pass, fail ) {
		pass();
	} );

var testQueue3 = new TestQueue()
	.addTest( 'sub test 3', function( pass, fail ) {
		pass();
	} )
	.addTest( 'sub test 4', function( pass, fail ) {
		pass();
	} );

testQueue2.addTest( 'sub sub test queue', testQueue3 );


testQueue.addTest( 'Sub test queue', testQueue2 );

TestQueue.toConsole( testQueue ).run()
	.catch( function() {
		process.exit(1);
	} );
	
	


