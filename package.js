Package.describe({
  name: 'ipstas:autoform-cloudinary',
  git: 'https://github.com/cosio55/autoform-cloudinary.git',
  summary: 'Use Cloudinary with autoform/simpleschema to upload an image, and save the url on the collection.',
  version: '0.0.7'
});

Package.onUse(function (api) {
  Npm.depends({
		q: '1.4.1',
		lodash: '4.17.4',
    cloudinary: '1.5.0'
  });
  
  api.versionsFrom('1.1.0.2');

  api.use([
		'mongo',
    'templating',
    'reactive-var',
    'underscore',
    'nekojira:cloudinary-jquery-upload@0.1.0',
    'aldeed:autoform@5.3.0',
		'themeteorchef:bert'
  ], 'client');

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
