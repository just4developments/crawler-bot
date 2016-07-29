let model = require('../service/model');
let site = 'http://chatvl.tv/';
let lastPageurl;
let videoids = [];

module.exports = {	
	headers: {
		'Host': 'chatvl.tv'
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
			return 'http://chatvl.tv/video/' + g[1];
		},
		then: {
			content: '$',
			pattern: /<div id="entries-content-ul" class="col-1">([^]*?)<div id="paging-buttons" class="paging-buttons">/igm,
			each: (g) => {				
				return g[1];
			},
			then: {
				content: '$',
				pattern: /<div class="gag-link" data-url="([^"]+)" [^]*?alt="([^"]+)"/igm,
				each: (g, g0) => {
					var obj = { title: g[2], link: g[1], id: g[1].substr(g[1].lastIndexOf('/')+1)};
					if(obj.link === lastPageurl) throw 'STOP';
					return obj;
				},
				then: {
					content: (e) => {
						return e.link;
					},
					pattern: /<iframe id="video-iframe" class="video-iframe" width="727" height="410" src="([^"]+)"/igm,
					each: (g, g0) => {			
						let rs = {title: g0.title, link: g[1].replace('chatvl.tv', 'www.youtube.com'), site: site, pageid: g0.id, pageurl: g0.link, youtubeid: g[1].substr(g[1].lastIndexOf('/')+1), createat: new Date(), updateat: new Date()};
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
}