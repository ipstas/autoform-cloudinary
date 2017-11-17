//import { Mongo } from 'meteor/mongo';
const Files = new Mongo.Collection(null);
window._localFiles = Files;
var jqXHR;
import cloudinary from 'cloudinary-jquery-file-upload';
//import 'blueimp-file-upload-npm';

const hooksObject = {
  before: {
    // Replace `formType` with the form `type` attribute to which this hook applies
    insert: function(doc) {
      // Potentially alter the doc
      if (Session.get('debug')) console.log("before on all input/update/method forms!", doc, this);
			return doc;
    }
  },

  // The same as the callbacks you would normally provide when calling
  // collection.insert, collection.update, or Meteor.call
/*   after: {
    // Replace `formType` with the form `type` attribute to which this hook applies
    insert: function(error, result) {
			console.log("after on all input/update/method forms!", error, result, this);
		}
  }, */

  // Called when form does not have a `type` attribute
/*   onSubmit: function(insertDoc, updateDoc, currentDoc) {
    // You must call this.done()!
    //this.done(); // submitted successfully, call onSuccess
    //this.done(new Error('foo')); // failed to submit, call onError with the provided error
    //this.done(null, "foo"); // submitted successfully, call onSuccess with `result` arg set to "foo"
  }, */

  onError: function () {
    console.warn("onError hook called with arguments", 'context:', this);
  },
	onSuccess: function (doc) {
		Files.remove(Session.get('cloudinarySubmittedId'));	
		if (Session.get('debug'))
			console.log("autoform-cloudinary: onSuccess. update:", 
				'doc:', doc, 
				'submittedId:', Session.get('cloudinarySubmittedId'),
				'currentDoc:', this.currentDoc, 
				'insertDoc:', this.insertDoc, 
				'\nfiles:', Files.find().fetch(), 
				'\nthis:', this, '\n\n' 
			);	
	},

/*   // Called every time an insert or typeless form
  // is revalidated, which can be often if keyup
  // validation is used.
  formToDoc: function(doc) {
    // alter doc
    // return doc;
  },

  // Called every time an update or typeless form
  // is revalidated, which can be often if keyup
  // validation is used.
  formToModifier: function(modifier) {
    // alter modifier
    // return modifier;
  },

  // Called whenever `doc` attribute reactively changes, before values
  // are set in the form fields.
  docToForm: function(doc, ss) {},

  // Called at the beginning and end of submission, respectively.
  // This is the place to disable/enable buttons or the form,
  // show/hide a "Please wait" message, etc. If these hooks are
  // not defined, then by default the submit button is disabled
  // during submission.
  beginSubmit: function() {},
  endSubmit: function() {} */
};

AutoForm.addHooks(null, hooksObject);

AutoForm.addInputType('cloudinary', {
  template: 'afCloudinary',

  valueOut: function () {
		if (Session.get('debug')) console.log('addInputType cloudinary', this, this.val());
    return this.val();
  }
});

AutoForm.addInputType('cloudinary_file', {
  template: 'afCloudinary_file',
	upload_preset: Meteor.settings.public.CLOUDINARY_RAW,
  valueOut: function () {
		//console.log('addInputType cloudinary_file', this, this.val());
    return this.val();
  }
});

Meteor.startup(function () {
	Meteor.call('publicCredentials', function(err, res) {
		if (res) {
			$.cloudinary.config({
				cloud_name: res.cloudName,
				api_key: res.apiKey,
				upload_preset: Meteor.settings.public.CLOUDINARY_PRESET
			});
		} else {
			$.cloudinary.config({
				cloud_name: Meteor.settings.public.CLOUDINARY_CLOUD_NAME,
				api_key: Meteor.settings.public.CLOUDINARY_API_KEY,
				upload_preset: Meteor.settings.public.CLOUDINARY_PRESET
			});
		}
		//console.log('cloudinary pkg publicCredentials', err, res);
	});
});

var templates = ['afCloudinary', 'afCloudinary_bootstrap3', 'afCloudinary_file'];

