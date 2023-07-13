const express = require('express')
const { render, send } = require('express/lib/response')
const async = require('hbs/lib/async')
const { ObjectId, MaxKey } = require('mongodb')
const { getDB, insertObject } = require('../databaseHandle')
const { requireWriter } = require('../middleware')
const multer = require('multer')
const path = require('path')
const res = require('express/lib/response')

const router = express.Router()

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

//writer info
router.get('/infoWriter', requireWriter, async (req, res) => {
    const acc = req.session["Writer"]
    const db = await getDB();
    const writer = await db.collection('Writer').findOne({ 'username': acc.name });
    res.render("writer/infoWriter", { data: writer })
})

//update writer info
router.get('/updateWriter', requireWriter, async (req, res) => {
    const acc = req.session["Writer"]
    const db = await getDB();
    const writer = await db.collection('Writer').findOne({ 'username': acc.name });
    res.render("writer/updateWriter", { data: writer })
})
router.post('/updateWriter', upload.single('folderImages'), requireWriter, async (req, res) => {
    const id = req.body.txtId;
    const file = req.file;
    const name = req.body.txtName;
    const age = req.body.txtAge;
    const email = req.body.txtEmail;
    const phone = req.body.txtPhone;
    const address = req.body.txtAddress;
    const subcribe = [];
    var coinSub = 0;
    var coinViews = 0;
    var coinTotal = 0;
    const filter = { _id: ObjectId(id) }
    const updateUser = {
        $set: {
            files: file,
            name: name,
            age: age,
            email: email,
            phone: phone,
            address: address,
            subcribe: subcribe,
            coinSub: coinSub,
            coinViews: coinViews,
            coinTotal: coinTotal
        }
    }

    const db = await getDB();
    await db.collection('Writer').updateOne(filter, updateUser);
    res.redirect("/writer/infoWriter")
})

//upload article
router.get('/uploadNews', requireWriter, async (req, res) => {
    const db = await getDB();
    const category = await db.collection('Category').find({}).toArray();
    res.render("writer/uploadNews", { category: category })
})
router.post('/uploadNews', upload.single('folderImages'), requireWriter, async (req, res) => {
    const acc = req.session["Writer"]
    const db = await getDB();
    const writerName = await db.collection('Writer').findOne({ 'username': acc.name });
    const nameWriter = writerName.name;
    const idWriter = writerName._id;
    const title = req.body.txtTitle;
    const text = req.body.txtContent;
    const files = req.file;
    const like = [];
    const dislike = [];
    const view = 0;
    const comment = [];
    const category = req.body.txtSelect;

    //date time current
    const d = new Date();
    var minutes = d.getMinutes();
    var months = d.getMonth() + 1;
    var days = d.getDate();
    var formatDate = ""
    if (months > 9) {
        if (days > 9) {
            if (minutes > 9) {
                formatDate = [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('/') + ' ' + [d.getHours(), d.getMinutes()].join(':')
            } else {
                var minutes = '0' + minutes;
                formatDate = [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('/') + ' ' + [d.getHours(), minutes].join(':')
            }
        } else {
            days = '0' + days;
            if (minutes > 9) {
                formatDate = [days, d.getMonth() + 1, d.getFullYear()].join('/') + ' ' + [d.getHours(), d.getMinutes()].join(':')
            } else {
                var minutes = '0' + minutes;
                formatDate = [days, d.getMonth() + 1, d.getFullYear()].join('/') + ' ' + [d.getHours(), minutes].join(':')
            }
        }
    } else {
        months = '0' + months;
        if (days > 9) {
            if (minutes > 9) {
                formatDate = [d.getDate(), months, d.getFullYear()].join('/') + ' ' + [d.getHours(), d.getMinutes()].join(':')
            } else {
                var minutes = '0' + minutes;
                formatDate = [d.getDate(), months, d.getFullYear()].join('/') + ' ' + [d.getHours(), minutes].join(':')
            }
        } else {
            days = '0' + days;
            if (minutes > 9) {
                formatDate = [days, months, d.getFullYear()].join('/') + ' ' + [d.getHours(), d.getMinutes()].join(':')
            } else {
                var minutes = '0' + minutes;
                formatDate = [days, months, d.getFullYear()].join('/') + ' ' + [d.getHours(), minutes].join(':')
            }
        }
    }
    const date = formatDate;

    const uploadNews = {
        _id:ObjectId(),
        writer: nameWriter,
        idWriter: idWriter,
        date: date,
        title: title,
        text: text,
        category: category,
        view: view,
        like: like,
        comment: comment,
        files: files
    }

    await db.collection("Category").updateOne({ name: category }, {
        $push: {
            news: uploadNews
        }
    })

    insertObject('Newspaper', uploadNews)
    res.redirect('articlesUploaded')
})

//Notification
router.get('/notification', requireWriter, async (req, res) => {
    const accWriter = req.session['Writer'];
    const db = await getDB();
    const writer = await db.collection('Writer').findOne({ 'username': accWriter.name });
    const allnews = await db.collection('Newspaper').find({ 'idWriter': writer._id }).toArray();

    var notificationComment = []
    var notificationReply = []

    for (let i = 0; i < allnews.length; i++) {
        for (let j = 0; j < allnews[i].comment.length; j++) {

            const comment = allnews[i].comment;
            const a = comment[j].user.name;
            const b = comment[j].comments;
            const rep = allnews[i].comment[j].reply;
            if (a != null) {
                var notificationCommentLoop = a + ' commented ' + '"' + b + '"' + ' on your article with the title "' + allnews[i].title + '"';
                notificationComment.push({notificationCommentLoop})
            }
            for (let e = 0; e < rep.length; e++) {
                const repName = rep[e].user.name;
                const repContent = rep[e].reply;
                var notificationReplyLoop = repName + ' replied to ' + '"' + a + '"' + ' comment with the content ' + '"' + repContent + '"'
                    + ' on your article with the title "' + allnews[i].title + '"';
                notificationReply.push({notificationReplyLoop})
            }
        }
    }
    res.render('writer/notification',{notificationComment:notificationComment,notificationReply:notificationReply})
})

//Detail article in UI writer
router.get('/detailNewsOfWriter', async (req, res) => {
    const id = req.query.id;
    const db = await getDB();
    const news = await db.collection("Newspaper").findOne({ _id: ObjectId(id) });
    res.render("writer/detailNewsOfWriter", { news: news });
})
// Article uploaded
router.get('/articlesUploaded', requireWriter, async (req, res) => {
    const acc = req.session["Writer"]
    const db = await getDB();
    const writer = await db.collection('Writer').findOne({ 'username': acc.name });
    const allnews = await (await db.collection('Newspaper').find({ 'idWriter': writer._id }).toArray()).reverse();
    res.render('writer/articlesUploaded', { data: allnews })
})

//Delete Article
router.get('/deleteArticle', requireWriter, async (req, res) => {
    const id = req.query.id;
    const db = await getDB();
    await db.collection("Newspaper").deleteOne({ _id: ObjectId(id) });
    res.redirect("articlesUploaded")
})

//Most like, view
router.get('/mostView', requireWriter, async (req, res) => {
    const db = await getDB();
    const allNews = await db.collection("Newspaper").find().sort({ view: -1 }).toArray();
    res.render("writer/articlesUploaded", { data: allNews });
})
router.get('/mostLike', requireWriter, async (req, res) => {
    const db = await getDB();
    const allNews = await db.collection("Newspaper").find().sort({ like: -1 }).toArray();
    res.render("writer/articlesUploaded", { data: allNews });
})

module.exports = router;