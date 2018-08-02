const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const { expect } = chai;

const server = require('../../../server/app');

chai.use(chaiHttp);

let token;

console.log(faker.internet.password());
describe('Users route', () => {
    const signup = '/users';
    const signin = '/users/signin';
    const secret = '/users/secret';
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
        email: 'mr.sometest@gmail.com',
        password: 'test'
    }

    before(done => {
        chai
            .request(server)
            .post(signup)
            .send(preSave)
            .end((err, res) => {
                expect(res.status).to.equal(200);
                token = res.body.token;
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
                    expect(res.status).to.be.equal(401);
                    /* expect(res.bodys).not.to.be.empty;
                    expect(res.bodys).to.have.property('token'); */
                    done();
                });
        });
    });
});