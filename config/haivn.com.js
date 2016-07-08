let model = require('../service/model');
let site = 'http://gioitre.net/';
let lastPageurl;

module.exports = {	
	headers: {
		'Host': 'haivn.com'
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
					if(rs.pageurl === lastPageurl) throw 'STOP';
					rs.image = `http://i.ytimg.com/vi/${rs.youtubeid}/0.jpg`;
					rs = model.appendDefaultAttr(rs);
					return rs;
				},
				then: {
					headers: {
						'Host': 'www.googleapis.com'
					},
					content: (e) => {
						return 'https://www.googleapis.com/youtube/v3/videos?id=' + e.youtubeid + '&key=' + model.googleapikey + '&fields=items(snippet(title),contentDetails(duration))&part=snippet,contentDetails';
					},
					each(g, g0){
						var item = g;
						item = item.items;
						if(item.length > 0) item = item[0];
						if(!g0.title || g0.title.length === 0) {
							g0.title = item.snippet.title;
							g0.utitle = model.toUnsigned(g0.title);
						}else{
							g0.utitle = model.toUnsigned(g0.title) + "<|>" + model.toUnsigned(item.snippet.title);
						}					
						g0.duration = model.getDuration(item.contentDetails.duration);
						g0 = model.appendDefaultAttr(g0);
						return g0;
					},
					end: (rs, next) => {
						if(rs.length === 0) return next();
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

