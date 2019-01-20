$(function() {
	$('.box-slider').slick({
		dots: true,
		infinite: true,
		speed: 300,
		slidesToShow: 8,
		slidesToScroll: 1,
		responsive: [{
				breakpoint: 1024,
				settings: {
				slidesToShow: 3,
				slidesToScroll: 3,
				infinite: true,
				dots: true
			}
		},
		{
			breakpoint: 600,
			settings: {
				slidesToShow: 4,
				slidesToScroll: 4
			}
		},
		{
			breakpoint: 480,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 3
			}
		}]
	});
})