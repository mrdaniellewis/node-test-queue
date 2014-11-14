/*jshint node:true */
"use strict";

var TestQueue = require('test-queue');
var assert = require('assert');
var Promise = require('promise-polyfill');

exports.tests = new TestQueue()
	.addTest( 'Returning true return passes', function() {
		return true;
	} )
	.addTest( 'Returning something truthy passes', function() {
		return {};
	} )
	.addTest( 'Returning a promise passes', function() {
		return Promise.resolve(true);
	} )
	.addTest( 'Returning an error object fails', function() {

		return new TestQueue()
			.addTest( 'return error', function() {
				return new Error('fail');
			} )
			.run()
			.then( 
				function() {
					throw new Error('Should not have passed');
				},
				function(e) {
					return true;
				} 
			);
	} )
	.addTest( 'Returning a rejected promise fails', function() {

		return new TestQueue()
			.addTest( 'return error', function() {
				return Promise.reject(true);
			} )
			.run()
			.then( 
				function() {
					throw new Error('Should not have passed');
				},
				function(e) {
					return true;
				} 
			);
	} )
	.addTest( 'Throwing an error fails', function() {

		return new TestQueue()
			.addTest( 'return error', function() {
				throw 'error';
			} )
			.run()
			.then( 
				function() {
					throw new Error('Should not have passed');
				},
				function(e) {
					return true;
				} 
			);
	} );



	// Throw an error

	
	