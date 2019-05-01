Package.describe({
	name: 'ipstas:autoform-cloudinary3',
	version: '1.0.15',
	summary: 'Provides a autoform augmented field for cloudinary upload',
	git: 'https://github.com/ipstas/autoform-cloudinary',
	documentation: 'README.md'
});

Package.onUse(function (api) {
	api.versionsFrom('1.6');
	
	Npm.depends({
		'cloudinary': '1.14.0',
		//'jquery-ui': '1.12.1',
		//'blueimp-file-upload': '9.28.0',
		//'cloudinary-jquery-file-upload': '2.6.2',
		//'blueimp-load-image': '2.20.1',
	});
	
	api.use([
		'ecmascript',
		'check',
		'mongo',
		'underscore',
		'templating@1.3.0',
		'blaze@2.3.0',
		'aldeed:autoform@6.3.0'
	]);
	
	//api.mainModule('autoform_cloudinary_index.js', 'client', {lazy: true});
	api.mainModule('autoform_cloudinary_index.js', 'client', {lazy: false});
	api.mainModule('autoform_cloudinary_srv.js', 'server', {lazy:false});

	api.addFiles([
		'jQuery-File-Upload/jquery.ui.widget.js',
		'jQuery-File-Upload/jquery.iframe-transport.js',
		'jQuery-File-Upload/jquery.fileupload.js',
		'autoform_cloudinary.css'
	], 'client');
	
	//api.export(['AutoformCloudinary']);
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('ipstas:autoform-cloudinary3');
  api.mainModule('autoform_cloudinary-tests.js');
});
