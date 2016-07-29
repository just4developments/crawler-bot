module.exports = {	
	scenes: ['./config/buavai.tv', './config/vui.us', './config/chatvl.com', './config/haivn.com'],
	//scenes: ['./config/buavai.tv'],
	loop: -1,
	sleep: {
		each: () => {
			let getRandomArbitrary = (min, max) => {
		    return Math.random() * (max - min) + min;
			};
			return getRandomArbitrary(5, 10) * 3 * 1000;
		},
		all: () => {
			let getRandomArbitrary = (min, max) => {
		    return Math.random() * (max - min) + min;
			};
			return getRandomArbitrary(10, 15) * 60 * 1000;
		}
	}
}