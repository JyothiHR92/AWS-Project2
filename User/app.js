var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var AWS = require("aws-sdk");
var bodyParser = require('body-parser');
var config = require('/home/ec2-user/config.js');
var availableLanguages = ['hindi', 'french', 'spanish', 'english']
var port = "3000"
var domain = config.server
var protocol = "http"
var home_url = protocol+"://"+domain+":"+port
var S3_url = "https://studentcourse.s3.amazonaws.com"

var app = express();

app.listen(3000, () => console.log('pollyCourse API listening on port 3000!'))

AWS.config.update({
  region: "us-east-1",
  endpoint: "http://dynamodb.us-east-1.amazonaws.com/",
  accessKeyId: config.key,
  secretAccessKey: config.secret
});

var docClient = new AWS.DynamoDB.DocumentClient();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('view engine', 'jade');

app.get('/', function(req, res, next) {
  res.render('index', { title: 'Welcome Tots!', server_url: home_url });
});

app.get('/pollyCourse', function (req, res) {
  res.render('pollyHome', {title: 'Home', server_url: home_url});
});

app.get('/learningCourse', function (req, res) {
  res.render('learningHome', {title: 'Learn', server_url: home_url});
});

app.get('/pollyCourse/:language', function(req, res){
  var lang = req.url.split('/').slice(2)[0];
  console.log(lang);
  var next_url = home_url+'/pollyCourse/'+lang+'/1';
  console.log(next_url);
  res.render('languageHome', {title: 'Course', server_url: home_url, lang: lang, url: next_url})

});

app.get('/learningCourse/:categories', function(req, res) {
  var category = req.url.split('/').slice(2)[0];
  console.log(category)
  var next_url = home_url+'/learningCourse/'+category+'/1';
  console.log(next_url);
  res.render('categoryHome', {title: 'Learning Course', server_url: home_url, category: category, url: next_url})
});


app.get('/pollyCourse/:language/:id', async function (req, res) {
  //console.log("here");
  var voice = 'Aditi';
  var url_parts = req.url.split('/').slice(2);
  var voiceNum = url_parts[1];
  var language = url_parts[0];
  if (language == 'hindi'){
    voice = 'Aditi';
  }
  else if (language == 'english'){
    voice = 'Joanna';
  }
  else if (language == 'french'){
    voice = 'Mathieu';
  }
  else if (language == 'german'){
    voice = 'Marlene';
  }
  else if (language =='spanish'){
    voice = 'Enrique'
  }
  var itemCountParams = {
    TableName : "pollyCourse_bkup",
    KeyConditionExpression: "#id = :id",
    ExpressionAttributeNames:{
      "#id": "voice"

    },
    ExpressionAttributeValues: {
      ":id": voice
    }
  };
let voice_count = 0;
let last_slide = false;
try{
data =  await docClient.query(itemCountParams).promise();
        console.log("query done");

        console.log(data);
        voice_count = data.Items[0].voice_count;
        if(voice_count == voiceNum){
                 last_slide = true;
        }
        console.log(voice_count);
}
catch (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
}
  var phraseID = voice+'_Phrase'+voiceNum
    var params = {
    TableName : "pollyCourse",
    KeyConditionExpression: "#id = :id",
    ExpressionAttributeNames:{
      "#id": "id"

    },
    ExpressionAttributeValues: {
      ":id": phraseID
    }
};
console.log(last_slide);
docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
        var nextSlide = parseInt(voiceNum)+1;
        var next_url = home_url+'/pollyCourse/'+language+'/'+nextSlide;
        console.log(last_slide);
        res.render('slide', { title: 'Course', text: data.Items[0].text, server_url: home_url, next_url: next_url, audio_url:data.Items[0].url, last_slide: last_slide});

    }
});
});

app.get('/learningCourse/:categories/:id', function (req, res) {
  //console.log("here");
  //var voice = 'Aditi';
  var url_parts = req.url.split('/').slice(2);
  var category = url_parts[0];
  var categoryNum = url_parts[1];
  var imageID = category+'/'+category+'_'+categoryNum
  console.log(imageID);
  var params = {
    TableName : "courseImages",
    KeyConditionExpression: "#id = :id",
    ExpressionAttributeNames:{
          "#id": "filename"

    },
    ExpressionAttributeValues: {
      ":id": imageID
    }
};

docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
        console.log(data);
        console.log(data.Items[0].text);
        var nextSlide = parseInt(categoryNum)+1;
        var previousSlide = parseInt(categoryNum)-1;
        console.log(previousSlide)
        var next_url = home_url+'/learningCourse/'+category+'/'+nextSlide;
        res.render('learningslide', { title: 'Course', server_url: home_url, id: categoryNum, folder: category, text: data.Items[0].text, next_url: next_url, S3url:data.Items[0].S3url});

    }
});
});
app.get('/learningCourse/:categories/quiz/:id', function (req, res) {
  var url_parts = req.url.split('/').slice(2);
  var category = url_parts[0];
  var numberOfSlidesInEachCategory = 4;
  var categoryNum = url_parts[2];
  console.log(categoryNum);
  var randomCategoryNum = numberOfSlidesInEachCategory;
  do{
        randomCategoryNum = Math.floor(Math.random() * numberOfSlidesInEachCategory) + 1;
  }while(randomCategoryNum==categoryNum);
  console.log(randomCategoryNum);
  var wrongImageURL = S3_url+'/'+category+'/'+category+'_quiz_'+randomCategoryNum+'.jpg';
  console.log(wrongImageURL);
    var image1ID = category+'/'+category+'_quiz_'+categoryNum
  //var image2ID = category+'/'+category+'_quiz_'+randomCategoryNum
  console.log(image1ID);
  //console.log(image2ID);
  var params1 = {
    TableName : "courseImages",
    KeyConditionExpression: "#id = :id",
    ExpressionAttributeNames:{
      "#id": "filename"

    },
    ExpressionAttributeValues: {
      ":id": image1ID
    }
};

docClient.query(params1, function(err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
          var nextSlide = parseInt(categoryNum)+1;
          var next_url = home_url+'/learningCourse/'+category+'/quiz/'+nextSlide;
          var rightImageURL = data.Items[0].S3url;
          console.log(rightImageURL);
          var rightImageText = data.Items[0].text;
          var rightImageLabel = data.Items[0].labels[0];
          console.log(rightImageLabel);
          var imageFlag = Math.floor(Math.random() * 2) + 1;
          if (imageFlag == 1){
                var firstImage = rightImageURL;
                var secondImage = wrongImageURL;
                var firstVal = 10;
                var secondVal = 20;
          }
          else if (imageFlag == 2){
                var firstImage = wrongImageURL;
                var secondImage = rightImageURL;
                var firstVal = 20;
                                var secondVal = 10;
          }
          res.render('quiz',
                {
                title: 'quiz',
                quiz_label_right: rightImageLabel,
                firstImageURL: firstImage,
                firstVal: firstVal,
                secondImageURL: secondImage,
                secondVal: secondVal,
                server_url: home_url,
                rightImageText: rightImageText,
                //wrongImageText: wrongImageData.wrongImageText,
                randomCategoryNum : randomCategoryNum,
                next_url: next_url,
                id: categoryNum,
                folder: category
                });

        }

});
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
