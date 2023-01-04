const express = require('express')
const mongoose = require('mongoose')
const config = require('config')
const authRouter = require('./routes/auth.routes')
const corsModdleware = require('./middleware/cors.middleware')
const filePathMiddleware = require('./middleware/filePath.middleware')

const app = express()
const PORT = process.env.PORT || config.get('serverPort')

const path = require('path')

app.use(corsModdleware)

app.use(express.json())
app.use('/api/auth', authRouter)

const start = async () => {
    try {
        mongoose.connect(config.get('bdUrl'), {
                useNewUrlParser:true,
                useUnifiedTopology:true
            })

        // dbJasa123qwe
        //dbByJasa123


        app.listen(PORT, () => {
            console.log('Server is running on port', PORT);
            console.log(`http://localhost:${PORT}`);
        })
    } catch (error) {
        
    }
}

start()