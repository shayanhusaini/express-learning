const router = require('express-promise-router')();
const passport = require('passport');
const passportConf = require('../passport');

const UsersController = require('../controllers/users');
const { validateParam, schemas, validateBody } = require('../helpers/routeHelpers');

router.route('/')
    .get(UsersController.index)
    .post(validateBody(schemas.userSchema), UsersController.newUser);

router.route('/signin')
    .post(passport.authenticate('local', {session: false}), UsersController.signIn);

router.route('/secret')
    .get(passport.authenticate('jwt', {session: false}), UsersController.secret);

router.route('/:userId')
    .get(validateParam(schemas.idSchema, 'userId'), UsersController.getUser)
    .put([validateParam(schemas.idSchema, 'userId'), validateBody(schemas.userSchema)], UsersController.replaceUser)
    .patch([validateParam(schemas.idSchema, 'userId'), validateBody(schemas.userOptionalSchema)], UsersController.updateUser);

router.route('/:userId/cars')
    .get(validateParam(schemas.idSchema, 'userId'), UsersController.getUserCars)
    .post([validateParam(schemas.idSchema, 'userId'), validateBody(schemas.carSchema)], UsersController.newUserCar);

module.exports = router;