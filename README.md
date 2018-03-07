## Autoform Cloudinary 

Extends autoform with a cloudinary storage
 
## Installation

In a Meteor app directory, enter:

```
$ meteor add ipstas:autoform-cloudinary
```

## Example usage

```javascript

SomeSchema = new SimpleSchema({
    picture: {
			type: String,
			autoform: {
				afFieldInput: {
					type: 'cloudinary'
				}
			}
    }
});

```

## Settings

```
{
	"public": {
		"cloudinary":{
			"config": {
				"api_key": "xxxx",
				"cloud_name": "cloudName",
				"upload_preset": "presetSigned", // for signed upload
				"folder": "",
				"preset": "qdfxtg1y", // for unsigned
			},
			"options": {
				"autoUpload": false,
				"resource_type": "auto",
				"limitMultiFileUploads": 3,
				"limitConcurrentUploads": 2,
				"maxFileSize": 4000000,
				"uniq" : "true",
				"tags": "tag",
				"unique_filename": true
			}
		},
	"private":{
		"cloudinary": {
			"api_secret": "long_secret"
		}
	}
}
```

