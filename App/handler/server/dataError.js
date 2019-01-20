function DataError() {
	this.index = function(req,res,next) {
		res.render("panel/logsError");
	}
	this.dataTable = function (req , res , next ) {
		var request = req.query;
		var sColumn = ['_id','url','message','date'];
		var kirim = JSON.stringify({"iTotalDisplayRecords":0,"iTotalRecords":0,"aaData":[]});
		var data = [];
		req.plugin.datatable.olahAttr(sColumn , request , function (err , HasilAttr){
			if (err) return res.send(kirim);
			HasilAttr.where['type'] = 'error';
			req.db.find('logs', HasilAttr.where , { sort : HasilAttr.order , limit : HasilAttr.limit , skip : HasilAttr.offset }, function (err , results){
				results.forEach(function (i){
					data.push({
						_id : i._id,
						url : i.url,
						message : i.message,
						date : req.generate.SetTanggal(i.date , 'DD MMMM YYYY HH:mm:ss')
					});
				});
				req.db.count('logs' ,HasilAttr.where , function (err , jumlah){
					if (err) return res.send(kirim);
					req.plugin.datatable.parsingObjectData( sColumn , request ,data , jumlah  , function (err , output ){
						if (err) return res.send(kirim);
						return res.send(JSON.stringify(output));
					});
				});
			});
		});
	}	
}
module.exports = DataError;