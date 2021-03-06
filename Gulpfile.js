'use strict';
// Require which and child_process
var which = require('which');
var spawn = require('child_process').spawn;
// Find npm in PATH
var npm = which.sync('npm');
// Execute
var noErrorSpawn = spawn(npm, ['install']);
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var cache = require('gulp-cached');
var cp = require('child_process');
var cssnano = require('gulp-cssnano');
var cache = require('gulp-cache');
var changed = require('gulp-changed');
var del = require('del');
var es = require('event-stream');
var foreach = require('gulp-foreach');
var fs = require('fs');
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
var imageResize = require('gulp-image-resize');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var os = require('os');
var parallel = require('concurrent-transform');
var path = require('path');
var plumber = require('gulp-plumber');
var print = require('gulp-print');
var reload = browserSync.reload;
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var scsslint = require('gulp-scss-lint');
var shell = require('gulp-shell');
var sizeOf = require('image-size');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
  jekyllBuild: '<span style="color: grey">Running: </span> $ jekyll build',
};
var responsiveSizes = [20, 400, 800, 1600];

/************
 **  SCSS  **
 ************/

gulp.task('scss', ['scss:lint', 'scss:build']);

gulp.task('scss:lint', function() {
  gulp.src(['./_scss/**/*.scss', '!./_scss/lib/**/*.scss'])
    .pipe(plumber())
    .pipe(scsslint());
});

gulp.task('scss:build', function() {
  gulp.src('./_scss/style.scss')
    .pipe(plumber())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: ['scss'],
      onError: browserSync.notify,
      outputStyle: 'compressed',
    }))
    .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {
      cascade: true
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./_site/css/'))
    .pipe(reload({
      stream: true
    }))
    .pipe(gulp.dest('./css/'));
});

gulp.task('scss:optimized', function() {
  return gulp.src('./_scss/style.scss')
    .pipe(plumber())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(sass({
      includePaths: ['scss'],
      outputStyle: 'compressed',
    }))
    .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {
      cascade: true
    }))
    .pipe(cssnano({
      compatibility: 'ie8'
    }))
    .pipe(gulp.dest('./_site/css/'))
    .pipe(reload({
      stream: true
    }))
    .pipe(gulp.dest('./css/'));
});

/******************
 **  JavaScript  **
 ******************/
gulp.task('js', ['js:lint', 'js:build']);

gulp.task('js:build', function() {
  return gulp.src('./_js/**/*.js')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./_site/js/'))
    .pipe(reload({
      stream: true
    }))
    .pipe(gulp.dest('./js/'));
});

