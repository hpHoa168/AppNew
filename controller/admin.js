const express = require('express')
const { ObjectId } = require('mongodb')
const { getDB,insertObject} = require('../databaseHandle')
const { requireAdmin } = require('../middleware')
const bodyParser = require('body-parser');
var appRoot = require('app-root-path');
const async = require('hbs/lib/async');
const multer = require('multer')
const path = require('path')
const router = express.Router()

router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())
//set files storage
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        var datetime = Date.now()
        cb(null, file.fieldname + '_' + datetime + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage })
//homepage ADMIN
router.get('/', requireAdmin, async (req, res) => {
    const user = req.session["Admin"]
    const db = await getDB();
    const allAcc = await db.collection("Account").find({}).toArray();
    const allCategory = await db.collection("Category").find({}).toArray();
    const allNews = await db.collection("Newspaper").find({}).toArray();

    var totalAcc = allAcc.length;
    var totalCategory = allCategory.length;
    var totalNews = allNews.length;
    var totalLike = 0;
    var totalView = 0;
    var totalComment = 0;
    for (let index = 0; index < allNews.length; index++) {
        const element1 = allNews[index].like.length;
        const element2 = allNews[index].view;
        const element3 = allNews[index].comment.length;
        totalLike += element1;
        totalView += element2;
        totalComment += element3
    }
    res.render('admin/indexAdmin', { user: user,totalAcc:totalAcc,totalCategory:totalCategory,totalNews:totalNews, totalLike:totalLike,totalView:totalView,totalComment:totalComment })
})
router.get('/account',requireAdmin,async(req,res)=>{
    const db = await getDB();
    const allAccount = await (await db.collection('Account').find({}).toArray()).reverse();
    res.render('admin/account',{data:allAccount})
})
//Detail account
router.get('/detailAccount', requireAdmin, async (req, res) => {
    const id = req.query.id;
    const db = await getDB();
    const acc = await db.collection("Account").findOne({ _id: ObjectId(id) });
    var detailAcc;
    if(acc.role == 'User'){
        detailAcc = await db.collection("User").findOne({'username':acc.username});
    }
    if(acc.role == 'Writer'){
        detailAcc = await db.collection("Writer").findOne({'username':acc.username});
    }
    res.render("admin/detailAccount",{detail:detailAcc,acc:acc})
})
//Add account
router.get('/addAccount',requireAdmin,(req,res)=>{
    res.render('admin/addAccount')
})
router.post('/addAccount', upload.single('folderImages'), requireAdmin, async (req, res) => {
    const username = req.body.txtUsername;
    const password = req.body.txtPassword;
    const role = req.body.txtSelect;
    const file = req.file;
    const name = req.body.txtName;
    const age = req.body.txtAge;
    const email = req.body.txtEmail;
    const phone = req.body.txtPhone;
    const address = req.body.txtAddress;
    const subcribe = [];
    const newAccount = {
        username: username,
        password: password,
        role: role
    }
    const addUser = {
        files: file,
        name: name,
        age: age,
        email: email,
        phone: phone,
        address: address,
        subcribe: subcribe,
        username:username
    }

    if (role == "User") {
        insertObject('Account', newAccount);
        insertObject('User', addUser);
    }else if (role = "Writer") {
        insertObject('Account', newAccount);
        insertObject('Writer', addUser);
    }
    
    
    res.redirect("account")
})
//UpdateAccount
router.get('/updateAccount',upload.single('folderImages'), requireAdmin,async(req,res)=>{
    const id = req.query.id;
    console.log(id);
    const db = await getDB();
    const acc = await db.collection("Account").findOne({ _id: ObjectId(id) });
    var detailAcc;
    if(acc.role == 'User'){
        detailAcc = await db.collection("User").findOne({'username':acc.username});
    }
    if(acc.role == 'Writer'){
        detailAcc = await db.collection("Writer").findOne({'username':acc.username});
    }
    res.render("admin/updateAccount",{detail:detailAcc,acc:acc})
})
router.post('/updateAccount',upload.single('folderImages'),requireAdmin,async(req,res)=>{
    const id = req.body.txtId;
    const file = req.file;
    const name = req.body.txtName;
    const age = req.body.txtAge;
    const email = req.body.txtEmail;
    const phone = req.body.txtPhone;
    const address = req.body.txtAddress;
    
    const update = {
        $set: {
            files: file,
            name: name,
            age: age,
            email: email,
            phone: phone,
            address: address
        }
    }
    var detailAcc;
    const db = await getDB();
    const acc = await db.collection("Account").findOne({ _id: ObjectId(id) });
    console.log(acc);
    if(acc.role == 'User'){
        detailAcc = await db.collection("User").findOne({'username':acc.username});
        await db.collection('User').updateOne({ _id: ObjectId(detailAcc._id) }, update);
    }
    if(acc.role == 'Writer'){
        detailAcc = await db.collection("Writer").findOne({'username':acc.username});
        await db.collection('Writer').updateOne({ _id: ObjectId(detailAcc._id) }, update);
    }
    res.redirect('/admin/account')
})
//Delete Account
router.get('/deleteAccount', requireAdmin, async (req, res) => {
    const id = req.query.id;
    const db = await getDB();
    await db.collection("Account").deleteOne({ _id: ObjectId(id) });
    res.redirect("/admin/account")
})

