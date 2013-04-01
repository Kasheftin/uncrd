define(["jquery","knockout","eventsEmitter","windowManager"],function($,ko,EventsEmitter,WindowManager) {
	var Core = function() {
		var self = this;

		// ссылка на само себя для widgetBinging-а
		this.core = this;

		this.config = {
			publicBaseUrl: ""
		}

		this.router = {
			clear: function() { }
		}

		// менеджер открытых окон
		this.windowManager = new WindowManager(this);

		this.windowManager.on("ready",function() {
			self.windowManager.isReady = true;
			if (self.windowManager.isReady)
				self.emit("ready");
		});

		// main.js запускает инициализацию core, эта инициализация запускает инициализации компонентов, 
		// например auth, который при непустом SID в cookie должен сделать запрос и получить авторизацию
		this.initialize = function() {
			self.windowManager.initialize();
		}

		// Сокращение open-метода, который отдает open.bind
		this.o = function(data) {
			return self.open.bind(self,data);
		}

		// Контекст в open-методе намерено теряется
		this.open = function(data,context,e) {
			if (typeof data != "object") data = {name:data};
			self.windowManager.open.call(self.windowManager,$.extend({event:e},data));
			return false;
		}
	}

	$.extend(Core.prototype,EventsEmitter.prototype);

	return Core;
});
