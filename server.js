"use strict"

const express = require('express')
const app = express()
const path = require('path')
const moment = require('moment');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const mongodb = require('mongodb')
MongoClient.connect("mongodb://localhost:27017/breaddb", function(err, db) {
  if (err) {
    return console.dir(err);
  }
  const collection = db.collection('bread');

  app.use(bodyParser.urlencoded({extended : true}))
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')
  app.use(express.static(path.join(__dirname, 'public')))

  app.get('/', function(req, res) {
    let url = (req.url == "/") ? "/?page=1" : req.url;
    let page = Number(req.query.page) || 1
    if(url.indexOf('&submit=') != -1){
      page = 1;
    }
    url = url.replace('&submit=', '')

    //filter
    let filter = {}
    if(req.query.cstring && req.query.string){
      filter['string'] = req.query.string;
    }
    if(req.query.integer && req.query.integer){
      filter['integer'] = Number(req.query.integer);
    }
    if(req.query.cfloat && req.query.float){
      filter['float']  = parseFloat(req.query.float);
    }
    if(req.query.cdate && req.query.startdate && req.query.enddate){
      filter['date'] = {$gte: req.query.startdate, $lte: req.query.enddate}
    }
    if(req.query.cboolean && req.query.boolean){
      filter['boolean'] = req.query.boolean;
    }

    // pagination
    let limit = 3
    let offset = (page-1) * 3
    collection.find(filter).count((error, count) => {
      if(error) {
        console.error(error);
      }
      let total = count
      let pages = (total == 0) ? 1 : Math.ceil(total/limit);
      collection.find(filter).skip(offset).limit(limit).toArray(function (err, data) {
        if (err) {
          console.error(err);
          return res.send(err);
        }
        res.render('list', {title: "BREAD",header: "BREAD", data: data, pagination:{page: page, limit: limit, offset: offset, pages: pages, total: total, url: url}, query: req.query});
      });
    })
  });

  app.get('/add', (req, res) => {
    res.render('add', {title: "Add"});
  });

  app.post('/add', (req, res)=>{
    let string = req.body.string
    let integer = parseInt(req.body.integer)
    let float = parseFloat(req.body.float)
    let date = req.body.date
    let boolean = req.body.boolean
    collection.insertOne({string:string, integer:integer, float:float , date: date, boolean: boolean}, (err) =>{
      if(err) {
        console.error(err)
        return res.send(err);
      }
      res.redirect('/');
    })
  })

  app.get('/edit/:id', (req, res)=>{
    let id = req.params.id;
    console.log(id);
    collection.findOne({_id:new mongodb.ObjectID(id)}, (err, data)=> {
      console.log(data);
      if (err) {
        console.error(err);
        return res.send(err);
      }
      if(data){
        res.render('edit', {item: data});
      }
    })
  })


  app.post('/edit/:id', (req, res)=>{
    let id = req.params._id;
    let string = req.body.string;
    let integer = parseInt(req.body.integer);
    let float = parseFloat(req.body.float);
    let date = req.body.date;
    let boolean = req.body.boolean;
    collection.updateOne({ id: id}, { $set:{string:string, integer:integer, float:float, date:date, boolean:boolean}}, (err)=>{
      if (err) {
        console.error(err);
        return res.send(err);
      }
      res.redirect('/');
    })
  })


  app.get('/delete/:id', (req, res)=>{
    let id = req.params._id;
    collection.deleteOne({id:id}, (err)=>{
      if (err) {
        console.error(err);
        return res.send(err);
      }
      res.redirect('/');
    })
  })


  app.listen(3000, function(){
    console.log("port");
  })
});
