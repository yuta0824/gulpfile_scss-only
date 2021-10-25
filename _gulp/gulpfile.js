const gulp = require("gulp");
const del = require("del");

//ローカルドメイン
const localDomain = "http://testserver.local/";

//ローカルdistディレクトリ
const distBase = "../";

//scss
const sassGlob = require("gulp-sass-glob-use-forward"); // Sassのglobを有効にする
const sass = require("gulp-dart-sass"); //Dart Sass はSass公式が推奨 @use構文などが使える
const plumber = require("gulp-plumber"); // エラーが発生しても強制終了させない
const notify = require("gulp-notify"); // エラー発生時のアラート出力
const browserSync = require("browser-sync"); //ブラウザリロード
const autoprefixer = require("gulp-autoprefixer"); //ベンダープレフィックス自動付与
const postcss = require("gulp-postcss"); //css-mqpackerを使うために必要
const mqpacker = require("css-mqpacker"); //メディアクエリをまとめる

// 入出力するフォルダを指定
const assets_Scss = "../_scss/**/*.scss"; //入力するsassディレクトリ
const dist_css = "../css"; //出力先cssディレクトリ

/**
 * clean
 */
const clean = () => {
  return del(
    [
      //クリーンするファイル
      dist_css + "/**",

      //クリーンしないファイル
      "!" + dist_css + "/base.css",
      "!" + dist_css + "/base_responsive.css",
      "!" + dist_css + "/delica4.css",
      "!" + dist_css + "/delica4_responsive.css",
      "!" + dist_css + "/product.css",
      "!" + dist_css + "/product_responsive.css",
      "!" + dist_css + "/remodal.css",
      "!" + dist_css + "/remodal-default-theme.css",
      "!" + dist_css + "/ress.css",
      "!" + dist_css + "/thumb.css",
    ],
    {
      force: true,
    }
  );
};

//ベンダープレフィックスを付与する条件
const TARGET_BROWSERS = [
  "last 2 versions",
  "ie >= 11",
  "iOS >= 7",
  "Android >= 4.4",
];

/**
 * sass
 *
 */
const cssSass = () => {
  return gulp
    .src(assets_Scss, {
      sourcemaps: false,
    })
    .pipe(sassGlob()) // Sassのglobを有効にする
    .pipe(
      //エラーが出ても処理を止めない
      plumber({
        errorHandler: notify.onError("Error:<%= error.message %>"),
      })
    )
    .pipe(
      sass({
        outputstyle: "expanded",
      })
    ) //指定できるキー expanded compressed CSS圧縮
    .pipe(autoprefixer(TARGET_BROWSERS))
    .pipe(postcss([mqpacker()])) // メディアクエリをまとめる
    .pipe(
      gulp.dest(dist_css, {
        sourcemaps: "./",
      })
    ) //コンパイル先
    .pipe(browserSync.stream())
    .pipe(
      notify({
        message: "Sassをコンパイルしました！",
        onLast: true,
      })
    );
};

/**
 * ローカルサーバー立ち上げ
 */
const browserSyncFunc = () => {
  browserSync.init(browserSyncOption);
};
const browserSyncOption = {
  //静的サイト
  server: distBase,
  //動的サイト
  // proxy: localDomain,
  open: true,
};

/**
 * リロード
 */
const browserSyncReload = (done) => {
  browserSync.reload();
  done();
};

/**
 *
 * ファイル監視 ファイルの変更を検知したら、browserSyncReloadでreloadメソッドを呼び出す
 * series 順番に実行
 * watch('監視するファイル',処理)
 */
const watchFiles = () => {
  gulp.watch(assets_Scss, gulp.series(cssSass));
  gulp.watch("../**", gulp.series(browserSyncReload));
};

/**
 * seriesは「順番」に実行
 * parallelは並列で実行
 *
 * 一度cleanでdistフォルダ内を削除し、最新のものをdistする
 */
exports.default = gulp.series(
  clean,
  gulp.parallel(cssSass),
  gulp.parallel(watchFiles, browserSyncFunc)
);
