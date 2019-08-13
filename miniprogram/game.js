import Calling from './js/player/calling'
import Dice from './js/player/dice'
import User from './js/room/login'

/**
 * 变量声明、初始化
 */
const canvas = wx.createCanvas()
const context = canvas.getContext('2d') // 创建一个 2d context
wx.cloud.init({
  env: 'diceinnanning-rthqg'
})
const db = wx.cloud.database()

let calling = new Calling(0, 0)
let dice = new Dice(0, 0, 0, 0, 0, 0)
let user = new User(canvas, db)
let roomnumber = ''
let is_wait = true
var dt
var end_round
var player2 = false
var is_complete
var unveil_avail = false
var touch = wx
var is_full = false

user.GetUesrInfo(MatchPlayers)

/**
 * 联网匹配对手
 */
function MatchPlayers() {
  wx.showKeyboard({
    defaultValue: "请输入房间号",
    maxLength: 6,
    multiple: false
  })
  wx.onKeyboardConfirm(function(res) {
    // console.log(res.value)
    roomnumber = res.value
    wx.cloud.callFunction({
      name: 'match',
      data: {
        id: roomnumber
      },
      success: function(res) {
        db.collection('RoundRecord').doc(roomnumber).update({
          data: {
            is_player2: true,
            //初始化游戏参数
            first_round_complete: false,
            is_end: false,
            is_full: false,
            is_removed: false,
            player1: {
              call: {
                count: 0,
                num: ""
              },
              dice: {
                one: 0,
                two: 0,
                three: 0,
                four: 0,
                five: 0,
                six: 0
              }
            },
            player2: {
              call: {
                count: 0,
                num: ""
              },
              dice: {
                one: 0,
                two: 0,
                three: 0,
                four: 0,
                five: 0,
                six: 0
              }
            }
          }
        })
        player2 = true
        // console.log(res.result)
      },
      fail: function() {
        db.collection('RoundRecord').add({
          data: {
            _id: roomnumber,
            is_player1: true,
            is_player2: false
          }
        })
      }
    })
    db.collection('RoundRecord').doc(roomnumber).get({
      success: function(res) {
        if (res.data.is_player1 == true && res.data.is_player2 == true) {
          is_wait = false
        }
      },
      complete: function() {
        dt = setInterval(WaitforPlayer2, 2000)
      }
    })
  })
}

/**
 * 开始游戏
 */
function Start() {
  clearInterval(dt)
  clearInterval(end_round)
  wx.hideToast()
  //显示玩家次序
  if (player2 == false) {
    context.fillStyle = '#ffffff'
    context.font = "20px Arial"
    context.fillText('player1', canvas.width - 70, 60)
    ShowButton(context, 20, 30, 40, 10, '摇骰', 'throw', 0)
    ShowButton(context, 80, canvas.height - 30, 40, 10, '确定', 'call', 0)
    ShowButton(context, canvas.width - 40, canvas.height - 30, 40, 10, '开', 'unveil', 0)
    ShowButton(context, 20, canvas.height - 90, 40, 10, ' 摘', 'remove', 0)
    ShowButton(context, 60, canvas.height - 90, 40, 10, ' 飞', 'doublecount', 0)
  } else {
    context.fillStyle = '#ffffff'
    context.font = "20px Arial"
    context.fillText('player2', canvas.width - 70, 60)
    ShowButton(context, 20, 30, 40, 10, '摇骰', 'throw', 0)
  }
  //call之前不能unveil
  unveil_avail = false
  //player1优先call
  is_complete = false
  db.collection('RoundRecord').doc(roomnumber).update({
    data: {
      is_complete: false
    }
  })
}

/**
 * 输入匹配号后等待
 */
function WaitforPlayer2() {
  db.collection('RoundRecord').doc(roomnumber).get({
    success: function(res) {
      if (res.data.is_player1 == true && res.data.is_player2 == true) {
        is_wait = false
        is_full = res.data.is_full
      }
    }
  })
  if (is_full == false) {
    if (is_wait == false) {
      Start()
      db.collection('RoundRecord').doc(roomnumber).update({
        data: {
          is_full: true
        }
      })
    } else {
      wx.showToast({
        title: '请等待对手加入',
        icon: 'loading',
        duration: 2000
      })
    }
  } else {
    wx.showToast({
      title: '房间已满，请重进游戏，输入新的房间号',
      icon: 'loading',
      duration: 2000
    })
  }
}

