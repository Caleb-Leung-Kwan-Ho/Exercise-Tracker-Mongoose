const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");
const {Schema} = mongoose;
const bodyParser = require("body-parser");

mongoose.connect(process.env.DB_URL)


const UserSchema = new Schema ({
  username: String,
});

const User = mongoose.model("User", UserSchema);


const ExerciseSchema = new Schema({
  user_id: { type:String, required: true},
  description: {type:String, required: true},
  duration: {type:Number, required: true},
  date: {type:Date, required: true},
});

const Exercise = mongoose.model("Exercise", ExerciseSchema) 

app.use(bodyParser.urlencoded({extended: false}));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async (req,res) => {
  const username = req.body.username;
  const data = {
    username : username,
  }
  const user = new User(data);
  try{
    let status = await user.save();
    console.log(status);
    res.json(status);
  }catch (err){
    console.error(err);
  }
});

app.get('/api/users', async (req,res) => {
  const users = await User.find({}).select("_id username");
  res.send(users);
})

app.get('/api/users/:_id/logs', async (req,res) => {
  const { from, to , limit} = req.query;
  const id = req.params._id
  const user = await User.findById(id);
  if (!user){
    res.send("Could not find user");
    return;
  }
  let dateObj = {}
  if (from){
    dateObj["$gte"] = new Date(from);
  }
  if (to){
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: id
  }
  if (from||to){
    filter.date = dateObj;
  }
  const exercise = await Exercise.find(filter).limit(+limit ?? 5000 )

  const logs = exercise.map(log => ({
    description: log.description,
    duration: log.duration,
    date: log.date.toDateString(),
  }))
  
  res.json({
    username: user.username,
    count: logs.length,
    _id: id,
    log:logs
    })
    
    
});

app.post('/api/users/:_id/exercises', async (req,res) => {  
  const _id = req.params._id;
  const {description, duration, date} = req.body;
  try{
    const user = await User.findById(_id);
    if (!user){
      res.send("Could not find user")
    }else{
      const data = new Exercise({
        user_id: _id,
        description: description,
        duration: duration,
        date: date ? new Date(date) : new Date()
      })
      const exercise = await data.save();
      res.json({
        username: user.username,
        description: description,
        duration: data.duration,
        date: data.date.toDateString(),
        _id: _id
        });
    }    
  }catch (err){
    console.error(err);
    res.send("there's sthg wrong")
  }
  
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})