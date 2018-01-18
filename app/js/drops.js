import { Application, loader, Sprite, RenderTexture, filters, Container, Graphics, WRAP_MODES } from 'pixi.js'
import { getRandom } from './helpers'
import dat from 'dat.gui'
import { TweenMax } from 'gsap'

// Images
import windowBkg from '../images/window.jpg'
import surfboardBkg from '../images/surfboard.jpg'
import abstraitBkg from '../images/abstrait.jpg'
import landscapeBkg from '../images/landscape.jpg'
import drop1 from '../images/water-1.png'
import drop2 from '../images/water-2.png'
import drop3 from '../images/water-3.png'
import drop4 from '../images/water-4.png'
import dropNormal1 from '../images/water-normal-1.png'
import dropNormal2 from '../images/water-normal-2.png'
import dropNormal3 from '../images/water-normal-3.png'
import dropNormal4 from '../images/water-normal-4.png'
import flicker from '../images/flicker.jpg'
import github from '../images/github.png'


class Drops {

	constructor() {

		// bind
		this.handleMouse = this.handleMouse.bind(this)
		this.stopMouse = this.stopMouse.bind(this)
		this.stretch = this.stretch.bind(this)
		this.onChangeFilter = this.onChangeFilter.bind(this)
		this.reset = this.reset.bind(this)

		// set up

		this.mouse = {
			x: window.innerWidth / 2,
			y: window.innerHeight / 2
		}

		this.posTargets = []
		this.posSmooth = []

		// GUI
		this.controller = {
			nb_drops: 20,
			refraction: 120,
			flicker_effect: 30,
			wind: 0.1,
			background: 'window',
		}

		this.gui = new dat.GUI()
		this.gui.add(this.controller, 'refraction', -2000, 1000).onChange(this.onChangeFilter)
		this.gui.add(this.controller, 'flicker_effect', 0, 50).onChange(this.onChangeFilter)
		this.gui.add(this.controller, 'wind', 0, 15).onChange(this.onChangeFilter)
		this.gui.add(this.controller, 'nb_drops', 1, 100).onChange(this.reset)
		this.gui.add(this.controller, 'background', ['window', 'abstrait', 'surfboard']).onChange(this.reset)
		// this.gui.add(this.controller, 'nb_drops', 1, 40)


		// Load
		this.loader = loader
		this.loader.add('window', windowBkg)
		this.loader.add('surfboard', surfboardBkg)
		this.loader.add('abstrait', abstraitBkg)
		this.loader.add('landscape', landscapeBkg)
		this.loader.add('drop1', drop1)
		this.loader.add('drop2', drop2)
		this.loader.add('drop3', drop3)
		this.loader.add('drop4', drop4)
		this.loader.add('dropNormal1', dropNormal1)
		this.loader.add('dropNormal2', dropNormal2)
		this.loader.add('dropNormal3', dropNormal3)
		this.loader.add('dropNormal4', dropNormal4)
		this.loader.add('flicker', flicker)
		this.loader.add('github', github)

		this.loader.load((loader, resources) => {

			this.resources = resources

			this.bkgModels = {
				'window': this.resources.window.texture,
				'surfboard': this.resources.surfboard.texture,
				'abstrait': this.resources.abstrait.texture,
				'landscape': this.resources.landscape.texture
			}

			this.init()
			this.stretch()

			window.addEventListener('resize', this.reset)
			this.events()

		})

	}

	init() {

		this.app = new Application({
			width: window.innerWidth,
			height: window.innerHeight,
			view: document.querySelector('canvas'),
			resolution: window.devicePixelRatio,
			sharedTicker: true,
			backgroundColor: 0xf4efe2
		})

		this.setBackground()
		this.setDrops()
		this.setRefraction()
		this.setFlicker()

		this.initiated = true

	}

	events() {

		this.app.view.addEventListener('mousemove', this.handleMouse)
		this.app.view.addEventListener('mouseleave', this.stopMouse)

		this.app.ticker.start()
		this.app.ticker.add(this.handleRAF.bind(this))
	}

