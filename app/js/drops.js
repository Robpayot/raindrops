console.log('NON')
import { isMobile } from '../core/Helpers'
import clamp from '@84paris/84.tools/maths/clamp'
import { autoBind } from '../tools/autoBind'
import ResizeManager from '../managers/ResizeManager.js'
import EmitterManager from '../managers/EmitterManager.js'
import PixiSceneManager from '../managers/PixiSceneManager.js'
import getRandomInt from '@84paris/84.tools/maths/getRandomInt'
import { Container, Graphics, Sprite, RenderTexture, filters } from 'pixi.js'

const DROPS = [{
	x: 0,
	y: 0,
	textureId: 1,
	level: 2.8,
	speed: 1.1
}, {
	x: 40,
	y: 110,
	textureId: 3,
	level: 2.6,
	speed: 1.2
}, {
	x: -40,
	y: 200,
	textureId: 0,
	level: 2.2,
	speed: 1.1
}, {
	x: -40,
	y: 300,
	textureId: 2,
	level: 1.8,
	speed: 1.1
}, {
	x: 40,
	y: 400,
	textureId: 1,
	level: 1.4,
	speed: 1.1
}, {
	x: -40,
	y: 500,
	textureId: 1,
	level: 1,
	speed: 1.3
}]

export default class Drop extends Container {

	constructor(texs, normTexs) {

		super()

		autoBind(this)

		this.w = ResizeManager.width
		this.h = ResizeManager.height

		this._renderTextureHue = RenderTexture.create(this.w, this.h)

		this._currentProgress = 0
		this._mouse = {}

		this._smoothed = []
		this._targets = []
		this._sprites = []
		this._hues = []

		this._spritesContainer = new Container()
		this._hueContainer = new Container()

		this._spriteHue = null
		this._filterIsActive = false

		this.addChild(this._spritesContainer)

		global.ticker.add(this.update.bind(this))

		// Bck
		this.bck = new Graphics()
		this.bck.beginFill(0x808080)
		this.bck.drawRect(0, 0, ResizeManager.width, ResizeManager.height)
		this._hueContainer.addChild(this.bck)

		for (let i = 0; i < DROPS.length; i++) {

			let drop = new Sprite(texs[DROPS[i].textureId])
			let dropHue = new Sprite(normTexs[DROPS[i].textureId])

			drop.alpha = 0.8

			drop.level = DROPS[i].level

			// drop.anchor.x = drop.anchor.y = dropHue.anchor.x = dropHue.anchor.y = 0
			drop.x = drop.initX = dropHue.x = DROPS[i].x
			drop.y = drop.initY = dropHue.y = DROPS[i].y
			drop.scale.x = drop.scale.y = dropHue.scale.x = dropHue.scale.y = clamp(0.33 * drop.level, 0.1, 0.9)
			// drop.speed = DROPS[i].speed
			drop.speed = DROPS[i].speed
			drop.lens = drop.level / 3 // speed based on drop size (bigger is faster)
			drop.lens = getRandomInt(100, 200) / 100 // random lens

			this._smoothed.push({ x: 0, y: 0 })
			this._targets.push({ x: 0, y: 0 })

			this._sprites.push(drop)
			this._hues.push(dropHue)

			this._spritesContainer.addChild(drop)
			this._hueContainer.addChild(dropHue)

		}

		if (isMobile) return

		global.renderer.render(this._hueContainer, this._renderTextureHue)

		this._spriteHue = new Sprite(this._renderTextureHue)
		// this.addChild(this._spriteHue)
		this._displacement = new filters.DisplacementFilter(this._spriteHue)
		this.scaleFilter(30)

		EmitterManager.on('resize', this.resize)
	}

	resize(w, h) {
		this.w = w
		this.h = h

		this.bck.clear()
		this.bck.drawRect(0, 0, ResizeManager.width, ResizeManager.height)
	}


	getDrops() {
		return {
			tex: this._sprites,
			hue: this._hues
		}
	}

	mouse(mouse, screen) {
		this._mouse.x = mouse.x - screen.w / 2
		this._mouse.y = mouse.y - screen.h / 2
	}

	update() {

		// if (this.visible) {
		const coefX = 0.015
		const coefY = 0.015

		const maxOffset = clamp(this.w, 1000, 1524)
		let offset = maxOffset * 0.27 - 100

		for (let i in this._sprites) {

			const currentPosX = isMobile ? this._sprites[i].initX + this.w * 0.5 : this._sprites[i].initX + this.w * 0.5 + offset
			const currentPosY = this._sprites[i].initY + (1 - this.currentProgress) * global.screen.height

			// Specify target we want
			this._targets[i].x = currentPosX + this._mouse.x * this._sprites[i].lens * coefX
			this._targets[i].y = currentPosY * this._sprites[i].speed + this._mouse.y * this._sprites[i].lens * coefY

			// Smooth it with deceleration
			this._smoothed[i].x += (this._targets[i].x - this._smoothed[i].x) * 0.08
			this._smoothed[i].y += (this._targets[i].y - this._smoothed[i].y) * 0.08

			// Apply on sprites & hues pixi elements
			this._sprites[i].x = this._hues[i].x = this._smoothed[i].x
			this._sprites[i].y = this._hues[i].y = this._smoothed[i].y

		}

		if (isMobile === false) {
			global.renderer.render(this._hueContainer, this._renderTextureHue)
		}
		// }

	}

	set currentProgress(currentProgress) {
		if (this._currentProgress !== currentProgress) {
			this._currentProgress = currentProgress
		}
	}

	get currentProgress() {
		return this._currentProgress
	}

	scaleFilter(value) {
		if (this._displacement) {
			this._displacement.scale.x = value
			this._displacement.scale.y = value
		}
	}

	activeFilter() {

		const scrollables = PixiSceneManager.scrollables

		if (!isMobile) {

			// this._spriteHue.visible = true
			scrollables['Main'].filters = scrollables['Harvest'].filters = [this._displacement]
		}
	}

	disactiveFilter() {

		const scrollables = PixiSceneManager.scrollables

		if (!isMobile) {

			// this._spriteHue.visible = false
			scrollables['Main'].filters = scrollables['Harvest'].filters = []
		}
	}
}
