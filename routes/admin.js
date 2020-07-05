const path = require('path');
const express = require("express");
const { body } = require("express-validator");
const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");
const router = express.Router();

router.get("/add-product", isAuth, adminController.getAddProduct); // go from left to right

router.post(
  "/add-product",
  [
    body(
      "title",
      "Please enter a title with minimum 10 characters and maximum 20 characters"
    )
    .isString()  
    .isLength({ min: 10, max: 20 })
      .trim(),
    // body("imageURL").isURL(),
    body("price").isFloat({ gt: 0 }),
    body(
      "description",
      "Please enter a description with minimum 10 characters and maximum 100 characters"
    )
      .isLength({ min: 10, max: 400 })
      .trim(),
  ],
  isAuth,
  adminController.postAddProduct
);

router.get("/products", isAuth, adminController.getProducts);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  [
    body(
      "title",
      "Please enter a title with minimum 10 characters and maximum 20 characters"
    )
      .isString()
      .isLength({ min: 10, max: 20 })
      .trim(),
    // body("imageURL").isURL(),
    body("price").isFloat({ gt: 0 }),
    body(
      "description",
      "Please enter a description with minimum 10 characters and maximum 100 characters"
    )
      .isLength({ min: 10, max: 400 })
      .trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
