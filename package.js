Package.describe({
	name: 'ipstas:autoform-cloudinary3',
	version: '1.0.8',
	summary: 'Provides a autoform augmented field for cloudinary upload',
	git: 'https://github.com/ipstas/autoform-cloudinary',
	documentation: 'README.md'
});

Package.onUse(function (api) {
	api.versionsFrom('1.4');

	Npm.depends({
		cloudinary: '1.11.0',
		'blueimp-file-upload': '9.21.0',
		'cloudinary-jquery-file-upload': '2.5.0'
	});
	
	api.use([
		//'ecmascript',
		'mongo',
		'templating',
		'blaze',
		'underscore',
		'aldeed:autoform@6.2.0'
	]);

	api.addFiles([
		//'load-image.js',
		'jQuery-File-Upload/js/vendor/jquery.ui.widget.js',
		'jQuery-File-Upload/js/jquery.iframe-transport.js',
		'jQuery-File-Upload/js/jquery.fileupload.js',
		'pkg-cloudinary-jquery-file-upload/cloudinary-jquery-file-upload.js',
		//'vendor/load-image.all.min.js',
		'vendor/load-image.js',
		'vendor/load-image-meta.js',
		'vendor/load-image-exif.js',
		'vendor/load-image-exif-map.js',
		'autoform_cloudinary.html',
		'autoform_cloudinary.js',
		'autoform_cloudinary.css'
	], 'client');
	
	api.addFiles([
		'autoform_cloudinary_srv.js'
	], 'server');

	api.export(['AutoformCloudinary']);
});

