var folderBucketName = 'studentcourse';
var bucketRegion = 'us-east-1';


const ID = '---your_key---';
const SECRET = '---your_secret---';

//update config
AWS.config.update({
    region: bucketRegion,
    accessKeyId : ID,
    secretAccessKey : SECRET
  });


  var s3 = new AWS.S3({
    params: {Bucket: folderBucketName}
  });



var queryString = decodeURIComponent(window.location.search);
queryString = queryString.substring(1);
var queries = queryString.split("&");

  function listImages() {
    s3.listObjects({Delimiter: '/'}, function(err, data) {
      if (err) {
        return alert('There was an error showing your courses folder: ' + err.message);
      } else {
        var folders = data.CommonPrefixes.map(function(commonPrefix) {
          var prefix = commonPrefix.Prefix;
          var folderName = decodeURIComponent(prefix.replace('/', ''));
          return getHtml([
              '<span onclick="viewFolder(\'' + folderName + '\')" style=" color:blue;text-decoration:underline; 	cursor:pointer;">',
                folderName,
              '</span>',
              '&nbsp;',
              '<button onclick="deleteFolder(\'' + folderName + '\')" style="color:white;background-color:#008CBA;cursor:pointer;border-radius:6px;">Delete Folder</button>',
			'<br/><br/>',
            
          ]);
        });
        var message = folders.length ?
          getHtml([
            '<p>Click on any Course to upload your image.</p>'
           
          ]) :
          '<p>You do not have any Course folders.<br/> Please create a folder for a Course.<br/> Please name the folder with the name of the Course';
          
        var htmlTemplate = [
          '<h2>Learning Course</h2>',
          message,
          '<ul>',
            getHtml(folders),
          '</ul>',
          '<button onclick="createFolder(prompt(\'Enter Folder (Course) Name:\'))" style="color:white;background-color:orange;cursor:pointer;border-radius:6px;padding:6px 12px;font-size:14px;">',
          'Create New Folder',
        '</button>',
        '<br/>',
        '<br/>',
        '<h2>Language Course</h2>',
        '<button onclick="location.href=\'adminPolly.html\'" style="color:white;background-color:orange;cursor:pointer;border-radius:6px;padding:6px 12px;font-size:14px;">',
          'Upload Content',
          '</button>'
        ]
        document.getElementById('adminPage').innerHTML = getHtml(htmlTemplate);
      }
    });
  }

//function to create a new course folder
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
	  //If folder was created successfully,call the view function to view resumes in the folder
      viewFolder(folderName);
    });
  });
}


//view a folder to upload your course images
function viewFolder(folderName) {
	var imageUploaded;
  var urlParams = new URLSearchParams(window.location.search);
  var url = window.location.href;
	var res = url.split("=");
	
AWS.config.update({
  region: 'us-east-1'
});
		
	
  var folderKey = encodeURIComponent(folderName) + '/';
  s3.listObjects({Prefix: folderKey}, function(err, data) {
	 
    if (err) {
      return alert('There was an error viewing your folder: ' + err.message);
    }
    var href = this.request.httpRequest.endpoint.href;
    var bucketUrl = href + folderBucketName + '/';
    
	var courseImg = data.Contents.map(function(res){
		//check if user has uploaded image, and if he has, then display it
		 var fileKey = res.Key;
		
     var filName = fileKey.replace(folderKey, '');
     
		 if(filName != '')
		 {
				imageUploaded = true;
				  var newStr = fileKey[fileKey.length-1];
	 
	  if(newStr != '/'){
      var fileURL = bucketUrl + encodeURIComponent(fileKey);
	  var newVar = fileURL;
	 
      return getHtml([
        '<span>',
          '<span>File Name:',
              fileKey.replace(folderKey, ''),
         ' - <a href="'+ newVar +'" download="'+ newVar +'" > Download Image </a>',
            '</span>',
            '&nbsp;',
            '<button onclick="deleteImage(\'' + folderName + "','" + fileKey + '\')" style="color:white;background-color:#008CBA;cursor:pointer;border-radius:6px;">',
              'Delete Image',
            '</button>',
		  '<div>',
		 
          '<div>',
            
           
          '</div>',
        '</span>',
      ]);
			}
    }
});

    var message = courseImg.length > 1 ?
      '<p>You can download the uploaded image/images. </p>' :
      '<p>Image not uploaded! Please upload the image for the course.</p>';
	
	//upload images
	 var upload = '</div><input id="fileUpload" type="file" accept=".jpeg"><button id="addFile" onclick="addFile(\'' + folderName +'\')" style="color:white;background-color:#008CBA;cursor:pointer;border-radius:6px;">Upload Image</button> <br/><br/><br/><button onclick="listImages()" style="color:white;background-color:orange;cursor:pointer;border-radius:6px;padding:6px 12px;font-size:14px;">Back To Folders</button>';
	
    var htmlTemplate = [
      '<h2>',
        'Course: ' + folderName,
      '</h2>',
      message,
      '<div>',
        getHtml(courseImg),
        '<br/>',
        '<br/>',
     upload
    ]
    document.getElementById('adminPage').innerHTML = getHtml(htmlTemplate);
  });
}

  //function to upload an image
function addFile(folderName) {
    var files = document.getElementById('fileUpload').files;
    if (!files.length) {
      return alert('Please choose a file to upload first.');
    }
    var file = files[0];
    var fileName = file.name;
    var folderKey = encodeURIComponent(folderName) + '/';
    var fileKey = folderKey + fileName;
    alert('fileKey: ' + fileKey);
    var urlParams = new URLSearchParams(window.location.search);
    
      s3.upload({
      Key: fileKey,
      Body: file,
      ContentDisposition: 'attachment; filename="' + fileName + '"'
    }, function(err, data) {
      if (err) {
          
        return alert('There was an error uploading your image: ', err.message);
      }
      alert('Successfully uploaded image');
       
      //storeFileDetails(fileKey);
      viewFolder(folderName);
     
    });
  }

  //function to delete the selected Folder
function deleteFolder(folderName) {
  var folderKey = encodeURIComponent(folderName) + "/";
  s3.listObjects({ Prefix: folderKey }, function(err, data) {
    if (err) {
      return alert("There was an error deleting your folder: ", err.message);
    }
    var objects = data.Contents.map(function(object) {
      return { Key: object.Key };
    });
	//s3 deleteObjects is used to delete the folder and its contents
    s3.deleteObjects(
      {
        Delete: { Objects: objects, Quiet: true }
      },
      function(err, data) {
        if (err) {
          return alert("There was an error deleting your folder: ", err.message);
        }
        alert("Successfully deleted folder.");
        listImages();
      }
    );
  });
}

  //function to delete courses
function deleteImage(folderName, fileKey) {
  s3.deleteObject({Key: fileKey}, function(err, data) {
    if (err) {
      return alert('There was an error deleting your course image: ', err.message);
    }
    alert('Successfully deleted course image.');
    viewFolder(folderName);
  });
}