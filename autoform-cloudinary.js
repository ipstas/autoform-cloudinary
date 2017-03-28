//import { Mongo } from 'meteor/mongo';
const Files = new Mongo.Collection(null);
window._localFiles = Files;

const hooksObject = {
  before: {
    // Replace `formType` with the form `type` attribute to which this hook applies
    insert: function(doc) {
      // Potentially alter the doc
      console.log("before on all input/update/method forms!", doc, this);
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
		console.log('addInputType cloudinary', this, this.val());
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
		Session.set('cloudinarySubmittedId');
		
    self.initialValueChecked = false;
		
		if (tmpl == 'afCloudinary_file')
			self.data.atts.upload_preset = Meteor.settings.public.CLOUDINARY_RAW;
		
    self.checkInitialValue = function () {
      Tracker.nonreactive(function () {
        if (! self.initialValueChecked && ! self.url.get() && self.data.value) {
					//console.log('set initial', self.data, this.data);
          self.url.set(self.data.value);
          self.initialValueChecked = true;
        }
      });
    };
  });

	Template[tmpl].onDestroyed( () => {
		var files = (Files.find().fetch());
		console.log('destroying clouds in autoform', files);
		_.each(files.cloud, function(cloud){
			var params = {};
			params.cloud = cloud;
			Meteor.call('afCloudinaryRemove', params);
			Files.remove({cloud: cloud});	
		});
	}); 
	
  Template[tmpl].onRendered(function () {
    var self = this;

    var options = {};
    if (this.data && this.data.atts && this.data.atts.folder) {
      _.extend(options, {folder: this.data.atts.folder});
    }
    if (this.data && this.data.atts && this.data.atts.tags) {
      _.extend(options, {tags: this.data.atts.tags});
    }

    if (this.data && this.data.atts && this.data.atts.resourceType && this.data.atts.resourceType==='file') {
      _.extend(options, {use_filename: true});
    }
		
		if (this.data.atts.upload_preset)
			options.upload_preset = this.data.atts.upload_preset;
		else if (Meteor.settings.public.CLOUDINARY_PRESET)
			options.upload_preset = Meteor.settings.public.CLOUDINARY_PRESET;

		//options.use_filename = true;
		if (this.data.atts.tags)
			options.tags = this.data.atts.tags + ', ' + Meteor.settings.public.CLOUDINARY_TAGS;
		else if (Meteor.settings.public.CLOUDINARY_TAGS)
			options.tags = Meteor.settings.public.CLOUDINARY_TAGS;

		if (this.data.atts.folder)
			options.folder = this.data.atts.folder;		
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

		var atts = this.data.atts;
		atts.tags = options.tags;
		atts.folder = options.folder;
		//atts.resource_type  = 'auto'	;
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
				// console.log('afCloudinarySign onRendered data.atts:', this, 'self:', self, 'options:', options, 'this:', this, '\n\n\n');
				
			Meteor.call('afCloudinarySign', options, function (err, res) {
				if (err) {
					return console.log(err);
				}
				//console.log('afCloudinarySign res:', res, 'options:', options, '\n\n\n');

				//console.log('> afCloudinarySign.res', res);

				self.$('input[name=file]').cloudinary_fileupload({
					formData: res
				});
			});
		});

    self.$('input[name=file]').on('fileuploadsend', function(e, data) {
      self.$('.uploader').prop('disabled', true).removeClass("browse");
      self.$('.uploader').text('0%');
			// if (Session.get('debug'))
				// console.log('fileuploadsend', data.files, e, data);
			var file = data.files[0];
			Files.insert({filename: file.name, type: file.type, size: file.size});
    });

    self.$('input[name=file]').on('fileuploadprogress', function(e, data) {
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
			
    });

    self.$('input[name=file]').on('fileuploaddone', function (e, data) {
      //self.$('.browse').text('Browse');
      self.$('.uploader').prop('disabled', false).addClass('browse');
			self.res.set(data.result);
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
			if (Session.get('debug'))
				console.log('fileuploaddone', self.atts.get(), data.files, Files.findOne({filename: file.name}), '\ndata:', data, '\n\n\n');
			Meteor.call('afCloudinary.tag', {tag: data.result.original_filename, public_id: data.result.public_id});
			Meteor.setTimeout(function(){
				if (self.atts.get().autosave)
					$('.submit').click();
			},100);	
			
    });
		
    self.$('input[name=file]').on('fileuploadfail', function (e, data) {
			console.warn('fileuploadfail', e, data);
      self.$('.browse').text('Upload Failed');
      self.$('.browse').prop('disabled', false);
			self.errorState.set(data._response.jqXHR.responseJSON.error.message);
			var file = data.files[0];
			Files.update({filename: file.name},{error: data._response});
			Bert.alert({
				title: 'Upload failed',
				message: data._response.jqXHR.responseJSON.error.message,
				type: 'danger',
				style: 'growl-top-right',
				icon: 'fa-music'
			});
      Tracker.flush();
    });

    self.$(self.firstNode).closest('form').on('reset', function () {
      //self.url.set(null);
    });
  });

  Template[tmpl].helpers({
		iffiles(){
			return Files.find().count();
		},
		files(){
			return Files.find();
		},
		url(){
			//console.log('if url', this);
			if (this.value)
				this.url = this.value;
			return this.url;
		},
		cloudId(){
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
			console.log('thumbnail', this, url);
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
			var error = t.errorState.get();
			if (error)
				console.log('fileuploadfail error', error);
			return error;
		},
		addatts(){
			var t = Template.instance();	
			var atts = t.atts.get();
			if (!atts || !atts.type)
				atts.resourceType = 'image';
			else
				atts.resourceType = 'file';
			if (Session.get('debug'))
				console.log('debug addats:', this, atts);
			var filename;
			if (t.res.get()) {
				
				filename = t.res.get().original_filename;
				atts.tags = atts.tags + ', ' + filename;
				//console.log('atts', atts, atts.tags);
      }			
			return atts;			
		},
		dimensions(){
/* 			var dimensions = {width: this.cloudinary.width, height: this.cloudinary.height};
			if (this.cloudinary.width / this.cloudinary.height == 2)
				return;
			Bert.alert('You have uploaded file with wrong dimensions. It might not work', 'warning');
			return dimensions; */
		},
		debug(){
			if (Session.get('debug'))
				console.log('debug this:', this);
			return 'debug';
		}
  });

  Template[tmpl].events({
		'change #cloudinary-filename' (e,t) {
			console.log('changed file', e, this);
		},
		'input' (e,t) {
			console.log('changed file2', e, this);
		},
		'change' (e,t) {
			console.log('changed file3', e, this);
		},
    'click .browse': function (e, t) {
			console.log('click browse', e, this);
      t.$('input[name=file]').click();
    },
    'click .submit': function (e, t) {
			e.preventDefault();
			e.stopPropagation();
			if (Session.get('debug'))
				console.log('submit class', this);		
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
			if (Session.get('debug'))
				console.log('remove pic', e.target.id, this, e, e.target, $(e.currentTarget));
			var params = {};
			params.cloud = e.target.id
			Meteor.call('afCloudinaryRemove', params);	
			Files.remove({filename: this.filename});
    },
		
    'change .cloudinary-atts': function (e, t) {
			//console.log('changed atts', e, e.target, e.target.id, $(e.currentTarget).val());
      e.preventDefault();
			var atts = t.atts.get();
			if (e.target.id == 'tags')
				atts.tags = $(e.currentTarget).val();
			else if (e.target.id == 'folder')
				atts.folder = $(e.currentTarget).val();
			t.atts.set(atts);
    }
  });
});
