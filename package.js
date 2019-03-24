Package.describe({
	name: 'ipstas:autoform-cloudinary3',
	version: '1.0.11',
	summary: 'Provides a autoform augmented field for cloudinary upload',
	git: 'https://github.com/ipstas/autoform-cloudinary',
	documentation: 'README.md'
});

Package.onUse(function (api) {
	api.versionsFrom('1.6');
	api.use('ecmascript');
	
	Npm.depends({
		'cloudinary': '1.13.2',
		//'cloudinary-core': '2.5.0',
		'blueimp-file-upload': '9.28.0',
		//'cloudinary-jquery-file-upload': '2.5.0',
		//'fast-exif': '1.0.1'
		//'exif': '0.6.0'
		'blueimp-load-image': '2.20.1',
		//'jquery-bridget': '2.0.1'
	});
	
	api.use([
		'ecmascript',
		'check',
		'mongo',
		'templating',
		'blaze',
		'underscore',
		'aldeed:autoform'
	]);
	
	api.mainModule('autoform_cloudinary_index.js', 'client');
	api.mainModule('autoform_cloudinary_srv.js', 'server');

	api.addFiles([
		'jQuery-File-Upload/js/vendor/jquery.ui.widget.js',
		'jQuery-File-Upload/js/jquery.iframe-transport.js',
		'jQuery-File-Upload/js/jquery.fileupload.js',
		'autoform_cloudinary.css'
	], 'client');
	
	api.export(['AutoformCloudinary']);
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('autoform-cloudinary3');
  api.mainModule('autoform_cloudinary-tests.js');
});