//Category
router.get('/category', requireAdmin,async(req,res)=>{
    const db = await getDB();
    const category = await (await db.collection("Category").find({}).toArray()).reverse();
    res.render("admin/category",{category:category})
})
//detail category
router.get('/detailCategory',requireAdmin,async(req,res)=>{
    const id = req.query.id;
    const db = await getDB();
    const category = await db.collection('Category').findOne({'_id':ObjectId(id)});
    res.render('admin/detailCategory',{data:category})
})
//update category
router.get('/updateCategory',requireAdmin,async(req,res)=>{
    const id = req.query.id;
    const db = await getDB();
    const category = await db.collection('Category').findOne({'_id':ObjectId(id)});
    res.render('admin/updateCategory',{category:category})
})
router.post('/updateCategory',requireAdmin,async(req,res)=>{
    const id = req.body.txtId;
    const name = req.body.txtName;
    const description = req.body.txtDescription;
    console.log(id);
    console.log(name);
    const db = await getDB();
    await db.collection("Category").updateOne({ _id: ObjectId(id)},{
        $set: {
            name: name,
            description: description
        }
    });
    res.redirect('category')
})
//delete category
router.get('/deleteCategory',requireAdmin,async(req,res)=>{
    const id = req.query.id;
    const db = await getDB();
    const category = await db.collection('Category').findOne({'_id':ObjectId(id)});
    for (let i = 0; i < category.news.length; i++) {
        const id = category.news[i]._id;
        await db.collection('Newspaper').deleteOne({'_id':ObjectId(id)})
    }
    await db.collection('Category').deleteOne({'_id':ObjectId(id)});
    res.redirect('/admin/category');
})

//news
router.get('/news',requireAdmin,async(req,res)=>{
    const db = await getDB();
    const allnews = await (await db.collection('Newspaper').find({}).toArray()).reverse();
    res.render('admin/news',{ data: allnews })
})
//Delete Article
router.get('/deleteArticle', requireAdmin, async (req, res) => {
    const id = req.query.id;
    const db = await getDB();
    await db.collection("Newspaper").deleteOne({ _id: ObjectId(id) });
    res.redirect("/admin/news")
})

//Most like, view
router.get('/mostView', requireAdmin, async (req, res) => {
    const db = await getDB();
    const allNews = await db.collection("Newspaper").find().sort({ view: -1 }).toArray();
    res.render("admin/news", { data: allNews });
})
router.get('/mostLike', requireAdmin, async (req, res) => {
    const db = await getDB();
    const allNews = await db.collection("Newspaper").find().sort({ like: -1 }).toArray();
    res.render("admin/news", { data: allNews });
})




module.exports = router;