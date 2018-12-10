/* eslint-disable */

const localStorage = window.localStorage

let store = {
  set (key, value) {
    try {
      let value1 = JSON.stringify(value)
      localStorage.setItem(key, value1)
    } catch (err) {
      console.log(err)
    }
  },

  get (key) {
    try {
      let value = localStorage.getItem(key)
      return value
    } catch (err) {
      console.log(err)
      return null
    }
  },

  remove (key) {
    localStorage.removeItem(key)
  },

  clear () {
    localStorage.clear()
  }
}

export default store
