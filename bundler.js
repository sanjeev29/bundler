const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const babel = require("@babel/core")
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
      dependencies.push(node.source.value)
    }
  })

  // Unique identifier for each file parsed
  const id = ID++

  // Transpile JS code to run on browser
  const { code } = babel.transformFromAst(ast, null, {
    presets: ['@babel/preset-env']
  })

  return {
    id,
    filename,
    dependencies,
    code,
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

function bundle(dependencyGraph) {
  let modules = ''

  dependencyGraph.forEach(mod => {
    modules += `${mod.id}: [
      function(require, module, exports) {
        ${mod.code} 
      },
      ${JSON.stringify(mod.mapping)},
    ],`
  })

  const result = `
    (function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id]
        
        function localRequire(relativePath) {
          return require(mapping[relativePath])
        }

        const module = { exports: {} }

        fn(localRequire, module, module.exports)

        return module.exports
      }

      require(0)
    })({${modules}})
  `

  return result
}

const graph = createDependencyGraph("./example/index.js")
const output = bundle(graph)

console.log(output)