
let query = require("../model.js");
let fs = require('fs');
let moment = require("moment");

let pageSize = 10;


let controller = {
    // 首页
    "index": async (req,res)=>{
        //获取文章总数
        var sql1 = "select count(*) as postsCount from posts";
        var sql2 = "select count(*) as draftedCount from posts where status = 'drafted'";
        var sql3 = "select count(*) as cateCount from category"
        var sql4 = "select count(*) as commentCount  from comments ";
        var sql5 = "select count(*) as heldCount  from comments where status = 'held' ";
        
        // connection.query异步执行
        // console.time('query')
        var promiseArr = [query(sql1),query(sql2),query(sql3),query(sql4),query(sql5)];


        var data =  await Promise.all(promiseArr);
        var resData = {};
       
        data.map((v)=>{
            // v => [{}] // v[0] => {}
            Object.assign(resData,v[0]);  //合并对象v[0]到resData对象身上
        })
        resData.nickname = req.session.nickname;
        resData.photo =  req.session.photo;
        // console.timeEnd('query')
        res.render('index.html',resData)


        // Promise.all(promiseArr).then(data => {
        //     var resData = {};
        //     data.map((v)=>{
        //         // v => [{}] // v[0] => {}
        //         Object.assign(resData,v[0]);  //合并对象v[0]到resData对象身上
        //     })
        //     // console.timeEnd('query')
        //     res.render('index.html',resData)
        // })
    },
    // 添加文字
    "post":async (req,res)=>{
        // res.sendFile(path.join(__dirname,'/views/posts.html'));// 取出文章分类和文章状态
        let status = [
            {"key":"published","text":"发布"},
            {"key":"drafted","text":"草稿"},
            {"key":"trashed","text":"废弃"}
        ]
        let sql = "select * from category";
        var catData = await query(sql);
           
        res.render('posts.html',{
            catData: catData,
            status: status
        })
    },
    "login":(req,res)=>{
        res.render('login.html')
    },
    "getPostsPageCount": async (req,res) => {
        var {cat_id,status} = req.query;

        // where 1=1 代表查询条件为真，主要为了防止后面没有查询条件而出现报错。
        var where = `1=1`; 
       
        if(cat_id){
            where += ` and cat_id=${cat_id}`
        }
        if(status){
            where += ` and status='${status}'`
        }
        var sql = `
            select count(*) as postsCount from posts 
             where ${where}
        `;
        var data = await query(sql);
        var totalPage = Math.ceil( data[0].postsCount / pageSize );
        res.json({
            totalPage
        })
    },
    "getPostsPageData":async (req,res)=>{
        var {cat_id,status} = req.query;
        // where 1=1 代表查询条件为真，主要为了防止后面没有查询条件而出现报错。
        var where = `1=1`; 
        if(cat_id){
            where += ` and t1.cat_id=${cat_id}`
        }
        if(status){
            where += ` and  t1.status='${status}'`
        }


        let page = parseInt(req.query.page);
        let offset = (page - 1) * pageSize;
        var sql = `
        SELECT  t1.*, t2.nickname, t3.cat_name
        FROM posts t1
        LEFT JOIN users t2 ON t1.user_id = t2.user_id
        LEFT JOIN category t3 ON t1.cat_id = t3.cat_id 
        where ${where}
        order by t1.post_id desc
        LIMIT ${offset},${pageSize}
        `;
        var data = await query(sql);
         //data => [{},{}]
         res.json(data)
    },
    "delPost":(req,res) =>{
        let post_id = req.params.post_id;
        let sql = "delete from posts where post_id = " + post_id;
        query(sql).then( result => {
            let {affectedRows} = result;
            if(affectedRows){
                res.json({code:200,message:"delete success",icon:1})
            }else{
                res.json({code:-1,message:"delete error",icon:2})
            }
        } )
    },
    "addPost": async (req,res)=>{
        // 取出文章分类和文章状态
        let status = [
            {"key":"published","text":"发布"},
            {"key":"drafted","text":"草稿"},
            {"key":"trashed","text":"废弃"}
        ]
        let sql = "select * from category";
        var catData = await query(sql);
        res.render('post-add.html',{
            catData: catData,
            status: status
        })
    },
    "savePost": (req,res)=>{
        let {title,content,category,created,status,feature} = req.body;
        let sql = `insert into posts(title,content,cat_id,created,status,feature) 
        values('${title}','${content}',${category},'${created}','${status}','${feature}')`;
        query(sql).then(result => {
            let {affectedRows} = result;
            if(affectedRows){
                res.json({code:200,'message':'添加成功'})
            }else{
                res.json({code:-1,'message':'添加失败'})
            }
        } )
    },

    "uploadFeature":(req,res)=>{
        if(req.file){
            let {filename,originalname,destination} = req.file;
            var ext = originalname.substring( originalname.indexOf('.') ); // => .jpg
            let oldPath = `${destination}${filename}`;
            let newPath = `${destination}${filename}${ext}`;
            let fullPath = '';
            fs.rename(oldPath,newPath,err => {
                if(err) throw err;
                // 返回完整的路径给前端，用于图片的src回显
                res.json({fullPath:newPath})
            })
        }
        

    },

    "editPost": async (req,res) => {
        // 接收路由参数
        let post_id = req.params.post_id;
        // 查询当前文章的数据，分配数据到模板中
         // 取出文章分类和文章状态
        let status = [
            {"key":"published","text":"发布"},
            {"key":"drafted","text":"草稿"},
            {"key":"trashed","text":"废弃"}
        ];
        let sql2 = "select * from category";
        var catData = await query(sql2); // [{},{}]
        let sql =`select * from posts where post_id = ${post_id}`;
        let rows = await query(sql);// [{}]
        rows[0].feature = rows[0].feature.replace('./','/')
        rows[0].created = moment(rows[0].created).format("YYYY-MM-DD HH:mm:ss")
        res.render('post-edit.html',{
            data:rows[0],
            status: status,
            catData: catData
        })
    },

    "updPost":async (req,res)=>{
        let {post_id,title,content,category,created,status,feature} = req.body;
        let sql = `update posts set title='${title}', 
                    content='${content}', 
                    cat_id='${category}',
                    created='${created}',
                    status='${status}',
                    feature='${feature}' 
                    where post_id = ${post_id}`;
        // console.log(sql); return;
        var result = await query(sql);
        let {affectedRows} = result;
        if(affectedRows){
            res.json({code:200,'message':'编辑成功'})
        }else{
            res.json({code:-1,'message':'编辑失败'})
        }
    },

    "inSystem": async (req,res) => {
        let {email,password} = req.body;
        let sql = `select * from users where email = '${email}' and password = '${password}'`;
        let rows = await query(sql);
        if(rows[0] === undefined){
            // 登录失败
            res.json({
                code:-1,
                message: "用户名或密码错误"
            })
        }else{
            //把用户信息存储到session中
            req.session.user_id = rows[0].user_id;
            req.session.email = rows[0].email;
            req.session.nickname = rows[0].nickname;
            req.session.photo = rows[0].photo.replace('./','/');
            req.session.intro = rows[0].intro;
            res.json({
                code:200,
                message: "登录成功"
            })
        }
    },
    "logout":(req,res)=>{
        // 清除登录设置的session信息即可
        req.session.destroy(function(err){
            if(err){
                throw err;
            }
        })
        // 打回到登录页面
        res.redirect('/login');
    },
    "profile": (req,res) =>{
        // 取出个人信息数据，分配到模板中进行展示,或者登陆成功存到session,可从session中获取
       
        res.render('profile.html',{
            nickname: req.session.nickname,
            photo: req.session.photo,
            email: req.session.email,
            intro: req.session.intro
        })
    },
    "resetpwd": (req,res) =>{
        res.render('password-reset.html')
    },
    "savepwd": async (req,res) => {
        let {oldPwd,newPwd,confirmPwd} = req.body;
        let user_id = req.session.user_id;
        // 先验证旧密码是否正确
        let sql = `select * from users where password= '${oldPwd}' and user_id = ${user_id} `;
        var rows = await query(sql);
        if(rows[0] === undefined){
            // 没有找到 =》 旧密码输入不正确
            res.json({code:-1,message:"旧密码输入错误"})
        }
        else{
            // 旧密码输入正确，修改真正的新密码
            let sql2 = `update users set password = '${newPwd}' where user_id = ${user_id}`;
            var result = await query(sql2); 

            if(result.affectedRows){
                // 修改成功
                res.json({code:200,message:"密码更新成功"})
            }else{
                // 修改失败
                res.json({code:-2,message:"服务器忙，请稍后再试"})
            }

        }

    },
    "saveProfile": async (req,res) => {
        let {nickname,intro,avatar} = req.body;
        let user_id = req.session.user_id;
        let sql = `update users set nickname='${nickname}', 
                    intro='${intro}',photo='${avatar}' where user_id = ${user_id}
                 `;
        let result = await query(sql);
        if(result.affectedRows){
            // 更新在session中的信息
            req.session.nickname = nickname;
            req.session.photo = avatar.replace("./",'/');
            req.session.intro = intro;
            res.json({code:200,message:"更新用户信息成功"})
        }else{
            res.json({code:-1,message:"服务器忙请稍后再试"})
        }
    }, 
    "slides":async(req,res) =>{
        let sql = "select * from swipe";
        let rows = await query(sql);// [{},{}]
        rows.map(v=>{
            if(v.img){
                v.img = v.img.replace('./','/')
            }
        })
        res.render('slides.html',{
            data:rows
        })
    },
    "addSlides":async (req,res)=>{
        // req.body 接收文本数据
        // console.log(req.body)
        // req.file 接收二进制数据
        // console.log(req.file)
        let {text,link} = req.body;
        let newPath = ''
        if(req.file){
            let {filename,originalname,destination} = req.file;
            var ext = originalname.substring( originalname.indexOf('.') ); // => .jpg
            let oldPath = `${destination}${filename}`;
            newPath = `${destination}${filename}${ext}`;
            fs.renameSync(oldPath,newPath);
            
        }
        let sql = `insert into swipe(img,text,link) values('${newPath}','${text}','${link}')`
        let {affectedRows} = await query(sql);
        if(affectedRows){
            res.send("<script>alert('添加成功');location.href='/slides';</script>");
        }else{
            res.send("<script>alert('添加失败');location.href='/slides';</script>");
        }
    }

    
};


module.exports = controller;