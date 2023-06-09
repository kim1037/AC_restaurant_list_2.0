const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/user");
const bcrypt = require("bcryptjs");
module.exports = (app) => {
  // initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  // set local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passReqToCallback: true },
      (req, email, password, done) => {
        User.findOne({ email })
          .then((user) => {
            if (!user) {
              return done(
                null,
                false,
                req.flash("warning_msg", "That email is not registed!")
              );
            }
            return bcrypt.compare(password, user.password).then((isMatch) => {
              if (!isMatch) {
                return done(
                  null,
                  false,
                  req.flash("warning_msg", "That password is not corret!")
                );
              }
              return done(null, user);
            });
          })
          .catch((e) => done(e, false));
      }
    )
  );
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ["email", "displayName"],
      },
      (accessToken, refreshToken, profile, done) => {
        const { name, email } = profile._json;
        User.findOne({ email })
          .then((user) => {
            if (user) return done(null, user);
            const randomPassword = Math.random().toString(36).slice(-8);
            bcrypt
              .genSalt(10)
              .then((salt) => bcrypt.hash(randomPassword, salt))
              .then((hash) =>
                User.create({ name, email, password: hash })
                  .then((user) => done(null, user))
                  .catch((e) => done(e, false))
              );
          })
          .catch((e) => console.log(e));
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    User.findById(id)
      .lean()
      .then((user) => done(null, user))
      .catch((e) => done(e, null));
  });
};
