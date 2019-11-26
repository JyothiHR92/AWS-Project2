var folders='';
var folderBucketName = 'daycarecenterchildren';
	AWS.config.update({
	region: 'us-east-1',
    accessKeyId:<Access Key>,
     secretAccessKey: <Secret Access Key>,

});
var s3 = new AWS.S3({
	params: {Bucket: folderBucketName}
});	
function validateUserName(){
	if(document.getElementById("usrName").value == '') {
		alert("Please enter the username.")
	}
	else {
		var params1= {
		Bucket: "daycarecenterchildren"
		};
		s3.listObjects(params1, function(err, data) {
			if (err) console.log(err, err.stack); // an error occurred
			else{
				var t = JSON.stringify(data.Key); 
				var results = data.Contents.map(function(res){
					var fileKey = res.Key;
					var lastchar = fileKey.charAt(fileKey.length-1)
					if(lastchar == '/') {
						folders+=fileKey +','
						console.log(folders);
					 }
				});
				if (folders != '') {
					console.log(folders);
					if(folders.includes(document.getElementById("usrName").value+'/,')) {
						location.href="webcam.html?param1="+document.getElementById("usrName").value;
					}
					else {
						alert("Unauthorized User!");
					}
				}
			}
		});
			
	}
		
}