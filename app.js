const express = require('express');
const boduParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const csrf = require('csurf');
const MongodbStore = require('connect-mongodb-session')(session);

const User = require('./models/user');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorController = require('./controllers/error');

const MONGO_CONNECTION_URL = "mongodb+srv://afferreira:k90tpT74Sbwch6Ah@cluster0-vgdiw.gcp.mongodb.net/shop?retryWrites=true&w=majority";
const app = express();
const store = new MongodbStore({
    uri: MONGO_CONNECTION_URL,
    collection: 'sessions'
});
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(boduParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'Aff0319Scrt',
    resave: false,
    saveUninitialized: false,
    store: store
}));
app.use(csrfProtection);

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorController.get404);

mongoose.connect(MONGO_CONNECTION_URL)
    .then(result => {
        app.listen(3000);
    })
    .catch(err => console.log(err));