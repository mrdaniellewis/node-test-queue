/**
 *	Test framework tests
 */

var assert = require('assert');

var TestQueue = require('testqueue');

var testQueue = TestQueue.toConsole()
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
							assert.deepEqual( results, { total: 2, passed: 2, failed: 0 } );
						} catch(e) {
							fail(e);
						}
						pass();
					},
					function(results) {
						fail( new Error('failure event should not have been called') );
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
						fail( new Error('success event should not have been called') );
					},
					function(results) {
						try {
							assert.deepEqual( results, { total: 2, passed: 0, failed: 1 } );
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
						fail( new Error('success event should not have been called') );
					},
					function(results) {
						try {
							assert.deepEqual( results, { total: 4, passed: 2, failed: 2 } );
						} catch(e) {
							fail(e);
						}
						pass();
					}
				);

	} )
	.run()
	/*.then( function() {

			return  TestQueue.toConsole( {stopOnFail: false} )
				.addTest( 'Test that will fail', function(pass,fail) {
					fail();
				} )
				.addTest( 'Second test that pass', function(pass,fail) {
					pass();
				} )
				.addTest( 'Second test that will fail', function(pass,fail) {
					fail();
				} )
				.run();
		}
	);*/


	// @todo several tests that will pass and fail - no stop on fail
	/*.on( 'pass', function(name) {
		console.log( 'PASS: ' + name );
	} )
	.on( 'fail', function( name, error ) {
		console.log( 'FAIL: ' + name );
		console.log( error + ': ' + error.stack );
	} )
	.on( 'success', function(results) {
		console.log( 'SUCCESS: ' + results.passed + ' tests passed' );
	} ) */
	


