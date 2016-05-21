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
          api_key: res.apiKey
        });
      } else {
        $.cloudinary.config({
          cloud_name: Meteor.settings.public.CLOUDINARY_CLOUD_NAME,
          api_key: Meteor.settings.public.CLOUDINARY_API_KEY
        });
      }
    });
});

var templates = ['afCloudinary', 'afCloudinary_bootstrap3'];

_.each(templates, function (tmpl) {
  Template[tmpl].onCreated(function () {
    var self = this;

    self.url = new ReactiveVar();

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

    Meteor.call('afCloudinarySign', options, function (err, res) {
      if (err) {
        return console.log(err);
      }

      //console.log('> afCloudinarySign.res', res);

      self.$('input[name=file]').cloudinary_fileupload({
        formData: res
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
      Tracker.flush();
    });

    self.$(self.firstNode).closest('form').on('reset', function () {
      self.url.set(null);
    });
  });

  Template[tmpl].helpers({
    url: function () {
      var t = Template.instance();

      t.checkInitialValue();
      return t.url.get();
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
    }
  });

  Template[tmpl].events({
    'click button': function (e, t) {
      t.$('input[name=file]').click();
    },

    'click .js-remove': function (e, t) {
      e.preventDefault();
      t.url.set(null);
    }
  });
});
