let model = require('../service/model');

module.exports = {	
	headers: {
		'Host': 'haivn.com'
	},	
	steps: {
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
				return {title: g[2], link: "http://haivn.com" + g[1], id: g0.id};
			},
			then: {
				content: (e) => {
					return e.link;
				},
				pattern: /<iframe allowfullscreen="true" src="([^"]+)/igm,
				each: (g, g0) => {
					let rs = {title: g0.title, link: g[1], site: 'http://haivn.com/', pageid: g0.id, pageurl: g0.link, youtubeid: g[1].match(/\/embed\/([a-zA-Z0-9_-]+)/)[1]};
					rs.image = `http://i.ytimg.com/vi/${rs.youtubeid}/0.jpg`;
					rs = model.appendDefaultAttr(rs);
					return rs;
				},
				end: (rs, next) => {		
					model.insert('clip', rs, (db) => { 
						db.close();
						next();
					}, (err) => { console.error(err); });
				}
			}
		}
	}
}

