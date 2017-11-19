AutoForm.debug();

//import * as cloudinary from 'cloudinary-jquery-file-upload';
//const cloudinary = require('cloudinary-jquery-file-upload');
//import { Mongo } from 'meteor/mongo';

const _Files = new Mongo.Collection(null);
window._localFiles = _Files;
var jqXHR;

// Using the config function
//const cloudinary = Npm.require('cloudinary-jquery-file-upload');


AutoForm.addInputType("cloudinary", {
	template: "afCloudinary",
	
	valueIn: function(value, atts) {
		//console.log('afCloudinary valueIn:', value, atts);
		return value;
	},
	
	valueOut: function() {
		//console.log('afCloudinary valueOut', this.val());
		return this.val();
	}
});

//return;

Template.afCloudinary.onCreated(function () {
	//Session.set('debug', true);
	var self = this;

	self.url = new ReactiveVar();
	self.res = new ReactiveVar();
	self.atts = new ReactiveVar({});
	self.files = new ReactiveVar({});
	self.errorState = new ReactiveVar();
	self.checkSize = new ReactiveVar();
	self.removeCloud = new ReactiveVar();
	
	Session.set('cloudinarySubmittedId');
	
	self.initialValueChecked = false;
	
	self.checkInitialValue = function () {
		Tracker.nonreactive(function () {
			if (!self.initialValueChecked && !self.url.get() && self.data.value) {
				if (Session.get('debug'))  
					console.log('afCloudinary data set initial', self.data);
				self.url.set(self.data.value);
				self.initialValueChecked = true;
			}
		});
	};
});

