var jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  gulp = require('gulp');

gulp.task('lint', function() {
  return gulp.src('truncate.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('lint vanilla', function () {
  return gulp.src('truncate.vanilla.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('uglify', function() {
  return gulp.src('truncate.js')
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('dist/'));
});

gulp.task('uglify vanilla', function () {
  return gulp.src('truncate.vanilla.js')
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('copy', function() {
  return gulp.src('truncate.js')
    .pipe(gulp.dest('dist/'));
});

gulp.task('copy vanilla', function () {
  return gulp.src('truncate.vanilla.js')
    .pipe(gulp.dest('dist/'));
});

gulp.task('build', ['lint', 'lint vanilla', 'copy', 'copy vanilla', 'uglify', 'uglify vanilla']);
