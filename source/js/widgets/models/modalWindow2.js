define(["jquery","knockout"],function($,ko) {
	var ModalWindow = function(o) {
		var self = this;

		var initializeOptions = function(paramName,paramValue,defaultValue) {
			if (ko.isObservable(paramValue) || ko.isComputed(paramValue))
				self[paramName] = paramValue;
			else
				self[paramName] = ko.observable($.isFunction(paramValue) ? paramValue() : paramValue || defaultValue);
		}

		var d = o.options.data;
		initializeOptions("header",d.header,"");
		initializeOptions("headerWidget",d.headerWidget,null);
		initializeOptions("content",d.content,"");
		initializeOptions("page",d.page,null);
		initializeOptions("width",d.width,560);

		this.xPosition = ko.utils.unwrapObservable(d.xPosition) || "center";
		this.yPosition = ko.utils.unwrapObservable(d.yPosition) || "center";
		this.xOffset = ko.utils.unwrapObservable(d.xOffset) || 0;
		this.yOffset = ko.utils.unwrapObservable(d.yOffset) || 0;

		this.loading = ko.observable(true);

		this.buttons = ko.observableArray(d.buttons || []);
		this.buttons.push({
			action: self.destroy,
			css: "btn-primary",
			text: "Закрыть"
		});

		// если указана page, то в контент window грузится виджет, ниже - его опции
		// в опции можно сообщить callback, после загрузки он выполняется
		// нам главное после загрузки пересчитать размер и положение окна
		this.pageWidgetBinding = ko.computed(function() {
			return {
				name: self.page(),
				data: d,
				modalWindow: self,
				callback: function(page) {
					if (!page.requiresLoading || page.isReady) {
						self.loading(false);
						self.recalculatePosition(true);
					}
					else 
						page.on("ready",function() {
							self.loading(false);
							self.recalculatePosition(true);
						});
					self.recalculatePosition(true);
				}
			}
		});


		// делаем position обычной observable а не computed потому что будем оптимизировать его расчет и количество пересчетов
		this.position = ko.observable(null);

		var ww = null, wh = null, cw = null, ch = null;

		this.recalculatePosition = function(update) {
			if (!self.container) return;

			var p = {}, c = {};

			if (update || !ww || !wh || !cw || !ch) {
				ww = $(window).width();
				wh = $(window).height();

				var headerContainer = self.container.find(".modal-header");
				var bodyContainer = self.container.find(".modal-body");
				var footerContainer = self.container.find(".modal-footer");


				var ih = 0
					 + headerContainer.outerHeight(true)
					 + bodyContainer[0].scrollHeight
					 + footerContainer.outerHeight(true);

				var bdiff = bodyContainer.outerHeight(true) - bodyContainer.height();

				// Здесь имеем глюк из-за того что scrollHeight меняется если есть padding, поэтому 2px отнимаем еще
				if (ih > wh) {
					bodyContainer.height(bodyContainer.get(0).scrollHeight + wh - ih - bdiff - 2);
					bodyContainer.css("padding-right","3px");
				}
				else {
					bodyContainer.css("height","auto");
					bodyContainer.css("padding-right","15px");
				}

				cw = self.container.outerWidth(true);
				ch = self.container.outerHeight(true);
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
				this.buttons.push({
					action: self.recalculatePosition,
					css: "",
					text: "recalculatePosition"
				});
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
			p.width = self.width() + "px";
			self.position(p);
		}

		this.recalculatePositionTrue = function() {
			return self.recalculatePosition(true);
		}

		this.buttons.push({
			action: self.recalculatePositionTrue,
			css: "",
			text: "recalculatePosition"
		});

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
			self.recalculatePosition();
		}

		this.domDestroy = function() {
			$(window).off("resize",self.recalculatePositionTrue);
		}

		// этот метод дергается как callback в инициализации внутреннего виджета, заданного переменной page
		this.pageDomInit = function(page) {
			if (!page.requiresLoading || page.isReady) {
				self.loading(false);
				self.recalculatePosition(true);
			}
			else 
				page.on("ready",function() {
					self.loading(false);
					self.recalculatePosition(true);
				});
			self.recalculatePosition(true);
		}

		this.preventDrag = function(w,e) {
			e.preventDefault();
			e.stopPropagation();
		}
	}

	return ModalWindow;
});
