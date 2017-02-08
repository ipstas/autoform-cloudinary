AutoForm.addInputType('cloudinary', {
  template: 'afCloudinary',

  valueOut: function () {
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
			console.log('cloudinary pkg publicCredentials', err, res);
    });
});

var templates = ['afCloudinary', 'afCloudinary_bootstrap3'];

_.each(templates, function (tmpl) {
  Template[tmpl].onCreated(function () {
    var self = this;

    self.url = new ReactiveVar();
		self.atts = new ReactiveVar({});
		self.errorState = new ReactiveVar();
		
    self.initialValueChecked = false;
    self.checkInitialValue = function () {
      Tracker.nonreactive(function () {
        if (! self.initialValueChecked && ! self.url.get() && self.data.value) {
          self.url.set(self.data.value);
          self.initialValueChecked = true;
        }
      });
    };
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
		if (Meteor.settings.public.CLOUDINARY_PRESET)
			options.upload_preset = Meteor.settings.public.CLOUDINARY_PRESET;

		options.use_filename = true;
		if (Meteor.settings.public.CLOUDINARY_TAGS)
			options.tags = Meteor.settings.public.CLOUDINARY_TAGS;
		
/* 		if (Meteor.settings.public.CLOUDINARY_FOLDER_PREFIX)
			options.folder = Meteor.settings.public.CLOUDINARY_FOLDER_PREFIX; */
		

		var env = __meteor_runtime_config__.ROOT_URL.match(/www|stg|app|dev/);
		var host = __meteor_runtime_config__.ROOT_URL.split('/')[2]
		if (!env)
			env = ['dev'];
		
		options.tags = options.tags + ', ' + env[0] + ', ' + host;
		
		if (!options.unique_filename && Meteor.settings.public.CLOUDINARY_UNIQ)
			options.unique_filename = Meteor.settings.public.CLOUDINARY_UNIQ;

		var atts= {};
		atts.tags = options.tags;
		atts.folder = options.folder;
		self.atts.set(atts);		
		//console.log('afCloudinarySign onRendered data.atts:', this, 'options:', options);
		
		Tracker.autorun(function () {	
			if (self.atts.get() && self.atts.get().tags)
				options.tags = options.tags + ', ' + self.atts.get().tags;
			if (self.atts.get() && self.atts.get().folder)
				options.folder = self.atts.get().folder;
			

			Meteor.call('afCloudinarySign', options, function (err, res) {
				if (err) {
					return console.log(err);
				}
				//console.log('afCloudinarySign res:', res, 'data.atts:', this.data, 'options:', options);

				//console.log('> afCloudinarySign.res', res);

				self.$('input[name=file]').cloudinary_fileupload({
					formData: res
				});
			});
		});

    self.$('input[name=file]').on('fileuploadsend', function(e, data) {
      self.$('button').prop('disabled', true);
      self.$('button').text('Uploading ..');
    });

    self.$('input[name=file]').on('fileuploadprogress', function(e, data) {
      //$('.progress_bar').css('width', Math.round((data.loaded * 100.0) / data.total) + '%');
      var progressPercent = Math.round((data.loaded * 100.0) / data.total) + '%';
      self.$('button').text('Uploading '+progressPercent);
    });

    self.$('input[name=file]').on('fileuploaddone', function (e, data) {
      self.$('button').text('Browse');
      self.$('button').prop('disabled', false);
      self.url.set(data.result.secure_url);
			console.log('fileuploaddone', e, data);
      Tracker.flush();
			self.errorState.set();
    });
		
    self.$('input[name=file]').on('fileuploadfail', function (e, data) {
			console.log('fileuploadfail', e, data);
      self.$('button').text('Upload Failed');
      self.$('button').prop('disabled', false);
			self.errorState.set(data._response.jqXHR.responseJSON.error.message);
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
      self.url.set(null);
    });
  });

  Template[tmpl].helpers({
    url: function () {
      var t = Template.instance();
			var url;
/* 			var upload = 'upload/' + Meteor.settings.public.CLOUDINARY_SCALED;
			if (t.url.get())
				url = t.url.get().replace('upload', upload ); */
			url = t.url.get();
      t.checkInitialValue();
      return url;
    },
		
		cloudId(){
      var t = Template.instance();
			var url;
/* 			var upload = 'upload/' + Meteor.settings.public.CLOUDINARY_SCALED;
			if (t.url.get())
				url = t.url.get().replace('upload', upload ); */
			cloudId = t.url.get().split('/').pop().split('.')[0];	
			return cloudId;
		}, 
		
    thumbnail: function () {
      var t = Template.instance();
			var url;
			if (!Meteor.settings.public.CLOUDINARY_SCALED)
				return t.url.get();
			var upload = 'upload/' + Meteor.settings.public.CLOUDINARY_SCALED;
			if (t.url.get())
				url = t.url.get().replace('upload', upload );
      return url;
    },

    accept: function () {
      return this.atts.accept || 'image/*';
    },

    file: function () {
      return this.atts.resourceType === 'file';
    },
    filename: function() {
      var t = Template.instance();
      var url = t.url.get();
      return url.substring(url.lastIndexOf('/')+1)
    },
    errorState: function () {
      var t = Template.instance();		
			var error = t.errorState.get();
			if (error)
				console.log('fileuploadfail error', error);
			return error;
		},
/* 		atts(){
			console.log('debug atts:', this);
			return this.atts;
		}, */
		addatts(){
			var t = Template.instance();	
      var atts = t.atts.get();
			//console.log('debug addats:', this, atts);
			return atts;			
		},
		debug(){
			console.log('debug this:', this);
			return 'debug';
		}
  });

  Template[tmpl].events({
    'click button': function (e, t) {
      t.$('input[name=file]').click();
    },

    'click .js-remove': function (e, t) {
      e.preventDefault();
      t.url.set(null);
			//console.log('remove pic', e.target.id, e, e.target, $(e.currentTarget));
			var params = {};
			params.cloud = e.target.id
			Meteor.call('afCloudinaryRemove', params);
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
