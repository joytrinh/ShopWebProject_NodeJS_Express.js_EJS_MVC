const path = require("path");
const fs = require('fs')
const https = require('https')

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session); //session is a variable above
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')

const errorController = require("./controllers/error");
const shopController = require('./controllers/shop');
const isAuth = require('./middleware/is-auth');
const User = require("./models/user");

const MONGODB_URI =
  `mongodb+srv://${process.env.MONGO_USER}:${
    process.env.MONGO_PASSWORD}
    @cluster0-7dvwp.azure.mongodb.net/${
      process.env.MONGO_DEFAULT_DATABASE}
      ?authSource=admin&replicaSet=Cluster0-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true`;
const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

const csrfProtection = csrf(); // a middleware

// const privateKey = fs.readFileSync('server.key') // block code from execution until the file is read
// const certificate = fs.readFileSync('server.cert') // block code from execution until the file is read

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true); // true: accept that file
  } else cb(null, false);
};

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flag: 'a'})
// write what's going on your server
app.use(helmet())
app.use(compression())
app.use(morgan('combined', {stream: accessLogStream}))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
); // single is a single file, image is the name of input edit-product
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

app.use(flash());
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) return next();
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err)); // you can throw the error in synchronous code places but inside of
      // promise, then or catch blocks or inside of callbacks, you have to use next(new Error(err))
    });
});
app.post('/create-order', isAuth, shopController.postOrder);

app.use(csrfProtection);
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);
// If there is an error, express will skip other middleware and jump to this error middleware
// If there are > 1 error middleware, it will execute from the top to the bottom
app.use((error, req, res, next) => {
  // res.status(error.httpStatusCode).render(...) another way
  // res.redirect('/500')
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    // https.createServer({key: privateKey, cert: certificate},app).listen(process.env.PORT || 3000);
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => console.log(err));
