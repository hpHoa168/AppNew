const express = require('express')
const { ObjectId } = require('mongodb')
const { getDB} = require('../databaseHandle')
const { requireUser } = require('../middleware')
const bodyParser = require('body-parser');
var appRoot = require('app-root-path');
const async = require('hbs/lib/async');
const multer = require('multer')
const path = require('path')
const router = express.Router()

router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())

router.get('/', requireUser, async (req, res) => {
    const acc = req.session["User"]
    const db = await getDB();
    const allnews = await (await db.collection('Newspaper').find({}).toArray()).reverse();
    const user = await db.collection('User').findOne({ 'username': acc.name });

    const a = allnews[0]
    const b = allnews[1]
    const c = allnews[2]

    var x = allnews.length + 1;
    const h = allnews.slice(3, x)

    const category = await db.collection('Category').find({}).toArray();

    var groupCategory = []

    for (let i = 0; i < category.length; i++) {
        const allnews = await db.collection('Newspaper').find({ category: category[i].name }).toArray();
        groupCategory.push(allnews)
    }

    res.render('user/indexUser', { user: user, item1: a, item2: b, item3: c, data: h,category:category, group: groupCategory })
})
router.get('/indexUser', requireUser, async (req, res) => {
    const acc = req.session["User"]
    const db = await getDB();
    const allnews = await db.collection('Newspaper').find({}).toArray();
    const user = await db.collection('User').findOne({ 'username': acc.name });
    res.render('user/indexUser', { data: allnews, user: user })
})

//profile user
router.get('/infoUser', requireUser, async (req, res) => {
    const acc = req.session["User"]
    const db = await getDB();
    const user = await db.collection('User').findOne({ 'username': acc.name });
    res.render("user/infoUser", { data: user })
})

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

//update profile user
router.get('/updateUser', requireUser, async (req, res) => {
    const acc = req.session["User"]
    const db = await getDB();
    const user = await db.collection('User').findOne({ 'username': acc.name });
    res.render("user/updateUser", { data: user })
})
router.post('/updateUser',upload.single('folderImages'), requireUser, async (req, res) => {
    const id = req.body.txtId;
    const file = req.file;
    const name = req.body.txtName;
    const age = req.body.txtAge;
    const email = req.body.txtEmail;
    const phone = req.body.txtPhone;
    const address = req.body.txtAddress;
    const filter = { _id: ObjectId(id) }
    const updateUser = {
        $set: {
            files: file,
            name: name,
            age: age,
            email: email,
            phone: phone,
            address: address
        }
    }

    const db = await getDB();
    await db.collection('User').updateOne(filter, updateUser);
    
    res.redirect("/user/infoUser")
})


//Charge money 
router.get('/chargeMoney', requireUser, async (req, res) => {
    res.render("user/chargeMoney")
})
router.post('/chargeMoney', requireUser, async (req, res) => {
    const acc = req.session["User"]
    const db = await getDB();
    const user = await db.collection('User').findOne({ 'username': acc.name })

    const qr = req.body.txtSelect;
    var coin = user.coin;
    if (qr == "20000") {
        coin += 16;
    } else if (qr == "50000") {
        coin += 40;
    } else if (qr == "100000") {
        coin += 80;
    } else if (qr == "200000") {
        coin += 160;
    } else if (qr == "500000") {
        coin += 400;
    }

    await db.collection('User').updateOne({ 'username': acc.name }, {
        $set: {
            coin: coin
        }
    })

    res.redirect("/user/")
})



module.exports = router;