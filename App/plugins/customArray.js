function customArray() {
	this.searchObject = function (valueKey, myArray, kolom){
		for (var i=0; i < myArray.length; i++) {
			if (myArray[i][kolom] === valueKey) {
				return myArray[i];
			}
		}
	}
	this.searchArray = function (arry, obj) {
		var s = arry.indexOf(obj);
		if (s >= 0) {
			return true;
		}
		else {
			return false;
		}
	}

	this.searchMultiArrayOr = function(arry, obj) {
		var status = [];
		if (obj.constructor === Array) {
			obj.forEach(function(data) {
				var s = arry.indexOf(data);
				if (s >= 0) {
					status.push('true');
				}
			});
			var st = status.indexOf('true');
			if (st >= 0) {
				return true
			}
			else {
				return false;
			}
		}
	}
}
module.exports = customArray;