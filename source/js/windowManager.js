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
			// Ищем, есть ли хоть одно готовое окно и заодно убираем hide класс.
			var readyWidgetExist = false;
			var lastReadyWidget = null;
			if (ar && ar.length > 0) {
				for (var i = 0; i < ar.length; i++) {
					if (ar[i].isReady) {
						readyWidgetExist = true;
						lastReadyWidget = ar[i];
						if (ar[i].data && ar[i].data.windowNode && ar[i].data.windowNode.hasClass("uncrd-unvisible"))
							ar[i].data.windowNode.removeClass("uncrd-unvisible");
/*
							setTimeout(function(node) {
								return function() {
									node.removeClass("uncrd-unvisible");
								}
							}(ar[i].data.windowNode),200);
*/
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
				$("html").scrollTop(self.contentScrollTop);
				self.contentScrollTop = null;
				self.core.router.clear();
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
	WindowManager.prototype.open = function(data) {
		var self = this;

		if (ko.isObservable(data) || ko.isComputed(data) || typeof data == "string")
			data = {name:data};

		data.windowNode = $("<div />",{"class":"uncrd-window uncrd-unvisible"}).appendTo(this.container);
		data.windowName = data.windowName || "default";

		// Первый блин. Здесь втыкаем иконку загрузки к ссылке или объекту, который вызвал open
		if (data.event && data.event.currentTarget && data.loading) {
			var elem = $(data.event.currentTarget);
			data.loadingIcon = $("<div />",{"class":"uncrd-loading-absolute"}).insertAfter(elem);
			var p = elem.position();
			var w = Math.floor(elem.outerWidth()/2);
			var h = Math.floor(elem.outerHeight()/2);
			var w2 = Math.floor(data.loadingIcon.width()/2);
			var h2 = Math.floor(data.loadingIcon.height()/2);
			if (data.loading == "over") {
				data.loadingIcon.css({top:(p.top+h-h2).toString()+"px",left:(p.left+w-w2).toString()+"px"});
				data.loadingIsShown = true;
			}
			else if (data.loading == "after") {
				data.loadingIcon.css({top:(p.top+h-h2).toString()+"px",left:(p.left+2*w).toString()+"px"});
				data.loadingIsShown = true;
			}
			else if (data.loading == "after-inside") {
				data.loadingIcon.css({top:(p.top+h-h2).toString()+"px",left:(p.left+2*w-2*w2).toString()+"px"});
				data.loadingIsShown = true;
			}
			else if (data.loading == "before") {
				data.loadingIcon.css({top:(p.top+h-h2).toString()+"px",left:(p.left-2*w2).toString()+"px"});
				data.loadingIsShown = true;
			}
			else {
				data.loadingIcon.remove();
				delete data.loadingIcon;
			}
		}

		// Если иконка загрузки была показана, то не нужно рисовать модальное окно со своей загрузкой, пока последнее не загрузится. 
		// Если же нет, сразу будем показывать модальное окно. 
		// Например, когда в url есть хеш, и идет перегрузка страницы, мы не знаем, какому элементу приделать иконку загрузки, 
		// в этом случае сразу показываем модальное окно, и уже внутри него крутится загрузка.
		// data.loadingIsShown - флаг, который говорит, показана ли иконка.

		ko.createWidget(data.windowNode.get(0),$.extend(true,{},data,{
			name: "modalWindow3",
			data: data,
			callback: function(w) {
				w.on("dragStart",function() {
					$(w.element).appendTo(self.container);
					if (self.childrenWidgets.indexOf(w) != self.childrenWidgets().length - 1) {
						self.childrenWidgets.splice(self.childrenWidgets.indexOf(w),1);
						self.childrenWidgets.push(w);
					}
				});

				// Если иконки загрузки не было, нужно открывать окно, т.е. вручную переставляем isReady=true и окно показывается. 
				// В этом случае окно уже внутри себя должно думать, какой loading показывать.
				if (!w.data.loadingIsShown)
					w.isReady = true;

				// Открываемое окно modalWindow3 либо уже должно быть готово, либо должно эмитить готово когда будет готово
				if (!w.requiresLoading || w.isReady)
					self.windowReadyCallback(w);
				else
					w.on("ready",function() {
						self.windowReadyCallback(w);
					});
			}
		}),this);
	}

	// Вызывается когда новое окно открываемое окно эмитит ready или уже сразу isReady
	WindowManager.prototype.windowReadyCallback = function(w) {
		var self = this;
		setTimeout(function() {
			if (w.data.loadingIsShown && w.data.loadingIcon)
				w.data.loadingIcon.remove();
			self.childrenWidgets.valueHasMutated();
			self.closeOtherByName(w);
			if (w.data.callback)
				w.data.callback();
		},200);
	}

	// Закрывает все другие окна с именем окна w
	WindowManager.prototype.closeOtherByName = function(w) {
		var w2d = [];
		$.each(this.childrenWidgets(),function(i,v) {
			if ((v.data.windowName == w.data.windowName) && (v != w))
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