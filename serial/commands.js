module.exports = {
  lightBulbOn: () => {
    return 'light bulb on'
  },
  lightBulbOff: () => {
    return 'light bulb off'
  },
  stop: () => {
    return 'stp'
  },
  reset: () => {
    return 'rst'
  },
  start: () => {
    return 'str'
  },
  setConfig: (distance, oscillations) => {
    return `cfg\t${distance}\t${oscillations}`
  }
}
