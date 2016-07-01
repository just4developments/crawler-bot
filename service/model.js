let Mongo = require('mongodb');
let MongoClient = Mongo.MongoClient;
let ObjectID = Mongo.ObjectID;
let url = 'mongodb://localhost:27017/test';
let unirest = require('unirest');

class Model {	
	
	connect(cb){
		MongoClient.connect(url, function(err, db) {
		  if(err) return console.error(err);
		  cb(db);
		});
	}

	insert(tbl, data, fcDone, fcError){
		data = (data instanceof Array) ? data : [data];
		exports.connect((db) => {
			db.collection(tbl).insertMany(data, function(err, r) {
		    if(err) {
		    	db.close();
		    	return fcError(err);
		    }
		    fcDone(db);
		  });
		});
	}
	select(tbl, where, fcDone, fcError){
		exports.connect((db) => {
			db.collection(tbl).find(where, function(err, r) {
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
		exports.connect((db) => {
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
		obj.utitle = exports.toUnsigned(obj.title);
		for(var k of this.keywords){
			if(k.pattern && k.pattern.length > 0){
				let regex = new RegExp(k.pattern, 'igm');	
				if(regex.test(obj.utitle)){
					obj.keywords.push(k._id);
				}
			}
		}		
		return obj;
	}
	
	constructor(){
		unirest('GET', 'http://localhost:8000/keywords', {
			'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36'
		}, null, (res)=>{
			this.keywords = res.body;
		});
	}

};

exports = module.exports = new Model();