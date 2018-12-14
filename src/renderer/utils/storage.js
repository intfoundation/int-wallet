/* eslint-disable */

const localStorage = window.localStorage
const sessionStorage = window.sessionStorage

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
  },

  setSession (key, value) {
    try {
      let value2 = JSON.stringify(value)
      sessionStorage.setItem(key, value2)
    } catch (err) {
      console.log(err)
    }
  },

  getSession (key) {
    try {
      let value = sessionStorage.getItem(key)
      return value
    } catch (err) {
      console.log(err)
      return null
    }
  }
}

export default store
