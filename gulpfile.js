//引入gulp及插件
var gulp = require( 'gulp' );
var fs = require('fs');

var sourcemaps = require( 'gulp-sourcemaps' );
var sass = require( 'gulp-sass' );
var autoprefixer = require( 'gulp-autoprefixer' );

var cssMin = require( 'gulp-minify-css' );
var htmlmin = require('gulp-htmlmin');
var uglify = require( 'gulp-uglify' );


function uglifyHtml( src, dest ){
	gulp.src( src )
		.pipe(
			htmlmin({
				collapseWhitespace: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
				processConditionalComments: true,
				removeComments: true
			})
		)
		.pipe( gulp.dest( dest ) );
}
function sassToCss( src, dest ){
	gulp.src( src )
		.pipe( sourcemaps.init() )
		.pipe(
			sass({
				//标准美化格式
				outputStyle: 'expanded'
			})
		)
		.pipe(
			autoprefixer({
				browsers: [ 'IE >= 9', 'Firefox > 10', 'chrome > 10' ]
			})
		)
		.pipe( cssMin() )
		.pipe( sourcemaps.write( 'map' ) )
		.pipe( gulp.dest( dest ) );
}
function uglifyJS( src, dest ){
	gulp.src( src )
		.pipe( sourcemaps.init() )
		.pipe( uglify() )
		.pipe( sourcemaps.write( 'map' ) )
		.pipe( gulp.dest( dest ) );
}

//编译sass
gulp.task( 'sass', function(){
	sassToCss( 'src/sass/*.scss', 'assets/css' );
	sassToCss( 'src/sass/xui/!(compass|animation|iconfont|normalize).scss', 'assets/css' );
});
//将开发者目录js压缩并转到线上目录
gulp.task( 'js', function(){
	uglifyJS( 'src/js/*.js', 'assets/js' );
});
//默认
gulp.task( 'default' , function(){
	gulp.watch( 'src/sass/**/*.scss', function(){
		gulp.run( 'sass' );
	});
	gulp.watch( 'src/js/*.js', function(){
		gulp.run( 'js' );
	});
	gulp.watch( 'src/temp/**/*.html', function(){
		gulp.run( 'temp' );
	});
});


//监听模块
var moduleName = 'qfii';
//var moduleName = 'login';
var srcModulUrl = 'src/module/' + moduleName + '/';
var destModulUrl = 'assets/module/' + moduleName;
gulp.task('moduleHtml', function () {
	uglifyHtml( srcModulUrl + '*.html', destModulUrl );
});
gulp.task('moduleSass', function () {
	sassToCss( srcModulUrl + '*.scss', destModulUrl );
});
gulp.task('moduleJS', function () {
	uglifyJS( srcModulUrl + '*.js', destModulUrl );
});
gulp.task( 'module' , function(){
	gulp.watch( srcModulUrl + '*.html', function(){
		gulp.run( 'moduleHtml' );
	});
	gulp.watch( srcModulUrl + '*.scss', function(){
		gulp.run( 'moduleSass' );
	});
	gulp.watch( srcModulUrl + '*.js', function(){
		gulp.run( 'moduleJS' );
	});
});

//模板
gulp.task('temp', function () {
	uglifyHtml( 'src/temp/**/*.html', 'assets/temp' );
});

/*

//md5版本号及替换
var rev = require( 'gulp-rev' ),
	collector = require( 'gulp-rev-collector' );

gulp.task( 'rev', function(){
	gulp.src([
			'assets/css/!*.css',
			'assets/js/!*.js',
			'assets/static/config.js'
		])
		.pipe( gulp.dest( 'rev/temp' ) )
		//加上MD5版本号
		.pipe( rev() )
		//生成一个rev-manifest.json
		.pipe( rev.manifest() )
		//将 rev-manifest.json 保存到 rev 目录内
		.pipe( gulp.dest( 'rev' ) )
});

gulp.task( 'collector', function(){
	// 读取 rev-manifest.json 文件以及需要进行css名替换的文件
	gulp.src( ['rev/!*.json', 'html/mystock.html'] )
		// 执行文件内css名的替换
        .pipe( collector() )
        // 替换后的文件输出的目录
        .pipe( gulp.dest( 'html' ) );
});
*/