//测试缩短流程用
// function WaitforPlayer2() {
//   db.collection('RoundRecord').doc(roomnumber).get({
//     success: function(res) {
//       if (res.data.is_player1 == true && res.data.is_player2 == true) {
//         is_wait = false
//         is_full = res.data.is_full
//       }
//     }
//   })
//   if (is_wait == false) {
//     Start()
//     db.collection('RoundRecord').doc(roomnumber).update({
//       data: {
//         is_full: true
//       }
//     })
//   } else {
//     wx.showToast({
//       title: '请等待对手加入',
//       icon: 'loading',
//       duration: 2000
//     })
//   }
// }

/**
 * 虚拟按钮通用方法
 */
function ShowButton(ctx, posx, posy, posw, posh, text, func, aug = 0) {
  ctx.fillStyle = '#ffffff'
  ctx.font = "20px Arial"
  ctx.fillText(text, posx, posy)
  const atlas = wx.createImage()
  context.drawImage(atlas, 100, 100, 40, 60, posx, posy, 2 * posw, 2 * posh)
  atlas.src = 'images/Common.png'
  wx.onTouchStart(function(e) {
    var x = e.changedTouches[0];
    var y = x.clientY;
    var xx = x.clientX;
    console.log(xx, y);
    if (xx >= posx && xx <= posx + posw && y >= posy - posh && y <= posy) {
      switch (func) {
        case 'throw':
          Throw()
          break
        case 'callcount':
          CallCount(ctx, aug)
          break
        case 'callnum':
          CallNum(ctx, aug)
          break
        case 'call':
          Call()
          break
        case 'unveil':
          Unveil()
          break
        case 'remove':
          Remove()
          break
        case 'doublecount':
          DoubleCount()
          break
        default:
          console.error('按钮绑定函数无效')
      }
    }
  })
}

/**
 * “摇骰”操作
 */
function Throw() {
  var i
  dice.Edit(0, 0, 0, 0, 0, 0)
  for (i = 0; i < 6; i++) {
    let num = Math.floor(Math.random() * 6 + 1)
    let imgX = canvas.width / 2 - 50
    let imgY = canvas.height / 6 + (canvas.height / 9) * i
    switch (num) {
      case 1:
        dice.one += 1
        break
      case 2:
        dice.two += 1
        break
      case 3:
        dice.three += 1
        break
      case 4:
        dice.four += 1
        break
      case 5:
        dice.five += 1
        break
      case 6:
        dice.six += 1
        break
    }
    ShowDice(num.toString(), imgX, imgY)
  }
  // ShowButton(context, 20, (canvas.height / 2) - 205, 15, 20, '1', 'callcount', 1)
  ShowButton(context, 20, (canvas.height / 2) - 175, 15, 20, '2', 'callcount', 2)
  ShowButton(context, 20, (canvas.height / 2) - 125, 15, 20, '3', 'callcount', 3)
  ShowButton(context, 20, (canvas.height / 2) - 75, 15, 20, '4', 'callcount', 4)
  ShowButton(context, 20, (canvas.height / 2) - 25, 15, 20, '5', 'callcount', 5)
  ShowButton(context, 20, (canvas.height / 2) + 25, 15, 20, '6', 'callcount', 6)
  ShowButton(context, 20, (canvas.height / 2) + 75, 15, 20, '7', 'callcount', 7)
  ShowButton(context, 20, (canvas.height / 2) + 125, 15, 20, '8', 'callcount', 8)
  ShowButton(context, 20, (canvas.height / 2) + 175, 15, 20, '9', 'callcount', 9)
  // ShowButton(context, 20, (canvas.height / 2) + 225, 15, 20, '0', 'callcount', 0)

  ShowButton(context, 60, (canvas.height / 2) - 125, 15, 20, '一', 'callnum', '一')
  ShowButton(context, 60, (canvas.height / 2) - 75, 15, 20, '二', 'callnum', '二')
  ShowButton(context, 60, (canvas.height / 2) - 25, 15, 20, '三', 'callnum', '三')
  ShowButton(context, 60, (canvas.height / 2) + 25, 15, 20, '四', 'callnum', '四')
  ShowButton(context, 60, (canvas.height / 2) + 75, 15, 20, '五', 'callnum', '五')
  ShowButton(context, 60, (canvas.height / 2) + 125, 15, 20, '六', 'callnum', '六')

  // ShowButton(context, 80, canvas.height - 30, 40, 10, '确定', 'call', 0)
  // ShowButton(context, canvas.width - 40, canvas.height - 30, 40, 10, '开', 'unveil', 0)
  if (player2 == false) {
    db.collection('RoundRecord').doc(roomnumber).update({
      data: {
        player1: {
          dice: {
            one: dice.one,
            two: dice.two,
            three: dice.three,
            four: dice.four,
            five: dice.five,
            six: dice.six
          }
        }
      },
      success: function(res) {
        console.log(res.data)
      },
      fail: console.error
    })
  } else {
    db.collection('RoundRecord').doc(roomnumber).update({
      data: {
        player2: {
          dice: {
            one: dice.one,
            two: dice.two,
            three: dice.three,
            four: dice.four,
            five: dice.five,
            six: dice.six
          }
        }
      },
      success: function(res) {
        console.log(res.data)
      },
      fail: console.error
    })
    //player2后置位call
    dt = setInterval(Player2WaitFirst, 2000)
  }
  end_round = setInterval(End, 2000)
}

