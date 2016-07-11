module.exports = {	
	scenes: ['./config/chatvl.com'],
	// scenes: ['./config/chatvl.com'],
	loop: -1,
	sleep: () => {
		let getRandomArbitrary = (min, max) => {
	    return Math.random() * (max - min) + min;
		};
		return getRandomArbitrary(1, 50) * 100;
	}
}