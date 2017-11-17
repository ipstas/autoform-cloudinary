Package.describe({
  name: 'ipstas:autoform-cloudinary2',
  git: 'https://github.com/ipstas/autoform-cloudinary.git',
  summary: 'Use Cloudinary with autoform/simpleschema to upload an image, and save the url on the collection.',
  version: '1.0.0'
});

Package.onUse(function (api) {
  Npm.depends({
		q: '1.5.0',
		lodash: '4.17.4',	
		'cloudinary-jquery-file-upload': '2.3.0',
		'cloudinary': '1.9.1'
		//'blueimp-file-upload-npm': '9.12.3',
		//'blueimp-file-upload': '9.18.0',
  });
  
  api.versionsFrom('1.3.2.4');

  api.use([
		'modules',
		'ecmascript',
		'mongo',
    'templating',
    'reactive-var',
    'underscore',
    //'nekojira:cloudinary-jquery-upload@0.1.0',
    'aldeed:autoform',
		'themeteorchef:bert',
		'tomi:upload-jquery'
  ]);

  api.addFiles([
    'autoform-cloudinary.html',
    'autoform-cloudinary.css',
    'autoform-cloudinary.js'
  ], 'client');

  api.addFiles([
    'autoform-cloudinary-server.js'
  ], 'server');
	
	api.addAssets('loading.gif', 'client')
});
