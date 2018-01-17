import { Application, Container, Graphics } from 'pixi.js';

import {BOTTLE_EFFECT_ENABLE} from '../core/Conf';

import EmitterManager from './EmitterManager';
import ResizeManager from './ResizeManager';
import BottleEffectManager from './BottleEffectManager';

import FlaconBlock from '../components/PixiBlock/FlaconBlock.js';
import FlowerLightBlock from '../components/PixiBlock/FlowerLightBlock';
import FlowerOctopusBlock from '../components/PixiBlock/FlowerOctopusBlock';
import FlowerRotationBlock from '../components/PixiBlock/FlowerRotationBlock';
import FlowerPistilBlock from '../components/PixiBlock/FlowerPistilBlock';
import ScrollerBlock from '../components/PixiBlock/ScrollerBlock.js';
import HarvestFlowerBlock from '../components/PixiBlock/HarvestFlowerBlock.js';
import SunBlock from '../components/PixiBlock/SunBlock.js';
import VideoBlock from '../components/PixiBlock/VideoBlock.js';
import ScrollerManager from '../managers/ScrollerManager.js';

// import {autoBind} from '../tools/autoBind';
import { isMobile } from '../core/Helpers';

import * as Events from '../core/Events';

// const $fps = document.querySelector('#fps');

class PixiSceneManager {

	constructor() {

		this.handleResize = this.handleResize.bind(this);
		this.handleMouse = this.handleMouse.bind(this);

		this._screen = {
			w: ResizeManager.width,
			h: ResizeManager.height
		};

		this._app = new Application({
			width: this._screen.w,
			height: this._screen.h,
			view: document.querySelector('.canvas--main'),
			resolution: window.devicePixelRatio > 1 ? 1.5 : 1,
			sharedTicker: true,
			backgroundColor: 0xf4efe2
		});

		global.ticker = this._app.ticker;
		global.renderer = this._app.renderer;
		// global.screen = this._app.screen; // IE/Edge : Assignment to readonly properties is not allowed in strict mode

		// console.log(this._app.renderer);

		this._app.renderer.backgroundColor = 0xf4efe2;

		this._mouse = {
			x: this._screen.w / 2,
			y: this._screen.h / 2
		};


		/* ------------------------------------
		 * STRUCTURE
		 * ------------------------------------
		 * Mobile & Desktop has différent order of elements, so the tree of containers
		 * is a bit complicated, here is a sum up of everything.
		 * ------------------------------------
		 *
		 *
			| app.stage
			|-- _generalContainer    > Drop Filter is applied on it
				|-- _mainScrollablesContainer
					|-- _scrollables['Main']
				|-- _mainScrollablesZoomedContainer    > FlaconMask is applied on it
					|-- _scrollablesZoomed['Main']
				|-- _blocks['fixed'] (FlaconBlock), only for MOBILE
				|-- _overlay
				|-- _secondaryScrollablesContainer
					|-- _scrollables['Bottle']
					|-- _scrollables['Fragrance']
					|-- ...
				|-- _secondaryScrollablesZoomedContainer    > FlaconMask is applied on it
					|-- _scrollablesZoomed['Bottle']
					|-- _scrollablesZoomed['Fragrance']
					|-- ...
				|-- _blocks['fixed'] (FlaconBlock), only for DESKTOP
		   |-- _drops
		 *
		 */

		// Mobile overlay
		this._overlay = new Graphics();
		this._overlay.visible = false;

		// All Containers
		this._generalContainer = new Container();
		this._mainScrollablesContainer = new Container();
		this._mainScrollablesZoomedContainer = new Container();
		this._secondaryScrollablesContainer = new Container();
		this._secondaryScrollablesZoomedContainer = new Container();

		this._generalContainer.addChild(this._mainScrollablesContainer);
		this._generalContainer.addChild(this._mainScrollablesZoomedContainer);
		this._generalContainer.addChild(this._overlay);
		this._generalContainer.addChild(this._secondaryScrollablesContainer);
		this._generalContainer.addChild(this._secondaryScrollablesZoomedContainer);

		this._app.stage.addChild(this._generalContainer);


		// Scrollables
		this._scrollables = [];
		this._scrollables['Main'] = new Container();
		this._scrollables['Bottle'] = new Container();
		this._scrollables['Fragrance'] = new Container();
		this._scrollables['Flowers'] = new Container();
		this._scrollables['Harvest'] = new Container();
		this._scrollables['Inspiration'] = new Container();

		this._scrollablesZoomed = [];
		this._scrollablesZoomed['Main'] = new Container();
		this._scrollablesZoomed['Bottle'] = new Container();
		this._scrollablesZoomed['Fragrance'] = new Container();
		this._scrollablesZoomed['Flowers'] = new Container();
		this._scrollablesZoomed['Harvest'] = new Container();
		this._scrollablesZoomed['Inspiration'] = new Container();

		// Blocks
		this._blocks = [];
		this._blocksFiltered = [];

		this.createMainBlocks();
		this.createSecondaryBlocks();

		// Add scrollables in their respectives containers
		this._mainScrollablesContainer.addChild(this._scrollables['Main']);
		if (BOTTLE_EFFECT_ENABLE) {
			this._mainScrollablesZoomedContainer.addChild(this._scrollablesZoomed['Main']);
		}

		this._secondaryScrollablesContainer.addChild(this._scrollables['Bottle']);
		if (!isMobile) this._secondaryScrollablesZoomedContainer.addChild(this._scrollablesZoomed['Bottle']);

		this._secondaryScrollablesContainer.addChild(this._scrollables['Fragrance']);
		if (!isMobile) this._secondaryScrollablesZoomedContainer.addChild(this._scrollablesZoomed['Fragrance']);

		this._secondaryScrollablesContainer.addChild(this._scrollables['Flowers']);
		if (!isMobile) this._secondaryScrollablesZoomedContainer.addChild(this._scrollablesZoomed['Flowers']);

		this._secondaryScrollablesContainer.addChild(this._scrollables['Harvest']);
		if (!isMobile) this._secondaryScrollablesZoomedContainer.addChild(this._scrollablesZoomed['Harvest']);

		this._secondaryScrollablesContainer.addChild(this._scrollables['Inspiration']);
		if (!isMobile) this._secondaryScrollablesZoomedContainer.addChild(this._scrollablesZoomed['Inspiration']);

		// Hide secondary zoomed containers
		for (const key in this._scrollables) {
			if (key === 'Main' || key === 'remove') {
				continue;
			}

			this._scrollables[key].visible = false;
			this._scrollablesZoomed[key].visible = false;
		}

		// Add FlaconBlock
		if (isMobile) {

			const index = this._generalContainer.getChildIndex(this._mainScrollablesZoomedContainer);
			this._generalContainer.addChildAt(this._blocks['fixed'], index + 1);
		} else {

			this._generalContainer.addChild(this._blocks['fixed']);
		}

		// Bind events
		EmitterManager.once('loadingComplete', this.handleComplete.bind(this));
		EmitterManager.on('VISIBILITY_MANAGER_SWITCH', this.handleVisibility.bind(this));
	}

