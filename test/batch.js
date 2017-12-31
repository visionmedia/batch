
var Batch = require('../');
var after = require('after')
var assert = require('assert');

describe('Batch', function(){
  describe('Batch()', function () {
    it('should create Batch instance', function () {
      assert.ok((Batch()) instanceof Batch)
    })
  })

  describe('new Batch()', function () {
    it('should create Batch instance', function () {
      assert.ok((new Batch()) instanceof Batch)
    })
  })

  describe('new Batch(...fns)', function () {
    it('should create Batch instance with fns', function () {
      var batch = new Batch(makeCallback('foo'), makeCallback('bar'))

      assert.ok(batch instanceof Batch)
      assert.equal(batch.fns.length, 2)
    })
  })

  describe('.concurrency(n)', function () {
    describe('by default', function () {
      it('should run all functions at once', function (done) {
        var batch = new Batch()
        var cbs = []
        var next = after(4, function () {
          cbs.splice(0).forEach(function (cb) {
            cb()
          })
        })

        batch.push(function (cb) {
          cbs.push(cb)
          next()
        })

        batch.push(function (cb) {
          cbs.push(cb)
          next()
        })

        batch.push(function (cb) {
          cbs.push(cb)
          next()
        })

        batch.push(function (cb) {
          cbs.push(cb)
          next()
        })

        batch.end(done)
      })
    })

    describe('when 2', function () {
      it('should run only 2 functions in parallel', function (done) {
        var batch = new Batch()
        var cbs = []
        var fn = function () {
          setTimeout(function () {
            next = after(2, fn)
            cbs.splice(0).forEach(function (cb) {
              cb()
            })
          }, 50)
        }
        var next = after(2, fn)

        batch.concurrency(2)

        batch.push(function (cb) {
          cbs.push(cb)
          next()
        })

        batch.push(function (cb) {
          cbs.push(cb)
          next()
        })

        batch.push(function (cb) {
          cbs.push(cb)
          next()
        })

        batch.push(function (cb) {
          cbs.push(cb)
          next()
        })

        batch.end(done)
      })
    })
  })

  describe('#end(cb)', function () {
    var batch;

    beforeEach(function () {
      batch = new Batch()
    })

    describe('when no functions are queued', function(){
      it('should invoke the callback', function(done){
        batch.end(done);
      })
    })

    it('construct an array of results in order', function(done){
      batch.push(function(fn){
        setTimeout(function(){
          fn(null, 'foo');
        }, 100);
      });

      batch.push(function(fn){
        setTimeout(function(){
          fn(null, 'bar');
        }, 50);
      });

      batch.end(function (err, results) {
        if (err) return done(err);
        assert.deepEqual(results, ['foo', 'bar'])
        done();
      })
    })

    describe('when several functions are queued', function(){
      it('should invoke the callback', function(done){
        batch.push(function(fn){
          process.nextTick(fn);
        })

        batch.push(function(fn){
          process.nextTick(fn);
        })

        batch.end(done);
      })
    })

    describe('when no callback given', function () {
      it('should still process functions', function (done) {
        var cb = after(2, done)

        batch.push(makeCallback('foo'))
        batch.push(makeCallback('bar'))

        batch.on('progress', function (e) {
          cb()
        })

        batch.end()
      })
    })

    describe('when a queued function is completed', function(){
      it('should emit "progress" events', function(done){
        var cb = after(4, done)

        batch.push(function(fn){
          fn(null, 'foo');
        });

        batch.push(function(fn){
          fn(null, 'bar');
        });

        batch.push(function(fn){
          fn(null, 'baz');
        });

        batch.on('progress', function(e){
          switch (e.index) {
            case 0:
              assert.equal(e.value, 'foo')
              assert.equal(e.total, 3)
              assert.equal(typeof e.percent, 'number')
              assert.equal(typeof e.complete, 'number')
              assert.equal(typeof e.pending, 'number')
              assert.equal(typeof e.duration, 'number')
              break;
            case 1:
              assert.equal(e.value, 'bar')
              assert.equal(e.total, 3)
              assert.equal(typeof e.percent, 'number')
              break;
            case 2:
              assert.equal(e.value, 'baz')
              assert.equal(e.total, 3)
              assert.equal(typeof e.percent, 'number')
              break;
          }

          cb()
        })

        batch.end(cb)
      })
    })

    describe('when several errors occur', function(){
      it('should invoke the callback with the first error', function(done){
        batch.push(function(fn){
          fn(new Error('fail one'));
        })

        batch.push(function(fn){
          fn(new Error('fail two'));
        })

        batch.end(function(err){
          assert.equal(err.message, 'fail one')
          done();
        });
      })
    })

    describe('when error is thrown', function () {
      it('should invoke the callback with the error', function (done) {
        batch.push(function () {
          throw new Error('fail one')
        })

        batch.end(function (err) {
          assert.equal(err.message, 'fail one')
          done()
        })
      })
    })

    describe('when .throws(false) is in effect', function(){
      it('errors should pile up', function(done){
        batch.push(function(fn){
          fn(null, 'foo');
        });

        batch.push(function(fn){
          fn(new Error('fail one'));
        });

        batch.push(function(fn){
          fn(null, 'bar');
        });

        batch.push(function(fn){
          fn(new Error('fail two'));
        });

        batch.push(function(fn){
          fn(null, 'baz');
        });

        batch.throws(false);

        batch.end(function (err, results) {
          assert.ok(Array.isArray(err), 'err is an array')
          assert(null == err[0]);
          assert('fail one' == err[1].message);
          assert(null == err[2]);
          assert('fail two' == err[3].message);
          assert.deepEqual(results, ['foo', undefined, 'bar', undefined, 'baz'])
          done();
        });
      })
    })
  })
})

function makeCallback (value) {
  return function (cb) {
    cb(null, value)
  }
}
