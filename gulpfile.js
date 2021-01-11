const {src, dest, parallel, series, watch} = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')

const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins() // 加载插件

const bs = browserSync.create()

const data = {
    menus: [
      {
        name: 'Home',
        icon: 'aperture',
        link: 'index.html'
      },
      {
        name: 'About',
        link: 'about.html'
      }
    ],
    pkg: require('./package.json'),
    date: new Date()
}

/** 清除dist文件 */
const clean = () =>{
    return del(['dist', 'temp'])
}

/** 样式文件编译 */
const style = () =>{
    return src('src/assets/styles/*.scss', {base: 'src'})
        .pipe(plugins.sass({ outputStyle: 'expanded'}))
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true })) // 使用流的形式加载
}

/** 脚本文件编译 */
const script = () =>{
    return src('src/assets/scripts/*.js', {base: 'src'})
        .pipe(plugins.babel({presets: ['@babel/preset-env']}))
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true }))
}

/** 页面模版编译 */
const page = () =>{
    return src('src/*.html', {base: 'src'})
        .pipe(plugins.swig({data, defaults: { cache: false }}))  // 防止模板缓存导致页面不能及时更新
        .pipe(dest('temp'))
        .pipe(bs.reload({ stream: true }))
}

/** 图片转化与压缩 */
const image = () =>{
    return src('src/assets/images/**', {base: 'src'})
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

/** 字体压缩 */
const font = () =>{
    return src('src/assets/fonts/**', {base: 'src'})
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}


/** 自动构建服务 */
const serve = () =>{
    // 监听文件变化
    //在开发环境中， 脚本、样式、页面的变化比较频繁，且需要需要重新编译成浏览器刻可读内容
    watch('src/assets/styles/*.scss',style)
    watch('src/assets/scripts/*.js',script)
    watch('src/*.html',page)
    // watch('src/assets/images/**', image)
    // watch('src/assets/fonts/**', font)

    // 对于改动比较少，且只是压缩文件的图片、字体等，可统一监听
    // bs.reload可读文件变化后，重新加载浏览器
    watch([
        'src/assets/images/**',
        'src/assets/fonts/**',
        'public/**'
    ], bs.reload)

    bs.init({
        notify:false,
        port: 3002,
        //open:false,
        //files: 'dist/**', // 当dist目录下任何一个文件变化， 就重新加载
        server:{
            baseDir:['temp', 'src', 'public'], // 
            routes:{
                '/node_modules': 'node_modules' // 将html中引用的node_modules中的文件映射到当前路径下
            }
        }
    })
}

/** 文件构建注释删除及压缩 */
const useref = () =>{
  return src('temp/*.html', {base: 'temp'})
    .pipe(plugins.useref({searchPath: ['temp', '.']}))
    // html js css
    .pipe(plugins.if(/\.js$/, plugins.uglify())) // 压缩js文件
    .pipe(plugins.if(/\.css$/, plugins.cleanCss())) // 压缩css文件
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    // 在构建的时候，先将压缩的文件放到temp文件下，
    // 在build阶段， 再将temp文件中的所有文件压缩后放在dist目录下
    // 这样可防止在build过程中，相同文件的写入写出发生错误
    // 减少调试过程中的文件编译的时间，提高本地开发效率
    // 减少线上代码的体积
    .pipe(dest('dist')) 
}

const compole = parallel(style, script, page)

/** 先清除dist文件然后重新编译 */
/** 上线之前执行的任务 */
const build = series(
  clean, 
  parallel(
    series(compole, useref), // 文件需要先构建后再压缩
    image, 
    font
  )
) 

const develop = series(compole, serve)

module.exports = {
    clean,
    build,
    develop
}