var createGame = require('../lib/game')
var THREE = require('three')
var voxel = require('voxel')
var toolbar = require('toolbar')
var blockSelector = toolbar({el: '#tools'})
var skin = require('minecraft-skin')

var generator = require('./index.js');
var heightmap = require('./heightmap.json');

window.game = createGame({
  generate: function(x, y, z) {
    return generator(x, y, z, heightmap);
  },
  texturePath: './textures/',
  materials: ['height0', 'height1', 'height2', 'height3', 'height4',
              'height5', 'height6', 'height7', 'height8', 'height9'],
  cubeSize: 25,
  chunkSize: 32,
  chunkDistance: 3,
  startingPosition: [500, 0, 1800],
  worldOrigin: [0,0,0],
  controlOptions: {jump: 6}
})

var substack = skin(game.THREE, 'greg.png').createPlayerObject()
substack.position.set(150, 12, 150)
game.scene.add(substack)

var currentMaterial = 1

blockSelector.on('select', function(material) {
  var idx = game.materials.indexOf(material)
  if(idx === -1) {
    for(var m = 0; m < game.materials.length; m++) {
      if(typeof game.materials[m] === 'object' && game.materials[m][0] === material) idx = m
    }
  }
  if (idx > -1) currentMaterial = idx + 1
})

game.on('collision', function (item) {
  incrementBlockTally()
  game.removeItem(item)
})

function createDebris (pos, value) {
  var mesh = new THREE.Mesh(
    new THREE.CubeGeometry(4, 4, 4),
    game.material
  )
  mesh.geometry.faces.forEach(function (face) {
    face.materialIndex = value - 1
  })
  mesh.translateX(pos.x)
  mesh.translateY(pos.y)
  mesh.translateZ(pos.z)
  
  return {
    mesh: mesh,
    size: 4,
    collisionRadius: 22,
    value: value
  }
}

function explode (pos, value) {
  if (!value) return
  var item = createDebris(pos, value)
  item.velocity = {
    x: (Math.random() * 2 - 1) * 0.05,
    y: (Math.random() * 2 - 1) * 0.05,
    z: (Math.random() * 2 - 1) * 0.05,
  }
  game.addItem(item)
  setTimeout(function (item) {
    game.removeItem(item)
  }, 15 * 1000 + Math.random() * 15 * 1000, item)
}

game.appendTo('#container')

var tally = document.querySelector('.tally .count')
function incrementBlockTally() {
  var c = +tally.innerText
  ++c
  tally.innerText = c
}

game.on('mousedown', function (pos) {
  var cid = game.voxels.chunkAtPosition(pos)
  var vid = game.voxels.voxelAtPosition(pos)
  if (erase) {
    explode(pos, game.getBlock(pos))
    game.setBlock(pos, 0)
  } else {
    game.createBlock(pos, currentMaterial)
  }
})

var erase = true
window.addEventListener('keydown', function (ev) {
  if (ev.keyCode === 'X'.charCodeAt(0)) {
    erase = !erase
  }
})

function ctrlToggle (ev) { erase = !ev.ctrlKey }
window.addEventListener('keyup', ctrlToggle)
window.addEventListener('keydown', ctrlToggle)

var container = document.querySelector('#container')
container.addEventListener('click', function() {
  game.requestPointerLock(container)
})