	createMainBlocks() {
		this._blocks['fixed'] = new FlaconBlock(this._app.stage);

		this._blocks['bottle'] = new VideoBlock({ shallowId: 'bottle', texture: 'bottleHome', videoUrl: '01_bottle/home.mp4' });
		this._scrollables['Main'].addChild(this._blocks['bottle']);

		this._blocks['fragrance'] = new VideoBlock({ shallowId: 'fragrance', texture: 'fragranceHome', videoUrl: '02_fragrance/home.mp4' });
		this._scrollables['Main'].addChild(this._blocks['fragrance']);

		this._blocks['flowers'] = new VideoBlock({ shallowId: 'flowers', texture: 'flowersHome', videoUrl: '03_flowers/home.mp4' });
		this._scrollables['Main'].addChild(this._blocks['flowers']);

		this._blocks['harvest'] = new VideoBlock({ shallowId: 'harvest', texture: 'harvestHome', videoUrl: '04_harvest/home.mp4' });
		this._scrollables['Main'].addChild(this._blocks['harvest']);

		this._blocks['inspiration'] = new ScrollerBlock({ shallowId: 'inspiration', texture: 'inspirationHome' });
		this._scrollables['Main'].addChild(this._blocks['inspiration']);

		this._blocks['flower-octopus'] = new FlowerOctopusBlock({ shallowId: 'flower-octopus' });
		this._scrollables['Main'].addChild(this._blocks['flower-octopus']);

		this._blocks['flower-rotation'] = new FlowerRotationBlock({ shallowId: 'flower-rotation', texture: 'flowerRotation' });
		this._scrollables['Main'].addChild(this._blocks['flower-rotation']);

		this._blocks['sun'] = new SunBlock({ shallowId: 'sun' });
		this._scrollables['Main'].addChild(this._blocks['sun']);

		this._blocks['flower-pistil'] = new FlowerPistilBlock({ shallowId: 'flower-pistil' });
		this._scrollables['Main'].addChild(this._blocks['flower-pistil']);
	}

