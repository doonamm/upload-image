require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const port = process.env.PORT;
const app = express();

const storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, 'uploads');
    },  
    filename: function(req, file, callback){
        const name = Math.round(Math.random()*1000000)+ '_' + file.originalname;
        callback(null, name);
    }
});
const upload = multer({storage: storage});

const startTime = Date.now();
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
const DB = mongoose.connection;

app.use('/', express.static(path.join(__dirname, '/client')));
app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/client/index.html');
});

app.get('/error', (req, res)=>{
    res.send('Something went wrong!');
});

DB.on('error', (err)=>console.log(err));
DB.once('open', ()=>{
    const ImgSchema = new mongoose.Schema({
        name: String,
        date: Date,
        image: {
            buffer: Buffer,
            contentType: String
        }
    });
    const Img = mongoose.model('images', ImgSchema);

    app.get('/photo/:id', (req, res)=>{
        const id = req.params.id;
        
        Img.findById(id, (err, result)=>{
            if(err){
                res.redirect('/error');
                return;
            }
            res.contentType(result.image.contentType);
            res.send(result.image.buffer);
        });
    });

    app.get('/api', (req, res)=>{
        const baseUrl = req.protocol +'://' + req.get('host') + '/photo/';
        
        Img.find().select('_id name date').exec((err, images)=>{
            if(err){
                res.json([]);
                return;
            }
            const finalList = images.map(({_id, name, date}) => {
                return{
                    url: baseUrl + _id,
                    name,
                    date
                }
            });
            res.json(finalList);
        });
    });

    app.post('/upload', upload.single('image'), (req, res, next)=>{
        const file = req.file;
        if(!file){
            const err = new Error('try upload again');
            err.httpStatusCode = 404;
            return next(err);
        }
        console.log('Got a new image:', file);
        const filename = file.originalname.slice(0, file.originalname.lastIndexOf('.'));

        const imgData = fs.readFileSync(file.path);
        const encode_img = imgData.toString('base64');

        Img.create({
            name: filename,
            date: Date.now(),
            image: {
                contentType: file.mimetype,
                buffer: new Buffer.from(encode_img, 'base64')
            }
        }, (err, result)=>{
            if(err)
                console.log(err);
            res.redirect('/');
        });
    });
    app.listen(port, onStart);
});


function onStart(){
    const responseTime = (Date.now() - startTime)/1000;
    console.log(`Server started!\nConnected to database!\nPort: ${port}\nResponse time: ${responseTime}s\nRunning...\n`);
}