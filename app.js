require('dotenv').config();

const bodyParser   = require('body-parser');
const cookieParser = require('cookie-parser');
const express      = require('express');
const favicon      = require('serve-favicon');
const hbs          = require('hbs');
const mongoose     = require('mongoose');
const logger       = require('morgan');
const path         = require('path');


const session         = require("express-session");
const bcrypt          = require("bcrypt");
const passport        = require("passport");
const LocalStrategy   = require("passport-local").Strategy;
const User            = require("./models/Usuario");
const flash           = require("connect-flash");



// app.js
mongoose.Promise = Promise;

mongoose
  .connect(process.env.MONGODB, {useNewUrlParser: true})
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(session({
  secret: "our-passport-local-strategy-app",
  resave: true,
  saveUninitialized: true
}));


passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

app.use(flash());

passport.use(new LocalStrategy({ passReqToCallback: true}, (req, username, password, next) => {

  User.findOne({ username}, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(null, false, { message: "Usuario Incorrecto" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return next(null, false, { message: "Contraseña incorrecta" });
    }

    return next(null, user);
  });
}));

app.use(passport.initialize());
app.use(passport.session());

// Express View engine setup

app.use(require('node-sass-middleware')({
  src:  path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'logo.ico')));



// default value for title local
app.locals.title = 'Express - Generated with IronGenerator';


const perfil = require('./routes/perfil')
app.use('/', perfil);

const navegar = require('./routes/navegar');
app.use('/', navegar);

const authRoutes = require("./routes/auth-routes");
app.use('/', authRoutes);

const siteRoutes = require('./routes/siteRoutes')
app.use('/', siteRoutes);

const storeProds = require('./routes/storeprods')
app.use('/', storeProds);




module.exports = app;
