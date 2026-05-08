const express = require('express');
const multer = require('multer');
require('dotenv').config();//no need for multer for now 
const path = require('path');//same
const fs = require('fs');//probably same
const app = express();
app.use(express.static(path.join(__dirname, 'public')));//important
app.use(express.json());
app.set('view engine', 'ejs');
app.set('public', path.join(__dirname, 'public'));//important2
app.use(express.urlencoded({ extended: true }));
//no need for database i think and i hope
//code start point

app.get('/',async(req,res)=>{
   res.render('main',{
      content:'home',
      style:'store.css'
   })
})
app.get('/game',async(req,res)=>{
   res.render('main',{
      content:'game',
      style:'store.css'
   })
})
app.get('/cheats',async(req,res)=>{
   res.render('main',{
      content:'cheat',
      style:'store.css'
   })
})
const PORT = 2000;
app.listen(PORT, () => {
    console.log(`Nodemon aktif: http://localhost:${PORT}/ adresine git.`);
});
