const passport = require('passport');
const JWTStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local').Strategy;
const { JWT_SECRET } = require('./config');
const User = require('./models/user');

// JWT Strategy
passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: JWT_SECRET
}, async (payload, done) => {
    try {
        const lUser = await User.findById(payload.sub);
        const user = lUser.getUser();
        if (!user) {
            return done(null, false);
        }

        done(null, user);
    } catch (error) {
        done(error, false);
    }
}));

// Local Strategy
passport.use(new LocalStrategy({
    usernameField: 'email'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        const iUser = user.getUser();
        if (!user) {
            return done(null, false);
        }

        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            done(null, false);
        }

        done(null, iUser);
    } catch (error) {
        done(error, false);
    }

}));