	setBackground() {

		let bkg = new Sprite(this.bkgModels[this.controller.background])
		bkg.anchor.set(0.5, 0.5)
		bkg.x = this.app.screen.width / 2
		bkg.y = this.app.screen.height / 2

		let ratioBkg = this.bkgModels[this.controller.background].width / this.bkgModels[this.controller.background].height
		let ratio = this.app.screen.width / this.app.screen.height

		if (ratioBkg > 1) {

			if (ratio < ratioBkg) {
				bkg.height = this.app.screen.height
				bkg.width = this.app.screen.height * ratioBkg
			} else {
				bkg.width = this.app.screen.width
				bkg.height = this.app.screen.width / ratioBkg
			}
		} else {
			if (ratio < ratioBkg) {
				bkg.height = this.app.screen.height
				bkg.width = this.app.screen.height * ratioBkg
			} else {
				bkg.width = this.app.screen.width
				bkg.height = this.app.screen.width / ratioBkg
			}
		}

		this.bkg = new Container()

		// github link
		this.github = new Sprite(this.resources.github.texture)
		this.github.anchor.set(0.5, 0.5)
		this.github.x = this.app.screen.width / 2
		this.github.y = this.app.screen.height / 2

		this.github.interactive = true

		this.github.click = () => {
			window.open('https://github.com/Robpayot/raindrops')
		}

		this.bkg.addChild(bkg)
		this.bkg.addChild(this.github)


		this.app.stage.addChild(this.bkg)

	}

	setDrops() {

		// Object containing all normals
		this.normalsContainer = new Container()

		// Important, add a 50% background gray to avoid image distorsion due to the Displacement filter.
		let grayBkg = new Graphics()
		grayBkg.beginFill(0x808080)
		grayBkg.drawRect(0, 0, this.app.screen.width, this.app.screen.height)

		this.normalsContainer.addChild(grayBkg)

		// 4 differents type of drops
		this.dropModels = [this.resources.drop1.texture, this.resources.drop2.texture, this.resources.drop3.texture, this.resources.drop4.texture]
		this.dropNormalModels = [this.resources.dropNormal1.texture, this.resources.dropNormal2.texture, this.resources.dropNormal3.texture, this.resources.dropNormal4.texture]

		this.drops = []
		this.dropsNormal = []

		for (let i = 0; i < this.controller.nb_drops; i++) {

			let model = Math.round(getRandom(0, 3))

			let drop = new Sprite(this.dropModels[model])
			let dropNormal = new Sprite(this.dropNormalModels[model])

			drop.alpha = 0.8
			drop.anchor.set(0.5, 0.5)
			dropNormal.anchor.set(0.5, 0.5)

			// Random positions
			// let marge = this.app.screen.width / 3
			drop.initX = getRandom(this.app.screen.width / 2 - this.app.screen.width * 0.3, this.app.screen.width / 2 + this.app.screen.width * 0.3)
			drop.initY = getRandom(this.app.screen.height / 2 - this.app.screen.height * 0.3, this.app.screen.height / 2 + this.app.screen.height * 0.3)

			// Random size
			dropNormal.scale.x = drop.scale.x = dropNormal.scale.y = drop.scale.y = drop.initScale = getRandom(0.8, 1.2)

			// Speed
			drop.coefX = 0.04 / (drop.initScale / 0.5)
			drop.coefY = 0.04 / (drop.initScale / 0.5)

			this.app.stage.addChild(drop)
			this.normalsContainer.addChild(dropNormal)

			this.drops.push(drop)
			this.dropsNormal.push(dropNormal)

			// save drops coordinates
			this.posTargets.push({ x: drop.x, y: drop.y })
			this.posSmooth.push({ x: drop.x, y: drop.y })

			// Avoid collisions
			let margeCollision = 100
			let loop = true
			while (loop === true) {

				let collision = false
				for (let y = 0; y < i; y++) {

					// if (drop.initX < this.app.screen.width / 2 - marge || drop.initX > this.app.screen.width / 2 + marge || drop.initY < this.app.screen.height / 2 - marge || drop.initY > this.app.screen.height / 2 + marge) {
					// 	drop.initX = getRandom(this.app.screen.width / 2 - marge, this.app.screen.width / 2 + marge)
					// 	drop.initY = getRandom(this.app.screen.height / 2 - marge, this.app.screen.height / 2 + marge)
					// 	continue
					// }
					if (drop.initX < margeCollision + this.drops[y].initX && drop.initX > -margeCollision + this.drops[y].initX && drop.initY < margeCollision + this.drops[y].initY && drop.initY > -margeCollision + this.drops[y].initY) {

						collision = true
					}
				}
				if (collision === true) {
					// if in the perimeter
					// randomize addition
					let random = Math.round(getRandom(1,2))
					if (random % 2 > 0) drop.initX -= margeCollision
					else drop.initX += margeCollision

					random = Math.round(getRandom(1,2))
					if (random % 2 > 0) drop.initY -= margeCollision
					else drop.initY += margeCollision

				} else {
					loop = false
					dropNormal.x = drop.x = drop.initX
					dropNormal.y = drop.y = drop.initY
				}
			}
		}

	}

