let model = require('../service/model');
let site = 'http://haivn.com/';
let lastPageurl;

module.exports = {	
	headers: {
		'Host': 'haivn.com'
	},	
	steps: {
		init: (next) => {
			model.select('clip', { where: { site: site }, sort: {createat: -1}, limit: 1 }, (rs, db) => {
				lastPageurl = rs.length > 0 ? rs[0].pageurl : null;
				console.log(lastPageurl);
				next();
			}, (err) => { console.error('Init method', err); })			
		},
		content: 'http://haivn.com/video',
		pattern: /<li id="video-key-(\d+)" class="col-xs-6 col-md-3 video-item-detail">([^]*?)<\/li>/igm,
		each: (g) => {
			return {id: g[1], content: g[2]};
		},
		then: {
			content: (e) => {
				return e.content;
			},
			pattern: /<a href="([^"]+)">[^<]*<span [^>]+>([^<]+)/igm,
			each: (g, g0) => {
				var obj = {title: g[2], link: "http://haivn.com" + g[1], id: g0.id};
				if(obj.link === lastPageurl) throw 'STOP';
				return obj;
			},
			then: {
				content: (e) => {
					return e.link;
				},
				pattern: /<iframe allowfullscreen="true" src="([^"]+)/igm,
				each: (g, g0) => {
					let rs = {title: g0.title, link: g[1], site: site, pageid: g0.id, pageurl: g0.link, youtubeid: g[1].match(/\/embed\/([a-zA-Z0-9_-]+)/)[1], createat: new Date(), updateat: new Date()};					
					rs.image = `http://i.ytimg.com/vi/${rs.youtubeid}/0.jpg`;
					return rs;
				},
				end: (rs, next) => {
					if(rs.length === 0) return next();
					rs = model.sortDate(rs);
					model.applyYoutube(rs, (rs) => {
						model.insert('clip', rs, (db) => { 
							next();
						}, (err) => { console.error(err); });
					});							
				}
			}
		}
	}
}

