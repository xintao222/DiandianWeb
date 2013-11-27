var async     = smart.util.async
  , response  = smart.framework.response
  , act       = require('../ws/action')
  , order     = require("../controllers/ctrl_order.js")
  , seq       = require("../controllers/ctrl_seq.js")
  , service   = require("../controllers/ctrl_service.js");

var code = "diandian";


exports.appList = function (req_, res_) {
  var code = "diandian"
    , deskId = req_.query.deskId
    , serviceId = req_.query.serviceId
    , start = req_.query.start
    , limit = req_.query.limit


  order.getList(code, deskId, serviceId, start, limit, function (err, result) {
    response.send(res_, err, result);
  });

}


exports.addOrder = function (data, callback) {
  var err = null;

  var tmpResult = [];
  var orderList = data.data.orderList;
  var curDeskId = data.data.deskId;
  for (var i in orderList) {
    orderList[i]._index = i
  }


  seq.getNextVal(code,"orderNum" ,function(err,orderNumSeq){
    async.forEach(orderList, function (orderObj, cb) {
      seq.getNextVal(code,"orderSeq",function(err,seq){

        orderObj.orderSeq = seq;
        orderObj.orderNum = orderNumSeq;

        order.add(code,'', orderObj, function (err, docs) {
          tmpResult[orderObj._index] = docs;
          service.addUnfinishedCount(code,orderObj.serviceId,function(){

            cb(null, orderObj);
          });

        });
      });

    }, function (err, result) {

      callback(err, result,
        act.dataForwardBroadcast("refreshOrder",{items:tmpResult}),
        act.dataBroadcast("refresh_desk", {deskId:curDeskId})
      );

    });
  });

}