var cloudinary = Npm.require('cloudinary');

if (process.env.CLOUDINARY_URL) {
  var cloudinaryURL = new URI(process.env.CLOUDINARY_URL);
}

Meteor.methods({
  afCloudinarySign: function (params) {
    check(params, Match.Optional(Object));

    params = params || {};
    params.timestamp = (new Date).getTime();
    params.folder = folderPrefix() +
        (params.folder ? '/'+params.folder :'');

    return cloudinary.utils.sign_request(params, {
      api_key: apiKey(),
      api_secret: apiSecret()
    });
  },
  publicCredentials: function() {
    if (cloudinaryURL) {
      return {
        cloudName: apiHost(),
        apiKey: apiKey()
      }
    }
  },
	'afCloudinaryRemove'(params){
		console.log('cloud.remove 0', params);
		//return;
		var list;
		var folder = 'virgo';
		params.public_id = folder + '/' + params.cloud.split('.')[0];
		var config = cloudinary.config({
			cloud_name: Meteor.settings.public.CLOUDINARY_CLOUD_NAME,
      api_key: Meteor.settings.public.CLOUDINARY_API_KEY,
      api_secret: Meteor.settings.CLOUDINARY_API_SECRET,
		});
		console.log('cloud.remove 1', params);
		try {
			list = cloudinary.uploader.destroy(params.public_id, function(err,res){
				console.log('cloud.remove', params.public_id, err, res);
				return res;		
			});
		} catch (e){
			console.warn('catch in cloud.remove:', e)
			throw new Meteor.Error(500, 'exception in cloud.remove', e);						
		} finally {
			return list;
		}
	},	
	'afCloudinary.tag'(params){
		var result;
		
    check(params, Match.Optional(Object));
	
    params = params || {};
    params.timestamp = (new Date).getTime();
    params.folder = folderPrefix() +
        (params.folder ? '/'+params.folder :'');
		
//		cloudinary.config;
//		var cloudinary = require('cloudinary');

		var config = cloudinary.config({
			cloud_name: Meteor.settings.public.CLOUDINARY_CLOUD_NAME,
      api_key: Meteor.settings.public.CLOUDINARY_API_KEY,
      api_secret: Meteor.settings.CLOUDINARY_API_SECRET,
		});
		//console.log('cloud.fetch 0', config, params);
		
		var uploaded;

		try {
			cloudinary.uploader.add_tag(params.tag, params.public_id, function(res) { 
				console.log('cloud.fetch tagged', res); 	
			});			
		} catch (e) {
			console.warn('catch in cloud.fetch:', params.tag, params.public_id, e)
			throw new Meteor.Error(500, 'exception in cloud.tag', e);
		} finally {
			return uploaded;
		}
	},
});

apiHost = function() {
  if (cloudinaryURL) {
    return cloudinaryURL.hostname();
  }
};

apiKey = function () {
  if (cloudinaryURL) {
    return cloudinaryURL.username();
  }

  if (! Meteor.settings ||
      ! Meteor.settings.public ||
      ! Meteor.settings.public.CLOUDINARY_API_KEY) {
    throw new Error('Meteor.settings.public.CLOUDINARY_API_KEY is undefined');
  }

  return Meteor.settings.public.CLOUDINARY_API_KEY;
};

apiSecret = function () {
  if (cloudinaryURL) {
    return cloudinaryURL.password();
  }

  if (! Meteor.settings ||
      ! Meteor.settings.CLOUDINARY_API_SECRET) {
    throw new Error('Meteor.settings.CLOUDINARY_API_SECRET is undefined');
  }

  return Meteor.settings.CLOUDINARY_API_SECRET;
};

folderPrefix = function() {
  if ( Meteor.settings && 
			Meteor.settings.public &&
			Meteor.settings.public.CLOUDINARY_FOLDER_PREFIX) {
    return Meteor.settings.public.CLOUDINARY_FOLDER_PREFIX;
  }

  return 'temp';
};
