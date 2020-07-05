const mongoose = require('mongoose');

const fileHelper = require('../util/file');
const Product = require("../models/product");
const { validationResult } = require("express-validator");
exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errMessage: 'Attached file is not an image',
      validationErrors: []
    })
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const imageURL = image.path

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageURL: imageURL,
    userId: req.user, //we can pass an user obj here, via ref, mongoose only get user._id
  });

  product
    .save() //this save() from mongoose, we don't need to write it
    .then((result) => {
      console.log("Created a product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        hasError: false,
        errMessage: null,
        validationErrors: []
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedimage = req.file;
  const updatedDesc = req.body.description;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        // imageURL: updatedimageURL,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (updatedimage) {
        fileHelper.deleteFile(product.imageURL);
        product.imageURL = image.path;      
      }
      /*
    product.save() will now not be a javascript object with the data but we will have a full 
    mongoose object here with all the mongoose methods like save and if we call save on an 
    existing object, it will not be saved as a new one but the changes will be saved, so it will 
    automatically do an update behind the scenes.
    */
      return product.save().then((result) => {
        console.log("Updated product");
        res.redirect("/admin/products");
      });
    })
    .catch((err) => {
      // return res.redirect("/500");
      /*
      when we call next with an error passed as an argument, then we actually let express know that
      an error occurred and it will skip all other middlewares and move right away to an error 
      handling middleware. So next error is the trick here with an error object being passed 
      instead of throwing it.
      */
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  /*
  this catch block would catch errors both for this first promise here 
  and for the second promise. This then block will now handle any success 
  responses from this save promise here
  */
};

exports.getProducts = (req, res, next) => {
  /* mongoose gives us this method to get an array of products. If you know you will
    query a large amounts of data, you should turn it into a cursor by adding find().cursor().then()
    or use pagination later
    Populate allows you to tell mongoose to populate a certain field with all the detail information 
    and not just the ID
  */
  Product.find({ userId: req.user._id }) //only show products created by the current user
    // .select("title price -_id") //only show these field
    // .populate("userId", "name") //without 'name', this method will show User with full properties instead of only
    //id. But with 'name', it shows id and name
    .then((products) => {
      // console.log(products);
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return next(new Error('Product not found.'));
      }
      fileHelper.deleteFile(product.imageURL);
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log("Destroyed product");
      res.status(200).json({ message: 'Success!' });
    })
    .catch((err) => {
      res.status(500).json({ message: 'Deleting product failed.' });
    });
};
