const Course      = require('../models/Course');
const User    = require('../models/Userid');
const bcryt     = require('bcrypt');
const jwt       = require('jsonwebtoken');
const { mutiMongoosetoObject,MongoosetoObject,modifyRequestImage }  = require('../../util/subfunction');

class UserController {
    index(req, res) {
        User.findOne({email: req.session.email.username})
            .then(user => {
                res.render('user/userinfo',{user: MongoosetoObject(user)})
            })
    }
    // [GET] /user/courses
    courses(req, res,next) {}

    // [GET] /user/courses-management
    viewrevenue(req, res, next) {
        // res.json(req.session.email);
        Promise.all([User.findOne({email: req.session.email.username}),Course.find({}).sortable(req), Course.countDocumentsDeleted()])
            .then(([user, courses, deletedCount]) => {
                res.render('user/viewrevenue', {
                    deletedCount,
                    courses: mutiMongoosetoObject(courses),
                    user: MongoosetoObject(user),
                });
            })
            .catch(next);
    }

    // [GET] /user/trash
    trash(req, res, next) {
        Course.findDeleted({})
            .then((courses) => {
                res.render('user/trash', {
                    courses: mutiMongoosetoObject(courses),
                    user: req.user
                });
            })
            .catch(next);
    }

    // [POST] /user/register
    register(req, res, next) {
        User.findOne({email: req.body.email})
            .then((user) => {
                if(user){
                    res.render('register', {
                        resinfo: req.body,
                        massage: 'User đã được sử dụng',
                    })
                }
                else if(req.body.password != req.body.cfpassword) {
                    res.render('register', {
                        resinfo: req.body,
                        massage: 'mật khẩu không khớp',
                    })
                }
                else {
                    bcryt.hash(req.body.password,10,function(err,hashedPass) {
                        if(err) return res.json(err);
                        let newuser = new User({
                            email: req.body.email,
                            password: hashedPass,
                            name: req.body.name,
                            gender: req.body.gender,
                            address: req.body.address,
                        });
                        newuser.save()
                            .then(() => res.redirect('/loginpage'))
                            .catch((error) => {
                                res.json({message: error})
                            })
                    })
                }
            })
            .catch((error) => res.json({message: error.message}));
        
    }

    // [POST] /user/login
    login(req, res, next) {
        User.findOne({email: req.body.email})
            .then((user)=>{
                if(!user) return res.render('loginpage',{massage: "Email hoặc mật khẩu không chính xác",name: req.body.email});
                const email = user.email;
                bcryt.compare(req.body.password,user.password)
                    .then((result) => {
                        if(!result) return res.render('loginpage',{massage: "Email hoặc mật khẩu không chính xác",name: req.body.email});
                        const token = jwt.sign({username: email},process.env.ACCESS_TOKEN_SECRET );
                        req.headers.authorization = 'Bearer '+ token;
                        next();
                    })
                    .catch((error) =>{
                        res.send({massage: error});
                    });
            })
            .catch(next);
    }
    // [GET] /user/logout
    logout(req, res, next) {
        if (req.session) {
          // delete session object
          req.session.destroy(function(err) {
            if(err) {
              return next(err);
            } else {
              return res.redirect('/');
            }
          });
        }
    }
}

module.exports = new UserController();
