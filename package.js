Package.describe({
	name: 'ipstas:autoform-cloudinary3',
	version: '1.0.1',
	summary: 'Provides a autoform tags input with typeahead functionality',
	git: 'https://github.com/Redroest/meteor-autoform-tags-typeahead',
	documentation: 'README.md'
});

Package.onUse(function (api) {
	api.versionsFrom('1.1.0.3');

	Npm.depends({
		cloudinary: '1.9.1',
		'blueimp-file-upload': '9.19.1',
		'cloudinary-jquery-file-upload': '2.3.0',
	});
	
	api.use([
		'mongo',
		'templating',
		'blaze',
		'underscore',
		'aldeed:autoform',
		//'tomi:upload-jquery'
	]);

	api.addFiles([
		'autoform_cloudinary.html',
		'autoform_cloudinary.js',
		'autoform_cloudinary.css',
		'jQuery-File-Upload/js/vendor/jquery.ui.widget.js',
		'jQuery-File-Upload/js/jquery.iframe-transport.js',
		'jQuery-File-Upload/js/jquery.fileupload.js',
		//'jQuery-File-Upload/js/jquery.fileupload-image.js',
		'pkg-cloudinary-jquery-file-upload/cloudinary-jquery-file-upload.js'
	], 'client');	
	
	api.addFiles([
		'autoform_cloudinary_srv.js'
	], 'server');

	api.export(['AutoformCloudinary']);
});

