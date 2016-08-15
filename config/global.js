module.exports = {	
	headers: {
		'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36'
	},
	skipError: true,
	sleep: () => {
		let getRandomArbitrary = (min, max) => {
	    return Math.random() * (max - min) + min;
		};
		return getRandomArbitrary(80, 200) * 10;
	},
	status: [200]
}