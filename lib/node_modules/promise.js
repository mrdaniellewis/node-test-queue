/**
 *	ES6 Promise polyfill
 *	See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */

var PromisePolyfill;

function isThenable(value) {
	return value && typeof value.then === 'function';
}

if ( typeof Promise !== 'undefined' ) {
	
	// If we have the real one then use it	- although it would be best to check before require
	PromisePolyfill = Promise;
	console.warn('Promise polyfill is no longer required');

} else {
	
	PromisePolyfill = function(handler) {

		if ( typeof handler !== 'function'  ) {
			throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
		}

		Object.defineProperties( this, {

			_promiseResolveActions: {
				value: [],
				writable: false
			},

			_promiseRejectActions: {
				value: [],
				writable: false
			}

		} );

		var that = this;

		function resolve(value) {
			
			if ( that._promiseStatus === 'unresolved' ) {

				if ( isThenable(value) ) { 
					that._promiseStatus = 'indeterminate';
					value.then(runResolutionActions,runRejectionActions);
				} else {
					runResolutionActions(value);
				}
			}
			
		}

		function runResolutionActions(value) {
			that._promiseStatus = 'has-resolution';
			that._promiseResult = value;
			process.nextTick( function() {
				for ( var i = 0, j = that._promiseResolveActions.length; i < j; ++i ) {
					that._promiseResolveActions[i](value);
				}
			} );
		}

		function reject(value) {	
			if ( that._promiseStatus === 'unresolved' ) {
				runRejectionActions(value);
			}
		}

		function runRejectionActions(value) {
			that._promiseStatus = 'has-rejection';
			that._promiseResult = value;
			process.nextTick( function runRejected() {
				for ( var i = 0, j = that._promiseRejectActions.length; i < j; ++i ) {
					that._promiseRejectActions[i](value);
				}
			} );
		}


		try {
			handler( resolve, reject );
		} catch(e) {
			reject(e);
		}
	};

	PromisePolyfill.prototype.then = function( onFulfilled, onRejected ) {

		var resolveProxy, rejectProxy;
		var promise = new PromisePolyfill( function( resolve, reject ) {

			resolveProxy = function(value) {

				if ( typeof onFulfilled !== 'function' ) {
					resolve(value);
					return;
				}

				try {
					value = onFulfilled(value);
				} catch(e) {
					reject(e);
					return;
				}

				if ( isThenable(value) ) {
					value.then(resolve,reject);
				} else {
					resolve(value);
				}
	
			};

			rejectProxy = function(value) {

				if ( typeof onRejected !== 'function' ) {
					reject(value);
					return;
				}

				try {
					value = onRejected(value);
				} catch(e) {
					reject(e);
					return;
				}

				if ( isThenable(value) ) {
					PromisePolyfill.resolve(value).then(resolve,reject);
				} else {
					resolve(value);
				}

			};

		} );

		if ( this._promiseStatus === 'has-resolution' ) {
			process.nextTick( resolveProxy.bind( null, this._promiseResult) );
		} else if ( this._promiseStatus !== 'has-rejection' ) {
			this._promiseResolveActions.push(resolveProxy);
		}
		
		if ( this._promiseStatus === 'has-rejection' ) {
			process.nextTick( rejectProxy.bind( null, this._promiseResult) );
		} else if (  this._promiseStatus !== 'has-resolution' ) {
			this._promiseRejectActions.push(rejectProxy);
		}

		return promise;

	};

	PromisePolyfill.prototype.catch = function(onRejected) {
		return this.then( undefined, onRejected );
	};

	Object.defineProperties( PromisePolyfill.prototype, {

		/**
		 *	unresolved - not yet resolved
		 *	indeterminate - following a thenable.  Still accepting handlers, but not a new resolution
		 *	has-resolution
		 *	has-rejection
		 */
		_promiseStatus: {
			value: 'unresolved',
			writable: true
		},

		_promiseResult: {
			writable: true
		}

	} );

	PromisePolyfill.resolve = function(value) {

		if ( value && value.constructor === PromisePolyfill ) {
			return value;
		}

		if ( isThenable(value) ) {
			return new PromisePolyfill( function(resolve,reject) {
				value.then(resolve,reject);
			} );
		}

		return new PromisePolyfill( function(resolve) {
			resolve(value);
		} );

	};

	PromisePolyfill.reject = function(reason) {

		return new PromisePolyfill( function(resolve,reject) {
			reject(reason);
		} );

	};

	PromisePolyfill.all = function(iterable) {
		if ( !arguments.length ) {
			throw new TypeError('Not enough arguments to Promise.all.');
		}

		// It's not clear what the definition of a sequence is.  Anything that is an object seems to be acceptable.
		if ( !iterable || typeof iterable !== 'object' ) {
			throw new TypeError("Argument 1 of Promise.all can't be converted to a sequence.");
		}

		var resolveProxy, rejectProxy;
		var resolvedCountdown = iterable.length || 0;
		var results = [];
		var done = Array(resolvedCountdown);
		promise = new PromisePolyfill( function( resolve, reject ) {
			resolveProxy = function( index, value ) {

				if ( index >= 0 && !done[index] ) {
					done[index] = true;
					results[index] = value;
					--resolvedCountdown;
				}

				if ( resolvedCountdown === 0 ) {
					resolve(results);
				}
	
			};
			rejectProxy = function(value) {
				reject(value);
			};
		} );

		if ( resolvedCountdown === 0 ) {
			resolveProxy();
		}
		
		// It is has a length property iterate
		for ( var i = 0, j = iterable.length || 0; i<j; ++i ) {
			PromisePolyfill.resolve( iterable[i] ).then( 
				resolveProxy.bind( null, i ),
				rejectProxy
			);
		}

		return promise;


	};

	PromisePolyfill.race = function(iterable) {
		if ( !arguments.length ) {
			throw new TypeError('Not enough arguments to Promise.race.');
		}

		if ( !iterable || typeof iterable !== 'object' ) {
			throw new TypeError("Argument 1 of Promise.race can't be converted to a sequence.");
		}
		
		var resolveProxy, rejectProxy;
		var promise = new PromisePolyfill( function( resolve, reject ) {
			resolveProxy = function(value) {
				resolve(value);
			};
			rejectProxy = function(value) {
				reject(value);
			};
		} );
	
		for ( var i = 0, j = iterable.length || 0; i<j; ++i ) {
			PromisePolyfill.resolve( iterable[i] ).then( 
				resolveProxy,
				rejectProxy
			);
		}

		return promise;
	};

}

module.exports = PromisePolyfill;