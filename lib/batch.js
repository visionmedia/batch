
/**
 * Expose `Batch`.
 */

module.exports = Batch;

/**
 * Create a new Batch.
 */

function Batch() {
  this.fns = [];
  this.notifyCb = null;
  for (var i = 0, len = arguments.length; i < len; ++i) {
    this.push(arguments[i]);
  }
}

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
 * Notifies as soon as a job in batch 
 * finishes `cb(index, result)`.
 *
 * @param {Function} cb
 * @return {Batch}
 * @api public
 */

Batch.prototype.notify = function(cb){
    this.notifyCb = cb;
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
  var pending = this.fns.length
    , results = []
    , done
    , notifyCb = this.notifyCb;

  if (!this.fns.length) return cb(null, results);

  this.fns.forEach(function(fn, index){
    fn(function(err, res){
      if (done) return;
      if (err) return done = true, cb(err);
      
      results[index] = res;
      notifyCb && notifyCb(index, res);
      --pending || cb(null, results);
    });
  });

  return this;
};