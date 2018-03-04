//const cloudinary 'cloudinary';
const cloudinary = Npm.require('cloudinary');

if (!Meteor.settings.private.cloudinary || !Meteor.settings.public.cloudinary|| !Meteor.settings.public.cloudinary.config) return console.warn('No cloudinary config is found');	

//return;
var cloudConf = {
	cloud_name: Meteor.settings.public.cloudinary.config.cloud_name,
	api_key: Meteor.settings.public.cloudinary.config.api_key,
	api_secret: Meteor.settings.private.cloudinary.api_secret
};

if (process.env.CLOUDINARY_URL) {
	var cloudinaryURL = new URI(process.env.CLOUDINARY_URL);
}

Meteor.methods({
	'afCloudinary.sign' (params) {
		check(params, Match.Optional(Object));

		var config = {
			upload_preset: params.upload_preset,
			folder: params.folder,
			tags: params.tags,
			timestamp: (new Date).getTime()
		};
		var signed = cloudinary.utils.sign_request(config, cloudConf);
		//if (params.debug) 
			console.log('\nCloudinary signing \nparams in:', params, '\nconfig out:', config, '\nsigned:', signed, '\n\n');
    return signed
  },
  'afCloudinary.checksize' () {
    //check(params, Object);
		console.log('afCloudinaryChecksize checking max img size for upload');
		return Meteor.call('image.checkImgSize');
  },
	'afCloudinary.remove'(params){
		if (!params || !(params.url && params.public_id)) 
			return;

		var list;
		var config = cloudinary.config(cloudConf);
		if (params.url)
			params.public_id = params.url.split('upload/')[1].split('.')[0].split('/').slice(1).join('/');
		try {
			var list = cloudinary.uploader.destroy(params.public_id, function(err,res){
				console.log('cloud.remove', params, err, res);
				return res;
			});
		} catch (e){
			console.warn('catch in cloud.remove:', e, params)
			throw new Meteor.Error(500, 'exception in cloud.remove', e);
		} finally {
			return list;
		}
	},
	'afCloudinary.tag'(params){
		var uploaded;
    check(params, Match.Optional(Object));
    params = params || {};
		var config = cloudinary.config(cloudConf);
		if (params.url)
			params.public_id = params.url.split('upload/')[1].split('.')[0].split('/').slice(1).join('/');
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

