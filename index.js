const express = require('express');
const bodyParser = require('body-parser')
const ejs = require('ejs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');



const port = 5000;
const app = express();
app.use(bodyParser.json());
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');


var conn = mongoose.createConnection('mongodb://localhost:27017/notesRegistration' ,{
     useNewUrlParser:true,
     useUnifiedTopology: true,
     useCreateIndex: true,
    useUnifiedTopology: true
})
let gfs;

conn.once('open', () =>{
    gfs = Grid(conn.db ,mongoose.mongo);
    gfs.collection('registers');
})

const storage = new GridFsStorage({
   url: 'mongodb://localhost:27017/notesRegistration',
    file:(req , file) =>{
    return new Promise((resolve , reject) =>{
    crypto.randomBytes(16, (err ,buf) =>{
    if(err) {
    return reject(err);
}
          //const filename = path.buf(file.originalname) + path.extname(file.originalname);

  const filename = buf.toString('hex') + path.extname(file.originalname);
const fileInfo ={
    filename: filename,
    bucketName:'registers'
};
    resolve(fileInfo);
});
});
}

});

const upload = multer({storage})

app.get('/', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('index', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'image/jpeg' ||
          file.contentType === 'image/png'
        ) {
          file.isImage = true;

        } else {
          file.isImage = false;
        }
      });
      res.render('index', { files: files });
    }
  });
});

app.get('/files',(req, res) =>{
   gfs.files.find().toArray((err , files) =>{
       if(!files ||  files.length === 0){
           return res.status(404).json({
               err: 'No Files exist'
           });

       }
       return res.json(files)
   });

});

app.get('/files/:filename',(req, res) =>{
   gfs.files.findOne({filename: req.params.filename} , (err , file) =>{
       if(!file ||  file.length === 0){
           return res.status(404).json({
               err: 'No Files exist'
           });
       }
       return res.json(file)
   });

});


app.get('/image/:filename',(req, res) =>{
   gfs.files.findOne({filename: req.params.filename} , (err , file) =>{
       if(!file ||  file.length === 0){
           return res.status(404).json({
               err: 'No Files exist'
           });
       }
       // add for pdf  : file.contentType === 'application/pdf'
       if(file.contentType === 'image/jpeg' ||  file.contentType === 'image/png' ){
           //read output from browser
           const readstream = gfs.createReadStream(file.filename);
           readstream.pipe(res);
       } else {
           res.status(404).json({
            err:'Not an image'
           });
       }
   });

});



app.post('/upload', upload.single('file') ,(req, res) =>{
    //res.json({file: req.file});
    res.redirect('/');

});

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'registers' }, (err,  GridFSBucket) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/');
  });
});

app.listen(port, ()=>{
    console.log('Server started')
});
