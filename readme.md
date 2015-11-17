# gulp-gulp-smartsprites [![Build Status](https://travis-ci.org/zba/gulp-gulp-smartsprites.svg?branch=master)](https://travis-ci.org/zba/gulp-gulp-smartsprites)

> My praiseworthy gulp plugin


## Install

```
$ npm install --save-dev gulp-gulp-smartsprites
```


## Usage

```js
var gulp = require('gulp');
var gulpSmartsprites = require('gulp-gulp-smartsprites');

gulp.task('default', function () {
	return gulp.src('src/file.ext')
		.pipe(gulpSmartsprites())
		.pipe(gulp.dest('dist'));
});
```


## API

### gulpSmartsprites(options)

#### options

##### foo

Type: `boolean`  
Default: `false`

Lorem ipsum.


## License

MIT © [Aleksei Zbiniakov](https://github.com/zba)
