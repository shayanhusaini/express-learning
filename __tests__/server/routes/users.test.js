const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const { expect } = chai;

const server = require('../../../server/app');

chai.use(chaiHttp);

let token;
let instanceUser;

describe('Users route', () => {
    const signup = '/users';
    const signin = '/users/signin';
    const secret = '/users/secret';
    const userWithId = '/users/';
    const user = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        password: faker.internet.password()
    }
    const preSave = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: 'mr.sometest@gmail.com',
        password: faker.internet.password()
    }

    const preSaveLogin = {
        email: preSave.email,
        password: preSave.password
    }

    before(done => {
        chai
            .request(server)
            .post(signup)
            .send(preSave)
            .end((err, res) => {
                expect(res.status).to.equal(200);
                token = res.body.token;
                instanceUser = res.body.user;
                done();
            });
    });

    after('dropping test db', done => {
        mongoose.connection.dropDatabase(() => {
            console.log('\n Test database dropped');
        });
        mongoose.connection.close(() => {
            done();
        });
    });

    describe('app level handling', () => {
        it('should return 404 if route not found', done => {
            chai
                .request(server)
                .get('/cars')
                .end((err, res) => {
                    expect(res.status).to.equal(404);
                    done();
                });
        });
    });

    describe('index', () => {
        it('should return list of user', done => {
            chai
                .request(server)
                .get(signup)
                .end((err, res) => {
                    expect(res.status).to.equal(200);
                    expect(res.body).to.deep.include({ data: [instanceUser] });
                    done();
                });
        });
    });

    describe('getUser', () => {
        it('should return 404 if user does not exists', done => {
            chai
                .request(server)
                .get(userWithId + '/' + instanceUser._id.replace(/[a-f]/g, 'c'))
                .end((err, res) => {
                    expect(res.status).to.equal(404);
                    expect(res.body).to.deep.equal({ error: 'User does not exists' });
                    done();
                });
        });
        it('should return user info', done => {
            chai
                .request(server)
                .get(userWithId + '/' + instanceUser._id)
                .end((err, res) => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.be.deep.equal({
                        _id: instanceUser._id,
                        firstName: instanceUser.firstName,
                        lastName: instanceUser.lastName,
                        email: instanceUser.email,
                    });
                    done();
                });
        });
    });

    describe('signup', () => {
        it('should create new user if email not found', done => {
            chai
                .request(server)
                .post(signup)
                .send(user)
                .end((err, res) => {
                    expect(res.status).to.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.have.property('token');
                    done();
                });
        });

        it('should return 403 if email was found', done => {
            chai
                .request(server)
                .post(signup)
                .send(preSave)
                .end((err, res) => {
                    expect(res.status).to.equal(403);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.deep.equal({ error: 'Email is already in use' });
                    done();
                });
        });
    });

    describe('secret', () => {
        it('should return status 401', done => {
            chai
                .request(server)
                .get(secret)
                .end((err, res) => {
                    expect(res.status).to.equal(401);
                    expect(res.body).to.be.empty;
                    done();
                });
        });

        it('should return status 200', done => {
            chai
                .request(server)
                .get(secret)
                .set('Authorization', token)
                .end((err, res) => {
                    expect(res.status).to.equal(200);
                    expect(res.body).to.deep.equal({ secret: 'resource' });
                    done();
                });
        });
    });

    describe('signin', () => {
        it('should return error 400 if user email and password empty', done => {
            let user = {};
            chai
                .request(server)
                .post(signin)
                .send(user)
                .end((err, res) => {
                    expect(res.status).to.be.equal(400);
                    done();
                });
        });

        it('should return 200 and our token', done => {
            chai
                .request(server)
                .post(signin)
                .send(preSaveLogin)
                .end((err, res) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).not.to.be.empty;
                    expect(res.body).to.have.property('token');
                    done();
                });
        });
    });

    describe('update user', () => {
        it('should return 400 if empty object is passed', done => {
            const obj = {};
            chai
                .request(server)
                .patch(userWithId + '/' + instanceUser._id)
                .send(obj)
                .end((err, res) => {
                    expect(res.status).to.be.equal(400);
                    expect(res.body).to.deep.equal({ error: 'Please include parameters to update' });
                    done();
                });
        });

        it('should return 404 if user not exists', done => {
            obj = { firstName: 'Test' }
            chai
                .request(server)
                .patch(userWithId + '/5b6331159e83451bfdcefcba')
                .send(obj)
                .end((err, res) => {
                    expect(res.status).to.be.equal(404);
                    expect(res.body).to.deep.equal({ error: 'User does not exists' });
                    done();
                });
        });

        it('should return 200 with updated user', done => {
            obj = { firstName: 'Mustaqeem', lastName: 'Paracha' }
            chai
                .request(server)
                .patch(userWithId + '/' + instanceUser._id)
                .send(obj)
                .end((err, res) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({
                        success: true, user: {
                            _id: instanceUser._id,
                            firstName: obj.firstName,
                            lastName: obj.lastName,
                            email: preSave.email
                        }
                    });
                    done();
                });
        });
    });

    describe('replace user', () => {
        it('should return 400 if empty object is passed', done => {
            const obj = {};
            chai
                .request(server)
                .put(userWithId + '/' + instanceUser._id)
                .send(obj)
                .end((err, res) => {
                    expect(res.status).to.be.equal(400);
                    done();
                });
        });

        it('should return 400 if not all params are passed', done => {
            const obj = { firstName: 'Test', lastName: 'Paracha' };
            chai
                .request(server)
                .put(userWithId + '/' + instanceUser._id)
                .send(obj)
                .end((err, res) => {
                    expect(res.status).to.be.equal(400);
                    done();
                });
        });

        it('should return 404 if user not exists', done => {
            obj = { firstName: 'Test', lastName: 'Paracha', email: 'mrtest@gmail.com' }
            chai
                .request(server)
                .put(userWithId + '/5b6331159e83451bfdcefcba')
                .send(obj)
                .end((err, res) => {
                    expect(res.status).to.be.equal(404);
                    expect(res.body).to.deep.equal({ error: 'User does not exists' });
                    done();
                });
        });

        it('should return 200 with updated user', done => {
            obj = { firstName: 'Mustaqeem', lastName: 'Paracha', email: 'mrtest@gmail.com' }
            chai
                .request(server)
                .put(userWithId + '/' + instanceUser._id)
                .send(obj)
                .end((err, res) => {
                    expect(res.status).to.be.equal(200);
                    expect(res.body).to.deep.equal({
                        success: true, user: {
                            _id: instanceUser._id,
                            firstName: obj.firstName,
                            lastName: obj.lastName,
                            email: obj.email
                        }
                    });
                    done();
                });
        });
    });
});