let fs = require('fs')

export class unitTestGenerator {
  constructor() {}

  getAllMethods(obj, deep = Infinity) {
    let props = []

    while (
      (obj = Object.getPrototypeOf(obj)) && // walk-up the prototype chain
      Object.getPrototypeOf(obj) && // not the the Object prototype methods (hasOwnProperty, etc...)
      deep !== 0
    ) {
      const l = Object.getOwnPropertyNames(obj)
        .concat(Object.getOwnPropertySymbols(obj).map(s => s.toString()))
        .sort()
        .filter(
          (p, i, arr) =>
            typeof obj[p] === 'function' && // only the methods
            p !== 'constructor' && // not the constructor
            (i == 0 || p !== arr[i - 1]) && // not overriding in this prototype
            props.indexOf(p) === -1 // not overridden in a child
        )
      props = props.concat(l)
      deep--
    }

    return props
  }

  header() {
    const header = `
    let chai = require('chai')
    let expect = chai.expect
    let assert = chai.assert
    `
    return header
  }

  getFunctionTest(functionName) {
    return `
        it('${functionName}', done => {
          assert(false,'Unit test not yet implemented')
        })
    `
  }

  generateTemplate(obj) {
    const objName = obj.constructor.name
    const functions = this.getAllMethods(obj)

    let stream = fs.createWriteStream(`./${objName}_test.js`)

    stream.once('open', fd => {
      stream.write(this.header())
      stream.write(`describe(\'${objName}\', () => {`)
      functions.map(functionName =>
        stream.write(this.getFunctionTest(functionName))
      )
      stream.write('})')
      stream.end()
    })
  }
}
