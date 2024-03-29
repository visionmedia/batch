/*!
 * batch
 * Copyright(c) 2013-2015 TJ Holowaychuk
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 */

try {
  var EventEmitter = require('events').EventEmitter;
  if (!EventEmitter) throw new Error();
} catch (err) {
  try {
    var Emitter = require('emitter')
  } catch (err) {
    throw err
  }
}

/**
 * Defer.
 */

var defer = typeof process !== 'undefined' && process && typeof process.nextTick === 'function'
  ? process.nextTick
  : function(fn){ setTimeout(fn); };

/**
 * Expose `Batch`.
 */

module.exports = Batch;

/**
 * Create a new Batch.
 */

function Batch (options) {
  var args = new Array(arguments.length)
  for (var i = 0; i < arguments.length; i++) {
    args[i] = arguments[i]
  }

  if (!(this instanceof Batch)) {
    return new (Batch.bind.apply(Batch, [null].concat(args)))()
  }

  var opts = {}

  if (args.length > 0 && typeof options !== 'function') {
    opts = args.shift() || {}
  }

  this.fns = [];
  this.concurrency(opts.concurrency || Infinity)
  this.throws(opts.throws === undefined ? true : opts.throws)

  for (i = 0; i < args.length; i++) {
    this.push(args[i])
  }
}

/**
 * Inherit from `EventEmitter.prototype`.
 */

if (EventEmitter) {
  Batch.prototype.__proto__ = EventEmitter.prototype;
} else {
  Emitter(Batch.prototype);
}

/**
 * Set concurrency to `n`.
 *
 * @param {Number} n
 * @return {Batch}
 * @api public
 */

Batch.prototype.concurrency = function(n){
  this.n = n;
  return this;
};

/**
 * Queue a function.
 *
 * @param {Function} fn
 * @return {Batch}
 * @api public
 */

Batch.prototype.push = function(fn){
  this.fns.push(fn);
  return this;
};

/**
 * Set wether Batch will or will not throw up.
 *
 * @param  {Boolean} throws
 * @return {Batch}
 * @api public
 */
Batch.prototype.throws = function(throws) {
  this.e = !!throws;
  return this;
};

/**
 * Execute all queued functions in parallel,
 * executing `cb(err, results)`.
 *
 * @param {Function} cb
 * @return {Batch}
 * @api public
 */

Batch.prototype.end = function(cb){
  var self = this
    , total = this.fns.length
    , pending = total
    , results = []
    , errors = []
    , fns = this.fns
    , max = this.n
    , throws = this.e
    , index = 0
    , done;

  // empty
  if (!fns.length) {
    if (cb) defer(function () { cb(null, results) })
    return
  }

  // process
  function next() {
    var i = index++;
    var fn = fns[i];
    if (!fn) return;
    var start = new Date;

    try {
      fn(callback);
    } catch (err) {
      callback(err);
    }

    function callback(err, res){
      if (done) return;

      if (err && throws) {
        done = true
        if (cb) defer(function () { cb(err) })
        return
      }

      var complete = total - pending + 1;
      var end = new Date;

      results[i] = res;
      errors[i] = err;

      self.emit('progress', {
        index: i,
        value: res,
        error: err,
        pending: pending,
        total: total,
        complete: complete,
        percent: complete / total * 100 | 0,
        start: start,
        end: end,
        duration: end - start
      });

      if (--pending) next();
      else if (cb) {
        defer(function () {
          if (!throws) cb(errors, results)
          else cb(null, results)
        })
      }
    }
  }

  // concurrency
  for (var i = 0; i < fns.length; i++) {
    if (i == max) break;
    next();
  }

  return this;
};
