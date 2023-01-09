const Router = require("express");
const User = require("../models/User")
const bcrypt = require("bcryptjs")
const config = require("config")
const jwt = require("jsonwebtoken")
const {check, validationResult} = require("express-validator")
const router = new Router()
const authMiddleware = require('../middleware/auth.middleware');
const Recomendation = require("../models/Recomendation");
const Comment = require("../models/Comment");
const multer = require("multer")
const path = require('path');
const Tag = require('../models/Tag')
const { cwd } = require('node:process')

router.post('/registration',
    [
        check('email', "Uncorrect email").isEmail(),
        check('password', 'Password must be longer than 3 and shorter than 12').isLength({min:3, max:12})
    ],
    async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({message: "Uncorrect request", errors})
        }
        const {email, password} = req.body
        const candidate = await User.findOne({email})
        if(candidate) {
            return res.status(400).json({message: `User with email ${email} already exist`})
        }
        const hashPassword = await bcrypt.hash(password, 8)
        let currentDate = new Date().toJSON().slice(0, 10);

        const user = new User({email, password: hashPassword, date: currentDate, status: 'active', role: 'user'})
        await user.save()
        res.json({message: "User was created"})
    } catch (e) {
        console.log(e)
        res.send({message: "Server error"})
    }
})


router.post('/login',
    async (req, res) => {
        try {
            const {email, password} = req.body
            const user = await User.findOne({email})
            if (!user) {
                return res.status(404).json({message: "User not found"})
            }
            const isPassValid = bcrypt.compareSync(password, user.password)
            if (!isPassValid) {
                return res.status(400).json({message: "Invalid password"})
            }
            const token = jwt.sign({id: user.id}, config.get("secretKey"), {expiresIn: "1h"})
            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    date: user.date,
                    status: user.status,
                    role: user.role
                }
            })
        } catch (e) {
            console.log(e)
            res.send({message: "Server error"})
        }
    })

router.get('/auth', authMiddleware,
    async (req, res) => {
        try {
            const user = await User.findOne({_id: req.user.id})
            const token = jwt.sign({id: user.id}, config.get("secretKey"), {expiresIn: "1h"})
            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    date: user.date,
                    status: user.status
                }
            })
        } catch (e) {
            console.log(e)
            res.send({message: "Server error"})
        }
    })

router.get('/allusers',
    async (req, res) => {
        try {
            const user = await User.find({}, {"password": 0})
            return res.json(user)


        } catch (e) {
            console.log(e)
            res.send({message: "Server error"})
        }
    })

router.delete(`/delete/:id`, 
    async (req, res) => {
        try {
            const user = await User.findOne({"_id": req.params.id})
            user.delete()
            return res.status(204).json({})
        } catch (e) {
            console.log(e)
            res.send({message: "Server error"})
        }

    })

router.patch(`/user/:id`, 
async (req, res) => {
    try {
        const user = await User.findOne({"_id": req.params.id})
        user.status = user.status == 'active' ? 'blocked' : 'active'
        user.save()
        return res.status(204).json({})
    } catch (e) {
        console.log(e)
        res.send({message: "Server error"})
    }

})

router.patch(`/userrole/:id`, 
async (req, res) => {
    try {
        const user = await User.findOne({"_id": req.params.id})
        user.role = user.role == 'user' ? 'admin' : 'user'
        user.save()
        return res.status(204).json({})
    } catch (e) {
        console.log(e)
        res.send({message: "Server error"})
    }

})

router.get(`/getoneuser/:id`,
    async (req, res) => {
        try {
            const user = await User.findOne({"_id": req.params.id})
            return res.json(user)
        } catch (e) {
            console.log(e)
            res.send({message: "Server error"})
        }

    })

// posts

// muler storage

const storage = multer.diskStorage({
    destination: 'uploads',
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
      }
})

const upload = multer({
    storage: storage
}).single('testImage')

