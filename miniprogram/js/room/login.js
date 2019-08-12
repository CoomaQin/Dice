export default class User{
  constructor(cvs, db){
    this.cvs = cvs
    this.db = db
    this.avatarurl=''
    this.nickname=''

  }
  GetUesrInfo(func){
    let button = wx.createUserInfoButton({
      type: 'text',
      text: '开始游戏',
      style: {
        left: this.cvs.width / 4,
        top: this.cvs.height / 2,
        width: this.cvs.width / 2,
        height: 40,
        lineHeight: 40,
        backgroundColor: '#ff0000',
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 16,
        borderRadius: 4
      }
    })
    button.onTap((res) => {
      this.avatarurl = res.userInfo.avatarUrl
      this.nickname = res.userInfo.nickName
      button.destroy()
      func()
    })

  }
}


