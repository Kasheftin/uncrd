define(["config","jquery","knockout","auth","eventsEmitter","windowManager","router"],function(config,$,ko,Auth,EventsEmitter,WindowManager,Router) {
	var Core = function() {
		var self = this;

		// ссылка на само себя для widgetBinging-а
		this.core = this;

		// копируем config в Core, потому что к Core будет доступ из любого виджета
		this.config = config;

		// инфа о текущем пользователе и SID
		this.user = ko.observable(null);

		this.isReady = ko.observable(false);
		this.on("binded",function() {
			self.isReady(true);
		});

		// здесь храним данные, которые не меняются, из общих мелких таблиц. Если какой-нибудь ajax возвращает в результате common, складываем это в this.common
		// например, countries, cities из геобазы
		this.common = {countryGroups:{},countries:{},cities:{}};

		// менеджер открытых окон
		this.windowManager = new WindowManager(this);

		// роутер - штука, которая будет отслеживать изменения хеша и по ним открывть соответствующие окна
		this.router = new Router(this);

		// данные про авторизацию - биндинги формы логина, выход и авторизация по SID из cookie
		this.auth = new Auth(self);

		// TODO: Переделать через setImmediate
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
					mss_login: (this.user() ? this.user().mss_login : ""),
					mss_pwd: (this.user() ? this.user().mss_pwd : ""),
					debug: true
				},
				error: function(jqXHR,textStatus,errorThrown) {
					self.error(textStatus);
				}
			},request));
		}

		// TODO: move somewhere
		this.drawLoadingIcon = function(e,loading) {
			var elem = $(e.currentTarget);
			var loadings = ["over","after","before","after-inside"];
			$.each(loadings,function(i,v) { 
				if (!loading && elem.hasClass("uncrd-loading-" + v)) loading = v;
			});
			var found = false;
			$.each(loadings,function(i,v) {
				if (v == loading)
					found = true;
			});
			if (!found) return null;
			var loadingIcon = $("<div />",{"class":"uncrd-loading-absolute"}).insertAfter(elem);
			var p = elem.position();
			var w = Math.floor(elem.outerWidth()/2);
			var h = Math.floor(elem.outerHeight()/2);
			var w2 = Math.floor(loadingIcon.width()/2);
			var h2 = Math.floor(loadingIcon.height()/2);
			if (loading == "after")
				loadingIcon.css({top:(p.top+h-h2).toString()+"px",left:(p.left+2*w).toString()+"px"});
			else if (loading == "after-inside")
				loadingIcon.css({top:(p.top+h-h2).toString()+"px",left:(p.left+2*w-2*w2).toString()+"px"});
			else if (loading == "before")
				loadingIcon.css({top:(p.top+h-h2).toString()+"px",left:(p.left-2*w2).toString()+"px"});
			else
				loadingIcon.css({top:(p.top+h-h2).toString()+"px",left:(p.left+w-w2).toString()+"px"});
			return loadingIcon;
		}

		// TODO: move to user actions
		this.isFriend = function(user,to_id) {
			if (user && user.friends.length > 0 && to_id > 0)
				for (var i = 0; i < user.friends.length; i++)
					if (to_id == user.friends[i])
						return true;
			return false;
		}

	}

	$.extend(Core.prototype,EventsEmitter.prototype);

	return Core;
});
