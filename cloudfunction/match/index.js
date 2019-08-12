// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
const _ = db.command

// 云函数入口函数
// 如果不存在_id为event.id的记录，则fail:
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()
  await db.collection('RoundRecord').doc(event.id).get()
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}