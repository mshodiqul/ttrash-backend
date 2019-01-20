function loadModal(url) {
	var element = $("#myModal");
	element.find(".modal-dialog").css({"width" : "1024px", "min-height" : "550px"})
	element.find(".modal-body").load(url);
	element.modal({
		backdrop: 'static'
	});
}

function rupiah(n) {
	return "Rp. " + parseInt(n/1000).toFixed(3).replace(/(\d)(?=(\d{3})+\.)/g, "$1.");
}

var col = "item";
function checkKeranjang() {
	// alert('dsdsf');
	var cart = localStorage['cart_item'] != undefined ? JSON.parse(localStorage['cart_item']) : null;
	// console.log(cart);
	if (cart != null && cart.length != 0) {
		$("#cartTotal1, #cartTotal2").text(cart.length);
		$("#cartTotal1, #cartTotal2").removeClass("hidden");
	} else {
		$("#cartTotal1, #cartTotal2").text(0);
		$("#cartTotal1, #cartTotal2").addClass("hidden");		
	}
}

// setInterval(checkKeranjang, 200);
checkKeranjang();

function getKeranjang(callback) {
	var cart = localStorage['cart_' + col] != undefined ? JSON.parse(localStorage['cart_' + col ]) : null;
	if (cart != null && cart.length != 0) {
		return callback(cart);
	}
	else {
		return callback([]);
	}
}