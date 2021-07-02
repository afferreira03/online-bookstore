const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
//const sendGridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const User = require('../models/user');

// const transporter = nodemailer.createTransport(sendGridTransport({
//     auth: {
//         api_key: ""
//     }
// }));

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');

    if (message.length > 0) {
        message = message[0]
    } else {
        message = 0;
    }

    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: message,
        oldInputs: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');

    if (message.length > 0) {
        message = message[0]
    } else {
        message = 0;
    }

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInputs: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array()[0]);
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            oldInputs: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    pageTitle: 'Login',
                    path: '/login',
                    errorMessage: 'Invalid email or password.',
                    oldInputs: {
                        email: email,
                        password: password
                    },
                    validationErrors: []
                });
            }

            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            res.redirect('/');
                        });
                    } else {
                        return res.status(422).render('auth/login', {
                            pageTitle: 'Login',
                            path: '/login',
                            errorMessage: 'Invalid email or password.',
                            oldInputs: {
                                email: email,
                                password: password
                            },
                            validationErrors: []
                        });
                    }
                })
                .catch(err => {
                    throw new Error(err)
                });
        })
        .catch(err => {
            next(new Error(err));
        });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array()[0]);
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInputs: {
                email: email,
                password: password,
                confirmPassword: ''
            },
            validationErrors: errors.array()
        });
    }

    return bcrypt.hash(password, 12)
        .then(hashpassword => {
            const user = new User({
                email: email,
                password: hashpassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            next(new Error(err));
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/')
    });
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error');

    if (message.length > 0) {
        message = message[0]
    } else {
        message = 0;
    }

    res.render('auth/reset', {
        pageTitle: 'Reset Passaword',
        path: '/reset',
        errorMessage: message
    });
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }

        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then((user) => {
                if (!user) {
                    req.flash('error', 'There is no matching account to this email.');
                    return res.redirect('/reset');
                }

                user.resetToken = token;
                user.resetTokenExpiration = new Date() + 3600000;
                return user.save()
            })
            .then((result) => {
                res.redirect('/');
                // transporter.sendMail({
                //     to: 'alan.fferreira03@gmail.com',
                //     from: 'shop@node-complete.com',
                //     subject: 'Password Reset',
                //     html: `
                //         <p>You request a password reset.</p>
                //         <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset your password</p>
                //     `
                // });
            })
            .catch(err => { 
                next(new Error(err));
             });
    });
}

exports.getNewPassword = (req, res, next) => {
    const token = req.param.token;

    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: new Date() } })
        .then(user => {
            let message = req.flash('error');

            if (message.length > 0) {
                message = message[0]
            } else {
                message = 0;
            }

            res.render('auth/new-password', {
                pageTitle: 'New Passaword',
                path: '/new-password',
                errorMessage: message,
                userId: user._id.toString(),
                resetToken: token
            });
        })
        .catch(err => {
            next(new Error(err));
        });
}

exports.postNewPassword = (req, res, next) => {
    const passwordToken = req.body.passwordToken;
    const userId = req.body.userId;
    const newPassword = req.body.newPassword;
    let resetUser;

    User.findOne({
        _id: userId,
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: new Date() }
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashpassword => {
            resetUser.password = hashpassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            next(new Error(err));
        });
}
