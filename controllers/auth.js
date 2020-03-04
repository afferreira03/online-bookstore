const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    res.render('auth/login',{ 
        pageTitle: 'Login',
        path: '/login',
        isAthenticaded: req.session.isLoggedIn
    });
};


exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    User.findById('5e5d47a143a86b3accd09c3a')
    .then(user => {
        req.session.isLoggedIn = true;
        req.session.user = user;
        res.redirect('/');
    })
    .catch(err => console.log(err));
};