_.each(templates, function (tmpl) {
  Template[tmpl].onCreated(function () {
    var self = this;

    self.url = new ReactiveVar();
		self.res = new ReactiveVar();
		self.atts = new ReactiveVar({});
		self.files = new ReactiveVar({});
		self.errorState = new ReactiveVar();
		self.checkSize = new ReactiveVar();
		Session.set('cloudinarySubmittedId');
		
    self.initialValueChecked = false;
		
		if (tmpl == 'afCloudinary_file')
			self.data.atts.upload_preset = Meteor.settings.public.CLOUDINARY_RAW;
		
    self.checkInitialValue = function () {
      Tracker.nonreactive(function () {
        if (!self.initialValueChecked && !self.url.get() && self.data.value) {
					if (Session.get('debug'))  console.log('afCloudinary data set initial', self.data);
          self.url.set(self.data.value);
          self.initialValueChecked = true;
        }
      });
    };
  });

	Template[tmpl].onDestroyed(function () {
		var files = (Files.find().fetch());
		if (Session.get('debug')) console.log('destroying clouds in autoform', files);
		_.each(files.cloud, function(cloud){
			var params = {};
			params.cloud = cloud;
			Meteor.call('afCloudinaryRemove', params);
			Files.remove({cloud: cloud});	
		});
	}); 
	
  Template[tmpl].onRendered(function () {
    var self = this;
		var error;
		var t = Template.instance();
		if (Session.get('debug'))  console.log('afCloudinary data', self.data);
    var options = {};
    if (self.data && self.data.atts && self.data.atts.folder) {
      _.extend(options, {folder: self.data.atts.folder});
    }
    if (self.data && self.data.atts && self.data.atts.tags) {
      _.extend(options, {tags: self.data.atts.tags});
    }

    if (self.data && self.data.atts && self.data.atts.resourceType && self.data.atts.resourceType==='file') {
      _.extend(options, {use_filename: true});
    }
		
		if (self.data.atts.upload_preset)
			options.upload_preset = self.data.atts.upload_preset;
		else if (Meteor.settings.public.CLOUDINARY_PRESET)
			options.upload_preset = Meteor.settings.public.CLOUDINARY_PRESET;

		//options.use_filename = true;
		if (self.data.atts.tags)
			options.tags = self.data.atts.tags + ', ' + Meteor.settings.public.CLOUDINARY_TAGS;
		else if (Meteor.settings.public.CLOUDINARY_TAGS)
			options.tags = Meteor.settings.public.CLOUDINARY_TAGS;

		if (self.data.atts.folder)
			options.folder = self.data.atts.folder;		
		// if (Meteor.settings.public.CLOUDINARY_FOLDER_PREFIX)
			// options.folder = Meteor.settings.public.CLOUDINARY_FOLDER_PREFIX;
		

		var env = __meteor_runtime_config__.ROOT_URL.match(/www|stg|app|dev/);
		if (env)
			env = env[0];
		else
			env = 'dev';
		
		var host = __meteor_runtime_config__.ROOT_URL.split('/')[2];
		
		var username; 
		if (Meteor.user())
			username = Meteor.user().username;
		options.tags = options.tags + ', ' + env + ', ' + host + ', ' + Meteor.userId() + ', ' + username;
		
		if (!options.unique_filename && Meteor.settings.public.CLOUDINARY_UNIQ)
			options.unique_filename = Meteor.settings.public.CLOUDINARY_UNIQ;

		var atts = self.data.atts;
		if (!atts.tags)
			atts.tags = options.tags;
		if (!atts.folder)
			atts.folder = options.folder;
		//atts.resource_type  = 'auto'	;
		if (Session.get('debug')) console.log('self.atts.set', atts, 'data:', self.data, '\n\n');
		self.atts.set(atts);		
		
		
		Tracker.autorun(function () {	
			if (self.atts.get() && self.atts.get().tags)
				options.tags = options.tags + ', ' + self.atts.get().tags;
			if (self.atts.get() && self.atts.get().folder)
				options.folder = self.atts.get().folder;
			//options.upload_preset = 'xlazzRaw';
			//options.resource_type  = 'auto'	;
/* 			if (self.data && self.data.atts)
				options = self.data.atts; */
			
			// if (self.data && self.data.atts)	
				// console.log('afCloudinarySign onRendered data.atts:', self, 'self:', self, 'options:', options, 'self:', self, '\n\n\n');
				
			Meteor.call('afCloudinarySign', options, function (err, res) {
				if (err) {
					return console.log(err);
				}
				if (Session.get('debug')) console.log('afCloudinarySign res:', res, 'options:', options, '\n\n\n');

				//console.log('> afCloudinarySign.res', res);

				self.$('input[name=file]').cloudinary_fileupload({
					formData: res
				});
			});
		});

		Meteor.call('afCloudinaryChecksize', function(err, res){
			if (Session.get('debug')) console.log('afCloudinaryChecksize max', res, t.checkSize.get());
			if (err)
				t.checkSize.set(5000000);
			if (res)
				t.checkSize.set(res);
		});

		self.$('input[name=file]').cloudinary_fileupload({
			autoUpload: false,
			limitMultiFileUploads: 3,
			limitConcurrentUploads: 3,
			maxFileSize: self.checkSize.get(),
			url: 'https://api.cloudinary.com/v1_1/ufg/auto/upload',
		// plus any other options, eg. maxFileSize
		});
		
		
		self.$('input[name=file]')
			.bind('fileuploadadd', function(e, data) {
				var file = data.files[0];
				if (Session.get('debug')) console.log('afCloudinarySign add:', file.size, t.checkSize.get(),  data, '\n\n\n');
				//self.checkSize.set(22200);
				if (file.size > self.checkSize.get()) {
					error = file.name + ' is too big, max size is ' + parseInt(t.checkSize.get()/1024/1024) + 'MB';
					t.errorState.set(error);
					Bert.alert({
						hideDelay: 5000,
						title: 'Upload failed',
						message: error,
						type: 'danger',
						style: 'growl-top-right',
					});
					return console.warn('afCloudinarySign add', error);
				} else 
					jqXHR = data.submit();
			})
			.bind('fileuploadsend', function(e, data) {
				var file = data.files[0];
				if (Session.get('debug')) console.log('afCloudinarySign send:', file.size, self.checkSize.get(), data.url, data, '\n\n\n');
				if (data.url == 'https://api.cloudinary.com/v1_1/undefined/auto/upload'){				
					console.log('afCloudinarySign send abort:', file, data.url, data, '\n\n\n');
					return jqXHR.abort();
				}
				self.$('.uploader').prop('disabled', true).removeClass("browse");
				self.$('.uploader').text('0%');				
				Files.insert({filename: file.name, type: file.type, size: file.size});
			})
			.bind('fileuploadprogress', function(e, data) {
      //$('.progress_bar').css('width', Math.round((data.loaded * 100.0) / data.total) + '%');
				var progressPercent = Math.round((data.loaded * 100.0) / data.total) + '%';
				var file = data.files[0];
				Files.update({filename: file.name},{$set:{
					progress: Math.round((data.loaded * 100.0) / data.total)
				}});
				//if (Session.get('debug')) console.log('fileuploadprogress', e, data);
				//self.$('.browse').text(progressPercent);
				// var files = self.files.get();
				// if (!files)
					// files = [];
				
				//files.push(data.res.original_filename);
				
			})
			.bind('fileuploaddone', function (e, data) {
				//self.$('.browse').text('Browse');
				self.$('.uploader').prop('disabled', false).addClass('browse');
				self.res.set(data.result);
				self.errorState.set();
				//Session.set('fileupload', data.result);
				//self.url.set(data.result.secure_url);

				Tracker.flush();
				//self.errorState.set();
				var file = data.files[0];
				var cloud = data.result.public_id.split('/')[1];
				Files.update({filename: file.name},{$set:{
					status: data.textStatus, 
					maxSize: data.maxFileSize, 
					size: data.loaded, 
					url:data.result.secure_url, 
					cloud: cloud, 
					cloudinary: data.result,
					metadata: data.result.image_metadata
				}});			
				Session.set('insertedMetadata', data.result.image_metadata);
				if (Session.get('debug')) console.log('afCloudinary fileuploaddone', self.atts.get(), data.files, Files.findOne({filename: file.name}), '\ndata:', data, '\n\n\n');
				Meteor.call('afCloudinary.tag', {tag: data.result.original_filename, public_id: data.result.public_id});
				Meteor.setTimeout(function(){
					if (Session.get('debug')) console.log('afCloudinary checking self.atts.get()', self.atts.get());
					if (self.atts.get().autosave)
						$('.submit').click();
				},100);	
				//Session.set('selectDate', new Date().toLocaleDateString());
			})	
			.bind('fileuploadfail', function (e, data) {
				console.warn('afCloudinary fileuploadfail', e, data);
				self.$('.uploader').prop('disabled', false).addClass('browse');			
				
				var file = data.files[0];
				error = data._response.jqXHR.responseJSON.error.message;
				self.errorState.set(error);

				Files.remove({filename: file.name});
				Bert.alert({
					hideDelay: 6000,
					title: 'Upload failed',
					message: error,
					type: 'danger',
					style: 'growl-top-right',
					icon: 'fa-music'
				});
				Tracker.flush();
				self.$('.browse').text('Failed');
			});

    self.$(self.firstNode).closest('form').on('reset', function () {
      //self.url.set(null);
    });
  });

  Template[tmpl].helpers({
		iffiles: function () {
			return Files.find().count();
		},
		files: function () {
			return Files.find();
		},
		url: function () {
			//console.log('if url', this);
			if (this.value)
				this.url = this.value;
			return this.url;
		},
		cloudId: function () {
      var t = Template.instance();
			var url;
			//console.log('cloudId', this);
			if (this.value)
				this.url = this.value;
/* 			var upload = 'upload/' + Meteor.settings.public.CLOUDINARY_SCALED;
			if (t.url.get())
				url = t.url.get().replace('upload', upload ); */
			var cloudId = this.url.split('/').pop().split('.')[0];	
			return cloudId;
		}, 	
    thumbnail: function () {
      var t = Template.instance();
			var url;
			//console.log('thumbnail', this);
			if (this.value)
				this.url = this.value;
			if (!this.url)
				return console.warn('empty url', this);
			var upload = 'upload/' + Meteor.settings.public.CLOUDINARY_SCALED;
			if (Meteor.settings.public.CLOUDINARY_SCALED)
				url = this.url.replace('upload', upload );
			else
				url = this.url.replace('upload', 'upload/c_fit,h_256,fl_progressive' );
			//console.log('afCloudinary thumbnail', this, url);
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
			var atts = t.atts.get();
			if (!atts || !atts.type)
				atts.resourceType = 'image';
			else
				atts.resourceType = 'file';
			if (Session.get('debug')) console.log('afCloudinary debug addats this:', this, 'atts:', atts, '\n');
			var filename;
			if (t.res.get()) {
				
				filename = t.res.get().original_filename;
				atts.tags = atts.tags + ', ' + filename;
				//console.log('atts', atts, atts.tags);
      }			
			return atts;			
		},
		dimensions: function () {
/* 			var dimensions = {width: this.cloudinary.width, height: this.cloudinary.height};
			if (this.cloudinary.width / this.cloudinary.height == 2)
				return;
			Bert.alert('You have uploaded file with wrong dimensions. It might not work', 'warning');
			return dimensions; */
		},
		debug: function (){
			if (Session.get('debug')) console.log('afCloudinary debug this:', this);
			return 'debug';
		}
  });

  Template[tmpl].events({
		'change #cloudinary-filename': function (e, t) {
			if (Session.get('debug')) console.log('afCloudinary changed file', e, this);
		},
		'input' : function (e, t) {
			if (Session.get('debug')) console.log('afCloudinary changed file2', e, this);
		},
		'change' : function (e, t) {
			if (Session.get('debug')) console.log('afCloudinary changed file3', e, this);
		},
    'click .browse' : function (e, t) {
			if (Session.get('debug')) console.log('afCloudinary click browse', e, this);
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
    'click .js-remove': function (e, t) {
      e.preventDefault();
			e.stopPropagation();
      t.url.set(null);		
			if (Session.get('debug')) console.log('afCloudinary remove pic', e.target.id, this, e, e.target, $(e.currentTarget));
			var params = {};
			params.cloud = e.target.id
			Meteor.call('afCloudinaryRemove', params);	
			Files.remove({filename: this.filename});
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
});
