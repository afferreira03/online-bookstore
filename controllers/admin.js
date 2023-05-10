const Product = require("../models/product");
const fileHelper = require('../util/file');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');


exports.getAddProduct = (req, res, next) => {
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);

    if(!image){
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/edit-product",
            editing: false,
            product: {
                title: title,
                price: price,
                description: description
            },
            hasError: true,
            errorMessage: 'It\'s not a valid image format.',
            validationErrors: []
        });        
    }

    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/edit-product",
            editing: false,
            product: {
                title: title,
                price: price,
                description: description
            },
            hasError: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }
    const imgUrl = image.path.replace(/\\/g, '/');
    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imgUrl,
        userId: req.session.user,
    });

    product
        .save()
        .then((result) => {
            console.log("Product created.");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            next(new Error(err));
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    const prodId = req.params.productId;

    if (!editMode) {
        return res.redirect("/");
    }

    Product.findById(prodId)
        .then((product) => {
            if (!product) {
                res.redirect("/");
            }
            res.render("admin/edit-product", {
                pageTitle: "Edit Product",
                path: "/admin/edit-product",
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validationErrors: []
            });
        })
        .catch((err) =>{
            next(new Error(err));
        });
};

exports.postEditProduct = (req, res, next) => {
    const id = req.body.id;
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/edit-product",
            editing: editMode,
            product: {
                _id: id,
                title: title,
                price: price,
                description: description
            },
            hasError: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    Product.findById(id)
        .then((product) => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }

            product.title = title;
            product.price = price;
            product.description = description;
            if(image){
                fileHelper.deleteFile(product.imageUrl)
                product.imageUrl = image.path.replace(/\\/g, '/');
            }
            return product
                .save()
                .then((result) => {
                    res.redirect("/admin/products");
                });
        })
        .catch((err) =>{
            next(new Error(err));
        });
};

exports.deleteProductById = (req, res, next) => {
    const prodId = req.params.productId;

    Product.findById(prodId)
        .then(prod => {
            if(!prod) {
                return next(new Error('Product not found'));
            }
            fileHelper.deleteFile(prod.imageUrl)
            return Product.deleteOne({_id: prodId, userId: req.user._id});
        })
        .then(() => {
            console.log('PRODUCT DELETED');
            res.status(200).json({ message: 'Success!!' });
        })
        .catch((err) => {
            res.status(500).json({ message: 'Delete product failed.' });
        });
};

exports.getAdminProducts = (req, res, next) => {
    Product.find({
        userId: req.user._id
    })
        .then((products) => {
            res.render("admin/products", {
                prods: products,
                pageTitle: "Admin Products",
                path: "/admin/products"
            });
        })
        .catch((err) => {
            next(new Error(err));
        });
};