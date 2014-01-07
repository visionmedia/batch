
var Batch = require('../');
var assert = require('assert');

describe('Batch', function(){
  var batch;

  beforeEach(function(){
    batch = new Batch;
  })

  describe('#end(callback)', function(){
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

      batch.end(function(err, res){
        if (err) return done(err);
        res.should.eql(['foo', 'bar']);
        done();
      })
    })

    it('passes arguments to the queued functions', function(done) {
      batch.push('a', 'b', function(a, b, fn) {
        a.should.eql('a');
        b.should.eql('b');
        fn();
      });
      batch.end(done);
    });

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

    describe('when a queued function is completed', function(){
      it('should emit "progress" events', function(done){

        batch.push(function(fn){
          fn(null, 'foo');
        });

        batch.push(function(fn){
          fn(null, 'bar');
        });

        batch.push(function(fn){
          fn(null, 'baz');
        });

        var pending = 3;
        batch.on('progress', function(e){
          switch (e.index) {
            case 0:
              e.value.should.equal('foo');
              e.percent.should.be.a.Number;
              e.total.should.be.a.Number;
              e.complete.should.be.a.Number;
              e.pending.should.be.a.Number;
              e.duration.should.be.a.Number;
              break;
            case 1:
              e.value.should.equal('bar');
              e.percent.should.be.a.Number;
              break;
            case 2:
              e.value.should.equal('baz');
              e.percent.should.be.a.Number;
              break;
          }

          --pending || done();
        })

        batch.end(function(err, res){
          if (err) return done(err);
        })
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
          err.message.should.equal('fail one');
          done();
        });
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

        batch.end(function(err, res){
          err.should.be.an.instanceOf(Array);
          assert(null == err[0]);
          assert('fail one' == err[1].message);
          assert(null == err[2]);
          assert('fail two' == err[3].message);
          res.should.eql(['foo', undefined, 'bar', undefined, 'baz']);
          done();
        });
      })
    })
  })
})
