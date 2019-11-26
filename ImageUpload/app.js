//set the bucket name, region and Identity pool ID
var folderBucketName = 'daycarecenterchildren';
var bucketRegion = 'US-EAST-1';
var IdentityPoolId = <Identity Pool ID>;
var userName ; 
var imageCount = 0;
//update config
AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
   IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  params: {Bucket: folderBucketName}
});
//function to list images in the folder
function listFolder(){
	var folderPresent= false;
	var allFolders='';
	var urlParams = new URLSearchParams(window.location.search);
	var url = window.location.href;
	var res = url.split("=");
	var final = res[2].replace("&expires_in","");
	AWS.config.update({
		region: 'us-east-1'
	});
	//get logged in user's user name from Cognito
	var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
	var params = {
		AccessToken: final /* required */
	};
	cognitoidentityserviceprovider.getUser(params, function(err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else    {
			console.log(data.Username);
			userName = data.Username;
		}
		});  
	var params1= {
		Bucket: "daycarecenterchildren"
	};
	//To list all folders
	s3.listObjects({Delimiter: '/'}, function(err, data) {
		if (err) {
			return alert('There was an error listing your folder ' + err.message);
		} else {
			var folders = data.CommonPrefixes.map(function(commonPrefix) {
				var prefix = commonPrefix.Prefix;
				var folderName = decodeURIComponent(prefix.replace('/', ''));
				console.log(folderName);
				console.log(userName);
				allFolders += folderName+',';
			});
		}
		console.log(allFolders);	
		//If user has created a folder, call the displayFolder function to display contents of folder
		if(allFolders.includes(userName)) {
			displayFolder(userName);
		}
		//If user has not created a folder, message saying no folder created
		else {
			var htmlTemplate = [
			 '<p>You have not created a folder with authorized images. Please create a folder for storing images of people authorized to pickup your child.',
			 '</p>',
			 '<button class="buttons" onclick="createFolder(userName)">',
				  'Create New Folder',
				'</button>'
			];
			document.getElementById('app').innerHTML = getHtml(htmlTemplate);
		}
	});
}


//function to display contents of folder
function displayFolder(folderName) {
	var htmlTemplate = [
	 '<p style="color:forestgreen;">Below is the folder created with the images of authorized people:</p>',
     '<span onclick="viewFolder(\'' + folderName + '\')" style=" color:forestgreen;text-decoration:underline; 	cursor:pointer;">',
              folderName,
            '</span> &nbsp',
	  ];
	 document.getElementById('app').innerHTML = getHtml(htmlTemplate);
}

//function to create a new  folder
function createFolder(folderName) {
  folderName = folderName.trim();
  //validations on the folder name
  if (!folderName) {
    return alert('Folder names must contain at least one non-space character.');
  }
  if (folderName.indexOf('/') !== -1) {
    return alert('Folder names cannot contain slashes.');
  }
  var albumKey = encodeURIComponent(folderName) + '/';
  s3.headObject({Key: albumKey}, function(err, data) {
    if (!err) {
      return alert('Folder already exists.');
    }
    if (err.code !== 'NotFound') {
      return alert('There was an error creating your folder: ' + err.message);
    }
	//call S3 putObject method to create a folder
    s3.putObject({Key: albumKey}, function(err, data) {
      if (err) {
        return alert('There was an error creating your folder: ' + err.message);
      }
      alert('Successfully created new folder.');
      viewFolder(folderName);
    });
  });
}

//To view folder images
function viewFolder(folderName) {
  var folderKey = encodeURIComponent(folderName) + '/';
  s3.listObjects({Prefix: folderKey}, function(err, data) {
	 
    if (err) {
      return alert('There was an error viewing your folder: ' + err.message);
    }
    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + folderBucketName + '/';
	var imgs = data.Contents.map(function(res){
		//check if user has uploaded image, and if he has, then display it
		 var fileKey = res.Key;
		
		 var filName = fileKey.replace(folderKey, '');
		 if(filName != '')
		 {
      var fileURL = bucketUrl + encodeURIComponent(fileKey);
	 // var newVar = fileURL;
	 
      return getHtml([
        '<span>',
          '<span style="color:forestgreen;">File Name:',
              fileKey.replace(folderKey, ''),
			   ' - <a href ="'+ fileURL +'"> Download Link</a>',
            '</span>',
			'<span onclick="deleteFile(\'' + folderName + "','" + fileKey + '\')" style=" color:blue;text-decoration:underline; 	cursor:pointer;">',
              'Delete Image',
            '</span>',
		  '<div>',
		 
          '<div>',
            
           
          '</div>',
        '</span>',
      ]);
			}
		
	});
	imageCount = imgs.length;
    var message = imgs.length > 1?
      '<p style="color:forestgreen;">Below are the images you have uploaded: </p>' :
      '<p style="color:forestgreen;">You have not uploaded any images yet!</p>';
	
	 var upload =  '</div><input id="fileUpload" class="buttons" type="file" accept=".jpg"><button id="addFile" class="buttons" onclick="addFile(\'' + folderName +'\')">Upload Image</button><br/>  <br/><button class="buttons" onclick="listFolder()">Back To Folders</button>';
	
    var htmlTemplate = [
      '<h2 style="color:forestgreen;">',
        'Album: ' + folderName,
      '</h2>',
      message,
      '<div>',
        getHtml(imgs),
     upload
    ]
    document.getElementById('app').innerHTML = getHtml(htmlTemplate);
  });
}

//function to upload an image
function addFile(folderName) {
	if(imageCount > 3){
		alert("You can upload a maximum of 3 images");
	}
	else{
  var files = document.getElementById('fileUpload').files;
  if (!files.length) {
    return alert('Please choose a file to upload first.');
  }
  var file = files[0];
  var fileName = file.name;
  var folderKey = encodeURIComponent(folderName) + '/';
  var fileKey = folderKey + fileName;

	s3.upload({
    Key: fileKey,
    Body: file,
	
  }, function(err, data) {
    if (err) {
		
      return alert('There was an error uploading your image: ', err.message);
    }
	alert('Successfully uploaded image');
    viewFolder(folderName);
   
  });
	}
  
}

//function to delete a file
function deleteFile(folderName, fileKey) {
	//s3 deleteObject method is used for deletion
  s3.deleteObject({Key: fileKey}, function(err, data) {
    if (err) {
      return alert('There was an error deleting your file: ', err.message);
    }
    alert('Successfully deleted Image.');
    viewFolder(folderName);
  });
}
