var fs = require('fs');
let model = require('../service/model');

module.exports = {	
	headers: {
		'Host': 'hongkong.craigslist.hk'
	},	
	steps: {
		content: 'http://guangzhou.craigslist.com.cn/search/cta?lang=en&cc=us',
		pattern: /<p class="row" data-pid="(\d+)">([^]*?)<\/p>/igm,
		each: (g) => {
			return g[1];
		},		
		then: {
			content: (e) => {
				return 'http://hongkong.craigslist.hk/reply/hkg/cto/' + e;
			},
			pattern: /<a href="mailto:[^>][^>]+>([^<]+)/igm,
			each: (g, g0) => {
				return {email: g[1], link: 'http://hongkong.craigslist.hk/cto/' + g0 + '.html?lang=en&cc=us'};
			},
			then: {				
				content: (e) => {
					return e.link;
				},
				pattern: /<img src="([^"]+)" title="[^"]+" alt="[^"]+">/igm,
				each: (g, g0) => {
					return {email: g0.email, image: g[1]};
				},
				end: (rs, next) => {
					model.insert('test', rs, (db) => { 
						db.close();
						next();
					}, (err) => { console.error(err); });
					// fs.writeFile('/home/thanhdt/Desktop/' + new Date().getTime() + '.txt', JSON.stringify(rs), function (err) {
					//   if (err) return console.log(err);
					//   console.log('Hello World > helloworld.txt');
					// });
				}
			}			
		}
	}
}