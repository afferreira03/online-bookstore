const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'Shop',
                path: '/products',
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
};

exports.getProduct = (req, res, next) => {
    const productId = req.params.productId;
    Product.findById(productId)
        .then((product) => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.tittle,
                path: '/products',
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch((err) => {
            console.log(err);
        });
}

exports.getIndex = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                isAuthenticated: req.session.isLoggedIn ? true : false,
                csrfToken: req.csrfToken()
            });
        })
        .catch(err => console.log(err));
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
                products: products,
                isAuthenticated: req.session.isLoggedIn
            });
        }).
        catch(err => console.log(err));
}

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            res.redirect("/cart");
        })
}

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    req.user.removeFromCart(prodId)
        .then(rersult => {
            res.redirect('/cart')
        })
        .catch(err => console.log(err));
}

exports.getOrders = (req, res, next) => {
    Order.find({'user.userId': req.session.user._id})
        .populate('products.product')
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'Orders',
                path: '/orders',
                orders: orders,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
}

exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {
        pageTitle: 'Shop Cart',
        path: '/checkout',
        isAuthenticated: req.session.isLoggedIn
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
                    name: req.user.email,
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
        .catch(err => console.log(err));
}