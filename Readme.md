# batch

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]

  Simple async batch with concurrency control and progress reporting.

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```bash
$ npm install batch
```

## Usage

```js
var Batch = require('batch')
```

### `new Batch()`

Create a new Batch.

#### `batch.concurrency(n)`

Set concurrency to `n`.

#### `batch.end([cb])`

Execute all queued functions in parallel, executing `cb(err, results)`.

#### `batch.push(fn)`

Queue a function.

#### `batch.throws(throws)`

Set wether Batch will or will not throw up.

#### `progress` event

Contains the "job" index, response value, duration information, and completion data.

```
{ index: 1,
  value: 'bar',
  pending: 2,
  total: 3,
  complete: 2,
  percent: 66,
  start: Thu Oct 04 2012 12:25:53 GMT-0700 (PDT),
  end: Thu Oct 04 2012 12:25:53 GMT-0700 (PDT),
  duration: 0 }
```

## Example

```js
var Batch = require('batch')
  , batch = new Batch;

batch.concurrency(4);

ids.forEach(function(id){
  batch.push(function(done){
    User.get(id, done);
  });
});

batch.on('progress', function(e){

});

batch.end(function(err, users){

});
```

## License

[MIT](LICENSE)

[downloads-image]: https://img.shields.io/npm/dm/batch.svg
[downloads-url]: https://npmjs.org/package/batch
[npm-image]: https://img.shields.io/npm/v/batch.svg
[npm-url]: https://npmjs.org/package/batch
[travis-image]: https://img.shields.io/travis/visionmedia/batch/master.svg
[travis-url]: https://travis-ci.org/visionmedia/batch
