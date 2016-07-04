let model = require('../service/model');
let site = 'http://chatvl.tv/';
let lastPageurl;

module.exports = {	
	headers: {
		'Host': 'chatvl.tv'
	},
	steps: {
		init: (next) => {
			model.select('clip', { where: { site: site }, sort: {createat: -1}, limit: 1 }, (rs, db) => {
				db.close();
				lastPageurl = rs.length > 0 ? rs[0].pageurl : null;
				console.log(lastPageurl);
				next();
			}, (err) => { console.error('Init method', err); })			
		},
		content: '1',
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
					return { title: g[2], link: g[1], id: g[1].substr(g[1].lastIndexOf('/')+1) };
				},
				then: {
					content: (e) => {
						return e.link;
					},
					pattern: /<iframe id="video-iframe" class="video-iframe" width="727" height="410" src="([^"]+)"/igm,
					each: (g, g0) => {			
						let rs = {title: g0.title, link: g[1].replace('chatvl.tv', 'www.youtube.com'), site: site, pageid: g0.id, pageurl: g0.link, youtubeid: g[1].substr(g[1].lastIndexOf('/')+1)};
						if(rs.pageurl === lastPageurl) throw 'STOP';
						rs.image = `http://i.ytimg.com/vi/${rs.youtubeid}/0.jpg`;
						rs = model.appendDefaultAttr(rs);
						return rs;
					},
					end: (rs, next) => {
						if(rs.length === 0) return next();
						rs = model.swap(rs);
						model.insert('clip', rs, (db) => { 
							db.close();
							next();
						}, (err) => { console.error(err); });
					}
				}
			}
		}
	}	
}