/**
	KeyValueStorage class. Implements an abstract key-value-pair storage.
	@class
	@classdesc This class abstracts localStorage.
*/
function KeyValueStorage ( dbname , sname ) {
	this.dbname = dbname || 'KeyValuePairStorage' ; // Database name
	this.sname = sname || 'kvps' ; // Storage name (not for LocalStorage)
}

/**
	Checks if an item with that key exists
	@param {string} key The key to check.
	@param {function} callback Callback function. Parameter is true if the item exists, false if not.
*/
KeyValueStorage.prototype.hasItem = function ( key , callback ) {
	var me = this ;
	
	if ( undefined === callback ) {
		console.log ( "Missing callback function in KeyValueStorage.getItem for key : " + key ) ;
		return ;
	}

	if ( me.type == 'indexeddb' ) {
		var promise = $.indexedDB(me.dbname).objectStore(me.sname,'readonly').get(key) ;
		promise.fail(function(error, event){ console.log ( "indexedDB : hasItem error " + error + " for " + key ) ; callback ( false ) ; } ) ;
		promise.done(function(result, event){ callback ( undefined !== event.target.result ) ; } ) ;
		return ;
	}

	if ( me.type == 'localstorage' ) {
		callback ( undefined !== localStorage.getItem ( key ) ) ;
		return ;
	}
	
	console.log ( "KeyValueStorage not initialized" ) ;
	callback ( false ) ;
}

/**
	Gets the value for a specific key.
	@param {string} key The key to check.
	@param {function} callback Callback function. Parameter is the stored value, or undefined if no item with that key exists.
*/
KeyValueStorage.prototype.getItem = function ( key , callback ) {
	var me = this ;
	
	if ( undefined === callback ) {
		console.log ( "Missing callback function in KeyValueStorage.getItem for key : " + key ) ;
		return ;
	}

	if ( me.type == 'indexeddb' ) {
		var promise = $.indexedDB(me.dbname).objectStore(me.sname,'readonly').get(key) ;
		promise.fail(function(error, event){ console.log ( "indexedDB : getItem error " + error + " for " + key ) ; callback ( undefined ) ; } ) ;
		promise.done(function(result, event){
			var v = ( undefined === event.target.result ) ? undefined : event.target.result.value ;
			callback ( v ) ;
		} ) ;
		return ;
	}

	if ( me.type == 'localstorage' ) {
		callback ( localStorage.getItem ( key ) ) ;
		return ;
	}

	console.log ( "KeyValueStorage not initialized" ) ;
	callback ( undefined ) ;
}

/**
	Stores a key-value pair.
	@param key {string} The key.
	@param v {string} The value. Must be string to be compatible to LocalStorage. JSON.stringify is your friend.
*/
KeyValueStorage.prototype.setItem = function ( key , v , callback ) {
	var me = this ;

	if ( me.type == 'indexeddb' ) {
	
		$.indexedDB(me.dbname).objectStore(me.sname).put({value:v}, key).then(function(res, e){
			console.log("Added " + key + " to objectStore1");
		}, function(res,e){
			console.log("Could not add data to objectStore");
			console.log(e);
		});
		return ;
	}


	if ( me.type == 'localstorage' ) {
	console.log ( "OH NO! LOCALSTORAGE!" ) ;
		try {
			localStorage.setItem ( key , v ) ;
		} catch ( e ) {
			alert ( 'Local storage quota exceeded. Changes since last page load will not be stored. Sorry about that.' ) ;
			if ( undefined !== callback ) callback ( false ) ;
			return ;
		}
		if ( undefined !== callback ) callback ( true ) ;
		return ;
	}

	console.log ( "KeyValueStorage not initialized" ) ;
	callback ( false ) ;
}

/**
	Removes an item with a specific key.
	@param {string} key The key.
	@param {function} callback Callback function. Parameter is true if removal was successful, false otherwise.
*/
KeyValueStorage.prototype.removeItem = function ( key , callback ) {
	var me = this ;
	
	
	if ( me.type == 'indexeddb' ) {
		var promise = $.indexedDB(me.dbname).objectStore(me.sname,'readwrite').delete(key) ;
		promise.fail(function(error, event){ console.log ( "indexedDB : removeItem error " + error + " for " + key ) ; if(undefined!==callback)callback ( false ) ; } ) ;
		promise.done(function(result, event){ if(undefined!==callback)callback ( true ) ; } ) ;
		return ;
	}

	if ( me.type == 'localstorage' ) {
		localStorage.removeItem ( key ) ;
		if ( undefined !== callback ) callback() ;
		return ;
	}
	
	console.log ( "KeyValueStorage not initialized" ) ;
}

/**
	Checks storage status.
	@return {bool} true if the storage is available and initialized, false otherwise.
*/
KeyValueStorage.prototype.isAvailable = function () {
	return undefined !== me.type ;
}

/**
	@constructor
	@param callback {function} Call that function once a storage was found. Parameter is true if a storage was found, false otherwise.
*/
KeyValueStorage.prototype.initialize = function ( callback ) {
	var me = this ;
	
	// Premium : indexedDB
	var idb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	if ( undefined !== idb ) {
//			var deletePromise = $.indexedDB('GENtle').deleteDatabase(); // HACK FIXME CLEANUP

//			var deletePromise = $.indexedDB(me.dbname).deleteDatabase(); return ;// DELETES THE DB!!!
		me.type = 'indexeddb' ;
		me.indexedDB = {} ;
		me.indexedDB.db = $.indexedDB(me.dbname, {
			"schema": {
				"1": function(versionTransaction){
					var objectStore = versionTransaction.createObjectStore(me.sname);
				},
				"2": function(versionTransaction){
//					$.indexedDB(me.dbname).objectStore(me.sname).put({value:"xx"},'test').then(function(){console.log('ok')},function(){console.log("oh no")});
				}
			}
		}) ;

		me.indexedDB.db.fail(function(db, event){
			console.log ( "indexedDB FAIL" ) ;
			if ( undefined !== callback ) callback(false) ;
		} ) ;

		me.indexedDB.db.done(function(db, event){
			console.log ( "DB open OK" ) ;
			if ( undefined !== callback ) callback(true) ;
		} ) ;	

		return ;
		
	}
	
	// Common : WebDB
	var webdb = window.openDatabase ;
	if ( undefined !== webdb ) {
	}
	
	// LocalStorage (fallback)
	if ( typeof window.localStorage != 'undefined' ) {
		me.type = 'localstorage' ;
		if ( undefined !== callback ) callback(true) ;
	}
	
	if ( undefined !== callback ) callback(false) ;
}