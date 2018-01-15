import { Application, Sprite } from 'pixi.js'
import background from '../images/water-in-the-desert.jpg'


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

		this.mouse = {
			x: this.screen.w / 2,
			y: this.screen.h / 2
		}

		// bind
		this.handleMouse = this.handleMouse.bind(this)

		this.addBackground()

		// loader ?

		this.events()


	}

	events() {
		window.addEventListener('mousemove', this.handleMouse)
		window.addEventListener('touchmove', this.handleMouse)

		this.app.ticker.start()
		this.app.ticker.add(this.handleRAF.bind(this))
	}

	addBackground() {
		const bkg = Sprite.fromImage(background)
		bkg.anchor.set(0.5,0.5)
		bkg.x = this.app.screen.width / 2
		bkg.y = this.app.screen.height / 2

		this.app.stage.addChild(bkg)
	}

	handleMouse(e) {

		if (e) {
			this.mouse.x = e.touches && e.touches[0].pageX ? e.touches[0].pageX : e.pageX || e.clientX || this.mouse.x
			this.mouse.y = e.touches && e.touches[0].pageY ? e.touches[0].pageY : e.pageY || e.clientY || this.mouse.y
		}
	}

	handleRAF() {
		// console.log('check raf')
	}

}

export default new Drops()
