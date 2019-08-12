/**
 * 个数与骰点类
 */
export default class Calling {
  constructor(count, num) {
    this.num = num
    this.count = count
    this.avail = true
  }

  EditCount(count) {
    this.count = count
  }

  EditNum(num) {
    this.num = num
  }

  Add() {
    this.num += 1
  }

  Strip(c) {
    switch (c) {
      case 1:
        this.num -= 1
        break
      case 2:
        this.num -= 2
        break
      default:
        this.avail = false
        console.error('摘操作错误')
    }
  }
}