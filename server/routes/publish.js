var express = require('express');
var router = express.Router();
const util = require('../common/util')
const operate = require('../common/dbOperate')
const publish = require('../module/publish')


//  发布一起玩游戏
router.post('/push',function (req,res,next) {

    let data = req.body
    publish.searchAll(data.userId,'userId').then((result) => {
        if(result.length == 0) {
            insertOnePublish(data,req, res, next)
        }else {
            let bol = result.some((item) => {
                return item.game == data.game
            })
            if(!bol) {
                insertOnePublish(data,req, res, next)
            }else {
                let msg = "已发布过该游戏"
                    util.RESJSON(req, res, next, 404, msg)
            }
        }
    })
    
})


//  获取已发布的游戏
router.get('/published',function (req,res,next) {
    let userId = req.query.userId 
    publish.searchAll(userId,'userId').then(async (result) => {
        if(result.length == 0) {
            let msg = "未发布任何游戏"
            util.RESJSON(req, res, next, 404, msg)
        }else {
            for(let i = 0; i < result.length; i ++) {
                await operate.searchOne(result[i].game,"name","game").then((result2) => {
                    result[i].gameDetail = result2[0]
               })
            }
            util.RESJSON(req, res, next, 200,'success',result)
        }
    })
})

//  获取已发布游戏详情
router.get('/publishedDetail',async function (req,res,next) {
    let userId = req.query.userId,
        name = req.query.name,
        data = {}
    await operate.searchOne(userId,'userId',"publishList").then((result) => {
        result.forEach(item => {
            if(item.game == name) {
                data = item
            }
        });
    })
    await operate.searchOne(name,'name',"game").then((result) => {
        data.gameDetail = result[0]
    })
    await operate.searchOne(name,'gameName',"level").then((result) => {
        data.gameLevel = result
    })
    util.RESJSON(req, res, next, 200,'success',data)
})


//  更新发布的游戏
router.post('/update',function (req,res,next) {
    let data = req.body
    
    publish.updateOne(data).then((result) => {
        util.RESJSON(req, res, next, 200,'success')
    })
})

//  删除发布的游戏
router.post('/delete',function (req,res,next) {
    let id = req.body.id
    operate.deleteOne(id,"id","publishList").then((result) => {
        util.RESJSON(req, res, next, 200,'success')
    })
})

//  获取当前游戏已发布的用户及信息
router.get('/searchPublish',async function (req, res, next) {
    let list = []
    await operate.searchOne(req.query.name,'gameName','level').then((result) => {
            list.push(result)
    })
    await operate.searchOne(req.query.name,'game',"publishList").then(async (result) => {
        for(let i = 0; i < result.length; i ++) {
            await operate.searchOne(result[i].userId,'id','user').then((result2) => {
                result[i].userInfo = result2[0]
            }) 
        }
        list.push(result)
    })
    list[1].forEach((item,index) => {
        if(item.userId == req.query.userId) {
            list[1].splice(index,1)
        }
    })
    util.RESJSON(req, res, next, 200,'success',list)
})

//  获取发布用户的信息和游戏信息
router.get('/publishInfo',async function (req, res, next) {
    let data = {
        userInfo:{},
        gameDetail:{},
        published:{}
    }
    await publish.searchOne(req.query).then((result) => {
        data.published = result[0]
    })
    await operate.searchOne(req.query.userId,"id","user").then((result) => {
        data.userInfo = result[0]
    })
    await operate.searchOne(req.query.game,"name","game").then((result) => {
        data.gameDetail = result[0]
    })
    util.RESJSON(req, res, next, 200,'success',data)
})


//  插入一条数据
function insertOnePublish(data,req, res, next) {
    publish.insertOnePublish(data).then((result) => {
        util.RESJSON(req, res, next, 200, 'success',result)
    })
}




module.exports = router