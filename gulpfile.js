// package vars
const pkg = require("./package.json");

// gulp
const gulp = require("gulp");
const gcmq = require('gulp-group-css-media-queries');

// load all plugins in "devDependencies" into the variable $
const $ = require("gulp-load-plugins")({
    pattern: ["*"],
    scope: ["devDependencies"]
});

const onError = (err) => {
    console.log(err);
};

// browserSyncProxy - url for local build
const config = require('./.env.gulp.json')

// browserSync
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const autoprefixerBrowsers = ['> 1%', 'ie >= 9'];
const	sassPrecision = 10;

// Convert Sass to CSS
gulp.task('sass', function(){
    return gulp.src(pkg.paths.src.scss + '**/*.scss')
        .pipe($.plumber({ errorHandler: onError }))
        .pipe($.sourcemaps.init({loadMaps: true}))
        .pipe($.sass({
            includePaths: pkg.paths.src.scss,
            precision: sassPrecision,
            sourceComments: false,
            outputStyle: 'nested'
          })
            .on('error', $.sass.logError))
        .pipe($.autoprefixer({
            browsers: autoprefixerBrowsers,
            cascade: false
        }))
        .pipe(gcmq())
        .pipe($.cssnano())
        .pipe($.size({gzip: true, showFiles: true}))
        .pipe($.sourcemaps.write('.'))
        .pipe($.gulp.dest(pkg.paths.dist.css))
        .pipe($.browserSync.stream());
});

// Script tasks
gulp.task('js-custom', function() {

	gulp.src([pkg.paths.src.js + '**/*.js'])
        .pipe($.plumber())

        .pipe($.order([
            // paths.scripts.src.replace('./', '') + 'flickity/*.js',
            // paths.scripts.src.replace('./', '') + 'lightgallery/*.js',
            // paths.scripts.src.replace('./', '') + 'lightgallery/lg-modules/*.js',
            pkg.paths.src.js.replace('./', '') + 'vendor/*.js',
            pkg.paths.src.js.replace('./', '') + 'src/*.js'
        ], { base: __dirname }))
        .pipe($.if(["*.js", "!*.min.js"],
            $.uglify()
        ))
        .pipe($.size({gzip: true, showFiles: true}))
        .pipe($.concat('custom.min.js'))
        .pipe($.uglify({
            mangle: false
        }))
		.pipe(gulp.dest(pkg.paths.dist.js))
        .pipe(reload({stream: true}));

});

// js task - minimize any distribution Javascript into the public js folder, and add our banner to it
gulp.task("js", ["js-custom"], () => {
    $.fancyLog("-> Building js");
    return gulp.src(pkg.globs.distJs)
        .pipe($.plumber({errorHandler: onError}))
        .pipe($.if(["*.js", "!*.min.js"],
            $.newer({dest: pkg.paths.dist.js, ext: ".min.js"}),
            $.newer({dest: pkg.paths.dist.js})
        ))
        .pipe($.if(["*.js", "!*.min.js"],
            $.uglify()
        ))
        .pipe($.if(["*.js", "!*.min.js"],
            $.rename({suffix: ".min"})
        ))
        .pipe($.size({gzip: true, showFiles: true}))
        .pipe($.concat('external.min.js'))
        .pipe(gulp.dest(pkg.paths.dist.js))
        .pipe($.filter("**/*.js"))
        .pipe(reload({stream: true}));
});

// static assets version task
gulp.task("static-assets-version", () => {
    gulp.src(pkg.paths.craftConfig + "general.php")
        .pipe($.replace(/'staticAssetsVersion' => (\d+),/g, function(match, p1, offset, string) {
            p1++;
            $.fancyLog("-> Changed staticAssetsVersion to " + p1);
            return "'staticAssetsVersion' => " + p1 + ",";
        }))
        .pipe(gulp.dest(pkg.paths.craftConfig));
});

// Default task
gulp.task("default", ["sass", "js"], () => {
    browserSync.init({
        proxy: config.browserSyncProxy,
    });
    gulp.watch([pkg.paths.src.scss + "**/*.scss"], ["sass"]).on('change', reload);
    gulp.watch([pkg.paths.src.js + "**/*.js"], ["js"]).on('change', reload);
});

// Production build
gulp.task("build", ["default", "static-assets-version"]);
