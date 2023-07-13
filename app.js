const express = require('express');
const session = require('express-session')
const { getDB, getRole, insertObject, ObjectId } = require('./databaseHandle');

const app = express()

app.set('view engine', 'hbs')
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.use("/images", express.static('images'))

app.use(session({ secret: '124447yd@@$%%#', cookie: { maxAge: 900000 }, saveUninitialized: false, resave: false }))

// index homepage
app.get('/', async (req, res) => {
    const acc = req.session.Acc;
    const db = await getDB();
    const allnews = await (await db.collection('Newspaper').find({}).toArray()).reverse();
    var user;
    var checkLogin = new Boolean(true)
    var checkUserLogin = new Boolean(true);
    var checkWriterLogin = new Boolean(true);

    if (acc != null) {
        if (acc.role == "User") {
            user = await db.collection('User').findOne({ 'username': acc.name });
            checkUserLogin = Boolean(true);
            checkWriterLogin = Boolean(false);
        }
        if (acc.role == "Writer") {
            user = await db.collection('Writer').findOne({ 'username': acc.name });
            checkWriterLogin = Boolean(true);
            checkUserLogin = Boolean(false);
        }
        checkLogin = Boolean(false);
    } else {
        checkLogin = Boolean(true);
        checkUserLogin = Boolean(false);
        checkWriterLogin = Boolean(false);
    }

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

    res.render('index', {
        user: user, item1: a, item2: b, item3: c, data: h, category: category, group: groupCategory,
        checkUserLogin: checkUserLogin, checkWriterLogin: checkWriterLogin, checkLogin: checkLogin
    })
})

//register account
app.get('/register', async (req, res) => {
    res.render("register");
})
app.post('/register', async (req, res) => {
    const username = req.body.txtUsername;
    const password = req.body.txtPassword;
    var coin = 0;
    const role = req.body.txtSelect;

    const newAccount = {
        username: username,
        password: password,
        role: role
    }

    if (role == "Writer") {
        insertObject('Account', newAccount)
    } else if (role == "User") {
        insertObject('Account', newAccount)
    }

    res.redirect('/');
})

//session cockie
app.use(session({
    key: 'user_id',
    secret: '124447yd@@$%%#',
    cookie: { maxAge: 900000 },
    saveUninitialized: false,
    resave: false
}))

//login
app.get('/login', (req, res) => {
    res.render('login')
})
app.post('/login', async (req, res) => {
    const name = req.body.txtUsername;
    const pass = req.body.txtPassword;
    const role = await getRole(name, pass);
    const db = await getDB();
    const user = await db.collection('Account').findOne({ $and: [{ username: name }, { password: pass }] });
    if (user) {
        req.session.Acc = {
            _id: user._id,
            name: name,
            role: role
        }
    }
    if (role == -1) {
        res.redirect('/login')
    } else if (role == "Admin") {
        req.session["Admin"] = {
            _id: user._id,
            name: name,
            role: role
        }
        res.redirect('admin')

    } else if (role == "Manager") {
        req.session["Manager"] = {
            _id: user._id,
            name: name,
            role: role
        }
        res.redirect('manager')
    } else if (role == "Writer") {
        req.session["Writer"] = {
            _id: user._id,
            name: name,
            role: role
        }
        res.redirect('/')
    } else if (role == "User") {
        req.session["User"] = {
            _id: user._id,
            name: name,
            role: role
        }
        res.redirect('/')
    }
})

//logout
app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