//
router.post('/post',
    
    async (req, res) => {
        try {
            upload(req, res, (err) => {
                if (err) {
                    console.log(err)
                    res.send({message: "Server error"})
                } else {
                    
                        const errors = validationResult(req)
                        if (!errors.isEmpty()) {
                            return res.status(400).json({message: "Uncorrect request", errors})
                        }
                        const {sender, senderid, title, content, rate, category, hashtags} = req.body

                        let tagArr = hashtags.replace(/ /g,'').split('#')
                        tagArr.shift()

                        tagArr.map(e => {
                            let tag = `#${e}`
                            const newtag = new Tag({tag})
                            newtag.save()
                        })

                        const message = new Recomendation({
                            sender,senderid, title, content, rate, category, hashtags, 
                            image: req.file.filename})
                        message
                            .save()
                            .then(() => res.json({message: "Message sent"}))
                            .catch((err) => console.log(err))
                    
                }
            })
            
        } catch (error) {
            console.log(error)
            res.send({message: "Server error"})
        }
        
    
})

router.get('/images/:image',
async (req, res) => {
    try {
        res.sendFile(path.join(path.resolve(), "uploads", req.params.image))
        console.info(`You are currently in ${cwd()}`) 
    } catch (e) {
        console.log(e)
        res.send({message: "Server error"})
    }
})

router.get('/allposts',
async (req, res) => {
    try {
        const recomendation = await Recomendation.find({})
        return res.json(recomendation)


    } catch (e) {
        console.log(e)
        res.send({message: "Server error"})
    }
})

router.delete(`/deletepost/:id`, 
    async (req, res) => {
        try {
            const post = await Recomendation.findOne({"_id": req.params.id})
            const coment = await Comment.findOne({"postId": req.params.id})
            post.delete()
            coment.delete()
            return res.status(204).json({})
        } catch (e) {
            console.log(e)
            res.send({message: "Server error"})
        }

    })

router.patch(`/post/:id`, 
    async (req, res) => {
        try {
            const post  = await Recomendation.findOne({"_id": req.params.id})
            const {title, content, rate, category, hashtags} = req.body
            post.title = title
            post.content = content
            post.rate = rate
            post.category = category
            post.hashtags = hashtags
            post.save()
            return res.status(204).json({})
        } catch (e) {
            console.log(e)
            res.send({message: "Server error"})
        }
    
    })

router.patch(`/likepost/:id`, 
    async (req, res) => {
        try {
            const post  = await Recomendation.findOne({"_id": req.params.id})
            const {username} = req.body
            if(post.likes.includes(username)){
                post.likes = post.likes.filter((e) => e !== username)
                post.save()
                return res.status(204).json({message: "fisliked"})
            }
            post.likes.push(username)
            post.save()
            return res.status(204).json({message: "liked"})
        } catch (e) {
            console.log(e)
            res.send({message: "Server error"})
        }

})

// router.patch(`/dislikepost/:id`, 
//     async (req, res) => {
//         try {
//             const post  = await Recomendation.findOne({"_id": req.params.id})
//             const {username} = req.body
//             // post.likes.pop(username)
//             post.likes = post.likes.filter((e) => e !== username)
//             post.save()
//             return res.status(204).json({})
//         } catch (e) {
//             console.log(e)
//             res.send({message: "Server error"})
//         }

// })

router.get(`/getpostsfrom/:senderid`,
    async (req, res) => {
        try {
            const post = await Recomendation.find({"senderid": req.params.senderid})
            return res.json(post)
        } catch (e) {
            console.log(e)
            res.send({message: "Server error"})
        }

    })

// router.get(`/getonepost/:id`,
//     async (req, res) => {
//         try {
//             const post = await Recomendation.findOne({"postId": req.params.senderid})
//             return res.json(post)
//         } catch (e) {
//             console.log(e)
//             res.send({message: "Server error"})
//         }

//     })




// comment

router.post('/comment',
    
    async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({message: "Uncorrect request", errors})
        }
        const {postId, comment, author} = req.body
        
    
        const newComment = new Comment({postId, comment, author})
        await newComment.save()
        res.json({message: "Message sent"})
    } catch (e) {
        console.log(e)
        res.send({message: "Server error"})
    }
})

router.get('/allcomments',
async (req, res) => {
    try {
        const comment = await Comment.find({})
        return res.json(comment)


    } catch (e) {
        console.log(e)
        res.send({message: "Server error"})
    }
})

// tags

router.get('/alltags',
async (req, res) => {
    try {
        const tags = await Tag.find({})
        return res.json(tags)


    } catch (e) {
        console.log(e)
        res.send({message: "Server error"})
    }
})

module.exports = router
