const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('babel-traverse').default

let ID = 0

function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8')
  
  // Construct an AST(Abstract Syntax Tree) from
  // the file content.
  const ast = parser.parse(content, {
    sourceType: "module"
  })

  const dependencies = []

  // Collect all the files we are dependent on
  traverse(ast, {
    ImportDeclaration: ({node}) => {
      dependencies.push(`${node.source.value}.js`)
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

function createDependencyGraph(entry) {
  const mainAsset = createAsset(entry)
  const queue = [mainAsset]

  for (const asset of queue) {
    const dirname = path.dirname(asset.filename)
    
    asset.mapping = {}

    asset.dependencies.forEach(relativePath => {
      const absolutePath = path.join(dirname, relativePath)
      const child = createAsset(absolutePath)

      asset.mapping[relativePath] = child.id

      queue.push(child)
    })
  }

  return queue
}

const graph = createDependencyGraph("./example/index.js")
console.log(graph)