// detail newspaper
app.get('/detailNewsOfWriter', async (req, res) => {
    const account = req.session.Acc;
    const id = req.query.id;
    var user;

    const db = await getDB();
    const news = await db.collection("Newspaper").findOne({ _id: ObjectId(id) })
    const writer = await db.collection("Writer").findOne({ _id: ObjectId(news.idWriter) })
    const allnews = await db.collection('Newspaper').find({}).toArray();
    const category = await db.collection('Category').find({}).toArray();

    const hotNews = allnews.slice(0, 5)

    var checkLogin = "";
    var checkUser = new Boolean(true);
    var checkSub1 = new Boolean(true);
    var checkSub2 = new Boolean(true);
    var checkLike1 = new Boolean(true);
    var checkLike2 = new Boolean(true);
    //check login

    if (account != null) {
        console.log(account);
        console.log(account.role);
        if (account.role == "User") {
            user = await db.collection('User').findOne({ 'username': account.name })
            checkUser = Boolean(false);

            //check subscribe
            const x = await db.collection("Writer").findOne({ $and: [{ _id: ObjectId(news.idWriter) }, { 'subcribe': user._id }] })
            if (x != null) {
                checkSub1 = Boolean(false)
            } else {
                checkSub2 = Boolean(false)
            }

            //check like
            const y = await db.collection("Newspaper").findOne({ $and: [{ _id: ObjectId(id) }, { 'like': user._id }] })
            if (y != null) {
                checkLike1 = Boolean(false)
            } else {
                checkLike2 = Boolean(false)
            }
        }
        if (account.role == "Writer") {
            user = await db.collection('Writer').findOne({ 'username': account.name })
            checkUser = Boolean(false);

            //check subscribe
            const x = await db.collection("Writer").findOne({ $and: [{ _id: ObjectId(news.idWriter) }, { 'subcribe': user._id }] })
            if (x != null) {
                checkSub1 = Boolean(false)
            } else {
                checkSub2 = Boolean(false)
            }

            //check like
            const y = await db.collection("Newspaper").findOne({ $and: [{ _id: ObjectId(id) }, { 'like': user._id }] })
            if (y != null) {
                checkLike1 = Boolean(false)
            } else {
                checkLike2 = Boolean(false)
            }
        }

    } else {
        checkLogin = "Please login";
        checkSub1 = new Boolean(true);
        checkSub2 = new Boolean(false);
        checkLike1 = new Boolean(true);
        checkLike2 = new Boolean(false);
    }


    //increase view
    await db.collection("Newspaper").updateOne({ _id: ObjectId(id) }, { $inc: { "view": 1 } })

    let coinViews = news.view * 1 / 1000;
    await db.collection('Writer').updateOne({ _id: ObjectId(news.idWriter) }, {
        $set: {
            coinViews: coinViews
        }
    })

    //show latest comment
    const comment = news.comment.reverse();

    res.render("detailNewsOfWriter", {
        comment: comment, user: user, news: news, hotNews: hotNews, writer: writer, checkLogin: checkLogin, checkUser: checkUser,
        category: category, checkSub1: checkSub1, checkSub2: checkSub2, checkLike1: checkLike1, checkLike2: checkLike2
    })
})

//show news of each category
app.get('/newsOfCategory', async (req, res) => {
    const id = req.query.id;
    const d = new Date();
    const acc = req.session.Acc;
    var user;
    var checkLogin = new Boolean(true);

    const db = await getDB();
    const category = await db.collection("Category").findOne({ '_id': ObjectId(id) });
    const categoryAll = await db.collection('Category').find({}).toArray();
    const newsOfCategory = await db.collection("Newspaper").find({ category: category.name }).toArray();

    //Check login
    if (acc != null) {
        checkLogin = Boolean(false);
    } else {
        checkLogin = Boolean(true);
    }
    //show news have most view in 3 months
    const hotNews = [];
    for (let i = 0; i < newsOfCategory.length; i++) {
        const news = newsOfCategory[i];
        const newsDate = newsOfCategory[i].date;
        let day = newsDate.slice(0, 2);
        let month = newsDate.slice(3, 5);
        let year = newsDate.slice(6, 11);
        let valueOfday = day - d.getDate();
        let valueOfmonth = d.getMonth() + 1 - month.valueOf();
        let valueOfyear = d.getFullYear() - year;
        if (valueOfyear == 0) {
            if (valueOfmonth < 3) {
                hotNews.push(news);
            } else if (valueOfmonth == 3) {
                if (valueOfday > 0 || valueOfday == 0) {
                    hotNews.push(news);
                } else {
                    console.log("Out of date");
                }
            } else {
                console.log("Out of month");;
            }
        } else {
            console.log("Out of year");
        }
    }
    for (let i = 0; i < hotNews.length - 1; i++) {
        for (let j = i; j < hotNews.length; j++) {
            if (hotNews[j].view > hotNews[i].view) {
                let temp = hotNews[i].view;
                hotNews[i].view = hotNews[j].view;
                hotNews[j].view = temp;
            }
        }
    }

    res.render("newsOfCategory", { data: newsOfCategory, newsOfHotNews: hotNews, category: categoryAll, checkLogin: checkLogin })
})