/**
 * 显示骰子
 */
function ShowDice(i, imgX, imgY) {
  const image = wx.createImage()
  image.onload = function() {
    context.drawImage(image, imgX, imgY, canvas.height / 12, canvas.height / 12)
  }
  image.src = 'images/' + i + '.png'
}

/**
 * 显示个数栏
 */
function CallCount(ctx, count) {
  ctx.fillStyle = '#000000'
  ctx.fillRect(20, canvas.height - 50, 30, canvas.height - 30)
  ctx.fillStyle = '#ff4f00'
  ctx.font = "20px Arial"
  var text = ''
  text = count.toString() + '个'
  ctx.fillText(text, 20, canvas.height - 30)
  calling.EditCount(count)
}

/**
 * 显示点数栏
 */
function CallNum(ctx, num) {
  ctx.fillStyle = '#000000'
  ctx.fillRect(50, canvas.height - 50, 20, 30)
  ctx.fillStyle = '#ff4f00'
  ctx.font = "20px Arial"
  var text = num
  ctx.fillText(text, 50, canvas.height - 30)
  calling.EditNum(num)
}

/**
 * “喊”操作：设置注的个数和点数
 */
function Call() {
  console.log(calling.count.toString() + '个' + calling.num)
  let temp_count = 0
  let temp_num = ''
  let temp_remove = false
  let temp_string = ''
  db.collection('RoundRecord').doc(roomnumber).get({
    success: function(res) {
      is_complete = res.data.is_complete
      if (player2 == false) {
        temp_count = res.data.player2.call.count
        temp_num = res.data.player2.call.num
        if (is_complete == true) {
          if (calling.count > temp_count) {
            console('111')
            db.collection('RoundRecord').doc(roomnumber).update({
              data: {
                is_complete: false,
                player1: {
                  call: {
                    count: calling.count,
                    num: calling.num
                  }
                },
                is_complete: false
              },
              success: function() {
                console.log('write the call successfully')
              }
            })
          } else if (calling.count = temp_count && TransferNumToInt(calling.num) > TransferNumToInt(temp_num)) {
            console('222')
            db.collection('RoundRecord').doc(roomnumber).update({
              data: {
                is_complete: false,
                player1: {
                  call: {
                    count: calling.count,
                    num: calling.num
                  }
                },
                is_complete: false
              },
              success: function() {
                console.log('write the call successfully')
              }
            })
          } else {
            temp_string = '对面喊' + temp_count.toString() + '个' + temp_num + '，你不能这么喊'
            wx.showToast({
              title: temp_string,
              icon: 'none',
              duration: 800
            })
          }

        } else {
          wx.showToast({
            title: '请等待对方喊点数',
            icon: 'none',
            duration: 2000
          })
        }
      } else {
        if (is_complete == false) {
          db.collection('RoundRecord').doc(roomnumber).update({
            data: {
              player2: {
                call: {
                  count: calling.count,
                  num: calling.num
                }
              },
              is_complete: true
            },
            success: function() {
              console.log('write the call successfully')

            }
          })
        } else {
          wx.showToast({
            title: '请等待对方喊点数',
            icon: 'none',
            duration: 2000
          })
        }
      }
    }
  })
  dt = setInterval(PlayersCorrespond, 2000)
}

