AutoForm.debug();

//import * as cloudinary from 'cloudinary-jquery-file-upload';
//const cloudinary = require('cloudinary-jquery-file-upload');
//import { Mongo } from 'meteor/mongo';

const _Files = new Mongo.Collection(null);
window._localFiles = _Files;

let metaData;
function getMeta(blob){
	loadImage.parseMetaData(
		blob,
		function (data) {
			if (!data.exif) return;
			if (Session.get('debug')) console.log('cloudinary getMeta', data.exif.getAll(), data.imageHead);
			metaData = data.exif.getAll();
			Session.set('insertedMetadata', metaData);
		},
	);
}

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
	var t = Template.instance();
	//Session.set('debug', true);
	var self = this;

	t.url = new ReactiveVar();
	t.res = new ReactiveVar();
	t.atts = new ReactiveVar({});
	t.files = new ReactiveVar({});
	t.errorState = new ReactiveVar();
	t.checkSize = new ReactiveVar();
	t.removeCloud = new ReactiveVar();
	
	Session.set('cloudinarySubmittedId');
	
	self.initialValueChecked = false;
	
	Meteor.call('afCloudinary.checksize', function(err, res){
		if (Session.get('debug')) console.log('afCloudinaryChecksize max', res, self.checkSize.get());
		if (err)
			self.checkSize.set(5000000);
		if (res)
			self
		.checkSize.set(res);
	});

});