Template.afCloudinary.onRendered(function () {
	var error, self = this, options = Meteor.settings.public.cloudinary;
	var signing = Meteor.settings.public.cloudinary.config;
	var t = Template.instance();
	if (Session.get('debug'))  console.log('afCloudinary data', cloudinary, self.data);

/* 	if (self.data && self.data.atts && self.data.atts.folder) {
		_.extend(options, {folder: self.data.atts.folder});
	}
	if (self.data && self.data.atts && self.data.atts.tags) {
		_.extend(options, {tags: self.data.atts.tags});
	}

	if (self.data && self.data.atts && self.data.atts.resourceType && self.data.atts.resourceType==='file') {
		_.extend(options, {use_filename: true});
	}
	
	options.upload_preset = Meteor.settings.public.cloudinary.cloudinary_preset;

	//options.use_filename = true;
	if (self.data.atts.tags)
		options.tags = self.data.atts.tags + ', ' + Meteor.settings.public.CLOUDINARY_TAGS;
	else if (Meteor.settings.public.CLOUDINARY_TAGS)
		options.tags = Meteor.settings.public.CLOUDINARY_TAGS;

	if (self.data.atts.folder)
		options.folder = self.data.atts.folder;		
	// if (Meteor.settings.public.CLOUDINARY_FOLDER_PREFIX)
		// options.folder = Meteor.settings.public.CLOUDINARY_FOLDER_PREFIX; */
	

	var env = __meteor_runtime_config__.ROOT_URL.match(/www|stg|app|dev/);
	if (env)
		env = env[0];
	else
		env = 'dev';
	
	var host = __meteor_runtime_config__.ROOT_URL.split('/')[2];
	
	var username; 
	if (Meteor.user())
		username = Meteor.user().username;
	// options.tags = Meteor.settings.public.cloudinary.tags || '';
	// options.tags = options.tags + ', ' + env + ', ' + host + ', ' + Meteor.userId() + ', ' + username;
	
	// if (!options.unique_filename && Meteor.settings.public.CLOUDINARY_UNIQ)
		// options.unique_filename = Meteor.settings.public.CLOUDINARY_UNIQ;

	var atts = self.data.atts;
/* 	if (!atts.tags)
		atts.tags = options.tags;
	if (!atts.folder)
		atts.folder = options.folder; */
	//atts.resource_type  = 'auto'	;
	if (Session.get('debug')) 
		console.log('self.atts.set', atts, 'data:', self.data, '\n\n');
	self.atts.set(atts);		
	
	options.autoUpload = false;
	options.limitMultiFileUploads = 3;
	options.limitConcurrentUploads = 3;
	options.maxFileSize = self.checkSize.get();
	options.url ='https://api.cloudinary.com/v1_1/' + Meteor.settings.public.cloudinary.config.cloud_name +'/auto/upload';

	Tracker.autorun(function () {	
/* 		if (self.atts.get() && self.atts.get().tags)
			options.tags = options.tags + ', ' + self.atts.get().tags;
		if (self.atts.get() && self.atts.get().folder)
			options.folder = self.atts.get().folder; */
		//options.upload_preset = 'xlazzRaw';
		//options.resource_type  = 'auto'	;
/* 			if (self.data && self.data.atts)
			options = self.data.atts; */
		
		// if (self.data && self.data.atts)	
			// console.log('afCloudinarySign onRendered data.atts:', self, 'self:', self, 'options:', options, 'self:', self, '\n\n\n');

		Meteor.call('afCloudinary.sign', signing, function (err, res) {
			if (err) {
				return console.log(err);
			}
			if (Session.get('debug')) 
				console.log('afCloudinarySign res:', res, '\noptions:', signing, '\n\n\n');

			//console.log('> afCloudinarySign.res', res);

			self.$('input[name=file]').cloudinary_fileupload({
				formData: res
			});
		});		
	});	

/* 	self.$('input[name=file]').cloudinary_fileupload({
		autoUpload: false,
		limitMultiFileUploads: 3,
		limitConcurrentUploads: 3,
		maxFileSize: self.checkSize.get(),
		url: 'https://api.cloudinary.com/v1_1/' + ufg/auto/upload',
	// plus any other options, eg. maxFileSize
	});	 */
	
	self.$('input[name=file]').cloudinary_fileupload(options);
		
	Meteor.call('afCloudinary.checksize', function(err, res){
		if (Session.get('debug')) console.log('afCloudinaryChecksize max', res, t.checkSize.get());
		if (err)
			t.checkSize.set(5000000);
		if (res)
			t.checkSize.set(res);
	});

/* 	self.$('input[name=file]').unsigned_cloudinary_upload(
		Meteor.settings.public.cloudinary.upload_preset,
		options,
		{multiple: true}
	); */
	
	self.$('input[name=file]').bind('fileuploadadd', function(e, data) {
			var file = data.files[0];
			jqXHR = data.submit();
			if (Session.get('debug')) console.log('afCloudinary add:', file.size, t.checkSize.get(),  data, '\n\n\n');
			if (file.size > self.checkSize.get()) {
				error = file.name + ' is too big, max size is ' + parseInt(t.checkSize.get()/1024/1024*10)/10 + 'MB';
				t.errorState.set(error);
				Bert.alert({
					hideDelay: 5000,
					title: 'Upload failed',
					message: error,
					type: 'danger',
					style: 'growl-top-right',
				});
				jqXHR.abort();
				return console.warn('afCloudinary add', error);
			} 
		})
		.bind('fileuploadsend', function(e, data) {
			var file = data.files[0];
			if (Session.get('debug')) console.log('afCloudinary send:', file.size, self.checkSize.get(), data.url, data, '\n\n\n');
			if (data.url == 'https://api.cloudinary.com/v1_1/undefined/auto/upload'){				
				console.log('afCloudinary url undefined, send abort:', file, data.url, data, '\n\n\n');
				return jqXHR.abort();
			}
			self.$('.uploader').prop('disabled', true).removeClass("browse");
			self.$('.uploader').text('0%');				
			_Files.insert({filename: file.name, type: file.type, size: file.size});
		})
		.bind('fileuploadprogress', function(e, data) {
		//$('.progress_bar').css('width', Math.round((data.loaded * 100.0) / data.total) + '%');
			var progressPercent = Math.round((data.loaded * 100.0) / data.total) + '%';
			var file = data.files[0];
			_Files.update({filename: file.name},{$set:{
				progress: Math.round((data.loaded * 100.0) / data.total)
			}});			
		})
		.bind('fileuploaddone', function (e, data) {
			self.$('.uploader').prop('disabled', false).addClass('browse');
			self.res.set(data.result);
			self.errorState.set();

			Tracker.flush();
			var file = data.files[0];
			var cloud = data.result.public_id;
			_Files.update({filename: file.name},{$set:{
				status: data.textStatus, 
				maxSize: data.maxFileSize, 
				size: data.loaded, 
				url:data.result.secure_url, 
				cloud: cloud, 
				cloudinary: data.result,
				metadata: data.result.image_metadata
			}});			
			Session.set('insertedMetadata', data.result.image_metadata);
			$('.submit').click();
			if (Session.get('debug')) console.log('afCloudinary fileuploaddone', self.atts.get(), data.files, _Files.findOne({filename: file.name}), '\ndata:', data, '\nremove:', t.removeCloud.get(), '\n\n\n');
			Meteor.call('afCloudinary.remove', {url: t.removeCloud.get()});
			Meteor.call('afCloudinary.tag', {tag: data.result.original_filename, public_id: data.result.public_id});
			Meteor.setTimeout(function(){
				if (Session.get('debug')) console.log('afCloudinary checking self.atts.get()', self.atts.get());
				if (self.atts.get().autosave) {
					$('.btnsub').click();
					_Files.remove({filename: file.name});
				}
			},100);	
		})	
		.bind('fileuploadfail', function (e, data) {
			console.warn('afCloudinary fileuploadfail', data._response, '\ndata:', data);
			self.$('.uploader').prop('disabled', false).addClass('browse');			
			
			var file = data.files[0];
			error = self.errorState.get() || data.errorThrown;
			self.errorState.set(error);

			_Files.remove({filename: file.name});
			Bert.alert({
				hideDelay: 6000,
				title: 'Upload failed',
				message: error,
				type: 'danger',
				style: 'growl-top-right',
				icon: 'fa-music'
			});
			Tracker.flush();
			//self.$('.browse').text('Failed');
		});
		
	var removeLocal = function(filename){
		_Files.remove({filename: file.name});
	}

	self.$(self.firstNode).closest('form').on('reset', function () {
		//self.url.set(null);
	});
});

