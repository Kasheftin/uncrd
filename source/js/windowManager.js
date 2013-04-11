define(["jquery","knockout","eventsEmitter"],function($,ko,EventsEmitter) {

	var WindowManager = function(core) {
		var self = this;

		this.core = core;

		// Здесь хитрость: обычно в widgetBinding после инициализации любого виджета создается свойство childrenWidgets, обычный массив.
		// Но если его в инициализации объявить как observableArray, то он не переопределяется, а работает правильно как observable.
		// И тогда на него можно навешивать subscribe.
		this.childrenWidgets = ko.observableArray();

		// currentWindow вроде как служит единственной целью для простановке leftBackdropAction (делаем драг на окне под данным, оно становится currentWindow и экшен подменяется)
		// это текущее, самое верхнее окно
		this.currentWindow = ko.observable(null);

		this.contentScrollTop = null;

		this.childrenWidgets.subscribe(function(ar) {
			// Каждое окно, которое создается windowManager-ом, должно вернуть статус ready, т.е. должно загрузиться.
			// До статуса ready дом создается и заполняется, но display:none.
			// Ищем, есть ли хоть одно готовое окно и убираем hide класс ему.
			var readyWidgetExist = false;
			var lastReadyWidget = null;
			if (ar && ar.length > 0) {
				for (var i = 0; i < ar.length; i++) {
					if (ar[i].isReady) {
						readyWidgetExist = true;
						lastReadyWidget = ar[i];
						if (ar[i]._data && ar[i]._data.windowNode && ar[i]._data.windowNode.hasClass("uncrd-unvisible"))
							ar[i]._data.windowNode.removeClass("uncrd-unvisible");
					}
				}
			}
			if (readyWidgetExist) {
				// Если готовое окно есть, то показываем его. При этом нужно прибить body чтобы был правильный скролл и показать fade
				self.currentWindow(lastReadyWidget);
				if (self.fadeInShown) return;
				self.fadeInShown = true;
				self.fadeIn.removeClass("hide");
				self.contentScrollTop = $("html").scrollTop();
				$("body").data("uncrd-orig-overflow-y",$("body").css("overflow-y")).css("overflow-y","scroll");
				$("body").css("overflow-y","scroll");
				self.siteContainer.each(function() {
					var obj = $(this);
					obj
						.data("orig-margin",obj.css("margin"))
						.data("orig-left",obj.css("left"))
						.data("orig-position",obj.css("position"))
						.css({
							"position": "fixed",
							"margin-top": (-1*self.contentScrollTop + parseInt(obj.css("margin-top"))).toString() + "px",
							"left": "50%",
							"margin-left": (-1*Math.floor(obj.outerWidth(true)/2)).toString() + "px"
						});
				});
			}
			else {
				// Если окон нет, открепляем body назад и убираем fade
				self.fadeInShown = false;
				self.fadeIn.addClass("hide");
				self.currentWindow(null);
				if (self.contentScrollTop == null) return;
				$("body").css("overflow-y",$("body").data("uncrd-orig-overflow-y"));
				self.siteContainer.each(function() {
					var obj = $(this);
					obj.css({
						position: obj.data("orig-position"),
						margin: obj.data("orig-margin"),
						left: obj.data("orig-left")
					});
				});	
				self.core.router.clear();
				$("html").scrollTop(self.contentScrollTop);
				self.contentScrollTop = null;
			}
		});

		this.leftBackdropAction = ko.computed(function() {
			var currentWindow = self.currentWindow();
			if (!currentWindow) return null;
			var action = currentWindow.leftBackdropAction();
			if (!action) return null;
			return action;
		});

		this.leftBackdropAction.subscribe(function(action) {
			if (!action)
				self.fadeInLeftActionControl.addClass("hide").off("click");
			else {
				self.fadeInLeftActionControl.removeClass("hide").off("click").on("click",function() {
					if (action && typeof action == "function")
						action();
				});
			}
		});
	}

	$.extend(WindowManager.prototype,EventsEmitter.prototype);

	WindowManager.prototype.initialize = function() {
		var self = this;
		this.container = $("<div />",{"class":"uncrd-window-manager"}).appendTo("body");
		this.fadeIn = $("<div />",{"class":"modal-backdrop fade in hide"}).appendTo(this.container);
		this.fadeIn.on("click",function() {
			self.closeAll();
		});
		this.fadeInLeftActionControl = $("<div />",{"class":"modal-backdrop fade in hide uncrd-modal-backdrop-left"}).append("<div class='uncrd-modal-backdrop-arrow-left'></div>").appendTo(this.container);
		this.siteContainer = $(".uncrd-container");
		this.emit("ready");
	}

	// Все окна в WindowManager открываются через метод open, поэтому будем считать текущим последнее открытое или драгнутое окно
	// Принимаем в data строку или массив (обычный) или observable-строку (но не observable-массив, не паримся с ним)
	// Всю эту data нужно "прокинуть" через виджет modalWindow в непосредственно его контент, т.е. внутренний виджет
	WindowManager.prototype.open = function(inputData) {
		var self = this;

		if (ko.isObservable(inputData) || ko.isComputed(inputData) || typeof inputData == "string")
			inputData = {name:inputData};

		// в inputData пришли данные для внутреннего виджета + необязательные данные для modalWindow в переменной inputData.modalWindow
		// но сначала открываем modalWindow, и уже изнутри modalWindow открывается внутренний виджет, поэтому нужно их поменять местами
		// сейчас готовим data - параметры для modalWindow, которые внутри в параметре widgetData должны содержать исходные данные		
		var data = $.extend({
			name: "modalWindow3",
			widgetData: inputData,
			windowNode: $("<div />",{"class":"uncrd-window uncrd-unvisible"}).appendTo(this.container),
			windowName: inputData.windowName || "default",
			callback: function(w) {
				w.on("dragStart",function() {
					$(w._element).appendTo(self.container);
					if (self.childrenWidgets.indexOf(w) != self.childrenWidgets().length - 1) {
						self.childrenWidgets.splice(self.childrenWidgets.indexOf(w),1);
						self.childrenWidgets.push(w);
					}
				});
				// Если иконки загрузки не было, нужно открывать окно, т.е. вручную переставляем isReady=true и окно показывается. 
				// В этом случае окно уже внутри себя должно думать, какой loading показывать.
				if (!w._data.loadingIsShown)
					w.isReady = true;
				// Открываемое окно modalWindow3 либо уже должно быть готово, либо должно эмитить готово когда будет готово
				if (!w.requiresLoading || w.isReady)
					self.windowReadyCallback(w);
				else
					w.on("ready",function() {
						self.windowReadyCallback(w);
					});
			}
		},inputData.modalWindow || {});

		// Первый блин. Здесь втыкаем иконку загрузки к ссылке или объекту, который вызвал open
		if (inputData.event && inputData.event.currentTarget) {
			data.loadingIcon = self.core.drawLoadingIcon(inputData.event,inputData.loading);
			if (data.loadingIcon)
				data.loadingIsShown = true;
		}

		// Если иконка загрузки была показана, то не нужно рисовать модальное окно со своей загрузкой, пока последнее не загрузится. 
		// Если же нет, сразу будем показывать модальное окно. 
		// Например, когда в url есть хеш, и идет перегрузка страницы, мы не знаем, какому элементу приделать иконку загрузки, 
		// в этом случае сразу показываем модальное окно, и уже внутри него крутится загрузка.
		// data.loadingIsShown - флаг, который говорит, показана ли иконка.

		ko.createWidget(data.windowNode.get(0),data,this);
	}

	// Вызывается когда новое окно открываемое окно эмитит ready или уже сразу isReady
	WindowManager.prototype.windowReadyCallback = function(w) {
		var self = this;
		setTimeout(function() {
			if (w._data.loadingIsShown && w._data.loadingIcon)
				w._data.loadingIcon.remove();
			self.childrenWidgets.valueHasMutated();
			self.closeOtherByName(w);
//			if (w._data.callback)
//				w._data.callback(w);
		},200);
	}

	// Закрывает все другие окна с именем окна w
	WindowManager.prototype.closeOtherByName = function(w) {
		var w2d = [];
		$.each(this.childrenWidgets(),function(i,v) {
			if ((v._data.windowName == w._data.windowName) && (v != w))
				w2d.push(v);
		});
		$.each(w2d,function(i,v) {
			v.destroy();
		});
	}

	WindowManager.prototype.closeAll = function() {
		while (this.childrenWidgets().length > 0)
			this.childrenWidgets()[0].destroy();
	}

	return WindowManager;
});