/**
 * 点数转化为数字
 */
function TransferNumToInt(num) {
  let numint = 0
  switch (num) {
    case '':
      numint = 0
      break
    case '一':
      numint = 1
      break
    case '二':
      numint = 2
      break
    case '三':
      numint = 3
      break
    case '四':
      numint = 4
      break
    case '五':
      numint = 5
      break
    case '六':
      numint = 6
      break
    default:
      console.log('TransferNumToInt() fail')
      break
  }
  return numint
}

/**
 * “摘”操作
 */
function Remove() {
  let temp_count = 0
  let temp_num = ''
  let temp_remove = false
  let temp_string = ''

  if (player2 == false) {
    db.collection('RoundRecord').doc(roomnumber).get({
      success: function(res) {
        temp_count = data.player2.call.count
        temp_num = data.player2.call.num
        temp_remove = data.is_removed
      }
    })
  } else {
    db.collection('RoundRecord').doc(roomnumber).get({
      success: function(res) {
        temp_count = data.player1.call.count
        temp_num = data.player1.call.num
        temp_remove = data.is_removed
      }
    })
  }
  if (calling.count > temp_count - 2 && temp_remove == false) {
    db.collection('RoundRecord').doc(roomnumber).update({
      data: {
        is_removed: true
      }
    })
    temp_string = calling.count.toString() + '个' + calling.num + '摘'
    wx.showToast({
      title: temp_string,
      icon: 'none',
      duration: 800
    })
  } else if (temp_remove == true) {
    temp_string = '已经摘过了'
    wx.showToast({
      title: temp_string,
      icon: 'none',
      duration: 800
    })
  } else {
    temp_string = '对面喊' + temp_count.toString() + '个' + temp_num + '，你不能这么喊'
    wx.showToast({
      title: temp_string,
      icon: 'none',
      duration: 800
    })
  }
}

/**
 * “飞”操作
 */
function DoubleCount() {
  let temp_count = 0
  let temp_num = ''
  let temp_remove = false
  let temp_string = ''

  if (player2 == false) {
    db.collection('RoundRecord').doc(roomnumber).get({
      success: function(res) {
        temp_count = data.player2.call.count
        temp_num = data.player2.call.num
        temp_remove = data.is_removed
      }
    })
  } else {
    db.collection('RoundRecord').doc(roomnumber).get({
      success: function(res) {
        temp_count = data.player1.call.count
        temp_num = data.player1.call.num
        temp_remove = data.is_removed
      }
    })
  }
  if (calling.count >= temp_count * 2) {
    db.collection('RoundRecord').doc(roomnumber).update({
      data: {
        is_removed: false
      }
    })
    temp_string = calling.count.toString() + '个' + calling.num + '飞'
    wx.showToast({
      title: temp_string,
      icon: 'none',
      duration: 800
    })
  } else {
    temp_string = '对面喊' + temp_count.toString() + '个' + temp_num + '，你不能这么喊'
    wx.showToast({
      title: temp_string,
      icon: 'none',
      duration: 800
    })
  }
}

/**
 * 默认player2先喊
 */
function Player2WaitFirst() {
  db.collection('RoundRecord').doc(roomnumber).get({
    success: function(res) {
      if (res.data.first_round_complete == true) {
        wx.hideToast()
        ShowButton(context, 80, canvas.height - 30, 40, 10, '确定', 'call', 0)
        ShowButton(context, canvas.width - 40, canvas.height - 30, 40, 10, '开', 'unveil', 0)
        ShowButton(context, 20, canvas.height - 90, 40, 10, ' 摘', 'remove', 0)
        ShowButton(context, 60, canvas.height - 90, 40, 10, ' 飞', 'doublecount', 0)
        var callbak_text = '对方喊' + res.data.player1.call.count + '个' + res.data.player1.call.num
        wx.showToast({
          title: callbak_text,
          icon: 'none',
          duration: 2000
        })
        unveil_avail = true
        clearInterval(dt)
      } else {
        wx.showToast({
          title: '让player1先喊',
          icon: 'none',
          duration: 2000
        })
      }
    },
    fail: console.error
  })
}