//Comment newspaper
app.post("/user-comment", async (req, res) => {
    console.log("connected comment");
    const account = req.session.Acc;

    const id = req.body.newsID;
    const comment = req.body.comment;
    const date = req.body.date;

    const db = await getDB();
    var user;
    user = await db.collection('User').findOne({ 'username': account.name })
    if (user != null) {
        await db.collection('Newspaper').updateOne({ _id: ObjectId(id) }, {
            $push: {
                'comment': {
                    "_id": ObjectId(),
                    "user": {
                        "_id": user._id,
                        "name": user.name
                    },
                    "comments": comment,
                    "date": date,
                    "reply": []
                }
            }
        })
    }
    return;
})

//reply comment
app.post("/user-reply-comment", async (req, res) => {
    console.log("connected reply");
    const account = req.session.Acc;
    const newsID = req.body.newsID;
    const commentID = req.body.commentID;
    const date = req.body.date;
    const reply = req.body.reply;

    const db = await getDB();
    var user;
    user = await db.collection('User').findOne({ 'username': account.name })
    if (user != null) {
        await db.collection('Newspaper').updateOne({ _id: ObjectId(newsID), 'comment._id': ObjectId(commentID) }, {
            $push: {
                "comment.$.reply": {
                    "_id": ObjectId(),
                    "user": {
                        "_id": user._id,
                        "name": user.name
                    },
                    "reply": reply,
                    "date": date
                }
            }
        })
    }
    return;

})

//subcribe writer
app.post("/user-sub", async (req, res) => {
    console.log("connected subcribe");
    const account = req.session.Acc;
    const writerID = req.body.writerID;

    const db = await getDB();
    var user;
    if (account.role == "User") {
        user = await db.collection('User').findOne({ 'username': account.name })
    }
    if (account.role == "Writer") {
        user = await db.collection('Writer').findOne({ 'username': account.name })
    }
    const writer = await db.collection('Writer').findOne({ _id: ObjectId(writerID) })
    var coin = writer.coinSub;

    if (user != null) {
        const x = await db.collection('Writer').findOne({ $and: [{ _id: ObjectId(writerID) }, { 'subcribe': user._id }] });
        if (x == null) {
            coin = coin + 2;
            await db.collection('Writer').updateOne({ _id: ObjectId(writerID) }, {
                $push: {
                    'subcribe': user._id
                }
            })
            await db.collection('Writer').updateOne({ _id: ObjectId(writerID) }, {
                $set: {
                    coinSub: coin
                }
            })
        } else {
            coin = coin - 2;
            await db.collection('Writer').updateOne({ _id: ObjectId(writerID) }, {
                $pull: {
                    'subcribe': user._id
                }
            })
            await db.collection('Writer').updateOne({ _id: ObjectId(writerID) }, {
                $set: {
                    coinSub: coin
                }
            })
        }
    }
})

//like newspaper
app.post("/user-like", async (req, res) => {
    console.log("connected like");
    const account = req.session.Acc
    const id = req.body.newsID;

    const db = await getDB();
    var user;
    user = await db.collection('User').findOne({ 'username': account.name })
    if (user != null) {
        const x = await db.collection('Newspaper').findOne({ $and: [{ _id: ObjectId(id) }, { 'like': user._id }] });
        if (x == null) {
            await db.collection('Newspaper').updateOne({ _id: ObjectId(id) }, {
                $push: {
                    'like': user._id
                }
            })
        } else {
            await db.collection('Newspaper').updateOne({ _id: ObjectId(id) }, {
                $pull: {
                    'like': user._id
                }
            })
        }
    }

})

//controller
const adminController = require('./controller/admin')
app.use('/admin', adminController)

const userController = require('./controller/user')
app.use('/user', userController)

const writerController = require('./controller/writer');
const async = require('hbs/lib/async');
app.use('/writer', writerController)

const PORT = process.env.PORT || 2001;
app.listen(PORT)
console.log("app running is: ", PORT)