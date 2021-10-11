const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit')
const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'Shop',
                path: '/products'
            });
        })
        .catch(err =>{
            next(new Error(err));
        });
};

exports.getProduct = (req, res, next) => {
    const productId = req.params.productId;
    Product.findById(productId)
        .then((product) => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.tittle,
                path: '/products'
            });
        })
        .catch((err) => {
            next(new Error(err));
        });
}

exports.getIndex = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/'
            });
        })
        .catch(err => {
            next(new Error(err));
        });
}

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products
            });
        }).
        catch(err => {
            next(new Error(err));
        });
}

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            res.redirect("/cart");
        }).catch(err => {
            next(new Error(err));
        })
}

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    req.user.removeFromCart(prodId)
        .then(rersult => {
            res.redirect('/cart')
        })
        .catch(err => {
            next(new Error(err));
        });
}

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.session.user._id })
        .populate('products.product')
        .then(orders => {
            res.render('shop/orders', { 
                pageTitle: 'Orders',
                path: '/orders',
                orders: orders
            });
        })
        .catch(err => {
            next(new Error(err));
        });
}

exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {
        pageTitle: 'Shop Cart',
        path: '/checkout'
    });
}

exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(i => {
                return { product: { ...i.productId._doc }, quantity: i.quantity };
            });

            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.session.user
                },
                products: products
            });

            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            next(new Error(err));
        });
}

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);
    
    Order.findById(orderId)
    .then(order => {
        if(!order){
            return next(new Error('Order not found!'));
        }

        if(order.user.userId.toString() != req.user._id.toString()){
            return next(new Error('Unauthorized.'));
        }

        const pdfDoc = new PDFDocument();
        res.setHeader('Content-type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="'+ invoiceName +'"');

        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text("Invoice", {
            underline: true
        });
        pdfDoc.text('-------------------------------------');
        pdfDoc.fontSize(14);
        let totalPrice = 0;

        order.products.forEach(prod => {
            totalPrice += prod.quantity * prod.product.price;

            pdfDoc.text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$'+prod.product.price);
        });
        pdfDoc.fontSize(26).text('-------------------------------------');
        pdfDoc.fontSize(20).text('Total price: $' + totalPrice);
        pdfDoc.end();

    })
    .catch(err => next(err));
}