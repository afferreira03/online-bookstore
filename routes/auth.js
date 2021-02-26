const express = require('express');
const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();
const { body } = require('express-validator');

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', 
    [
        body('email')
        .isEmail()
        .withMessage('Invalid email format.')
        .normalizeEmail(),

        body('password', 'Please enter a password with only numbers and text and at least 5 characters.')
        .isLength({min : 5})
        .isAlphanumeric()
        .trim()
    ],
    authController.postLogin
);

router.post('/signup',
    [
        body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, { req }) => {
            return User.findOne({ email: value })
            .then(userDoc => {
                if (userDoc) {
                    return Promise.reject('E-Mail exists already, please pick a different one.')
                }
            });
        })
        .normalizeEmail(),
        
        body('password', 'Please enter a password with only numbers and text and at least 5 characters.')
        .isLength({min : 5})
        .isAlphanumeric()
        .trim(),
        
        body('confirmPassword')
        .custom((value, { req }) => {
            if(value !== req.body.confirmPassword){
                throw new Error('Password does not match.');
            }
            return true;
        })
        .trim()
    ],
    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;