	createSecondaryBlocks() {
		// Bottle
		this._blocks['bottle-quote'] = new VideoBlock({ shallowId: 'bottle-quote', scroller: 'Bottle', texture: 'bottleQuote', videoUrl: '01_bottle/01_quote.mp4' });
		this._scrollables['Bottle'].addChild(this._blocks['bottle-quote']);

		this._blocks['bottle-video'] = new VideoBlock({ shallowId: 'bottle-video', scroller: 'Bottle', texture: 'bottleCoverVideo', playIcon: true });
		this._scrollables['Bottle'].addChild(this._blocks['bottle-video']);

		// Fragrance
		this._blocks['fragrance-quote'] = new VideoBlock({ shallowId: 'fragrance-quote', scroller: 'Fragrance', texture: 'fragranceQuote', videoUrl: '02_fragrance/01_quote.mp4' });
		this._scrollables['Fragrance'].addChild(this._blocks['fragrance-quote']);

		this._blocks['fragrance-video'] = new VideoBlock({ shallowId: 'fragrance-video', scroller: 'Fragrance', texture: 'fragranceCoverVideo', playIcon: true });
		this._scrollables['Fragrance'].addChild(this._blocks['fragrance-video']);

		this._blocks['flower-light'] = new FlowerLightBlock({ shallowId: 'flower-light', scroller: 'Fragrance' });
		this._scrollables['Fragrance'].addChild(this._blocks['flower-light']);

		// Flowers
		if (isMobile === true) {
			this._blocks['flower-mobile'] = new ScrollerBlock({ shallowId: 'flower-mobile', scroller: 'Flowers', texture: 'harvestFlower' });
			this._scrollables['Flowers'].addChild(this._blocks['flower-mobile']);
		}

		this._blocks['flowers-video'] = new VideoBlock({ shallowId: 'flowers-video', scroller: 'Flowers', texture: 'flowersCoverVideo', playIcon: true });
		this._scrollables['Flowers'].addChild(this._blocks['flowers-video']);

		// Harvest
		this._blocks['harvest-quote'] = new VideoBlock({ shallowId: 'harvest-quote', scroller: 'Harvest', texture: 'harvestQuote', videoUrl: '04_harvest/01_quote.mp4' });
		this._scrollables['Harvest'].addChild(this._blocks['harvest-quote']);

		this._blocks['harvest-video'] = new VideoBlock({ shallowId: 'harvest-video', scroller: 'Harvest', texture: 'harvestCoverVideo', playIcon: true });
		this._scrollables['Harvest'].addChild(this._blocks['harvest-video']);

		if (isMobile === false) {
			this._blocks['harvest-flower'] = new HarvestFlowerBlock({ shallowId: 'harvest-flower', scroller: 'Harvest', texture: 'harvestFlower' });
			this._scrollables['Harvest'].addChild(this._blocks['harvest-flower']);
		}

		// Inspiration
		this._blocks['inspiration-figure'] = new ScrollerBlock({ shallowId: 'inspiration-figure', scroller: 'Inspiration', texture: 'inspirationFigure' });
		this._scrollables['Inspiration'].addChild(this._blocks['inspiration-figure']);

		this._blocks['inspiration-quote'] = new ScrollerBlock({ shallowId: 'inspiration-quote', scroller: 'Inspiration', texture: 'inspirationQuote' });
		this._scrollables['Inspiration'].addChild(this._blocks['inspiration-quote']);

		this._blocks['inspiration-video'] = new VideoBlock({ shallowId: 'inspiration-video', scroller: 'Inspiration', texture: 'inspirationCoverVideo', playIcon: true });
		this._scrollables['Inspiration'].addChild(this._blocks['inspiration-video']);
	}

	handleResize(w = ResizeManager.width, h = ResizeManager.height) {

		this._screen.w = w;
		this._screen.h = h;

		this._overlay.clear();
		this._overlay.beginFill(0xf4efe2);
		this._overlay.drawRect(0, 0, w, h);
		this._overlay.endFill();

		this._app.renderer.resize(w, h);

		for (const key in this._blocks) {
			if (key === 'remove') continue;
			this._blocks[key].resize(w, h);
		}
	}

	handleVisibility(state) {

		if (state) this._app.ticker.stop();
		else if (!this._app.ticker.started) this._app.ticker.start();
	}

