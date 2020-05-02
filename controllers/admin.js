const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imgUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    
    const product = new Product({
        title: title, 
        price: price, 
        description: description,
        imageUrl : imgUrl,
        userId : req.session.user
    });

    product.save()
        .then(result => {
            console.log("Product created.");
            res.redirect('/admin/products');
        })
        .catch(err => console.log(err));
};

exports.getEditProduct = (req, res, next) => {
     const editMode = req.query.edit;
     const prodId = req.params.productId;

    if (!editMode) {
        return res.redirect('/')
    }

    Product.findById(prodId)
        .then(product => {
            if(!product){
                res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: "Edit Product",
                path: '/admin/edit-product',
                editing: editMode,
                product: product
            })
        })
        .catch(err => console.log(err));
}

exports.postEditProduct = (req, res, next) => {
    const id = req.body.id;
    const title = req.body.title;
    const imgUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description

    Product.findById(id)
    .then(product => {
        product.title = title;
        product.price = price;
        product.description = description;
        product.imageUrl = imgUrl;
        return product.save();
    })
    .then(result => {
        res.redirect('/admin/products');
    })
    .catch((err) => console.log(err));
}

exports.postDeleteProductById = (req, res, next) => {
    const prodId = req.body.prodId;
    Product.findByIdAndRemove(prodId)
        .then(() => {
            console.log("PRODUCT DELETED");
            res.redirect('/admin/products');
        })
        .catch(err => console.log(err));
}

exports.getAdminProducts = (req, res, next) => {
    Product.find()
        .then(products => {
                res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products'
            });
        })
        .catch(err => console.log(err));
};