	setRefraction() {

		// Create a render texture containing all normal drops
		// This render Texture will be use as a filter on the background

		this.renderTexture = RenderTexture.create(this.app.screen.width, this.app.screen.height)
		let renderTextureSprite = new Sprite(this.renderTexture)

		// Create Filter
		this.displacement = new filters.DisplacementFilter(renderTextureSprite)
		this.displacement.scale.x = this.controller.refraction
		this.displacement.scale.y = this.controller.refraction
		this.bkg.filters = [this.displacement]

	}

	setFlicker() {

		this.flickerSprite = new Sprite(this.resources.flicker.texture)

		this.flickerSprite.texture.baseTexture.wrapMode = WRAP_MODES.REPEAT


		this.flicker = new filters.DisplacementFilter(this.flickerSprite)
		this.flicker.scale.x = this.controller.flicker_effect
		this.flicker.scale.y = this.controller.flicker_effect

		// Need to be added to stage
		this.app.stage.addChild(this.flickerSprite)

		// Add filter
		for (let i = 0; i < this.drops.length; i++) {
			this.drops[i].filters = [this.flicker]
			this.dropsNormal[i].filters = [this.flicker]
		}

	}

	stretch() {

		// Calcule mouse speed
		let distX = this.mouse.x - this.lastMouseX
		let distY = this.mouse.y - this.lastMouseY

		// Pythagore <3
		let dist = Math.sqrt(distX * distX + distY * distY)
		// With the delayed call we know the speed : let's say if dist > 200 after 0.1s, it's fast
		// console.log(dist)
		let maxDist = 50

		if (dist > maxDist) {

			for (let i = 0; i < this.drops.length; i++) {

				let w, h
				if (Math.abs(distX) > maxDist) {
					w = this.drops[i].initScale * 1.4
					h = this.drops[i].initScale * 0.5
				} else {
					w = this.drops[i].initScale * 0.5
					h = this.drops[i].initScale * 1.4
				}

				TweenMax.to([this.drops[i].scale, this.dropsNormal[i].scale], 0.3, {
					x: w,
					y: h,
					ease: window.Linear.easeNone
				})
			}

		} else {

			for (let i = 0; i < this.drops.length; i++) {
				TweenMax.to([this.drops[i].scale, this.dropsNormal[i].scale], 0.5, { x: this.drops[i].initScale, y: this.drops[i].initScale, ease: window.Expo.easeOut })
			}
		}

		this.lastMouseX = this.mouse.x
		this.lastMouseY = this.mouse.y

		TweenMax.delayedCall(0.1, this.stretch) // Check every 0.1s if we need to stretch drops

	}

	handleMouse(e) {

		if (e) {
			let x = e.touches && e.touches[0].pageX ? e.touches[0].pageX : e.pageX || e.clientX
			let y = e.touches && e.touches[0].pageY ? e.touches[0].pageY : e.pageY || e.clientY
			this.mouse.x = x - window.innerWidth / 2
			this.mouse.y = y - window.innerHeight / 2

		}
	}

	stopMouse() {
		this.mouse = {
			x: 0,
			y: 0
		}
	}

	handleRAF() {
		// console.log('raf')

		// Move drops
		for (let i = 0; i < this.drops.length; i++) {

			// Specify target we want
			this.posTargets[i].x = this.drops[i].initX + this.mouse.x
			this.posTargets[i].y = this.drops[i].initY + this.mouse.y

			// Smooth it with deceleration
			this.posSmooth[i].x += (this.posTargets[i].x - this.posSmooth[i].x) * this.drops[i].coefX
			this.posSmooth[i].y += (this.posTargets[i].y - this.posSmooth[i].y) * this.drops[i].coefY

			// Apply on sprites & normals drops
			this.drops[i].x = this.dropsNormal[i].x = this.posSmooth[i].x
			this.drops[i].y = this.dropsNormal[i].y = this.posSmooth[i].y

		}

		// Render Texture of normalsContainer and use it as a displacement filter
		this.app.renderer.render(this.normalsContainer, this.renderTexture)

		// Wind effect
		this.flickerSprite.x += this.controller.wind
	}

	onChangeFilter() {

		this.displacement.scale.x = this.controller.refraction
		this.displacement.scale.y = this.controller.refraction

		this.flicker.scale.x = this.controller.flicker_effect
		this.flicker.scale.y = this.controller.flicker_effect
	}

	reset() {
		this.app.ticker.stop()
		this.app.view.removeEventListener('mousemove', this.handleMouse)
		this.app.view.removeEventListener('mouseleave', this.stopMouse)
		this.app.stage.destroy({ children: true, texture: false, baseTexture: true })
		this.app.destroy(this.app.view)

		let canvas = document.createElement('canvas')
		document.body.appendChild(canvas)

		this.init()
		this.app.view.addEventListener('mousemove', this.handleMouse)
		this.app.view.addEventListener('mouseleave', this.stopMouse)

	}

}

export default new Drops()
