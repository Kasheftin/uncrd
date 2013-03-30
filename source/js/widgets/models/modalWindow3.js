define(["jquery","knockout"],function($,ko) {
	var ModalWindow = function(o) {
		var self = this;
		var d = o.options;

		this.header = this.asObservable(d.header,"");
		this.headerWidget = this.asObservable(d.headerWidget,null);
		this.footerWidget = this.asObservable(d.footerWidget,null);
		this.content = this.asObservable(d.content,null);
		this.width = this.asObservable(d.width,560);
		this.cssPosition = this.asObservable(d.cssPosition,"fixed");
		this.leftBackdropAction = this.asObservable(d.leftBackdropAction,null);

		this.xPosition = ko.utils.unwrapObservable(d.xPosition) || "center";
		this.yPosition = ko.utils.unwrapObservable(d.yPosition) || "center";
		this.xOffset = ko.utils.unwrapObservable(d.xOffset) || 0;
		this.yOffset = ko.utils.unwrapObservable(d.yOffset) || 0;

		// Либо указан content, либо widgetData и в widgetData есть name - имя загружаемого виджета
		// Так вот, если widgetData нет или widgetData.name нет, то загрузка не требуется
		// если указана page, то в контент window грузится виджет, ниже - его опции
		// в опции можно сообщить callback, после загрузки он выполняется
		// нам главное после загрузки пересчитать размер и положение окна + сделать emit(ready) после ready внутреннего виджета
		// Здесь мы опять переопределяем родной callback, тот, что указывался еще в this.core.open({callback:...}), поэтому нужно о нем вспомнить в widgetReadyCallback

		if (d.widgetData && d.widgetData.hasOwnProperty("name")) {
			this.requiresLoading = true;
			this.isReady = false;
		}

		this.pageWidgetBinding = ko.computed(function() {
			if (!d.widgetData || !d.widgetData.hasOwnProperty("name")) return false;
			return $.extend({},o.options.widgetData,{
				modalWindow: self,
				callback: function(w) {
					if (!w.requiresLoading || w.isReady)
						self.widgetReadyCallback(w);
					else 
						w.on("ready",function() {
							self.widgetReadyCallback(w);
						});
					self.recalculatePositionTrue();
				}
			});
		});

		this.buttons = ko.observableArray([]);
		this.buttons.push({
			action: function() { self.destroy() },
			css: "",
			text: "Закрыть"
		});

		this.widgetReadyCallback = function(w) {
			self.isReady = true;
			self.recalculatePositionTrue();
			// вспоминаем про родной callback
			if ($.isFunction(d.widgetData.callback))
				d.widgetData.callback(w);
			self.emit("ready");
		}

		// делаем position обычной observable а не computed потому что будем оптимизировать его расчет и количество пересчетов
		this.position = ko.observable({});

		var ww = null, wh = null, cw = null, ch = null;

		this.width.subscribe(function(v) {
			self.recalculatePositionTrue();
		});

		this.recalculatePosition = function(update,cycle) {
			if (!self.container) return;

			var p = {}, c = {};

			if (update || !ww || !wh || !cw || !ch) {
				ww = $(window).width();
				wh = $(window).height();
				cw = self.container.outerWidth(true);
				ch = self.container.outerHeight(true);
				self.xOffset = 0;
				self.yOffset = 0;
			}

			if (self.xPosition == "left")
				c.left = 0;
			else if (self.xPosition == "center" || self.xPosition == "middle")
				c.left = Math.floor((ww - cw) / 2);
			else if (self.xPosition == "right")
				c.right = 0;

			if (self.yPosition == "top")
				c.top = 0;
			else if (self.yPosition == "center" || self.yPosition == "middle")
				c.top = Math.floor((wh - ch) / 2);
			else if (self.yPosition == "bottom")
				c.bottom = 0;

			if (c.hasOwnProperty("left")) {
				p.left = c.left + self.xOffset;
				if (p.left + cw > ww) p.left = ww - cw;
				if (p.left < 0) p.left = 0;
				self.xOffset = p.left - c.left;
				p.left = p.left.toString() + "px";
			}
			if (c.hasOwnProperty("right")) {
				p.right = c.right - self.xOffset;
				if (p.right + cw > ww) p.right = ww - cw;
				if (p.right < 0) p.right = 0;
				self.xOffset = c.right - p.right;
				p.right = p.right.toString() + "px";
			}
			if (c.hasOwnProperty("top")) {
				p.top = c.top + self.yOffset;
				if (p.top + ch > wh) p.top = wh - ch;
				if (p.top < 0) p.top = 0;
				self.yOffset = p.top - c.top;
				p.top = p.top.toString() + "px";
			}
			if (c.hasOwnProperty("bottom")) {
				p.bottom = c.bottom - self.yOffset;
				if (p.bottom + ch > wh) p.bottom = wh - ch;
				if (p.bottom < 0) p.bottom = 0;
				self.yOffset = c.bottom - p.bottom;
				p.bottom = p.bottom.toString() + "px";
			}

			if (self.width())
				p.width = self.width() + "px";

			if (self.cssPosition())
				p.position = self.cssPosition();

			self.position(p);

			if (update && !cycle) {
				setTimeout(function() {
					self.recalculatePosition(true,1);
				},100);
			}
			if (update && cycle == 1) {
				setTimeout(function() {
					self.recalculatePosition(true,2);
				},500);
			}

		}

		this.recalculatePositionTrue = function(msg) {
			return self.recalculatePosition(true);
		}

		this.dragStart = function(self,e) {
			self.emit("dragStart");
			var startEX = e.pageX, startEY = e.pageY, startX = self.xOffset, startY = self.yOffset;
			var mouseMove = function(e) {
				self.xOffset = startX + e.pageX - startEX;
				self.yOffset = startY + e.pageY - startEY;
				self.recalculatePosition();
			}
			$(document).on("mousemove",mouseMove).one("mouseup mouseleave",function(e) {
				$(document).off("mousemove",mouseMove);
				self.emit("dragEnd");
			});
		}

		this.domInit = function(obj,element,firstDomChild) {
			self.container = $(firstDomChild);
			$(window).on("resize",self.recalculatePositionTrue);
			self.recalculatePositionTrue();
		}

		this.domDestroy = function() {
			$(window).off("resize",self.recalculatePositionTrue);
			self.emit("destroy");
		}

		this.preventDrag = function(w,e) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	return ModalWindow;
});