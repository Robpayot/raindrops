import { Application, Sprite, RenderTexture, filters, Container, Graphics } from 'pixi.js'
import { getRandom } from './helpers'
import background from '../images/water-in-the-desert.jpg'
import dat from 'dat.gui'
import { TweenMax } from 'gsap'
// Images
import drop1 from '../images/water-1.png'
import dropNormal1 from '../images/water-normal-1.png'


class Drops {

	constructor() {

		// bind
		this.handleMouse = this.handleMouse.bind(this)
		this.checkMouse = this.checkMouse.bind(this)
		this.onChangeRefraction = this.onChangeRefraction.bind(this)

		// set up

		this.nbDrops = 2

		this.screen = {
			w: window.innerWidth,
			h: window.innerHeight
		}

		this.app = new Application({
			width: this.screen.w,
			height: this.screen.h,
			view: document.querySelector('canvas'),
			resolution: window.devicePixelRatio,
			sharedTicker: true,
			backgroundColor: 0xf4efe2
		})

		this.container = new Container()

		this.mouse = {
			x: this.screen.w / 2,
			y: this.screen.h / 2
		}

		this.posTargets = []
		this.posSmooth = []

		// GUI
		this.controller = {
			refraction: 1000
		}

		this.gui = new dat.GUI()
		this.gui.add(this.controller, 'refraction', -2000, 1000).onChange(this.onChangeRefraction)

		this.setBackground()
		this.setDrops()
		this.setDisplacement()

		// loader ?

		this.events()

		this.app.stage.addChild(this.container)

		this.checkMouse()

	}

	events() {
		window.addEventListener('mousemove', this.handleMouse)
		window.addEventListener('touchmove', this.handleMouse)

		this.app.ticker.start()
		this.app.ticker.add(this.handleRAF.bind(this))
	}

	checkMouse() {

		let speedX = Math.abs(this.mouse.x - this.lastMouseX)
		let speedY = Math.abs(this.mouse.y - this.lastMouseY)

		if (speedX > 600 || speedY > 600) {

			if (!this.isStretching) {
				this.isStretching = true

				for (let i = 0; i < this.drops.length; i++) {

					let w, h
					if (speedX > 600) {
						w = this.drops[i].initW
						h = this.drops[i].initH * 0.5
					} else {
						w = this.drops[i].initW * 0.5
						h = this.drops[i].initH
					}

					TweenMax.to([this.drops[i], this.dropsNormal[i]], 0.3, {
						width: w,
						height: h,
						ease: window.Linear.easeNone,
						onComplete: () => {

							this.lastMouseX = this.mouse.x
							this.isStretching = false

						}
					})
				}
			}
			console.log('vite !!!!')
		} else {

			for (let i = 0; i < this.drops.length; i++) {
				TweenMax.to([this.drops[i], this.dropsNormal[i]], 0.5, { width: this.drops[i].initW, height: this.drops[i].initH, ease: window.Expo.easeOut })
			}
		}

		this.lastMouseX = this.mouse.x
		this.lastMouseY = this.mouse.y

		TweenMax.delayedCall(0.5, this.checkMouse)



	}

	setBackground() {

		this.bkg = Sprite.fromImage(background)
		this.bkg.anchor.set(0.5, 0.5)
		this.bkg.x = this.app.screen.width / 2
		this.bkg.y = this.app.screen.height / 2

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

		// create a render texture containing all normal drops

		this.drops = []
		this.dropsNormal = []

		for (let i = 0; i < this.nbDrops; i++) {

			let drop = Sprite.fromImage(drop1)
			drop.alpha = 0.8

			let dropNormal = Sprite.fromImage(dropNormal1)

			drop.anchor.set(0.5, 0.5)
			dropNormal.anchor.set(0.5, 0.5)
			dropNormal.x = drop.x = drop.initX = getRandom(this.app.screen.width / 2 - 100, this.app.screen.width / 2 + 100)
			dropNormal.y = drop.y = drop.initY = getRandom(this.app.screen.height / 2 - 100, this.app.screen.height / 2 + 100)

			// drop.lens = getRandom(100, 200) / 100 // random lens
			// drop.speed = getRandom(1, 1.3) // random lens
			drop.initW = drop.texture.baseTexture.width - 20 /// ??????? why not 80
			drop.initH = drop.texture.baseTexture.height - 20 /// ??????? why not 80
			// console.log(drop.texture.baseTexture, drop.texture.baseTexture.width)

			this.app.stage.addChild(drop)
			this.normalsContainer.addChild(dropNormal)

			this.drops.push(drop)
			this.dropsNormal.push(dropNormal)

			// save drops coordinates
			this.posTargets.push({ x: drop.x, y: drop.y })
			this.posSmooth.push({ x: drop.x, y: drop.y })

		}

	}

	setDisplacement() {

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

	handleMouse(e) {

		if (e) {
			let x = e.touches && e.touches[0].pageX ? e.touches[0].pageX : e.pageX || e.clientX
			let y = e.touches && e.touches[0].pageY ? e.touches[0].pageY : e.pageY || e.clientY
			this.mouse.x = x - this.screen.w / 2
			this.mouse.y = y - this.screen.h / 2

			if (this.lastMouseX > -1) {
				this.mousetravel += Math.max(Math.abs(x - this.lastMouseX), Math.abs(y - this.lastMouseY))
			}
		}
	}

	handleRAF() {

		// const coefX = 0.015
		// const coefY = 0.015

		// const maxOffset = clamp(this.app.screen.width, 1000, 1524)
		// let offset = maxOffset * 0.27 - 100

		for (let i = 0; i < this.drops.length; i++) {

			// console.log(this.mouse.x)

			const currentPosX = this.drops[i].initX
			const currentPosY = this.drops[i].initY

			// Specify target we want
			this.posTargets[i].x = currentPosX + this.mouse.x
			this.posTargets[i].y = currentPosY + this.mouse.y

			// Smooth it with deceleration
			this.posSmooth[i].x += (this.posTargets[i].x - this.posSmooth[i].x) * 0.08
			this.posSmooth[i].y += (this.posTargets[i].y - this.posSmooth[i].y) * 0.08

			// Apply on sprites & hues pixi elements
			this.drops[i].x = this.dropsNormal[i].x = this.posSmooth[i].x
			this.drops[i].y = this.dropsNormal[i].y = this.posSmooth[i].y

		}

		// Render Texture
		this.app.renderer.render(this.normalsContainer, this.renderTexture) // render the RenderTexture and use it as a displacement filter

	}

	onChangeRefraction() {

		this.displacement.scale.x = this.controller.refraction
		this.displacement.scale.y = this.controller.refraction
	}

}

export default new Drops()