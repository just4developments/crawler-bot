let Mongo = require('mongodb');
let MongoClient = Mongo.MongoClient;
let ObjectID = Mongo.ObjectID;
let url = 'mongodb://localhost:27017/clipv2';
let unirest = require('unirest');
let async = require('async');
let HtmlEntities = require('html-entities').AllHtmlEntities;
let htmlEntities = new HtmlEntities();

class Model {	

	get googleapikey() {
		return 'AIzaSyDZGfuJuAR3Kr_hLNlW4r-UfKKyDqI29tQ';
	}
	
	connect(cb){
		let self = this;
		MongoClient.connect(url, function(err, db) {
		  if(err) return console.error(err);
		  self.db = db;
		});
	}

	disconnect(){
		try{
			if(this.db) this.db.close();
		}catch(e){
			console.log('dbclose', e);
		}
	}

	getDuration(str) {
		if(!str) return '';
		if(str.includes('PT')){
			str = str.substr(2);
		}
		return str;
	}

	insert(tbl, data, fcDone, fcError){		
		let self = this;
		data = (data instanceof Array) ? data : [data];
		this.db.collection(tbl).insertMany(data, function(err, r) {
	    if(err) {
	    	return fcError(err);
	    }
	    fcDone(self.db);
	  });
	}
	select(tbl, wobj, fcDone, fcError){		
		let self = this;
		let tbl0 = this.db.collection(tbl);

		if(!wobj.where) wobj.where = {};
		if(wobj.fields) tbl0 = tbl0.find(wobj.where, wobj.fields);
		else tbl0 = tbl0.find(wobj.where);
		if(wobj.sort) tbl0 = tbl0.sort(wobj.sort);
		if(wobj.limit) tbl0 = tbl0.limit(wobj.limit);
		if(wobj.skip) tbl0 = tbl0.skip(wobj.skip);
		tbl0.toArray(function(err, r) {
	    if(err) {
	    	return fcError(err);
	    }
	    fcDone(r, self.db);
	  });
	}
	remove(tbl, id) {
		let self = this;
		data = (data instanceof Array) ? data : [data];
		for(let i in data){
			data[i] = {_id: ObjectID(data[i])};
		}
	  this.db.collection(tbl).deleteMany(data, function(err, r) {
	    if(err) {
	    	return fcError(err);
	    }
	    fcDone(self.db);
	  });
	}	
	toUnsigned(alias, isRemoveSpecial){
    let str = alias;
    str= str.toLowerCase(); 
    str= str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str= str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str= str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str= str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str= str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str= str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str= str.replace(/đ/g,"d"); 
    if(isRemoveSpecial) {
    	str= str.replace(/!|@|%|\\|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'| |\"|\&|\#|\[|\]|~|$|_|\|/g,"-");
	    str= str.replace(/-+-/g,"-");
	    str= str.replace(/^\-+|\-+$/g,""); 
	  }
    return str;
	}	
	appendDefaultAttr(obj, isYoutube){
		if(obj instanceof Array){
			for(let i in obj){
				obj[i] = this.appendDefaultAttr(obj[i], isYoutube);
			}
		}else{
			if(!isYoutube) obj.title = htmlEntities.decode(obj.title);
			obj.title0 = this.toUnsigned(obj.title, true);
			obj.creator = "Admin";
			obj.keywords = [];
			obj.viewcount = 0;
			obj.status = 1;
			for(let k of global.keywords){
				if(k.pattern && k.pattern.length > 0){
					let regex = new RegExp(k.pattern, 'igm');	
					if(regex.test(obj.title) || regex.test(obj.utitle)){
						obj.keywords.push(k._id);
					}
				}
			}
		}
		return obj;	
	}

	removeUndefined(rs){
		for(let i=rs.length-1; i>=0; i--){
			if(rs[i] === undefined) {
				rs.splice(i, 1);
				continue;
			}
		}
		return rs;
	}

	sortDate(rs){
		for(let i =0, j=rs.length-1; i<j; i++, j--){
			let tmp = rs[i].createat;
			rs[i].createat = rs[j].createat;
			rs[j].createat = tmp;

			tmp = rs[i].updateat;
			rs[i].updateat = rs[j].updateat;
			rs[j].updateat = tmp;
		}
		return rs;
	}

	applyYoutube(rs, fcDone){
		let self = this;
		let ids = '';
		for(let i in rs){
			if(!rs[i].youtubeid) continue;
			if(ids.length > 0) ids += ",";
			ids += rs[i].youtubeid;
		}
		let url = 'https://www.googleapis.com/youtube/v3/videos?id=' + ids + '&key=' + self.googleapikey + '&fields=items(snippet(title),contentDetails(duration))&part=snippet,contentDetails';
		unirest('GET', url, {
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36'
		}, null, (res)=>{
			let k=0;
			for(let i in rs){
				if(rs[i].youtubeid){
					try{
						let item = res.body.items[k++];
						if(!item) continue;
						if(!rs[i].title || rs[i].title.length === 0) {
							rs[i].title = htmlEntities.decode(item.snippet.title);
							rs[i].utitle = self.toUnsigned(rs[i].title, true);
						}else{
							rs[i].title = htmlEntities.decode(rs[i].title);
							rs[i].utitle = self.toUnsigned(rs[i].title, true) + "<|>" + self.toUnsigned(item.snippet.title, true);
						}
						rs[i].duration = self.getDuration(item.contentDetails.duration);					
					}catch(e){
						console.error('applyYoutube', e);
					}
				}
				rs[i] = self.appendDefaultAttr(rs[i], true);
			}
			fcDone(rs);
		});
	}
	
	constructor(){
		this.connect();
		unirest('GET', 'http://localhost:8000/keywords', {
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36'
		}, null, (res)=>{
			global.keywords = res.body;
		});
	}

};

exports = module.exports = new Model();