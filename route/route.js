// 设置路由中间件
let express = require('express');
let query = require("../model.js");
let controller = require('../controller/controller.js');

let multer = require('multer');

// 指定上传文件的目录
let upload = multer({
    dest: "./public/uploads/"
})

router = express.Router();


router.get('/',controller.index)

// 文章列表页
router.get('/posts',controller.post)

// 登录页面
router.get('/login',controller.login)

// 获取文章总页数
let pageSize = 10;
router.get('/getPostsPageCount',controller.getPostsPageCount)


// 获取文章分页的数据
router.get('/getPostsPageData',controller.getPostsPageData)

// ajax删除文章
router.post('/delPost/:post_id',controller.delPost)

// 展示添加文字的模板
router.get('/addPost',controller.addPost)

// 保存文章数据入库
router.post('/savePost',controller.savePost)

// ajax上传图片
router.post('/uploadFeature',upload.single('feature'),controller.uploadFeature)



// 编辑回显文章数据
router.get("/editPost/:post_id",controller.editPost);


// 编辑文章数据入库
router.post("/updPost/",controller.updPost);


// ajax用户登录逻辑
router.post("/login",controller.inSystem);

// ajax用户退出逻辑
router.get("/logout",controller.logout);

// 展示用户的个人信息
router.get("/profile",controller.profile);

// 修改个人密码界面
router.get("/resetpwd",controller.resetpwd);

// 更新个人密码
router.post("/savepwd",controller.savepwd);


// 更新个人信息
router.post("/saveProfile",controller.saveProfile);

// 展示轮播图页面
router.get('/slides',controller.slides)

// 添加轮播图入库
router.post('/slides',upload.single('img'),controller.addSlides)

module.exports = router