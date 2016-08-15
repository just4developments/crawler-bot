module.exports = {	
	scenes: ['./config/chatvl.com', './config/vui.us', './config/haivn.com', './config/buavai.tv'],
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