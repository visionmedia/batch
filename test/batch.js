
var Batch = require('../');

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
  })
})