Template.afCloudinary.onDestroyed(function () {
	var files = (_Files.find().fetch());
	if (Session.get('debug')) console.log('destroying clouds in autoform on onDestroyed', files);
	_.each(files.cloud, function(cloud){
		var params = {};
		params.cloud = cloud;
		Meteor.call('afCloudinary.remove', params);
		_Files.remove({cloud: cloud});	
	});
}); 

Template.afCloudinary.helpers({
	iffiles: function () {
		return _Files.find().count();
	},
	files: function () {
		return _Files.find();
	},
	url: function () {
		//console.log('if url', this);
		if (this.value)
			this.url = this.value;
		return this.url;
	},
	cloudId: function () {
		console.log('cloudId', this);
		if (this.url)
			return cloudId = this.url.split('upload/').pop();	
	}, 	
	thumbnail: function () {
		var t = Template.instance();
		var url, upload;
		if (!this.url)
			return console.warn('empty url', this);
		if (Meteor.settings.public.cloudinary && Meteor.settings.public.cloudinary.scaled)
			upload = 'upload/' + Meteor.settings.public.cloudinary.scaled;
		else
			upload = 'upload/c_fit,h_256,fl_progressive';
		url = this.url.replace('upload', upload );
		console.log('afCloudinary thumbnail', this, url);
		return url;
	},
	accept: function () {
		return this.atts.accept || 'image/*';
	},
	file: function () {
		return this.atts.resourceType === 'file';
	},
	errorState: function () {
		var t = Template.instance();		
		if (!t.errorState.get())
			return;
		var error = t.errorState.get() + '<br>Upgrade to the next plan to have it larger';
		console.log('afCloudinary fileuploadfail error', error);
		return error;
	},
	addatts: function () {
		var t = Template.instance();	
		var filename, atts = t.atts.get();
		if (!atts || !atts.type)
			atts.resourceType = 'image';
		else
			atts.resourceType = 'file';
		if (Session.get('debug')) console.log('afCloudinary debug addats this:', this, 'atts:', atts, '\n');
		if (t.res.get()) {		
			filename = t.res.get().original_filename;
			atts.tags = atts.tags + ', ' + filename;
		}			
		return atts;			
	},
	dimensions: function () {

	},
	debug: function (){
		if (Session.get('debug')) console.log('afCloudinary debug this:', this);
		return 'debug';
	}
});

Template.afCloudinary.events({
	'change #cloudinary-filename': function (e, t) {
		if (Session.get('debug')) console.log('afCloudinary changed file', e, this);
		var params = {};
		console.log('remove:', this.url, e.target.id, 'this:', this, e);
		t.removeCloud.set(this.url);
/* 		$('#cloudinary-filename').fileupload({
        dataType: 'json',
        done: function (e, data) {
					console.log('uploading done', data);
            $.each(data.result.files, function (index, file) {
                $('<p/>').text(file.name).appendTo(document.body);
            });
        },
				progressall: function (e, data) {
					console.log('uploading', data);
						var progress = parseInt(data.loaded / data.total * 100, 10);
						$('#progress .bar').css(
								'width',
								progress + '%'
						);
				}
		}); */
	},
	'input' : function (e, t) {
		if (Session.get('debug')) console.log('afCloudinary changed file2', e, this);
	},
	'change' : function (e, t) {
		if (Session.get('debug')) console.log('afCloudinary changed file3', e, this);
	},
	'click .browse' : function (e, t) {
		if (Session.get('debug')) console.log('afCloudinary click browse', e, this);
		t.removeCloud.set(this.url);
		t.$('input[name=file]').click();
	},
	'click .submit' : function (e, t) {
		e.preventDefault();
		e.stopPropagation();
		if (Session.get('debug')) console.log('afCloudinary submit class', this);		
		Session.set('cloudinarySubmittedId', this._id);
		
		//document.forms['insertImagesForm'].submit();
		$('.btnsub').click();
		
	},
	'click button': function (e, t) {
		//e.preventDefault();
		//e.stopPropagation();
		//console.log('submit button', e,  e.target, t, $(this).closest('form'), this);
	},
	'click .removeCloud': function (e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.url.set(null);		
		if (Session.get('debug')) console.log('afCloudinary remove pic:', e.target.id, '\nthis:',this, '\nevent:', e);
		Meteor.call('afCloudinary.remove', {url: this.url});	
		_Files.remove({filename: this.filename});
	},
	
	'change .cloudinary-atts': function (e, t) {	
		e.preventDefault();
		var atts = t.atts.get();
		if (e.target.id == 'tags')
			atts.tags = $(e.currentTarget).val();
		else if (e.target.id == 'folder')
			atts.folder = $(e.currentTarget).val();
		t.atts.set(atts);
		if (Session.get('debug')) console.log('changed t.atts.set', atts);
	}
});

