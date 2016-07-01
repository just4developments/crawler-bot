let globalConfig = require('./config/global');
let scheduleConfig = require('./config/schedule');
let CrawlerBot = require('./');	
let schedule = require('./schedule');	

if(scheduleConfig){
	schedule(globalConfig, scheduleConfig);
}else{
	let config;
	try{
		config = require('./config/' + process.argv[2]);	
	}catch(e){
		return console.error('Not found config file', e);
	}
	let c = new CrawlerBot(config, globalConfig);
	c.execute();
}