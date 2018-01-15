import { Application, Sprite, RenderTexture, filters, Container, Graphics } from 'pixi.js'
import background from '../images/water-in-the-desert.jpg'
import drop1 from '../images/water-1.png'
import dropNormal1 from '../images/water-normal-1.png'


class Drops {

	constructor() {

		console.log(background)

		const img = new Image()
		img.src = background


		this.screen = {
			w: window.innerWidth,
			h: window.innerHeight
		}

		this.app = new Application({
			width: this.screen.w,
			height: this.screen.h,
			view: document.querySelector('canvas'),
			resolution: window.devicePixelRatio > 1 ? 1.5 : 1,
			sharedTicker: true,
			backgroundColor: 0xf4efe2
		})

		this.container = new Container()

		this.mouse = {
			x: this.screen.w / 2,
			y: this.screen.h / 2
		}

		// bind
		this.handleMouse = this.handleMouse.bind(this)

		this.setBackground()
		this.setDrops()
		this.setDisplacement()

		// loader ?

		this.events()


		this.app.stage.addChild(this.container)


	}

	events() {
		window.addEventListener('mousemove', this.handleMouse)
		window.addEventListener('touchmove', this.handleMouse)

		this.app.ticker.start()
		this.app.ticker.add(this.handleRAF.bind(this))
	}

	setBackground() {
		this.bkg = Sprite.fromImage(background)
		this.bkg.anchor.set(0.5,0.5)
		this.bkg.x = this.app.screen.width / 2
		this.bkg.y = this.app.screen.height / 2

		this.app.stage.addChild(this.bkg)

	}

	setDisplacement() {

		// Create a render texture containing all normal drops
		// This render Texture will be use as a filter on the background

		this.renderTexture = RenderTexture.create(this.app.screen.width, this.app.screen.height)
		this.renderTextureSprite = new Sprite(this.renderTexture)

		// Object containing all normals
		this.normals = new Container()

		// Important, add a 50% background gray to avoid image distorsion due to the Displacement filter.
		let grayBkg = new Graphics()
		grayBkg.beginFill(0x808080)
		grayBkg.drawRect(0, 0, this.app.screen.width, this.app.screen.height)

		this.normals.addChild(grayBkg)
		this.normals.addChild(this.dropNormal)

		// Create Filter
		this.displacement = new filters.DisplacementFilter(this.renderTextureSprite)
		this.displacement.scale.x = 1000
		this.displacement.scale.y = 1000
		this.bkg.filters = [this.displacement]

	}

	setDrops() {
		// create a render texture containing all normal drops

		let drop = Sprite.fromImage(drop1)
		drop.alpha = 0.8

		this.dropNormal = Sprite.fromImage(dropNormal1)

		// drop.anchor.set(0.5,0.5)
		// this.dropNormal.anchor.set(0.5,0.5)
		this.dropNormal.x = drop.x = this.app.screen.width / 2
		this.dropNormal.y = drop.y = this.app.screen.height / 2


		this.app.stage.addChild(drop)
	}

	handleMouse(e) {

		if (e) {
			this.mouse.x = e.touches && e.touches[0].pageX ? e.touches[0].pageX : e.pageX || e.clientX || this.mouse.x
			this.mouse.y = e.touches && e.touches[0].pageY ? e.touches[0].pageY : e.pageY || e.clientY || this.mouse.y
		}
	}

	handleRAF() {
		this.app.renderer.render(this.normals, this.renderTexture) // render the RenderTexture and use it as a displacement filter
		// console.log('check raf')
	}

}

export default new Drops()
