var mode = process.env.NODE_ENV || 'dev';
var database = require('../config/database.json')[mode] || require('../config/database.json')[mode];
function DataTable () {

	this.olahAttr = function (colums , request , callback) {
		var sLimit = '';
		var sOffset = '';

		if(request['iDisplayStart'] && request['iDisplayLength'] != -1) {
			sLimit = parseInt(request['iDisplayLength']);
			sOffset = parseInt(request['iDisplayStart']);
		}

		// init order sort
		var sOrder_name = '' ;
		var sOrder_method = '';


		if( request['iSortCol_0'] ) {
			for(var i = 0 ; i < request['iSortingCols']; i++) {
				if (request['bSortable_'+parseInt(request['iSortCol_'+i])] == "true") {
			        sOrder_name = colums[parseInt(request["iSortCol_"+i])].toString();
			       	switch (database.driver) {
			       		case "mongodb" :
							if (request["sSortDir_"+i].toString() == 'asc'){
								sOrder_method = 1 ;
							} else {
								sOrder_method = -1;
							}
						break;
						case "mysql" :
							sOrder_method= request["sSortDir_"+i].toString();
						break;
						default :
							if (request["sSortDir_"+i].toString() == 'asc'){
								sOrder_method = 1 ;
							} else {
								sOrder_method = -1;
							}
			       	}
			    }
		    }
		}

		switch(database.driver) {
			case "mongodb" :
				var order = {};
				order[sOrder_name] = sOrder_method;
			break;
			case "mysql" :
				var order = 'order by sOrder_name sOrder_method';
			break;
			default :
				var order = {};
				order[sOrder_name] = sOrder_method;
		}

		// filter data unutk search 
		var data_where = [];
		var where = {};
		if ( request['sSearch'] && request['sSearch'] != "" ) {
			for(var i=0 ; i< colums.length ; i++) {
				var field = {};
				field[colums[i]] = { $regex : new RegExp(request['sSearch'].replace(/[^\w\s]/gi, '') ,"gi")};
				data_where.push(field);
			}

		} else {
			var field = {};
			data_where.push(field);
		}

		switch(database.driver) {
			case "mongodb" :
				where = { $or : data_where };
			default :
				where = { $or : data_where }
		}

		return callback(null , { where : where , order : order , limit : sLimit , offset : sOffset });

	}

	this.parsingObjectData = function (colums , request ,result , count , callback){
		var rResult = {};
		var rResultFilterTotal = {};
		var aResultFilterTotal = {};
		var iFilteredTotal = {};
		var iTotal = {};
		var output = {};
		var temp = [];

		iTotal = count;
		rResult = result;
		rResultFilterTotal = count;
		aResultFilterTotal = rResultFilterTotal;
		iFilteredTotal = aResultFilterTotal;

		output.iTotalDisplayRecords = iFilteredTotal;
		output.sEcho = parseInt(request['sEcho']);
		output.iTotalRecords = iTotal;
		output.aaData = [];

		for (i = 0 ; i < rResult.length; i++) {
			// console.log(i);
			for (var Field in rResult[i]) {
					for(x = 0; x < colums.length; x++){
						if (Field != colums[x]) continue;
						temp.push(rResult[i][Field]);
					}
			}
			output.aaData.push(temp);
			temp = [];
		}
        callback(null,output);
	}
}

module.exports = DataTable;