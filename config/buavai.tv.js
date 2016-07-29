let model = require('../service/model');
let site = 'https://buavai.tv/';
let lastPageurl;
let videoids = [];

module.exports = {	
	headers: {
		'Host': 'buavai.tv'
	},
	steps: {
		init: (next) => {
			model.select('clip', { where: { site: site }, sort: {createat: -1}, limit: 1 }, (rs, db) => {
				lastPageurl = rs.length > 0 ? rs[0].pageurl : null;
				console.log(site, lastPageurl);
				model.select('clip', { where: { youtubeid: {$exists: true}}, sort: {updateat: -1}, limit: 500, fields: { _id: 0, youtubeid: 1 }}, (rs, db) => {
					videoids = rs.map((e)=>{return e.youtubeid;});
					next();
				});
			}, (err) => { console.error('Init method', err); })			
		},
		content: '1 2',
		pattern: /(\d+)/gim,
		each: (g) => {
			return 'https://buavai.tv/?page=' + g[1];
		},
		then: {
			content: '$',
			pattern: /<div class="img-wrap">[^<]*<a target="_blank" href="([^"]+)" title="([^"]+)" hreflang="vi"/igm,			
			each: (g, g0) => {
				var obj = { title: g[2], pageurl: g[1], id: g[1].substring(g[1].lastIndexOf('clip')+1, g[1].lastIndexOf('.'))};
				if(obj.pageurl === lastPageurl) throw 'STOP';
				return obj;
			},
			then: {
				content: (e) => {
					return e.pageurl;
				},
				pattern: /<iframe id="video-iframe" class="video-iframe" width="727" height="410" src="([^"]+)"/igm,
				each: (g, g0) => {
					let rs = {title: g0.title, link: g[1], site: site, pageid: g0.id, pageurl: g0.pageurl, youtubeid: g[1].substr(g[1].lastIndexOf('/')+1), createat: new Date(), updateat: new Date()};
					rs.image = `http://i.ytimg.com/vi/${rs.youtubeid}/0.jpg`;
					if(videoids.indexOf(rs.youtubeid) !== -1) return undefined;
					return rs;
				},
				end: (rs, next) => {
					if(rs.length === 0) return next();
					rs = model.sortDate(rs);
					model.applyYoutube(rs, (rs) => {
						model.insert('clip', rs, (db) => { 
							next();
						}, (err) => { console.error('page', err, rs); });
					});
				}
			}
		}
	}	
}