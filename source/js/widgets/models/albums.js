define(["jquery","knockout"], function($,ko) {
	var Albums = function(o) {
		var self = this;

		var d = o.options;

		// порядок вывода - прямой "" или обратный "desc"
		this.order = this.asObservable(d.order,"desc");

		// сколько записей выводить
		// если unlimited, выводятся все записи и нет контрола на "показать больше/меньше"
		this.unlimited = this.asObservable(d.unlimited,false);
		this.limitStep = d.limitStep || 3;
		this.limit = this.asObservable(d.limit,this.limitStep);

		// в виджет может передаваться data, тогда загрузка не происходит
		this.data = this.asObservable(d.data,{});

		// текст в заголовке (используется в стене, когда "стена пользователя ...")
		this.header = this.asObservable(d.header,"");
		this.showHeader = this.asObservable(d.showHeader,true);
		this.addHeader = this.asObservable(d.addHeader,"Загрузить фото");

		// если data не передана, делается запрос с этими параметрами
		this.to_type = this.asObservable(d.to_type,0);
		this.to_id = this.asObservable(d.to_id,0);

		this.loading = ko.observable(false);
		this.modalWindow = o.options.modalWindow;

		this.uploadPhotoEnabled = ko.computed(function() {
			if (!self.core.user()) return false;
			if (self.to_type() == 0 && self.to_id() == self.core.user().id) return true;
			// TODO: закачка фото в альбомы клубов
			return false;
		});

		// Есть 2 варианта - либо  вызвали из профиля и уже передали data, тогда просто ее выводим. Либо вызвали и не передали (и тогда this.data - обычный observable), тогда нужно ее загрузить
		if (!d.hasOwnProperty("data") && this.to_id()) {
			self.requiresLoading = true;
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "getAlbums",
					formData: {
						to_type: self.to_type(),
						to_id: self.to_id()
					}
				},
				success: function(result) {
					self.loading(false);
					if (result.success) {
//						self.data({albums:result.data.albums,albumsUsers:result.data.albumsUsers});
						self.data({albums:result.data.albums});
					}
					if (result.error) {
						self.core.error(result.error);
					}
					self.emit("ready");
				}
			});
		}

		this.albums = ko.computed(function() {
			if (!self.data()) return [];
			var ar = $.extend(true,[],self.data().albums);
			if (!ar) return [];
			for (var i = 0; i < ar.length; i++) {
//				ar[i].user_id = ar[i].user;
//				ar[i].user = self.data().albumsUsers[ar[i].user_id];
				ar[i].open = function(album,e) {
					if (album.photo && album.photo.id)
						self.open({name:"photo",id:album.photo.id,mode:"context",loading:"over"},album,e);
				}
//				ar[i].gotoUserProfile = function(id) {
//					return function(context,e) {
//						self.open({name:"profile",id:id,loading:"after"},context,e);
//					}
//				}(ar[i].user.id);
			}
			return ar;
		});

		this.albumsLimited = ko.computed(function() {
			if (!self.unlimited() && self.limit() <= 0) return [];
			var ar = $.extend(true,[],self.albums());
			if (self.order() == "desc") ar.reverse();
			if (self.unlimited()) return ar;
			return ar.slice(0,self.limit());
		});

		if (this.modalWindow) {
			this.albumsLimited.subscribe(function() {
				self.modalWindow.recalculatePositionTrue();
			});
		}

		this.showMore = function() {
			self.limit((self.limit() || 0) + self.limitStep);
		}

		this.showLess = function() {
			var l = (self.limit() || 0) - self.limitStep;
			if (l < 0) l = 0;
			self.limit(l);
		}

		this.showAll = function() {
			self.limit(self.albums().length);
		}

		this.showNone = function() {
			self.limit(0);
		}

		this.showSwitch = function() {
			if (self.showEnabled())
				self.showMore();
			else
				self.showNone();
		}

		this.showMoreEnabled = ko.computed(function() {
			return self.albums().length > 0 && self.limit() > 0 && self.albums().length != self.albumsLimited().length;
		});

		this.showLessEnabled = ko.computed(function() {
			return self.albums().length>0 && self.limit() > 0;
		});

		this.showEnabled = ko.computed(function() {
			return !self.unlimited() && self.albums().length > 0 && self.limit() == 0;
		})
	}

	return Albums;
});