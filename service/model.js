let Mongo = require('mongodb');
let MongoClient = Mongo.MongoClient;
let ObjectID = Mongo.ObjectID;
let url = 'mongodb://localhost:27017/test';
let unirest = require('unirest');
var async = require('async');

class Model {	

	get googleapikey() {
		return 'AIzaSyDZGfuJuAR3Kr_hLNlW4r-UfKKyDqI29tQ';
	}
	
	connect(cb){
		MongoClient.connect(url, function(err, db) {
		  if(err) return console.error(err);
		  cb(db);
		});
	}

	getDuration(str) {
		if(!str) return '';
		if(str.includes('PT')){
			str = str.substr(2);
		}
		return str;
	}

	insert(tbl, data, fcDone, fcError){		
		data = (data instanceof Array) ? data : [data];
		this.connect((db) => {
			db.collection(tbl).insertMany(data, function(err, r) {
		    if(err) {
		    	db.close();
		    	return fcError(err);
		    }
		    fcDone(db);
		  });
		});
	}
	select(tbl, wobj, fcDone, fcError){		
		this.connect((db) => {						
			let tbl0 = db.collection(tbl);
			if(wobj.where) tbl0 = tbl0.find(wobj.where);
			if(wobj.sort) tbl0 = tbl0.sort(wobj.sort);
			if(wobj.limit) tbl0 = tbl0.limit(wobj.limit);
			if(wobj.skip) tbl0 = tbl0.skip(wobj.skip);
			tbl0.toArray(function(err, r) {
		    if(err) {
		    	db.close();
		    	return fcError(err);
		    }
		    fcDone(r, db);
		  });
		});
	}
	remove(tbl, id) {
		data = (data instanceof Array) ? data : [data];
		for(let i in data){
			data[i] = {_id: ObjectID(data[i])};
		}
		this.connect((db) => {
		  db.collection(tbl).deleteMany(data, function(err, r) {
		    if(err) {
		    	db.close();
		    	return fcError(err);
		    }
		    fcDone(db);
		  });
		});
	}	
	toUnsigned(alias, isRemoveSpecial){
    var str = alias;
    str= str.toLowerCase(); 
    str= str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ  |ặ|ẳ|ẵ/g,"a"); 
    str= str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str= str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str= str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ  |ợ|ở|ỡ/g,"o"); 
    str= str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str= str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str= str.replace(/đ/g,"d"); 
    if(isRemoveSpecial) str= str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'| |\"|\&|\#|\[|\]|~|$|_/g,"-");
    /* tìm và thay thế các kí tự đặc biệt trong chuỗi sang kí tự - */
    str= str.replace(/-+-/g,"-"); //thay thế 2- thành 1-
    str= str.replace(/^\-+|\-+$/g,""); 
    //cắt bỏ ký tự - ở đầu và cuối chuỗi 
    return str;
	}	
	appendDefaultAttr(obj){		
		obj.createat = new Date();
		obj.updateat = new Date();		
		obj.creator = "Admin";
		obj.keywords = [];
		obj.viewcount = 0;
		obj.status = 1;
		for(var k of global.keywords){
			if(k.pattern && k.pattern.length > 0){
				let regex = new RegExp(k.pattern, 'igm');	
				if(regex.test(obj.utitle)){
					obj.keywords.push(k._id);
				}
			}
		}
		return obj;	
	}

	applyYoutube(rs, fcDone){
		var self = this;
		var ids = '';
		for(var i=rs.length-1; i>=0; i--){
			var u = rs[i];
			if(!u) {
				rs.splice(i, 1);
				continue;
			}
			if(ids.length > 0) ids += ",";
			ids += u.youtubeid;
		}
		var url = 'https://www.googleapis.com/youtube/v3/videos?id=' + ids + '&key=' + self.googleapikey + '&fields=items(snippet(title),contentDetails(duration))&part=snippet,contentDetails';
		unirest('GET', url, {
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36'
		}, null, (res)=>{
			var k=0;
			for(var i in rs){
				if(!rs[i].youtubeid) continue;
				try{
					var item = res.body.items[k++];
					if(!item) continue;
					if(!rs[i].title || rs[i].title.length === 0) {
						rs[i].title = item.snippet.title;
						rs[i].utitle = self.toUnsigned(rs[i].title);
					}else{
						rs[i].utitle = self.toUnsigned(rs[i].title) + "<|>" + self.toUnsigned(item.snippet.title);
					}					
					rs[i].duration = self.getDuration(item.contentDetails.duration);
					rs[i] = self.appendDefaultAttr(rs[i]);
				}catch(e){
					console.error('applyYoutube', e);
				}
			}
			fcDone(rs);
		});
	}
	
	constructor(){
		unirest('GET', 'http://localhost:8000/keywords', {
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36'
		}, null, (res)=>{
			global.keywords = res.body;
		});
	}

};

exports = module.exports = new Model();