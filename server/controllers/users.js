const JWT = require('jsonwebtoken');
const User = require('../models/user');
const Car = require('../models/car');
const isEmpty = require('lodash/isEmpty');

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
        res.status(200).json({data: users});
    },
    newUser: async (req, res, next) => {
        const { email } = req.value.body;
        const foundUser = await User.findOne({ email });
        if (foundUser) {
            return res.status(403).json({ error: 'Email is already in use' });
        }
        const newUser = new User(req.value.body);
        const user = await newUser.save();

        const token = signToken(newUser)

        res.status(200).json({ token: token, user: newUser });
    },
    signIn: async (req, res, next) => {
        const token = signToken(req.user);
        res.status(200).json({ token: token, user: req.user });
    },
    secret: async (req, res, next) => {
        res.json({ secret: "resource" });
    },
    getUser: async (req, res, next) => {
        const { userId } = req.value.params;
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({error: 'User does not exists'});
        }
        res.status(200).json(user.getUser());
    },
    replaceUser: async (req, res, next) => {
        const { userId } = req.value.params;
        const newUser = req.value.body;
        if (isEmpty(newUser)) {
            return res.status(400).json({ error: 'Please include parameters to update' });
        }
        const result = await User.findByIdAndUpdate(userId, newUser);
        if (!result) {
            return res.status(404).json({ error: 'User does not exists' });
        }
        const updatedUser = await User.findById(userId);
        res.status(200).json({ success: true, user: updatedUser.getUser() });
    },
    updateUser: async (req, res, next) => {
        const { userId } = req.value.params;
        const newUser = req.value.body;
        if (isEmpty(newUser)) {
            return res.status(400).json({ error: 'Please include parameters to update' });
        }
        const result = await User.findByIdAndUpdate(userId, newUser);
        if (!result) {
            return res.status(404).json({ error: 'User does not exists' });
        }
        const updatedUser = await User.findById(userId);
        res.status(200).json({ success: true, user: updatedUser.getUser() });
    },
    getUserCars: async (req, res, next) => {
        const { userId } = req.value.params;
        const user = await User.findById(userId).populate('cars');
        res.status(200).json(user.cars);
    },
    newUserCar: async (req, res, next) => {
        const { userId } = req.value.params;
        const newCar = new Car(req.value.body);
        const user = await User.findById(userId);
        newCar.seller = user;
        await newCar.save();
        user.cars.push(newCar);
        await user.save();
        res.status(201).json(newCar);
    }
};