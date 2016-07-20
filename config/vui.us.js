let model = require('../service/model');
let site = 'http://vui.us/';
let lastPageurl;
let videoids = [];

module.exports = {	
	headers: {
		'Host': 'vui.us'
	},
	steps: {
		init: (next) => {
			model.select('clip', { where: { site: site }, sort: {createat: -1}, limit: 1 }, (rs, db) => {
				lastPageurl = rs.length > 0 ? rs[0].pageurl : null;
				console.log('Lastpage', site, lastPageurl);
				model.select('clip', { where: { youtubeid: {$exists: true}, facebookid: {$exists: true} }, sort: {updateat: -1}, limit: 500, fields: { _id: 0, youtubeid: 1, facebookid: 1 }}, (rs, db) => {
					videoids = rs.map((e)=>{return e.youtubeid ? 'youtube:${e.youtubeid}' : 'facebook:${e.facebookid}';});
					next();
				});
			}, (err) => { console.error('Init method', err); })			
		},
		content: '1',
		pattern: /(\d+)/gim,
		each: (g) => {
			return 'http://vui.us/video/' + g[1];
		},
		then: {
			content: '$',
			pattern: /<div class="item-\d+ media_content media-video">([^]*?)<div class="right-\d+ summary"/igm,
			each: (g) => {				
				return g[1];
			},
			then: {
				content: '$',
				pattern: /<a class="blank" target="_blank" href="([^"]+)" [^]*?title="([^"]+)"[^]*?<img class="single-media" title="[^"]+" src="([^"]+)/igm,
				each: (g, g0) => {
					var obj = { title: g[2], pageurl: g[1], image: g[3], pageid: g[1].substring(g[1].lastIndexOf('-')+1, g[1].lastIndexOf('.')), createat: new Date(), updateat: new Date(), site: site};
					if(obj.pageurl === lastPageurl) throw 'STOP';					
					return obj;
				},
				then: {
					content: (e) => {
						return e.pageurl;
					},
					pattern: /<div class="fb-video" [^]*?data-href="([^"]+)"|jwplayer\('player'\)\.setup\(\{[^]*?file:[^']*'([^']+)/igm,
					each: (g, g0) => {
						g0.link = g[1] || g[2] || g[3];						
						if(g0.link.includes('youtube')){
							let m = g0.link.match(/v=([^&]+)/);							
							if(!m) return undefined;
							g0.youtubeid = m[1];
							g0.link = `http://www.youtube.com/embed/${g0.youtubeid}`;
							if(videoids.indexOf(`youtube:${g0.youtubeid}`) !== -1) return undefined;
						}else if(g0.link.includes('facebook')){
							let m = g0.link.match(/v=([^&]+)/);
							if(!m) return undefined;
							g0.facebookid = m[1];
							if(videoids.indexOf(`facebook:${g0.facebookid}`) !== -1) return undefined;
						}
						return g0;
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