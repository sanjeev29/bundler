const fs = require('fs')
const babylon = require('babylon')
const traverse = require('babel-traverse').default

let ID = 0

function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8')
  
  // Construct an AST(Abstract Syntax Tree) from 
  // the file content.
  const ast = babylon.parse(content, {sourceType: "module"})

  const dependencies = []

  // Collect all the files we are dependent on
  traverse(ast, {
    ImportDeclaration: ({node}) => {
      dependencies.push(node.source.value)
    }
  })

  // Unique identifier for each file parsed
  const id = ID++

  return {
    id,
    filename,
    dependencies
  }
}

const mainAsset = createAsset("./example/index.js")
console.log(mainAsset)