gulp.task('js:lint', function() {
  return gulp.src(['./_js/**/*.js', '!./_js/lib/**/*.js', 'Gulpfile.js'])
    .pipe(plumber())
    .pipe(jscs())
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

/**********************
 ** Optimized Images **
 **********************/

gulp.task('images', /*['responsive'],*/ function() {
  var dest = './img/';
  return gulp.src('./_img/**/*')
    .pipe(plumber())
    .pipe(changed(dest))
    .pipe(gulp.dest('./_site/img/'))
    .pipe(reload({
      stream: true
    }))
    .pipe(gulp.dest(dest));
});

gulp.task('images:optimized', /*['responsive'],*/ function() {
  return gulp.src('./_img/**/*')
    .pipe(plumber())
    .pipe(cache(imagemin({
      interlaced: true,
      pngquant: true,
      progressive: true,
      multipass: true,
    })))
    .pipe(gulp.dest('./_site/img/'))
    .pipe(reload({
      stream: true
    }))
    .pipe(gulp.dest('./img/'));
});

/***********************
 ** Responsive Images **
 ***********************/

gulp.task('responsive', function(cb) {
  return runSequence('responsive:clean',
    ['responsive:resize', 'responsive:metadata'], 'images', cb);
});

gulp.task('responsive:resize', function() {
  var srcSuffix;
  var destSuffix;

  // Note: process.argv =
  // ['node', 'path/to/gulpfile.js', 'responsive', '--dir', 'subPathIfProvided']
  var idx = process.argv.indexOf('--dir');
  if (idx > -1) {
    // Only process subdirectory
    var srcPath = path.join('./_img/res/raw/', process.argv[idx + 1]);
    if (fs.lstatSync(srcPath).isDirectory()) {
      srcSuffix = path.join(process.argv[idx + 1], '/**/*');
      destSuffix = process.argv[idx + 1];
    } else {
      srcSuffix = process.argv[idx + 1];
      destSuffix = process.argv[idx + 1].substring(0,
        process.argv[idx + 1].lastIndexOf('/'));
    }
  } else {
    srcSuffix = '**/*';
    destSuffix = '';
  }

  return es.merge(responsiveSizes.map(function(size) {
    var dest = './_img/res/' + size + '/' + destSuffix;
    return gulp.src('./_img/res/raw/' + srcSuffix)
      .pipe(plumber())
      .pipe(changed(dest))
      .pipe(parallel(
        imageResize({
          height: size,
          width: 0,
          crop: false,
          upscale: false,
          imageMagick: true,
        }),
        os.cpus().length
      ))
      .pipe(print(function(filepath) {
        return 'Created: ' + filepath.replace('/raw/', '/' + size + '/');
      }))
      .pipe(gulp.dest(dest));
  }));
});
(function() {
  var childProcess = require("child_process");
  var oldSpawn = childProcess.spawn;
  function mySpawn() {
    console.log('spawn called');
    console.log(arguments);
    var result = oldSpawn.apply(this, arguments);
    return result;
  }
  childProcess.spawn = mySpawn;
})();
gulp.task('responsive:metadata', function() {
  // We always process all images.
  var metadata = {
    _NOTE: 'This file is generated in gulpfile.js, in the responsive:metadata task.',
    aspectRatios: {},
    sizes: responsiveSizes,
  };
  return gulp.src('./_img/res/raw/**/*.{jpg,JPG,png,PNG,jpeg,JPEG,gif,GIF}')
    .pipe(foreach(function(stream, file) {
      var key = file.path.replace(/\\/g, '/').replace(/.*\/_img\/res\/raw\//, '');
      var dimensions = sizeOf(file.path);
      metadata.aspectRatios[key] = Number((dimensions.width / dimensions.height).toFixed(3));
      return stream;
    }))
    .on('finish', function() {
      fs.writeFileSync('./_data/responsiveMetadata.json', JSON.stringify(metadata, null, 2));
    });
});

gulp.task('responsive:clean', function(cb) {
  // Note: process.argv =
  // ['node', 'path/to/gulpfile.js', 'responsive', '--dir', 'subPathIfProvided']
  var idx = process.argv.indexOf('--dir');
  var folders = (idx > -1) ? (
    responsiveSizes.map(function(size) {
      return '_img/res/' + size + '/' + process.argv[idx + 1];
    })
    ) : (['_img/res/*', '!_img/res/raw/', '!_img/res/raw/**']);

  return del(folders, cb);
});

/************
 ** Jekyll **
 ************/

gulp.task('jekyll', ['jekyll:build']);

gulp.task('jekyll:build', function(cb) {
  browserSync.notify(messages.jekyllBuild);
  return spawn('jekyll', ['build', '--quiet', '--incremental'],
    {
      stdio: 'inherit'
    }).on('close', cb);
});

gulp.task('jekyll:rebuild', ['jekyll:build'], function() {
  reload();
});

/******************
 ** Global Tasks **
 ******************/

gulp.task('clean', function(cb) {
  return del(['./_site/', './css/', './js/', './img/'], cb);
});

gulp.task('deploy', ['build:optimized'], function() {
  return gulp.src('')
    .pipe(shell('rsync -avuzh _site/* dan:/srv/schlosser.io/public_html/'))
    .on('finish', function() {
      process.stdout.write('Deployed to schlosser.io\n');
    });
});

gulp.task('watch', function() {
  gulp.watch([
    './**/*.html',
    '!./_site/**/*.html',
    './_layouts/*.html',
    './_includes/*.html',
    './_drafts/*.html',
    './_projects/*.html',
    './_posts/*',
    './_data/*',
    './_config.yml',
  ], ['jekyll:rebuild']);
  gulp.watch('./_scss/**/*.scss', ['scss']);
  gulp.watch('./img/res/**/*', ['images']);
  gulp.watch(['./_js/**/*.js', 'Gulpfile.js'], ['js']);
});

gulp.task('build', function(cb) {
  return runSequence('clean', ['scss', 'images', 'js'], 'jekyll', cb);
});

gulp.task('build:optimized', function(cb) {
  return runSequence('clean',
    ['scss:optimized', 'images', 'js'],
    'jekyll',
    cb);
});

// use default task to launch Browsersync and watch JS files
gulp.task('serve', ['build'], function() {

  // Serve files from the root of this project
  browserSync.init(['./dist/**/*'], {
    ghostMode: {
      clicks: false,
      forms: false,
      scroll: false,
    },
    server: {
      baseDir: '_site',
    },
  });

  gulp.start(['watch']);
});

gulp.task('default', ['serve']);