Template.afCloudinary.onRendered(function () {
	var t = Template.instance();
	var username, error, self = this, state;
	var config = Meteor.settings.public.cloudinary.config;
	var options = Meteor.settings.public.cloudinary.options || {};
	var t = Template.instance();
	if (Session.get('debug'))  console.log('afCloudinary data', cloudinary, self.data);

	var env = __meteor_runtime_config__.ROOT_URL.match(/www|stg|app|dev/);
	if (env)
		env = env[0];
	else
		env = 'dev';
	var host = __meteor_runtime_config__.ROOT_URL.split('/')[2];

	t.autorun(()=>{
		if (!Meteor.user()) return;
		options.maxFileSize = t.checkSize.get() || options.maxFileSize || 200000;
		options.url ='https://api.cloudinary.com/v1_1/' + Meteor.settings.public.cloudinary.config.cloud_name +'/auto/upload';
		options.tags = options.tags + ', ' + Meteor.user().username + ', ' + env;
	});

	t.autorun(function () {
		if (self.data && self.data.atts) {
			t.atts.set(self.data.atts);
			if (self.data.atts.folder) config.folder = self.data.atts.folder;
			if (self.data.atts.tags) options.tags = options.tags + ', ' + self.data.atts.tags;
			if (self.data.atts.unique_filename === false) config.unique_filename = false;
			//if (Session.get('debug')) console.log('self.atts.set', self.data.atts, 'data:', self.data, '\n\n');
		}
		console.log('self.data:', self.data, '\n\n');

		if (Session.get('debug') && self.data && self.data.atts)
			console.log('afCloudinarySign onRendered data.atts self.data:', self.data, 'options:', options, '\n\n');

		config.tags = options.tags;
		Meteor.call('afCloudinary.sign', config, function (err, res) {
			if (err) return console.warn('afCloudinary.sign err', err);
			var cloudinary = options;
			cloudinary.formData = res;
			self.$('input[name=file]').cloudinary_fileupload(cloudinary);
			if (Session.get('debug')) console.log('afCloudinarySign cloudinary:', cloudinary, '\nres:', res, '\noptions:', config, '\n\n\n');
		});
	});

	self.$('input[name=file]')
		.bind('fileuploadadd', function(e, data) {
			var file = data.files[0];
			getMeta(file);
			var state = data.submit();
			if (Session.get('debug')) console.log('afCloudinary add:', file.size, t.checkSize.get(),  data, '\n\n\n');
			if (file.size > t.checkSize.get()) {
				error = file.name + ' is too big, max size is ' + parseInt(t.checkSize.get()/1024/1024*10)/10 + 'MB';
				t.errorState.set(error);
				Bert.alert({
					hideDelay: 5000,
					title: 'Upload failed',
					message: error,
					type: 'danger',
					style: 'growl-top-right',
				});
				state.abort();
				return console.warn('afCloudinary add', error);
			} 
		})
		.bind('fileuploadsend', function(e, data) {
			var file = data.files[0];
			//if (Session.get('debug')) console.log('afCloudinary send:', file.size, self.checkSize.get(), data.url, data, '\n\n\n');
			if (data.url == 'https://api.cloudinary.com/v1_1/undefined/auto/upload'){
				console.warn('afCloudinary url undefined, send abort:', file, data.url, data, '\n\n\n');
				//return state.abort();
				return;
			}
			self.$('.uploader').prop('disabled', true).removeClass("browse").addClass('cancelUpload');
			//self.$('.uploader').text('0%');
			_Files.insert({filename: file.name, type: file.type, size: file.size});
			console.log('afCloudinary send:', data, file);
		})
		.bind('fileuploadprogress', function(e, data) {
			var file = data.files[0];
			_Files.update({filename: file.name},{$set:{
				progress: Math.round((data.loaded * 100) / data.total)
			}});
		})
		.bind('fileuploaddone', function (e, data) {
			self.$('.uploader').prop('disabled', false).removeClass('cancelUpload').addClass('browse');
			
			t.res.set(data.result);
			t.errorState.set();

			var file = data.files[0];
			var cloud = data.result.public_id;
			file = _Files.findOne({filename: file.name});
			_Files.update(file._id,{$set:{
				status: data.textStatus, 
				maxSize: data.maxFileSize, 
				size: data.loaded, 
				url:data.result.secure_url, 
				cloud: cloud, 
				cloudinary: data.result,
				metadata: metaData
			}});
			
			if (Session.get('debug')) console.log('\n\nafCloudinary fileuploaddone data:', data, '\natts:', t.atts.get(), '\n\n');
			Meteor.call('afCloudinary.tag', {tag: data.result.original_filename, public_id: data.result.public_id});
			
			//if form field has autosave=true
			if (t.atts.get() && t.atts.get().autosave) {
				var id = 'sub' + cloud.split('/').pop();
			}
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
		});

	//if (t.atts.get() && t.atts.get().autosave) 
	t.autorun(()=>{
		console.log('cloudinary last res:', t.res.get());
		if (!t.atts.get() || !t.atts.get().autosave) return console.log('cloudinary autosave', t.atts.get());

		Meteor.setTimeout(()=>{
			if (!_Files.find().count() || _Files.find({url:{$exists: false}}).count()) return; 
			console.log('cloudinary url not yet', _Files.find({url:{$exists: false}}).count());
			var files = _Files.find({url:{$exists: true}}).fetch();
			console.log('submitting form', $('form'));
			$('form').submit();
			_.each(files, (file)=>{
				_Files.remove(file._id);
			});
		},500);
	});

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
	iffiles(){
		return _Files.find().count();
	},
	files(){
		return _Files.find();
	},
	url(){
		//console.log('if url', this);
		if (this.value)
			this.url = this.value;
		return this.url;
	},
	cloudId(){
		if (Session.get('debug')) console.log('cloudId', this);
		if (this.cloud)
			return cloudId = this.cloud.split('/').pop();
	},
	thumbnail(){
		var t = Template.instance();
		var url, upload;
		if (!this.url)
			return console.warn('empty url', this);
		if (Meteor.settings.public.cloudinary && Meteor.settings.public.cloudinary.scaled)
			upload = 'upload/' + Meteor.settings.public.cloudinary.scaled;
		else
			upload = 'upload/c_fit,h_256,fl_progressive';
		url = this.url.replace('upload', upload );
		if (Session.get('debug')) console.log('afCloudinary thumbnail', this, url);
		return url;
	},
	accept(){
		if (this.atts)
			return this.atts.accept || 'image/*';
	},
	file(){
		if (this.atts)	
			return this.atts.resourceType === 'file';
	},
	errorState(){
		var t = Template.instance();
		if (!t.errorState.get())
			return;
		var error = t.errorState.get() + '<br>Upgrade to the next plan to have it larger';
		if (Session.get('debug')) console.log('afCloudinary fileuploadfail error', error);
		return error;
	},
	addatts(){
		var t = Template.instance();	
		var filename, atts = t.atts.get() || {};
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
	dimensions(){

	},
	debug(){
		if (Session.get('debug')) console.log('afCloudinary debug this:', this);
		return 'debug';
	}
});

Template.afCloudinary.events({
	'change #cloudinary-filename'(e,t){
		e.preventDefault();
		e.stopPropagation();
		if (Session.get('debug')) console.log('afCloudinary changed file', e, this);
		var params = {};
		if (Session.get('debug')) console.log('remove:', this.url, e.target.id, 'this:', this, e);
		t.removeCloud.set(this.url);
	},
	'input' (e,t){
		if (Session.get('debug')) console.log('afCloudinary changed file2', e, this);
	},
	'change' (e,t){
		if (Session.get('debug')) console.log('afCloudinary changed file3', e, this);
	},
	'click .browse' (e,t){
		if (Session.get('debug')) console.log('afCloudinary click browse', e, this);
		t.removeCloud.set(this.url);
		t.$('input[name=file]').click();
	},
	'click .cancelUpload'(e,t){
		console.log('click .cancelUpload', this);
		_Files.remove(this._id);
	},
	'click .js-remove'(e,t){
		e.preventDefault();
		e.stopPropagation();
		console.log('clicked remove', this);
		Meteor.call('afCloudinary.remove', {public_id: this.cloud});
		_Files.remove(this._id);
	},
	'click .removeCloud'(e,t){
		e.preventDefault();
		e.stopPropagation();
		t.url.set(null);		
		if (Session.get('debug')) console.log('afCloudinary remove pic:', e.target.id, '\nthis:',this, '\nevent:', e);
		Meteor.call('afCloudinary.remove', {url: this.url});
		_Files.remove({filename: this.filename});
	},	
	'change .cloudinary-atts'(e,t){
		e.preventDefault();
		var atts = t.atts.get() || {};
		if (e.target.id == 'tags')
			atts.tags = $(e.currentTarget).val();
		else if (e.target.id == 'folder')
			atts.folder = $(e.currentTarget).val();
		t.atts.set(atts);
		if (Session.get('debug')) console.log('changed t.atts.set', atts);
	}
});

