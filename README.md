# my-gulp-demo

[![Build Status][travis-image]][travis-url]
[![Package Version][version-image]][version-url]
[![License][license-image]][license-url]
[![Dependency Status][dependency-image]][dependency-url]
[![devDependency Status][devdependency-image]][devdependency-url]
[![Code Style][style-image]][style-url]

> Always a pleasure scaffolding your awesome static sites.

## 项目的主要功能及技术  
该项目使用了gulp及其gulp的相关插件来完成html、js、style、image、fronts等前端项目开发所需要使用的基本项目资源，实现本地实时热更新、项目在浏览器上的代码编译、静态资源压缩与打包，有效提高本地代码开发效率及减少部署上线的项目资源体积。

## 项目的使用

```shell
# clone repo
$ git clone git@github.com:husky0601/my-gulp-demo.git
$ cd my-gulp-demo
# install dependencies
$ yarn # or npm install  
```

## 项目结构及介绍  

```
└── my-gulp-demo ····································· project root
   ├─ public ········································· static folder
   │  └─ favicon.ico ································· static file (unprocessed)
   ├─ src ············································ source folder
   │  ├─ assets ······································ assets folder
   │  │  ├─ fonts ···································· fonts folder
   │  │  ├─ images ··································· images folder
   │  │  ├─ scripts ·································· scripts folder
   │  │  └─ styles ··································· styles folder
   │  ├─ layouts ····································· layouts folder
   │  ├─ partials ···································· partials folder
   │  ├─ about.html ·································· page file (use layout & partials)
   │  └─ index.html ·································· page file (use layout & partials)
   ├─ .gitignore ····································· git ignore file
   ├─ README.md ······································ repo readme
   ├─ gulpfile.js ···································· gulp tasks file
   ├─ package.json ··································· package file
   └─ yarn.lock ······································ yarn lock file
```

## gulpfile项目入口文件及介绍    
- 通过使用gulp中的src与dest方法将src及public目录下的style、js、image、html、fronts等静态资源通过src方法传入，通过gulp的基本插件，在pipe中对文件进行编译，然后通过dest方法输出到temp文件相应的目录下  
```
const {src, dest} = require('gulp')
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins() // 加载插件
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
/** 样式文件编译 */
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


```    


- 自动构建服务    
为了是项目在本地开发环境中，能够根据代码的变动实时展示在浏览器上，需要在gulp中增加server方法，该方法通过gulp提供的watch方法来监听本地经常变动文件的变化，变化的文件在被保存后，就会被立即被编译、转化为浏览器可读语言，提高本地开发效率。
```
const browserSync = require('browser-sync')
const bs = browserSync.create()
const {src, dest, parallel, series, watch} = require('gulp')

const serve = () =>{
    // 监听文件变化
    //在开发环境中， 脚本、样式、页面的变化比较频繁，且需要需要重新编译成浏览器刻可读内容
    watch('src/assets/styles/*.scss',style)
    watch('src/assets/scripts/*.js',script)
    watch('src/*.html',page)
    // watch('src/assets/images/**', image)
    // watch('src/assets/fonts/**', font)
    // watch('public/**', extra)

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
```

- 文件构建注释删除及压缩    
为了使线上的静态资源体积更小，减少上传时间及加快静态资源请求的时间，需要对本地的静态资源文件中的一些注释代码及空格换行符等进行剔除，使代码的压缩效果达到最好
```
const useref = () =>{
  return src('temp/*.html', {base: 'temp'})
    .pipe(plugins.useref({searchPath: ['dist', '.']}))
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
```

- 根据不同场景导出gulp任务     
clean: 在编译后，对于想要快速删除打包的dist文件可以使用clean任务
parallel与series能够分别对任务进行并行与串行，从而提高打包效率  
develop：在开发阶段，将变化频繁的文件进行编译并且实时监听
build：我们将文件变化比较不频繁并且内部不需要过多的压缩的image和fronts在生产阶段即项目上线前再进行编译，在编译上线的代码时，在开发阶段时已经实时编译dist文件，为了防止文件被覆盖或重叠，确保线上的代码的正确编译，现将本地代码编译后，全部放至temp目录下，在build的时候，直接读取temp下已经编译过的文件进行压缩，最后放到dist文件下，大大提高本地打包速度
```
const del = require('del')
/** 清除dist文件 */
const clean = () =>{
    return del(['dist', 'temp'])
}

const { parallel, series} = require('gulp')
const compole = parallel(style, script, page)
const develop = series(compole, serve)
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



```

## 项目的基本命令脚本

``` 
// package.json
"scripts": {
   "clean": "gulp clean",
   "build": "gulp build",
   "develop": "gulp develop"
}

// 基本命令  
yarn clean  // 清除本地打包的dist文件与temp文件
yarn build  // 项目部署前的资源压缩与打包
yarn develop // 本地代码调试的服务构建
```
