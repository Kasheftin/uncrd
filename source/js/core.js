define(["config","jquery","knockout","auth","eventsEmitter","windowManager","router"],function(config,$,ko,Auth,EventsEmitter,WindowManager,Router) {
	var Core = function() {
		var self = this;

		// ссылка на само себя для widgetBinging-а
		this.core = this;

		// копируем config в Core, потому что к Core будет доступ из любого виджета
		this.config = config;

		// инфа о текущем пользователе и SID
		this.user = ko.observable(null);

		// здесь храним данные, которые не меняются, из общих мелких таблиц. Если какой-нибудь ajax возвращает в результате common, складываем это в this.common
		// например, countries, cities из геобазы
		this.common = {countryGroups:{},countries:{},cities:{}};

		// менеджер открытых окон
		this.windowManager = new WindowManager(this);

		// роутер - штука, которая будет отслеживать изменения хеша и по ним открывть соответствующие окна
		this.router = new Router(this);

		// данные про авторизацию - биндинги формы логина, выход и авторизация по SID из cookie
		this.auth = new Auth(self);

		this.windowManager.on("ready",function() {
			self.windowManager.isReady = true;
			if (self.windowManager.isReady && self.router.isReady && self.auth.isReady)
				self.emit("ready");
		});
		this.router.on("ready",function() {
			self.router.isReady = true;
			if (self.windowManager.isReady && self.router.isReady && self.auth.isReady)
				self.emit("ready");
		})
		this.auth.on("ready",function() {
			self.auth.isReady = true;
			if (self.windowManager.isReady && self.router.isReady && self.auth.isReady)
				self.emit("ready");
		});

		// ядро запускает инициализацию core, эта инициализация запускает инициализации компонентов, 
		// например auth, который при непустом SID в cookie должен сделать запрос и получить авторизацию
		this.initialize = function() {
			self.auth.initialize();
			self.router.initialize();
			self.windowManager.initialize();
		}

		this.open = function(data,context,e) {
			if (typeof data != "object") data = {name:data};
			self.windowManager.open.call(self.windowManager,$.extend({event:e},data));
			return false;
		}

		this.updateCommon = function(data) {
			if (!data) return;
			$.each(data.countries || [],function(i,rw) {
				self.common.countries[i] = rw;
			});
			$.each(data.cities || [],function(i,rw) {
				self.common.cities[i] = rw;
			});
		}

		this.error = function(message,parentWindow) {
			self.open({name:"alert",windowName:"alert",type:"error",message:message,callback: function() {
				if (parentWindow)
					parentWindow.destroy();
			}});
		}

		this.apiCall = function(request) {
			return $.ajax($.extend(true,{},{
				url: config.apiBaseUrl,
				type: "post",
				dataType: "json",
				data: {
					SID: (this.user() ? this.user().SID : ""),
					debug: true
				},
				error: function(jqXHR,textStatus,errorThrown) {
					self.error(textStatus);
				}
			},request));
		}

	}

	$.extend(Core.prototype,EventsEmitter.prototype);

	return Core;
});
