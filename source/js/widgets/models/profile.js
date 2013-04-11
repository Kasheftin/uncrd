define(["jquery","knockout"], function($,ko) {
	var ProfilePage = function(o) {
		var self = this;

		this.id = o.options.id;
		this.modalWindow = o.options.modalWindow;

		this.loading = ko.observable(true);
		this.user = ko.observable(null);
		this.fullInfo = ko.observable(false);

		this.requiresLoading = true;

		// делаем this.user не связанной с this.core.user, а то юзер разлогинится и вылезет ошибка
		if (!this.id) {
			if (this.core.user())
				this.id = this.core.user().id;
			else {
				this.core.error("Ошибка загрузки профиля");
				this.modalWindow.destroy();
			}
		}

		this.my = ko.computed(function() {
			return (self.user() && self.core.user() && self.core.user().id == self.user().id);
		});

		this.profileSubmenuVisible = ko.observable(false);
		this.switchProfileSubmenu = function(obj,e) {
			$(e.currentTarget).blur();
			self.profileSubmenuVisible(!self.profileSubmenuVisible());
		}

		this.to_type = ko.observable(0);
		this.to_id = ko.computed(function() {
			return self.user() ? self.user().id : 0;
		});

		this.stenaData = ko.computed({
			read: function() {
				return self.user() ? {posts:self.user().stena,users:self.user().users} : {};
			},
			// Здесь добавим write чтобы сохранить целостность когда в stena.js происходит добавление записи
			write: function(v) {
				if (self.user()) {
					var u = self.user();
					u.stena = v.posts;
					u.users = v.users;
					self.user(u);
				}
			}
		});
		this.stenaHeader = ko.computed(function() {
			return self.user() ? self.user().name : "";
		});

		this.albumsData = ko.computed({
			read: function() {
				return self.user() ? {albums:self.user().albums} : {};
			},
			// Здесь добавим write чтобы сохранить целостность когда в albums.js происходит добавление записи
			write: function(v) {
				if (self.user()) {
					var u = self.user();
					u.albums = v.albums;
					self.user(u);
				}
			}
		});
		this.albumsHeader = ko.computed(function() {
			return self.user() ? self.user().name : "";
		});

		this.blogsData = ko.computed({
			read: function() {
				return self.user() ? {blogsIndex:self.user().blogsIndex,users:self.user().users,blogsComments:self.user().blogsComments,blogsSections:self.user().blogsSections,blogsData:self.user().blogsData} : {};
			},
			// Здесь добавим write чтобы сохранить целостность когда в stena.js происходит добавление записи
			write: function(v) {
				if (self.user()) {
					var u = self.user();
					u.blogsIndex = v.blogsIndex;
					u.blogsData = v.blogsData;
					u.users = v.users;
					u.blogsComments = v.blogsComments;
					u.blogsSections = v.blogsSections;
					self.user(u);
				}
			}
		});
		this.blogsHeader = ko.computed(function() {
			return self.user() ? self.user().name : "";
		});

		this.friendsData = ko.computed({
			read: function() {
				return self.user() ? {friends:self.user().friends,users:self.user().users} : {};
			},
			write: function(v) {
				if (self.user()) {
					var u = self.user();
					u.friends = v.friends;
					u.users = v.users;
					self.user(u);
				}
			}
		})


		this.statusText = ko.computed(function() {
			return self.user() ? self.user().status : "";
		});

		this.geoText = ko.computed(function() {
			if (!self.user()) return "";
			var rw_city = self.core.common.cities[self.user().city_id];
			var rw_country = self.core.common.countries[self.user().country_id];
			var out = (rw_city?rw_city.name_ru:"");
			out += (out?", ":"") + (rw_country?rw_country.name_ru:"");
			return (out.length>0) ? out : "не указан";
		});

		this.user.subscribe(function(u) {
			self.core.router.set({name:"profile",id:u.id});
		})

	}

	ProfilePage.prototype.loadUser = function(id) {
		var self = this;
		this.loading(true);
		this.user(null);
		this.core.apiCall({
			data: {
				action: "getUser",
				id: id
			},
			success: function(result) {
				self.loading(false);
				if (result.success) {
					self.core.updateCommon(result.data.commonData);
					self.user(result.data.userData);
					self.modalWindow.width(800);
					self.modalWindow.cssPosition("absolute");
					self.modalWindow.recalculatePosition(true);
				}
				if (result.error) {
					self.core.error(result.error);
					self.modalWindow.destroy();
				}
				self.emit("ready");
			},
			error: function(jqXHR,textStatus,errorThrown) {
				self.core.error(textStatus);
				self.modalWindow.destroy();
			}
		});
	}

	ProfilePage.prototype.showFullInfo = function() {
		this.fullInfo(true);
		this.modalWindow.recalculatePositionTrue();
	}

	ProfilePage.prototype.hideFullInfo = function() {
		this.fullInfo(false);
		this.modalWindow.recalculatePositionTrue();
	}

	ProfilePage.prototype.domInit = function() {
		this.loadUser(this.id);
	}

	return ProfilePage;
});