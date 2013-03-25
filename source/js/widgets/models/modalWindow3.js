define(["jquery","knockout"],function($,ko) {
	var ModalWindow = function(o) {
		var self = this;

console.log("Init ModalWindow, o=",o);

/*
	Когда делаем windowManager.open(data), все параметры data попадают в виджет modalWindow в o.options
	При этом есть 3 особенных параметра - name, data, callback - они НЕ из data. Они переписаны в windowManager.
	Пример:
		Открываем окно 
			this.core.open({
				name:'alert',
				header: 'Alert Header',
				callback:function() { 
					alert('OK'); 
				},
				message: 'Some Alert',
				cssPosition: 'absolute'
			});

		Тогда в o.options имеем все эти параметры кроме name, data, callback, которые переписаны на другие в windowManager:
			o.options = {
				name: 'modalWindow3',
				header: 'Alert Header',
				callback: ... (callback из windowManager-а)
				message: 'Some Alert',
				cssPosition: 'absolute',
				data: {
					name:'alert',
					header: 'Alert Header',
					callback:function() { 
						alert('OK'); 
					},
					message: 'Some Alert',
					cssPosition: 'absolute'
				}
			}
*/

		this.header = this.asObservable(o.options.header,"");
		this.headerWidget = this.asObservable(o.options.headerWidget,null);
		this.footerWidget = this.asObservable(o.options.footerWidget,null);
		this.content = this.asObservable(o.options.content,null);
		this.width = this.asObservable(o.options.width,560);
		this.cssPosition = this.asObservable(o.options.cssPosition,"fixed");

		this.xPosition = ko.utils.unwrapObservable(o.options.xPosition) || "center";
		this.yPosition = ko.utils.unwrapObservable(o.options.yPosition) || "center";
		this.xOffset = ko.utils.unwrapObservable(o.options.xOffset) || 0;
		this.yOffset = ko.utils.unwrapObservable(o.options.yOffset) || 0;

		this.requiresLoading = true;
		this.isReady = false;

		// Магическая строчка блин
		// Зачем нужна: windowManager при инициализации modalWindow положил в эту data кучу всего своего, что захочет использовать когда окно ининциализируется и загрузится 
		// - loadingIsShown, loadingIcon, windowName
		// но в callback-методах после загрузки есть доступ только к этому виджету, т.е. к self
		this.data = o.options.data;

		// Либо указан content, либо data и в data есть name - имя загружаемого виджета
		// Так вот, если data нет или data.name нет, то загрузка не требуется
		if (!o.options.data || !o.options.data.hasOwnProperty("name")) {
			this.requiresLoading = false;
			this.isReady = true;
		}

		this.buttons = ko.observableArray([]);
		this.buttons.push({
			action: function() { self.destroy() },
			css: "",
			text: "Закрыть"
		});

		this.leftBackdropAction = ko.observable(null);

		// если указана page, то в контент window грузится виджет, ниже - его опции
		// в опции можно сообщить callback, после загрузки он выполняется
		// нам главное после загрузки пересчитать размер и положение окна + сделать emit(ready) после ready внутреннего виджета
		// Здесь мы опять переопределяем родной callback, тот, что указывался еще в this.core.open({callback:...}), поэтому нужно о нем вспомнить в widgetReadyCallback
		this.pageWidgetBinding = ko.computed(function() {
			return $.extend({},o.options.data,{
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

		this.widgetReadyCallback = function(w) {
			self.isReady = true;
			self.recalculatePositionTrue();
			// вспоминаем про родной callback
			if ($.isFunction(o.options.data.callback))
				o.options.data.callback(w);
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