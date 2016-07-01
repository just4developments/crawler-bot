let unirest = require('unirest');
let async = require('async');

module.exports = class CrawlerBot {
	constructor(...config){
		if(!config || config.length === 0) throw 'Have not included config file yet';
		let merge = (a, b) => {
			if(!b) return a;
			for(let i in a){
				if(typeof b[i] === 'object'){
					b[i] = merge(a[i], b[i]);
				}else{
					if(b[i] === undefined) b[i] = a[i];
				}
			}
			return b;
		};
		this.config = config[0];
		for(let i=1; i<config.length; i++){
			this.config = merge(this.config, config[i]);
		}
	}

	handle(og, k, fcDone, fcError){	
		let self = this;
		self.handleContent(og, k, (k) =>{
			let g;			
			let data = [];
			if(k.pattern){			
				let m;
				let then = [];
				let pattern = k.pattern;
				while(g = pattern.exec(k.realContent)){				
					m = true;
					if(k.each) g = k.each(g, og);
					data = data.concat(g);					
					if(k.then) {
						then.push(function(content, then, callback){							
							self.handle(content, then, (vl)=>{
								let sleep = self.config.sleep();
								setTimeout(() => {
									callback(null, vl);
								}, sleep);
							}, (err) => {
								console.error('Not match', err.pattern, err.temp);
							});
						}.bind(null, g, k.then));
					}else if(k.end) self.end = k.end;
				}
				if(!m) {
					if(!self.config.skipError){
						let e = fcError(k);
						if(e) return;
					}
				}
				if(k.all) k.all(data);
				if(then.length > 0){					
					async.series(then, (err, rs) => {
						if(err) return console.error(err);
						let result = new Set();
						for(var k in rs){
							if(rs[k] instanceof Array){
								for(let j in rs[k]){
									result.add(rs[k][j]);
								}								
							}else{
								result.add(rs[k]);
							}
						}
						if(fcDone) fcDone(Array.from(result));
					});			
				}else{
					if(fcDone) fcDone(data);
				}				
			}else{
				g = k.realContent;
				if(k.each) g = k.each(g);
				data = data.concat(g);
				if(k.all) k.all(data);
				if(k.then) self.handle(g, k.then, k.error ? k.error : (err) => { console.error('Not match', err); });
				else if(k.end) self.end = k.end;
				if(fcDone) fcDone(data);
			}
		});
	}

	handleContent(g, k, cb){
		let self= this;		
		if(typeof k.content === 'function'){
			k.realContent = k.content(g);	
		}
		k.temp = k.realContent;
		let j = /\$(\d*)/.exec(k.content);
		if(j && g !== undefined){
			k.realContent = j[1].length > 0 ? g[parseInt(j[1])] : g;				
			this.handleContent(undefined, k, cb);
		}else{
			if(!k.realContent) k.realContent = k.content;
			let h = /^https?:\/\//.exec(k.realContent);		
			if(h){
				let url = k.realContent;
				console.log('GET', url);
				return unirest('GET', url, self.config.headers, null, (res)=>{
					if(self.config.status.indexOf(res.statusCode) === -1) {
						console.error('Request error ', res.status, url);
					}
					k.realContent = res.body;
					cb(k);
				});
			}else{
				if(!k.realContent) k.realContent = k.content;
				cb(k)	
			}			
		}
	}

	execute(fcFinished){
		var self = this;
		console.log('\n----------------------------- B-E-G-I-N-I-N-G -----------------------------\n');
		self.handle(null, this.config.steps, function(rs){						
			if(self.end) self.end(rs, fcFinished);
			console.log('\n----------------------------- F-I-N-I-S-H-E-D -----------------------------\n');
		}, (err) => {
			console.log('\n----------------------------- E-R-R-O-R -----------------------------\n');			
			console.error(err);
			if(fcFinished) fcFinished(err);
		});
	}

};