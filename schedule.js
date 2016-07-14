let CrawlerBot = require('./');	
let model = require('./service/model');

module.exports = (globalConfig, scheduleConfig) => {
	let loop = scheduleConfig.loop;
	let scenes = [];
	for(var s of scheduleConfig.scenes){
		scenes.push(new CrawlerBot(globalConfig, require(s)));
	}	
	let scan = (idx, loop) => {		
		let scene = scenes[idx];		
		let sleep = scheduleConfig.sleep();				
		if(loop > 0) console.log('|--R-E-P-E-A-T--[' + loop + ']');
		else if(loop < 0) console.log('|--R-E-P-E-A-T---F-O-R-E-V-E-R');
		console.log('|--S-C-E-N-E----[' + idx + ']--A-F-T-E-R--- ' + sleep + ' ms');				
		setTimeout(() => {
			scene.execute((err) => {				
				// console.log('aaaaaaaaaaaa', err);
				if(idx === scenes.length -1) {
					if(loop > 0 && --loop === 0) {
						model.disconnect();
						return;
					}
					idx = 0;
				}else{
					idx++;
				}
				scan(idx, loop);
			});
		}, sleep);
	}	
	setTimeout(()=>{
		scan(0, loop);
	}, 2000);	
}