//const cloudinary 'cloudinary';
//import {cloudinary} from 'cloudinary';
var cloudinary = Npm.require('cloudinary');

if (!Meteor.settings.private.cloudinary || !Meteor.settings.public.cloudinary|| !Meteor.settings.public.cloudinary.config) return console.warn('No cloudinary config is found');	

//return;
const cloudinaryConf = Meteor.settings.public.cloudinary.config;
cloudinary.config({
	cloud_name: cloudinaryConf.cloud_name,
	api_key: cloudinaryConf.api_key,
	api_secret: Meteor.settings.private.cloudinary.api_secret
});

if (process.env.CLOUDINARY_URL) {
	var cloudinaryURL = new URI(process.env.CLOUDINARY_URL);
}

Meteor.methods({
	'afCloudinary.sign' (params) {
		check(params, Match.Optional(Object));
		let signed;
		var config = {
			upload_preset: params.upload_preset,
			folder: params.folder,
			tags: params.tags,
			timestamp: (new Date).getTime()
		};
		console.log('\nCloudinary signing \nparams 0:', params, '\nconfig out:', config, cloudinaryConf, '\n\n');
		
		try {
			signed = cloudinary.utils.sign_request(config, cloudinaryConf);
		} catch(e){
			console.warn('afCloudinary.sign err:', e);
		}
		 
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
		cloudinary.config(cloudConf);
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
		cloudinary.config(cloudinaryConf);
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