/**
 * “开”操作
 */
function Unveil() {
  if (unveil_avail == false) {
    wx.showToast({
      title: '现在还不能开',
      icon: 'none',
      duration: 2000
    })
  } else {
    if (player2 == false) {
      db.collection('RoundRecord').doc(roomnumber).get({
        success: function(res) {
          if (res.data.is_removed == true) {
            switch (res.data.player2.call.num) {
              case "一":
                CompareDice(res.data.player2.call, '一', res.data.player1.dice.one, res.data.player2.dice.one)
                break
              case "二":
                CompareDice(res.data.player2.call, '二', res.data.player1.dice.two, res.data.player2.dice.two)
                break
              case "三":
                CompareDice(res.data.player2.call, '三', res.data.player1.dice.three, res.data.player2.dice.three)
                break
              case "四":
                CompareDice(res.data.player2.call, '四', res.data.player1.dice.four, res.data.player2.dice.four)
                break
              case "五":
                CompareDice(res.data.player2.call, '五', res.data.player1.dice.five, res.data.player2.dice.five)
                break
              case "六":
                CompareDice(res.data.player2.call, '六', res.data.player1.dice.six, res.data.player2.dice.six)
                break
            }
          }
          else{
            switch (res.data.player2.call.num) {
              case "一":
                CompareDice(res.data.player2.call, '一', res.data.player1.dice.one, res.data.player2.dice.one)
                break
              case "二":
                CompareDice(res.data.player2.call, '二', res.data.player1.dice.two + res.data.player1.dice.one, res.data.player2.dice.two + res.data.player2.dice.one)
                break
              case "三":
                CompareDice(res.data.player2.call, '三', res.data.player1.dice.three + res.data.player1.dice.one, res.data.player2.dice.three + res.data.player2.dice.one)
                break
              case "四":
                CompareDice(res.data.player2.call, '四', res.data.player1.dice.four + res.data.player1.dice.one, res.data.player2.dice.four + res.data.player2.dice.one)
                break
              case "五":
                CompareDice(res.data.player2.call, '五', res.data.player1.dice.five + res.data.player1.dice.one, res.data.player2.dice.five + res.data.player2.dice.one)
                break
              case "六":
                CompareDice(res.data.player2.call, '六', res.data.player1.dice.six + res.data.player1.dice.one, res.data.player2.dice.six + res.data.player2.dice.one)
                break
            }
          }
        }
      })
    } else {
      db.collection('RoundRecord').doc(roomnumber).get({
        success: function(res) {
          if (res.data.is_removed == true){
            switch (res.data.player1.call.num) {
              case "一":
                CompareDice(res.data.player1.call, '一', res.data.player2.dice.one, res.data.player1.dice.one)
                break
              case "二":
                CompareDice(res.data.player1.call, '二', res.data.player2.dice.two, res.data.player1.dice.two)
                break
              case "三":
                CompareDice(res.data.player1.call, '三', res.data.player2.dice.three, res.data.player1.dice.three)
                break
              case "四":
                CompareDice(res.data.player1.call, '四', res.data.player2.dice.four, res.data.player1.dice.four)
                break
              case "五":
                CompareDice(res.data.player1.call, '五', res.data.player2.dice.five, res.data.player1.dice.five)
                break
              case "六":
                CompareDice(res.data.player1.call, '六', res.data.player2.dice.six, res.data.player1.dice.six)
                break
            }
          }
          else{
            switch (res.data.player1.call.num) {
              case "一":
                CompareDice(res.data.player1.call, '一', res.data.player2.dice.one, res.data.player1.dice.one)
                break
              case "二":
                CompareDice(res.data.player1.call, '二', res.data.player2.dice.two + res.data.player2.dice.one, res.data.player1.dice.two + res.data.player1.dice.one)
                break
              case "三":
                CompareDice(res.data.player1.call, '三', res.data.player2.dice.three + res.data.player2.dice.one, res.data.player1.dice.three + res.data.player1.dice.one)
                break
              case "四":
                CompareDice(res.data.player1.call, '四', res.data.player2.dice.four + res.data.player2.dice.one, res.data.player1.dice.four + res.data.player1.dice.one)
                break
              case "五":
                CompareDice(res.data.player1.call, '五', res.data.player2.dice.five + res.data.player2.dice.one, res.data.player1.dice.five + res.data.player1.dice.one)
                break
              case "六":
                CompareDice(res.data.player1.call, '六', res.data.player2.dice.six + res.data.player2.dice.one, res.data.player1.dice.six + res.data.player1.dice.one)
                break
            }
          }
        }
      })
    }
    db.collection('RoundRecord').doc(roomnumber).update({
      data: {
        is_end: true
      }
    })
  }
}

