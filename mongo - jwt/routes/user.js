const { Router } = require("express");                    //getting router function from the express module
const router = Router();                                  //creating a router instance
const userMiddleware = require("../middleware/user");   //importing middleware
const { User, Course } = require("../db");
const jwt = require("jsonwebtoken")
const { JWT_SECRET } = require("../config")

router.post("/signup", async (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    const user =await User.findOne({
        username
    })
    if (user){
        return res.json({
            msg:"user already exists"
        })
    }
    try{
        await User.create({
            username:username,                
            password:password
        })
        res.json({message:"User created Successfully"});
    } catch(e){
        res.json({message:e.toString()})
    }
});


router.post("/signin", async (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    try {
        const user = await User.findOne({ username,password });
        if (!user) {
            return res.status(400).json({msg:'User not found'});
        }
        const token = jwt.sign({username}, JWT_SECRET);
        // this token will have to be sent as auth header for all routes containing adminMiddleware as adminMiddleware expects the token and decodes it to verify
        res.send({ message: 'Sign in successful', token });
    } catch (error) {
        res.status(500).send('Server error' + error.message); // very important for debugging
    }
});

router.get("/courses",async (req,res)=>{
    const response = await Course.find({});
    res.json({
        courses: response
    })
});

router.post("/courses/:courseId", userMiddleware, (req,res)=>{
    const courseId = req.params.courseId
    const username = req.username  //important
    User.updateOne({
        username:username
    },{
        "$push":{
            purchasedCourses: courseId
        }
    }).catch((e)=>{
        console.log(e);
    });
    res.json({
        message:"Purchase Complete"
    })
});

router.get("/courses/purchasedCourses", userMiddleware, async (req,res)=>{
    try{
        const user = await User.findOne({
            username: req.username
        });
        const courses = await Course.find({
            _id:{
                "$in": user.purchasedCourses
            }
        });
        res.send({
            courses:courses
        })
    } catch(e){
        res.send(e.message)
    }
    
});

module.exports = router;