	handleComplete(resources) {

		let block = null;

		for (const key in this._blocks) {
			if (key === 'remove') continue;

			block = this._blocks[key];
			block.complete(resources, this._screen);

			if (block._shallowId !== null) {
				const copy = block.getEffectCopy();
				this._blocksFiltered[key] = copy;
				this._scrollablesZoomed[block._scrollerName].addChild(copy);
			}
		}

		BottleEffectManager.complete(resources, this._screen);
		BottleEffectManager.applyTo(this._scrollablesZoomed['Main']);

		EmitterManager.on('scroll', this.handleScroll.bind(this));

		EmitterManager.on('resize', this.handleResize);
		EmitterManager.emit('resize:update');
		this.handleResize();

		EmitterManager.on(Events.SCROLLER_IN_START, this.handleScrollerInStart.bind(this));
		EmitterManager.on(Events.SCROLLER_OUT_COMPLETE, this.handleScrollerOutComplete.bind(this));
		EmitterManager.on(Events.SCROLLER_IN, this.handleScrollerIn.bind(this));
		EmitterManager.on(Events.SCROLLER_OUT, this.handleScrollerOut.bind(this));

		window.addEventListener('mousemove', this.handleMouse);
		window.addEventListener('touchmove', this.handleMouse);
		this.handleMouse();

		this.activeFilteredContainer();

		// setTimeout(() => {
		// 	if (isMobile) {

		// 		for (let i = 0; i < this._scrollables['Main'].children.length; i++) {

		// 			this._scrollables['Main'].children[i].visible = true;
		// 		}

		// 		// this._scrollables['Main'].scale.x = this._scrollables['Main'].scale.y = 0.1;
		// 		console.log(this._scrollables['Main'].width, this._scrollables['Main'].height);
		// 		this._scrollables['Main'].cacheAsBitmap = true;
		// 	}
		// }, 2000);

		this._app.ticker.add(this.handleRAF.bind(this));
	}

	handleScrollerInStart(progress, id) {

		if (id !== 'Main') {
			this._scrollables[id].visible = true;
			this._scrollablesZoomed[id].visible = true;
		}

		if (isMobile) {
			if (id !== 'Main') {
				this._overlay.visible = true;
			}
		} else {
			BottleEffectManager.applyTo(this._scrollablesZoomed[id]);
		}
	}

	handleScrollerIn(progress, id) {

		if (isMobile === false || id === 'Main') { return false; }
		this._overlay.x = this._screen.w * (1 - progress);
	}

	handleScrollerOut(progress, id) {

		if (isMobile === false || id === 'Main') { return false; }
		this._overlay.x = this._screen.w * (1 - progress);
	}

	handleScrollerOutComplete(progress, id) {

		// this._secondaryScrollablesContainer.removeChild(this._scrollables[id]);
		// if (!isMobile) this._secondaryScrollablesZoomedContainer.removeChild(this._scrollables[id]);
		if (id !== 'Main') {
			this._scrollables[id].visible = false;
			this._scrollablesZoomed[id].visible = false;
		}

		if (isMobile) {
			if (id !== 'Main') {
				this._overlay.visible = false;
			}
		} else {
			BottleEffectManager.removeFrom(this._scrollablesZoomed[id]);
		}
	}

	handleScroll(id, scrollTop) {

		this._scrollables[id].y = -scrollTop;
		this._scrollablesZoomed[id].y = -scrollTop;
	}

	handleMouse(event) {

		if (event) {

			this._mouse.x = event.touches && event.touches[0].pageX ? event.touches[0].pageX : event.pageX || event.clientX || this._mouse.x;
			this._mouse.y = event.touches && event.touches[0].pageY ? event.touches[0].pageY : event.pageY || event.clientY || this._mouse.y;
		}

		for (const key in this._blocks) {

			if (key === 'remove' || this._blocks[key].visible === false) continue;
			if (key === 'fixed' && isMobile && event && event.type === 'touchmove') continue;

			this._blocks[key].mouse(this._mouse, this._screen, {pageX: this._pageX, pageY: this._pageY});
		}
	}

	handleRAF() {
		for (const key in this._blocks) {
			if (key === 'remove' || this._blocks[key].visible === false) continue;
			this._blocks[key].update(this._mouse, this._screen);
		}

		BottleEffectManager.update();

		ScrollerManager.update();
		// $fps.textContent = Math.round(this._app.ticker.FPS);
	}

	activeFilteredContainer() {

		this._mainScrollablesZoomedContainer.visible = true;
		this._mainScrollablesZoomedContainer.mask = this._blocks['fixed'].flaconMask;

		this._secondaryScrollablesZoomedContainer.visible = true;
		this._secondaryScrollablesZoomedContainer.mask = this._blocks['fixed'].flaconMask;
	}

	disactiveFilteredContainer() {

		this._mainScrollablesZoomedContainer.visible = false;
		this._mainScrollablesZoomedContainer.mask = null;

		this._secondaryScrollablesZoomedContainer.visible = false;
		this._secondaryScrollablesZoomedContainer.mask = null;
	}

	get scrollables() {

		return this._scrollables;
	}

	get blocks() {

		return this._blocks;
	}

	// get generalContainer() {

	// 	return this._scrollables['Main'];
	// }
}

export default new PixiSceneManager();
