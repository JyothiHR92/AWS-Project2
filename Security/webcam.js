function logout(){
	location.href="security.html";
}
var myParam='';
var emailId='';
window.onload = function() {
 
			var urlParams = new URLSearchParams(window.location.search);
			myParam = urlParams.get('param1');
			 }
var  imageList =[];
var images='';
var folderBucketName = 'daycaresecurityapplication';
var bucketRegion = 'us-east-1';
var final;
var newList =[];
//update config
AWS.config.update({
  region: bucketRegion,
    accessKeyId:<access key>,
     secretAccessKey: <secret key>,
 
});

var s3 = new AWS.S3({
  params: {Bucket: folderBucketName}
});

 Webcam.set({
  width: 320,
  height: 240,
  image_format: 'jpeg',
  jpeg_quality: 90
 });
 Webcam.attach( '#my_camera' );

<!--Code to take picture and call function to upload to S3-->
function take_snapshot() {
 
 // take snapshot and get image data
 Webcam.snap( function(data_uri) {
  // display results in page
  document.getElementById('results').innerHTML = 
  '<img src="'+data_uri+'"/>';
  //call function to add file to S3
  addFile(dataURItoBlob(data_uri))
  } );
  document.getElementById("authBtn").style="display:block;margin-left:39%;";
}

//function called on click of authenticate
function auth(){
	var params1= {
  Bucket: "daycarecenterchildren"
 };
 s3.listObjects(params1, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else     {
   var t = JSON.stringify(data.Key); 
	var imgs = data.Contents.map(function(res){
		 var fileKey = res.Key;
		var lastchar = fileKey.charAt(fileKey.length-1)
		 if(lastchar != '/' && fileKey.includes(myParam+'/')) {
			images+=fileKey +','
			imageList.push(fileKey);
		 }
	});
	var newStr = images.slice(0, -1);
	
  authenticate(newStr);
	 }
   });
   
   
}
//function to do the facial comparison
function authenticate(newStr){
var res = newStr.split(',');
var match;

  
   for(var i=0;i<res.length;i++){
   console.log('res[i]...'+res[i]);
   const client = new AWS.Rekognition();
  
   const params = {
    SimilarityThreshold: 95,
     SourceImage: {
       S3Object: {
         Bucket: "daycaresecurityapplication",
         Name: myParam+".jpg"
       },
     },
     TargetImage: {
       S3Object: {
         Bucket: "daycarecenterchildren",
         Name: res[i]
       },
     }
   }
    client.compareFaces(params, function(err, response) {
     if (err) {
	console.log(params);
       console.log(err, err.stack); // an error occurred
     } else {
	 console.log(response.FaceMatches);
       response.FaceMatches.forEach(data => {
         let position   = data.Face.BoundingBox
         let similarity = data.Similarity
		
         console.log(`The face at: ${position.Left}, ${position.Top} matches with ${similarity} % confidence`)
		match =true;
		console.log(match);
       }) // for response.faceDetails
	   if(response.FaceMatches.length == 0) {
	   match=false;
	   }
	   newList.push(match);
	   console.log(newList);
	   console.log(res.length);
	   if(newList.length == res.length) {
	   
			var temp = newList.includes(true);
			if(temp){
				successFunction();
			}	
			 else{
			errorFunction();
	   }
	   }
	  
	  //final = match;
	 // return match;
     } 
   });
    
   }

  }
  function successFunction(){
	document.getElementById("app").style="display:none;";
	document.getElementById("success").style="display:block;";
	
	
  }
  function errorFunction(){
  //alert(JSON.stringify(TargetImage));
	document.getElementById("app").style="display:none;";
	document.getElementById("error").style="display:block;";
	
	var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
	var params = {
  UserPoolId: 'us-east-1_NuXyg9NJF', /* required */
  Username: myParam /* required */
};
cognitoidentityserviceprovider.adminGetUser(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else    { console.log(JSON.stringify(data.UserAttributes[2].Value)); 
	emailId = data.UserAttributes[2].Value;
	sendEmail(emailId);
	
}
  // successful response
});
	console.log(emailId);
	
  }
  
  function sendEmail(emailId){
	console.log(emailId);
	var ses = new AWS.SES({
    region: 'us-east-1'
});
var eParams = {
        Destination: {
            ToAddresses: [emailId]
        },
        Message: {
            Body: {
                Text: {
                    Data: 'There was an unauthorized person to pick up your child today.Please contact us for further details.'
                }
            },
            Subject: {
                Data: "iTots - Security Alert"
            }
        },
        Source: "prarthana.hemanth@sjsu.edu"
    };
    console.log('===SENDING EMAIL===');
    var email = ses.sendEmail(eParams, function(err, data) {
        if (err) console.log(err);
        else {
            console.log("===EMAIL SENT===");
            // console.log(data);
            console.log("EMAIL CODE END");
            console.log('EMAIL: ', email);
            //context.succeed(event);
        }
    });

	
  }
  
 //function to add image taken to S3 bucket
function addFile(fileToUpload) {

console.log('Adding to S3');
//should name the image using cognito user's username
  var fileName = myParam+'.jpg';
 
  var fileKey = fileName;
 
	s3.upload({
    Key: fileKey,
    Body: fileToUpload,
	
  }, function(err, data) {
    if (err) {
		
      return alert('There was an error uploading your image: ', err.message);
    }
	console.log('Successfully uploaded image');
    
   
  });
  
  
  
}

//function to convert URI to BLOB
function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
	
    return new Blob([ia], {type:mimeString});
}
