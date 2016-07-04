module.exports = {	
	scenes: ['./config/gioitre.net', './config/chatvl.com', './config/haivn.com'],
	// scenes: ['./config/chatvl.com'],
	loop: 2,
	sleep: () => {
		let getRandomArbitrary = (min, max) => {
	    return Math.random() * (max - min) + min;
		};
		return getRandomArbitrary(1, 50) * 100;
	}
}