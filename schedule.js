let CrawlerBot = require('./');	

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
			scene.execute(() => {				
				if(idx === scenes.length -1 && loop > 0) {
					if(--loop === 0) return;
					idx = 0;
				}else{
					idx++;
				}
				scan(idx, loop);
			});
		}, sleep);
	}	
	scan(0, loop);
}