function End() {
  console.log('end detacting')
  db.collection('RoundRecord').doc(roomnumber).get({
    success: function(res) {
      if (res.data.is_end == true) {
        context.fillStyle = '#000000'
        context.fillRect(0, 0, canvas.width, canvas.height)
        clearInterval(dt)
        wx.offTouchStart()
        Start()
      }
    }
  })

}

function CompareDice(call, num, mydice, rivaldice) {
  if (call.count < mydice + rivaldice) {
    var campare_text = '对方' + rivaldice.toString() + '个' + num + '，你赢了'
    console.log(campare_text)
    wx.showToast({
      title: campare_text,
      icon: 'none',
      duration: 3000
    })
  } else {
    var campare_text = '对方' + rivaldice.toString() + '个' + num + '，你输了'
    console.log(campare_text)
    wx.showToast({
      title: campare_text,
      icon: 'none',
      duration: 3000
    })
  }
}

function PlayersCorrespond() {
  let callback_count = 0
  let callback_number = ''
  let callbak_text = ''
  wx.showToast({
    title: '请等待对方喊点数',
    icon: 'none',
    duration: 2000
  })
  // console.log(is_complete.toString())
  // console.log(player2.toString())
  if (player2 == false) {
    db.collection('RoundRecord').doc(roomnumber).get({
      success: function(res) {
        is_complete = res.data.is_complete
        callback_count = res.data.player2.call.count
        callback_number = res.data.player2.call.num
        callbak_text = '对方喊' + callback_count.toString() + '个' + callback_number
        if (is_complete == true) {
          clearInterval(dt)
          wx.hideToast()
          wx.showToast({
            title: callbak_text,
            icon: 'none',
            duration: 2000
          })
        }
        unveil_avail = true
      }
    })
  } else {
    db.collection('RoundRecord').doc(roomnumber).get({
      success: function(res) {
        is_complete = res.data.is_complete
        callback_count = res.data.player1.call.count
        callback_number = res.data.player1.call.num
        callbak_text = '对方喊' + callback_count.toString() + '个' + callback_number
        if (is_complete == false) {
          clearInterval(dt)
          wx.hideToast()
          wx.showToast({
            title: callbak_text,
            icon: 'none',
            duration: 2000
          })
        }
        unveil_avail = true
      }
    })
  }
}

/**
 * db测试语句
 */
// db.collection('RoundRecord').add({
//   // data 字段表示需新增的 JSON 数据
//   data: {
//     // _id: 'todo-identifiant-aleatoire', // 可选自定义 _id，在此处场景下用数据库自动分配的就可以了
//     description: "learn cloud database",
//     due: new Date("2018-09-01"),
//     tags: [
//       "cloud",
//       "database"
//     ],
//     // 为待办事项添加一个地理位置（113°E，23°N）
//     location: new db.Geo.Point(113, 23),
//     done: false
//   },
//   success: function (res) {
//     // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
//     console.log(res)
//   }
// })

// db.collection('RoundRecord').doc('25c59b425d41c15907d67dc017c68630').update({
//   data: {
//     description: "learn cloud database",
//     due: new Date("2018-09-01"),
//     tags: [
//       "sunny",
//       "database"
//     ],
//     style: {
//       color: "skyblue"
//     },
//     // 位置（113°E，23°N）
//     location: new db.Geo.Point(113, 23),
//     done: false
//   },
//   success: function (res) {
//     console.log(res.data)
//   },
//   fail: console.error
// })

// db.collection('RoundRecord').doc('my-todo-id').get({
//   success: function (res) {
//     // res.data 包含该记录的数据
//     console.log('1')
//   },
//   fail: function(){
//     console.log('2')
//   }
// })