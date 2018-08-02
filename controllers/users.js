const JWT = require('jsonwebtoken');
const User = require('../models/user');
const Car = require('../models/car');

const { JWT_SECRET } = require('../config');

signToken = user => {
    return JWT.sign({
        iss: 'Testing',
        sub: user._id,
        iat: new Date().getTime(),
        exp: new Date().setDate(new Date().getDate() + 1)
    }, JWT_SECRET);
}

module.exports = {
    index: async (req, res, next) => {
        const users = await User.find({});
        res.status(200).json(users);
    },
    newUser: async (req, res, next) => {
        const newUser = new User(req.value.body);
        const user = await newUser.save();

        const token = signToken(newUser)

        res.status(200).json({token: token});
    },
    signIn: async (req, res, next) => {
        const token = signToken(req.user);
        res.status(200).json({token: token});
    },
    secret: async (req, res, next) => {
        res.json({secret: "resource"});
    },
    getUser: async (req, res, next) => {
        const { userId } = req.value.params;
        const user = await User.findById(userId);
        res.status(200).json(user);
    },
    replaceUser: async (req, res, next) => {
        const {userId} = req.value.params;
        const newUser = req.value.body;
        const result = await User.findByIdAndUpdate(userId, newUser);
        res.status(200).json({success: true});
    },
    updateUser: async (req, res, next) => {
        const {userId} = req.value.params;
        const newUser = req.value.body;
        const result = await User.findByIdAndUpdate(userId, newUser);
        res.status(200).json({success: true});
    },
    getUserCars: async (req, res, next) => {
        const {userId} = req.value.params;
        const user = await User.findById(userId).populate('cars');
        res.status(200).json(user.cars);
    },
    newUserCar: async (req, res, next) => {
        const {userId} = req.value.params;
        const newCar = new Car(req.value.body);
        const user = await User.findById(userId);
        newCar.seller = user;
        await newCar.save();
        user.cars.push(newCar);
        await user.save();
        res.status(201).json(newCar);
    }
};