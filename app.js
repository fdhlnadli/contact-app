const express = require('express');
const expressLayouts = require('express-ejs-layouts');

const { body, validationResult, check } = require('express-validator');
const methodOverride = require('method-override');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

require('./utils/db');  
const Contact = require('./model/contact');

const app = express();
const port = 3000;

// setup methodOverride
app.use(methodOverride('_method'));

// setup ejs
app.set('view engine', 'ejs');
app.use(expressLayouts); 
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// kofigurasi flash
app.use(cookieParser('secret'))
app.use((
   session({
      cookie: { maxAge: 6000 }, 
      secret: 'secret', 
      resave: true, 
      saveUninitialized: true
   })
));
app.use(flash());

// halaman home
app.get('/', (req, res) => {
   // res.sendFile('./index.html', { root: __dirname });
   const mahasiswa = [
      {
         nama: 'fadhlan', 
         email: 'fadhlan@gmail.com'
      }, 
      {
         nama: 'satrio', 
         email: 'satrio@gmail.com'
      }, 
      {
         nama: 'adli', 
         email: 'adli@gmail.com'
      }
   ]
   res.render('index', { 
      nama: 'Fadhlanadli', 
      mahasiswa, 
      layout: 'layouts/main-layout',
      title: 'Web Browser Express EJS' 
   });
});

// halaman about
app.get('/about', (req, res) => {
   res.render('about', {
      title: 'Halaman About',  
      layout: 'layouts/main-layout'
   });
});

// halaman contact
app.get('/contact', async (req, res) => {
   const contacts = await Contact.find();
   res.render('contact', { 
      title: 'Halaman Contact', 
      layout: 'layouts/main-layout', 
      contacts, 
      msg: req.flash('msg')
   });
});

// halaman form tambah data contact
app.get('/contact/add', (req, res) => {
   res.render('add-contact', {
      title: 'Form Tambah Data Contact', 
      layout: 'layouts/main-layout'
   });
});

// Proses Tambah Data Contact
app.post(
   '/contact', 
   [
      body('nama').custom( async (value) => {
         const duplikat = await Contact.findOne({ nama: value });
         if(duplikat) {
            throw new Error('Nama contact sudah digunakan!');
         }
         return true;
      }), 
      check('email', 'Email is Invalid!').isEmail(), 
      check('nohp', 'No Handphone is Invalid!').isMobilePhone('id-ID')
   ], (req, res) => {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
         res.render('add-contact', {
            title: 'Form Tambah Data Contact', 
            layout: 'layouts/main-layout', 
            errors: errors.array()
         });
      } else {
         Contact.insertMany(req.body, (error, result) => {
            // kirimkan flash message
            req.flash('msg', 'Data contact berhasl ditambahkan!'); 
            res.redirect('/contact'); 
         }); 
      }
      
   }
); 

// proses delete contact
// app.get('/contact/delete/:nama', async (req, res) => {
//    const contact = await Contact.findOne({ nama: req.params.nama });
//    if(!contact) {
//       res.status(404); 
//       res.send('<h1>404</h1>')
//    } else {
//       Contact.deleteOne({ _id: contact._id  }).then((result) => {
//          req.flash('msg', 'Data Contact berhasil dihapus');
//          res.redirect('/contact');
//       });
//    }
// });

// proses delete contact
app.delete('/contact', (req, res) => {
   Contact.deleteOne({ nama: req.body.nama  }).then((result) => {
      req.flash('msg', 'Data Contact berhasil dihapus');
      res.redirect('/contact');
   });
});

// halaman form ubah data contact
app.get('/contact/edit/:nama', async (req, res) => {
   const contact = await Contact.findOne({ nama: req.params.nama });
   res.render('edit-contact', {
      title: 'Form Ubah Data Contact', 
      layout: 'layouts/main-layout', 
      contact
   });
});

// proses ubah data
app.put('/contact', [
   body('nama').custom( async (value, { req }) => {
      const duplikat = await Contact.findOne({ nama: value });
      if(value !== req.body.oldNama && duplikat) {
         throw new Error('Nama contact sudah digunakan!')
      }
      return true;
   }),
   check('email', 'Email is Invalid!').isEmail(), 
   check('nohp', 'No Hp is Invalid!').isMobilePhone('id-ID')
], (req, res) => {
   const errors = validationResult(req);
   if(!errors.isEmpty()) {
      res.render('edit-contact', {
         title: 'Form Ubah Data Contact', 
         layout: 'layouts/main-layout', 
         errors: errors.array(), 
         contact: req.body
      })
   } else {
      Contact.updateOne(
         {_id: req.body._id}, 
         {
            $set: {
               nama: req.body.nama, 
               email: req.body.email, 
               nohp: req.body.nohp
            }
         }
      ).then((result) => {
         // kirimkan flash message
         req.flash('msg', 'Data Contact berhasil diubah!');
         res.redirect('/contact');
      });
   }
});

// halaman detail contact
app.get('/contact/:nama', async (req, res) => {
   const contact = await Contact.findOne({ nama: req.params.nama });
   res.render('detail', { 
      title: 'Halaman Detail Contact', 
      layout: 'layouts/main-layout', 
      contact
   });
});

app.listen(port, () => {
   console.log(`MongoDB Contact App | listening at https://localhost:${port}`);
});


