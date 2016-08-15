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
		this.findEnding(this.config.steps);
	}

	findEnding(k){
		if(!k.end && k.then) this.findEnding(k.then);
		else if(k.end) this.end = k.end;
	}

	handle(og, k, fcDone, fcError){			
		let self = this;
		let handler = () => {
			debugger;
			self.handleContent(og, k, (k) =>{
				let data = [];
				let g;
				if(k.pattern){			
					let m;
					let then = [];					
					while(g = k.pattern.exec(k.realContent)){				
						m = true;
						try{
							if(k.each) g = k.each(g, og);
							if(g === undefined) continue;
						}catch(e){
							debugger;
							self.status = 'STOP';
							break;
						}
						data = data.concat(g);					
						if(k.then) {
							then.push(function(content, then, callback){
								if(self.status === 'STOP') {
									callback(null, []);
								}else{
									self.handle(content, then, (vl)=>{
										let sleep = self.config.sleep();
										setTimeout(() => {
											callback(null, vl);
										}, sleep);
									}, (err) => {
										try{
											console.error('Not match', err.pattern, err.temp);										
										}catch(e){
											console.error('Error other', err);										
										}
									});
								}
							}.bind(null, g, k.then));
						}
					}
					k.pattern.lastIndex = 0;
					if(!m) {
						if(!self.config.skipError){
							let e = fcError(k);
							if(e) return;
						}
					}
					if(k.all) k.all(data);
					if(then.length > 0){					
						async.series(then, (err, rs) => {
							if(err) {
								if(!self.config.skipError){
									let e = fcError(k);
									if(e) return;
								}
							}
							let result = new Set();
							for(var k in rs){
								if(rs[k] instanceof Array){
									if(rs[k].length > 0){
										for(let j in rs[k]){
											if(rs[k][j] !== undefined) result.add(rs[k][j]);
										}
									}
								}else{
									if(rs[k] !== undefined) result.add(rs[k]);
								}
							}
							if(fcDone) fcDone(Array.from(result));
						});			
					}else{
						if(fcDone) fcDone(data);
					}				
				}else{
					g = k.realContent;
					if(k.each) g = k.each(g, og);
					data = data.concat(g);
					if(k.all) k.all(data);
					if(k.then) self.handle(g, k.then, k.error ? k.error : (err) => { console.error('Not match', err); });					
					if(fcDone) fcDone(data);
				}
			});
		}
		if(k.init){
			k.init(handler);
		}else{
			handler();
		}
	}

	mergeHeaders(pri, seconds){
		if(!pri) return seconds;
		for(var i in seconds){
			if(pri[i] === null) delete pri[i];
			else if(pri[i] === undefined) pri[i] = seconds[i];
		}
		return pri;
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
				console.log(new Date(), 'GET', url);
				let headers = self.mergeHeaders(k.headers, self.config.headers);
				return unirest('GET', url, headers, null, (res)=>{
					if(self.config.status.indexOf(res.statusCode) === -1) {
						console.error('Request error ', res.statusCode, headers, url);
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

	execute(fcFinished0){
		let fcFinished = () => {
			console.log('\n', new Date(), '----------------------------- F-I-N-I-S-H-E-D -----------------------------\n');
			fcFinished0();
		}
		let self = this;
		self.status = 'RUNNING';
		console.log('\n', new Date(), '----------------------------- B-E-G-I-N-I-N-G -----------------------------\n');
		self.handle(null, this.config.steps, function(rs){						
			if(self.end) self.end(rs, fcFinished);
			else {console.log('There is not ending method')}			
		}, (err) => {
			console.log('\n', new Date(), '----------------------------- E-R-R-O-R -----------------------------\n');			
			console.error(err);
			if(fcFinished) fcFinished(err);
		});
	}

};